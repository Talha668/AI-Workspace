import React from 'react';
import type { Document } from '../../types';
import { formatFileSize, formatDate } from '../../utils/formatters';

interface DocumentListProps {
  documents: Document[];
  onDelete?: (documentId: number) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete }) => {
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      default:
        return '📎';
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <li key={doc.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getFileIcon(doc.file_type)}</span>
                  <div>
                    <p className="text-sm font-medium text-blue-600 truncate hover:underline cursor-pointer">{doc.title}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(doc.file_size)} • Uploaded {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                  <div className="flex space-x-2">
                    {/* Changed to trigger Django download endpoint instead of a broken direct link */}
                    <a
                      href={`/api/workspaces/${window.location.pathname.split('/')[2]}/documents/${doc.id}/download/`}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      View
                    </a>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentList;