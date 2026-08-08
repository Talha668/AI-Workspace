import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

export const useConversations = (workspaceId: number) => {
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['conversations', workspaceId],
    queryFn: () => apiService.getConversations(workspaceId),
    enabled: !!workspaceId,
  });

  const createConversationMutation = useMutation({
    mutationFn: (data: { title: string; workspace: number }) =>
      apiService.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
    },
  });

  return {
    conversations: conversationsQuery.data,
    isLoading: conversationsQuery.isLoading,
    createConversation: createConversationMutation,
  };
};

export const useConversation = (id: number) => {
  const queryClient = useQueryClient();

  const conversationQuery = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => apiService.getConversation(id),
    enabled: !!id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Just send messages, backend handles AI internally
      const response  = await apiService.sendMessage(id, content);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    },
  });

  return {
    conversation: conversationQuery.data,
    isLoading: conversationQuery.isLoading,
    sendMessage: sendMessageMutation,
  };
};