'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UploadArea } from '../upload-area';

interface ConversationFormData {
  languageHint?: string;
}

interface ProcessingResult {
  transcript: Array<{ start: number; end: number; text: string }>;
  diarized: Array<{ start: number; end: number; speaker: string; text: string }>;
  summary: { tldr: string; bullets: string[] };
}

export function ConversationAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit } = useForm<ConversationFormData>();

  const onSubmit = async (data: ConversationFormData) => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Convert file to base64
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const audioData = `data:${uploadedFile.type};base64,${base64}`;

      const response = await fetch('/api/conversation/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData,
          languageHint: data.languageHint,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process audio');
      }

      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error('Processing failed:', error);
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Conversation Analysis
        </h2>
        <p className="text-gray-600">
          Upload an audio file to get transcription, speaker diarization, and summary.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <UploadArea
          onFileSelect={setUploadedFile}
          acceptedTypes={['audio/wav', 'audio/mp3', 'audio/m4a']}
          maxSize={50 * 1024 * 1024} // 50MB
        />

        <div>
          <label htmlFor="languageHint" className="block text-sm font-medium text-gray-700 mb-1">
            Language Hint (Optional)
          </label>
          <select
            {...register('languageHint')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Auto-detect</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!uploadedFile || isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Analyze Conversation'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Processing audio with OpenAI...</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Results</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Transcript</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {result.transcript.map((segment, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-gray-500">
                      {Math.floor(segment.start / 60)}:{(segment.start % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="ml-2">{segment.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Diarization</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {result.diarized.map((segment, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-blue-600">{segment.speaker}:</span>
                    <span className="ml-2">{segment.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <div className="space-y-2">
                <p className="text-sm font-medium">{result.summary.tldr}</p>
                <ul className="text-sm space-y-1">
                  {result.summary.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 