// import React from 'react';
// import { useParams } from 'react-router-dom';
// import { useWorkspace } from '../hooks/useWorkspaces';
// import { useDocuments } from '../hooks/useDocuments';
// import DocumentUpload from '../components/documents/DocumentUpload';
// import DocumentList from '../components/documents/DocumentList';


// const WorkspaceDetail: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const workspaceId = parseInt(id || '0');
//   const { data: workspace, isLoading } = useWorkspace(workspaceId);
//   const { deleteDocument } = useDocuments(workspaceId);

//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   if (!workspace) {
//     return <div>Workspace not found</div>;
//   }

//   return (
//     <div>
//       <div className="mb-6">
//         <h1 className="text-2xl font-semibold text-gray-900">{workspace.name}</h1>
//         <p className="mt-1 text-sm text-gray-500">{workspace.description}</p>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2">
//           <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
//           <DocumentList
//             documents={workspace.documents}
//             onDelete={(docId) => deleteDocument.mutate(docId)}
//           />
//         </div>
//         <div>
//           <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h2>
//           <DocumentUpload workspaceId={workspaceId} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WorkspaceDetail;

import React from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../hooks/useWorkspaces';
import { useDocuments } from '../hooks/useDocuments';
import DocumentUpload from '../components/documents/DocumentUpload';
import DocumentList from '../components/documents/DocumentList';
import ChatBar from '../components/ai/ChatBar';
import type { Document } from '../types'; // Importing your exact type!


const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const workspaceId = parseInt(id || '0');

  // Dummy data matching your exact TypeScript interfaces
  const workspace = {
    id: workspaceId,
    name: id === '1' ? 'AI Research' : 'Project Alpha',
    description: 'Research papers and AI documentation',
    owner_email: 'user@example.com',
    documents_count: 2,
    documents: [
      {
        id: 1,
        title: 'Gemini_Technical_Report.pdf',
        file: '/dummy/path.pdf',
        file_type: 'pdf' as const,
        file_size: 2048576, // ~2MB
        content_text: 'Dummy extracted text...',
        is_processed: true,
        uploaded_by_email: 'user@example.com',
        created_at: '2024-01-28T10:30:00Z',
        file_url: '#'
      },
      {
        id: 2,
        title: 'Meeting_Notes.txt',
        file: '/dummy/path.txt',
        file_type: 'txt' as const,
        file_size: 1024, // 1KB
        content_text: 'Dummy notes...',
        is_processed: false, // This will show as not processed in UI if you add logic for it later
        uploaded_by_email: 'user@example.com',
        created_at: '2024-01-29T14:15:00Z',
        file_url: '#'
      }
    ],
    created_at: '2024-01-15',
    updated_at: '2024-01-29'
  };

  const handleDeleteDoc = (docId: number) => {
    console.log('Requested to delete document:', docId);
    // Connect to: deleteDocument.mutate(docId) later
  };

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{workspace.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{workspace.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Passing your strictly typed dummy documents to your real component */}
            <DocumentList documents={workspace.documents} onDelete={handleDeleteDoc} />
          </div>
          <div className="space-y-6">
            <DocumentUpload workspaceId={workspaceId} />
          </div>
        </div>
      </div>

      {/* Bottom AI Chat Bar */}
      <ChatBar workspaceId={workspaceId} />
    </div>
  );
};

export default WorkspaceDetail;