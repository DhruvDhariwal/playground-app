'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UploadArea } from '../upload-area';

interface DocumentFormData {
  url?: string;
}

interface SummaryResult {
  tldr: string;
  bullets: string[];
  longSummary: string;
  keyQuotes: string[];
}

export function DocumentSummarization() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch } = useForm<DocumentFormData>();
  const url = watch('url');

  const onSubmit = async (data: DocumentFormData) => {
    if (!uploadedFile && !data.url) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      let requestBody: any = {};

      if (uploadedFile) {
        // For now, we'll read the file as text (for simple text files)
        const text = await uploadedFile.text();
        requestBody.textContent = text;
      } else if (data.url) {
        requestBody.url = data.url;
      } else {
        throw new Error('No document or URL provided');
      }

      const response = await fetch('/api/doc/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize document');
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
          Document/URL Summarization
        </h2>
        <p className="text-gray-600">
          Upload a PDF/DOCX file or provide a URL to get a comprehensive summary.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              URL (Optional)
            </label>
            <input
              type="url"
              {...register('url')}
              placeholder="https://example.com/article"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or upload a file</span>
            </div>
          </div>

          <UploadArea
            onFileSelect={setUploadedFile}
            acceptedTypes={['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']}
            maxSize={50 * 1024 * 1024} // 50MB
          />
        </div>

        <button
          type="submit"
          disabled={(!uploadedFile && !url) || isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Summarize Document'}
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
            <span className="text-blue-800">Processing document with OpenAI...</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Summary Results</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">TL;DR</h4>
              <p className="text-sm text-gray-700">{result.tldr}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Key Points</h4>
              <ul className="space-y-1">
                {result.bullets.map((bullet, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Detailed Summary</h4>
            <p className="text-sm text-gray-700">{result.longSummary}</p>
          </div>

          {result.keyQuotes && result.keyQuotes.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Key Quotes</h4>
              <div className="space-y-2">
                {result.keyQuotes.map((quote, index) => (
                  <blockquote key={index} className="text-sm text-gray-700 italic border-l-4 border-blue-200 pl-4">
                    "{quote}"
                  </blockquote>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 