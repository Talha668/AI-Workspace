from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, ConversationCreateSerializer,
    MessageSerializer, MessageCreateSerializer
)
from apps.ai.services import RAGService


class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            created_by=self.request.user
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return ConversationCreateSerializer
        return ConversationSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            # Save user message
            message = serializer.save(
                conversation=conversation,
                message_type='user'
            )
            
            # Get AI reponse using RAG
            try:
                rag_service = RAGService()
                ai_result = rag_service.query_documents(
                    query=message.content,
                    workspace_id=conversation.workspace_id
                )

                ai_message = Message.objects.create(
                    conversation=conversation,
                    content=ai_result['answer'],
                    message_type='assistant',
                    metadata={'sources': ai_result['sources']}
                )

                return Response({
                    'user_message': MessageSerializer(message).data,
                    'ai_message': MessageSerializer(ai_message).data
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                # If ai fails still return user message with error
                ai_message = Message.objects.create(
                    conversation=conversation,
                    content=f"Sorry, I encountered an error: {str(e)}",
                    message_type='assistant',
                    metadata={'error': str(e)}
                )

                return Response({
                    'user_message': MessageSerializer(message).data,
                    'ai_message': MessageSerializer(ai_message).data
                }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)    


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(
            conversation__created_by=self.request.user
        )