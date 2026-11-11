from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'content', 'message_type', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at', 'metadata']


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'workspace', 'created_by_email',
            'messages', 'message_count', 'created_at', 'updated_at', 'last_message'
        ]
        read_only_fields = ['id', 'created_by_email', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        m = obj.messages.order_by('-created_at').first()
        if not m:
            return None
        return {
            'text': (m.content or '')[:80],
            'role': m.message_type,
            'created_at': m.created_at.isoformat(),
        }

    def get_message_count(self, obj):
        return obj.messages.count()


class ConversationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['title', 'workspace']


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content', 'message_type']