# Audio Diarization Worker

A FastAPI-based microservice for audio diarization using WebRTC VAD and Resemblyzer.

## Features

- Audio file download and processing
- Speech activity detection using WebRTC VAD
- Speaker embedding extraction using Resemblyzer
- Speaker clustering using AgglomerativeClustering
- Support for various audio formats (converted to WAV)
- Confidence scoring for speaker separation

## Requirements

- Python 3.11+
- ffmpeg
- Docker (optional)

## Installation

### Local Development

1. **Install system dependencies**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update && sudo apt-get install -y ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   # Download ffmpeg from https://ffmpeg.org/download.html
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Docker

1. **Build the image**
   ```bash
   docker build -t audio-diarization-worker .
   ```

2. **Run the container**
   ```bash
   docker run -p 8000:8000 audio-diarization-worker
   ```

## API Endpoints

### POST /diarize

Process audio file for speaker diarization.

**Request Body:**
```json
{
  "fileUrl": "https://example.com/audio.wav",
  "languageHint": "en"
}
```

**Response:**
```json
{
  "diarizedSegments": [
    {
      "start": 0.0,
      "end": 5.0,
      "speaker": "Speaker 1",
      "text": ""
    }
  ],
  "speakerCount": 2,
  "confidence": 0.85,
  "debug": {
    "speech_segments_count": 10,
    "embeddings_count": 10,
    "processing_time": "mock"
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "audio-diarization-worker"
}
```

## Algorithm

1. **Audio Download**: Download audio file from provided URL
2. **Audio Conversion**: Convert to mono 16kHz WAV format using ffmpeg
3. **Speech Detection**: Use WebRTC VAD to detect speech segments
4. **Embedding Extraction**: Extract speaker embeddings using Resemblyzer
5. **Speaker Clustering**: Cluster embeddings into 2 speakers using AgglomerativeClustering
6. **Confidence Calculation**: Calculate confidence score using silhouette score
7. **Result Generation**: Return diarized segments with speaker labels

## Configuration

The worker can be configured using environment variables:

- `LOG_LEVEL`: Logging level (default: INFO)
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 50MB)
- `PROCESSING_TIMEOUT`: Processing timeout in seconds (default: 300)

## Deployment

### Render

1. Connect your repository to Render
2. Create a new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables as needed

### Railway

1. Connect your repository to Railway
2. Deploy the worker directory
3. Set environment variables
4. The service will be automatically deployed

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest
```

### Local Testing

1. Start the worker:
   ```bash
   uvicorn main:app --reload
   ```

2. Test with curl:
   ```bash
   curl -X POST "http://localhost:8000/diarize" \
        -H "Content-Type: application/json" \
        -d '{"fileUrl": "https://example.com/audio.wav"}'
   ```

## Troubleshooting

### Common Issues

1. **ffmpeg not found**: Install ffmpeg system-wide
2. **Memory issues**: Reduce audio file size or increase memory limits
3. **Processing timeout**: Increase timeout settings for large files

### Logs

Check logs for detailed error information:
```bash
# Local
uvicorn main:app --log-level debug

# Docker
docker logs <container-id>
```

## License

MIT License - see LICENSE file for details 