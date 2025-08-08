'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number;
}

export function UploadArea({ onFileSelect, acceptedTypes = [], maxSize }: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <div className="text-gray-400">
          <svg
            className="mx-auto h-12 w-12"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-gray-600">
          <span className="font-medium">Click to upload</span> or drag and drop
        </div>
        <p className="text-xs text-gray-500">
          {acceptedTypes.length > 0 && `Accepted types: ${acceptedTypes.join(', ')}`}
          {maxSize && ` (Max size: ${Math.round(maxSize / 1024 / 1024)}MB)`}
        </p>
      </div>
    </div>
  );
} 