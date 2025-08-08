'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UploadArea } from '../upload-area';

interface ImageFormData {
  imageUrl?: string;
}

interface AnalysisResult {
  caption: string;
  detailedDescription: string;
  objects: string[];
}

export function ImageAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch } = useForm<ImageFormData>();
  const imageUrl = watch('imageUrl');

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onSubmit = async (data: ImageFormData) => {
    if (!uploadedFile && !data.imageUrl) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      let imageData: string;

      if (uploadedFile) {
        // Validate file size (max 10MB)
        if (uploadedFile.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB');
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(uploadedFile.type)) {
          throw new Error('File type not supported. Please use JPEG, PNG, or WebP.');
        }

        // Convert file to base64 using FileReader
        imageData = await fileToBase64(uploadedFile);
      } else if (data.imageUrl) {
        // Validate URL
        try {
          new URL(data.imageUrl);
        } catch {
          throw new Error('Invalid URL provided');
        }
        imageData = data.imageUrl;
      } else {
        throw new Error('No image provided');
      }

      console.log('Sending image analysis request...');
      
      const response = await fetch('/api/image/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze image');
        } else {
          // Handle HTML error responses
          const errorText = await response.text();
          console.error('Non-JSON error response:', errorText);
          
          // Try to extract meaningful error from HTML
          if (errorText.includes('Unauthorized') || errorText.includes('401')) {
            throw new Error('Authentication required. Please sign in.');
          } else if (errorText.includes('500') || errorText.includes('Internal Server Error')) {
            throw new Error('Server error. Please check your OpenAI API key and try again.');
          } else {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }
      }

      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Image Analysis
        </h2>
        <p className="text-gray-600">
          Upload an image or provide a URL to get a detailed description and analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              {...register('imageUrl')}
              placeholder="https://example.com/image.jpg"
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
            onFileSelect={handleFileSelect}
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            maxSize={10 * 1024 * 1024} // 10MB
          />
        </div>

        <button
          type="submit"
          disabled={(!uploadedFile && !imageUrl) || isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Analyzing...' : 'Analyze Image'}
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
            <span className="text-blue-800">Analyzing image with OpenAI...</span>
          </div>
        </div>
      )}

      {(previewUrl || imageUrl) && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
          <img
            src={previewUrl || imageUrl}
            alt="Preview"
            className="max-w-full h-auto rounded-md"
          />
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Caption</h4>
              <p className="text-sm text-gray-700">{result.caption}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Detected Objects</h4>
              <div className="flex flex-wrap gap-2">
                {result.objects.map((object, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {object}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Detailed Description</h4>
            <p className="text-sm text-gray-700">{result.detailedDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
} 