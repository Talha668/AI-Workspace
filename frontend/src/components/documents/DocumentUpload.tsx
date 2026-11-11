import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDocuments } from '../../hooks/useDocuments';
import type { Document } from '../../types';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface DocumentUploadProps {
  workspaceId: number;
  onUploadComplete?: (document: Document) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ workspaceId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const { uploadDocument: uploadDocumentMutation } = useDocuments(workspaceId);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          await uploadDocumentMutation.mutateAsync(file);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
      }
    },
    [uploadDocumentMutation, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 52428800,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Upload Documents</h2>
      </div>

      <div className="p-4">
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors
            ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800/50'
            }
            ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <input {...getInputProps()} disabled={uploading} />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <ArrowUpTrayIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            {uploading ? 'Uploading...' : isDragActive ? 'Drop the files here' : 'Drag and drop files here, or click to select'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PDF, DOCX or TXT · up to 50MB</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;