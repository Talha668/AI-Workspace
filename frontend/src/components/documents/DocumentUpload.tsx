import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';

interface DocumentUploadProps {
  workspaceId: number | string;
}

export default function DocumentUpload({ workspaceId }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      setError(null);
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          await apiService.uploadDocument(Number(workspaceId), file);
        }
        queryClient.invalidateQueries(); // refresh documents list + counts everywhere
      } catch (err: any) {
        const detail = err?.response?.data;
        setError(
          typeof detail === 'string'
            ? detail
            : detail
              ? Object.entries(detail)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
                  .join(' · ')
              : 'Upload failed. Please try again.'
        );
      } finally {
        setUploading(false);
      }
    },
    [workspaceId, queryClient]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 50 * 1024 * 1024,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  return (
    <div className="rounded-2xl bg-slate-900 p-6 shadow-xl ring-1 ring-white/10">
      <h3 className="text-lg font-semibold text-white">Upload Documents</h3>
      <div
        {...getRootProps()}
        className={`mt-4 cursor-pointer rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
          isDragActive ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-600 hover:border-indigo-400/60'
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600/20">
          <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-white">
          {uploading ? 'Uploading…' : 'Drag and drop files here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-slate-400">PDF, DOCX or TXT · up to 50MB</p>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}