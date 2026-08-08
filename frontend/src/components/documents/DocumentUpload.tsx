import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDocuments } from '../../hooks/useDocuments';
import { Document } from '../../types';
import { formatFileSize } from '../../utils/formatters';

interface DocumentUploadProps {
  workspaceId: number;
  onUploadComplete?: (document: Document) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ workspaceId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const { uploadDocument } = useDocuments(workspaceId);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const uploadedDoc = await uploadDocument.mutateAsync(file);
        onUploadComplete?.(uploadedDoc);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [uploadDocument, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 52428800, // 50MB
  });

  return (
    <div
      {...getRootProps()}
      className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg 
        ${isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
        ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="space-y-1 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <div className="flex text-sm text-gray-600">
          <input {...getInputProps()} disabled={uploading} />
          <p className="pl-1">
            {uploading
              ? 'Uploading...'
              : isDragActive
              ? 'Drop the files here'
              : 'Drag and drop files here, or click to select'}
          </p>
        </div>
        <p className="text-xs text-gray-500">PDF, DOCX, TXT up to 50MB</p>
      </div>
    </div>
  );
};

export default DocumentUpload;