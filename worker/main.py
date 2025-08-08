from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import tempfile
import os
import subprocess
import json
from typing import List, Optional
import webrtcvad
import numpy as np
from resemblyzer import VoiceEncoder, preprocess_wav
import librosa
from sklearn.cluster import AgglomerativeClustering
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audio Diarization Worker", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiarizationRequest(BaseModel):
    fileUrl: str
    languageHint: Optional[str] = None

class DiarizationSegment(BaseModel):
    start: float
    end: float
    speaker: str
    text: str

class DiarizationResponse(BaseModel):
    diarizedSegments: List[DiarizationSegment]
    speakerCount: int
    confidence: float
    debug: dict

def download_audio(url: str) -> str:
    """Download audio file from URL and return local path"""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_path = temp_file.name
        temp_file.close()
        
        # Write audio data
        with open(temp_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return temp_path
    except Exception as e:
        logger.error(f"Failed to download audio: {e}")
        raise HTTPException(status_code=400, detail="Failed to download audio file")

def convert_to_wav(input_path: str) -> str:
    """Convert audio to mono 16kHz WAV format"""
    try:
        output_path = input_path.replace('.wav', '_converted.wav')
        
        # Use ffmpeg to convert
        cmd = [
            'ffmpeg', '-i', input_path,
            '-ac', '1',  # Mono
            '-ar', '16000',  # 16kHz
            '-f', 'wav',
            output_path,
            '-y'  # Overwrite output file
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"FFmpeg conversion failed: {result.stderr}")
            raise Exception("Audio conversion failed")
        
        return output_path
    except Exception as e:
        logger.error(f"Failed to convert audio: {e}")
        raise HTTPException(status_code=500, detail="Audio conversion failed")

def detect_speech_segments(audio_path: str) -> List[dict]:
    """Detect speech segments using WebRTC VAD"""
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=16000)
        
        # Initialize VAD
        vad = webrtcvad.Vad(2)  # Aggressiveness level 2
        
        # Convert to 16-bit PCM
        y_int16 = (y * 32767).astype(np.int16)
        
        # Process in 30ms frames
        frame_duration = 30  # ms
        frame_size = int(sr * frame_duration / 1000)
        frames = []
        
        for i in range(0, len(y_int16), frame_size):
            frame = y_int16[i:i + frame_size]
            if len(frame) == frame_size:
                frames.append(frame.tobytes())
        
        # Detect speech
        speech_frames = []
        for i, frame in enumerate(frames):
            is_speech = vad.is_speech(frame, sr)
            if is_speech:
                speech_frames.append(i)
        
        # Merge contiguous speech segments
        segments = []
        if speech_frames:
            start_frame = speech_frames[0]
            prev_frame = speech_frames[0]
            
            for frame in speech_frames[1:]:
                if frame - prev_frame > 1:  # Gap detected
                    # End current segment
                    end_time = (prev_frame + 1) * frame_duration / 1000
                    start_time = start_frame * frame_duration / 1000
                    if end_time - start_time >= 0.25:  # Min duration 250ms
                        segments.append({
                            'start': start_time,
                            'end': end_time
                        })
                    start_frame = frame
                prev_frame = frame
            
            # Add final segment
            end_time = (prev_frame + 1) * frame_duration / 1000
            start_time = start_frame * frame_duration / 1000
            if end_time - start_time >= 0.25:
                segments.append({
                    'start': start_time,
                    'end': end_time
                })
        
        return segments
    except Exception as e:
        logger.error(f"Speech detection failed: {e}")
        raise HTTPException(status_code=500, detail="Speech detection failed")

def extract_embeddings(audio_path: str, segments: List[dict]) -> List[np.ndarray]:
    """Extract speaker embeddings for each segment"""
    try:
        # Load audio
        wav = preprocess_wav(audio_path)
        
        # Initialize encoder
        encoder = VoiceEncoder()
        
        embeddings = []
        for segment in segments:
            start_sample = int(segment['start'] * 16000)
            end_sample = int(segment['end'] * 16000)
            
            # Extract segment
            segment_wav = wav[start_sample:end_sample]
            
            if len(segment_wav) > 0:
                # Get embedding
                embedding = encoder.embed_utterance(segment_wav)
                embeddings.append(embedding)
            else:
                embeddings.append(np.zeros(256))  # Default embedding
        
        return embeddings
    except Exception as e:
        logger.error(f"Embedding extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Embedding extraction failed")

def cluster_speakers(embeddings: List[np.ndarray]) -> List[int]:
    """Cluster embeddings into speakers"""
    try:
        if len(embeddings) < 2:
            return [0] * len(embeddings)
        
        # Convert to numpy array
        X = np.array(embeddings)
        
        # Use AgglomerativeClustering for 2 speakers
        clustering = AgglomerativeClustering(n_clusters=2, linkage='ward')
        labels = clustering.fit_predict(X)
        
        return labels.tolist()
    except Exception as e:
        logger.error(f"Speaker clustering failed: {e}")
        raise HTTPException(status_code=500, detail="Speaker clustering failed")

def calculate_confidence(embeddings: List[np.ndarray], labels: List[int]) -> float:
    """Calculate confidence score for speaker separation"""
    try:
        if len(embeddings) < 2:
            return 0.0
        
        # Calculate silhouette score or similar metric
        from sklearn.metrics import silhouette_score
        
        X = np.array(embeddings)
        if len(np.unique(labels)) > 1:
            score = silhouette_score(X, labels)
            return max(0.0, score)  # Ensure non-negative
        else:
            return 0.0
    except Exception as e:
        logger.error(f"Confidence calculation failed: {e}")
        return 0.0

@app.post("/diarize", response_model=DiarizationResponse)
async def diarize_audio(request: DiarizationRequest):
    """Process audio file for speaker diarization"""
    try:
        logger.info(f"Processing audio from: {request.fileUrl}")
        
        # Download audio
        audio_path = download_audio(request.fileUrl)
        
        # Convert to WAV
        wav_path = convert_to_wav(audio_path)
        
        # Detect speech segments
        speech_segments = detect_speech_segments(wav_path)
        
        if not speech_segments:
            # Return empty result for files with no speech
            return DiarizationResponse(
                diarizedSegments=[],
                speakerCount=0,
                confidence=0.0,
                debug={"message": "No speech detected"}
            )
        
        # Extract embeddings
        embeddings = extract_embeddings(wav_path, speech_segments)
        
        # Cluster speakers
        speaker_labels = cluster_speakers(embeddings)
        
        # Calculate confidence
        confidence = calculate_confidence(embeddings, speaker_labels)
        
        # Create diarized segments
        diarized_segments = []
        for i, segment in enumerate(speech_segments):
            speaker_label = speaker_labels[i] if i < len(speaker_labels) else 0
            diarized_segments.append(DiarizationSegment(
                start=segment['start'],
                end=segment['end'],
                speaker=f"Speaker {speaker_label + 1}",
                text=""  # Text will be filled by the main application
            ))
        
        # Clean up temporary files
        try:
            os.unlink(audio_path)
            os.unlink(wav_path)
        except:
            pass
        
        return DiarizationResponse(
            diarizedSegments=diarized_segments,
            speakerCount=len(set(speaker_labels)),
            confidence=confidence,
            debug={
                "speech_segments_count": len(speech_segments),
                "embeddings_count": len(embeddings),
                "processing_time": "mock"
            }
        )
        
    except Exception as e:
        logger.error(f"Diarization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "audio-diarization-worker"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 