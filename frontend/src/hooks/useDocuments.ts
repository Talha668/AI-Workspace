import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';


export const useDocuments = (workspaceId: number) => {
  const queryClient = useQueryClient();

  const uploadDocumentMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadDocument(workspaceId, file),
    onSuccess: () => {
      // Update the document count on the workspace card
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      // Update the actual list of documents in the table
      queryClient.invalidateQueries({ queryKey: ['workspace-documents', workspaceId] });
    },
    onError: (error: any) => {
      console.error("Upload failed:", error.response?.data);
      alert(error.response?.data?.error || "Failed to upload document.");
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: number) => apiService.deleteDocument(documentId),
    onSuccess: () => {
      // Update the document count on the workspace card
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      // Update the actual list of documents in the table
      queryClient.invalidateQueries({ queryKey: ['workspace-documents', workspaceId] });
    },
  });

  return {
    uploadDocument: uploadDocumentMutation,
    deleteDocument: deleteDocumentMutation,
  };
}