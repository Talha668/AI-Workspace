from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, ConversationCreateSerializer,
    MessageSerializer, MessageCreateSerializer
)

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
            message = serializer.save(
                conversation=conversation,
                message_type='user'
            )
            
            # TODO: In Phase 3, we'll add AI response here
            # For now, we'll create a placeholder response
            ai_message = Message.objects.create(
                conversation=conversation,
                content="AI response will be implemented in Phase 3",
                message_type='assistant',
                metadata={'status': 'placeholder'}
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