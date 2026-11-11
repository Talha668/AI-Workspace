import json
from urllib.parse import parse_qs
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import Conversation, Message
from apps.ai.services import RAGService



class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Authenticate via ?token= query param
        params = parse_qs(self.scope['query_string'].decode())
        token = params.get('token', [None])[0]

        user = AnonymousUser()
        if token:
            try:
                validated = JWTAuthentication().get_validated_token(token)
                user = await database_sync_to_async(JWTAuthentication().get_user)(validated)
            except (InvalidToken, TokenError):
                user = AnonymousUser()

        if user.is_anonymous:
            await self.close()
            return

        self.user = user
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']

        # Only the owner may join this conversation
        conversation = await self.get_conversation(self.conversation_id)
        if conversation is None or conversation.created_by_id != self.user.id:
            await self.close()
            return

        self.room_group_name = f'chat_{self.conversation_id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        message_type = data.get('type', 'message')
        if message_type == 'message':
            await self.handle_message(data)
        elif message_type == 'typing':
            await self.handle_typing(data)

    async def handle_message(self, data):
        content = (data.get('content') or '').strip()
        if not content:
            return

        user_message = await self.save_message('user', content)

        # Auto-title: the first user message names the chat
        await self.autotitle_conversation(content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': user_message.id,
                    'content': content,
                    'message_type': 'user',
                    'created_at': user_message.created_at.isoformat(),
                },
            }
        )

        # AI response, with an error safety net so the client is never left hanging
        try:
            ai_result = await self.get_ai_response(content)
            answer = ai_result['answer']
            metadata = {'sources': ai_result.get('sources', [])}
        except Exception as e:
            answer = f'Sorry, I encountered an error: {e}'
            metadata = {'error': str(e)}

        ai_message = await self.save_message('assistant', answer, metadata)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': ai_message.id,
                    'content': answer,
                    'message_type': 'assistant',
                    'metadata': metadata,
                    'created_at': ai_message.created_at.isoformat(),
                },
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def handle_typing(self, data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'is_typing': data.get('is_typing', False),
            }
        )

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing'],
        }))

    @database_sync_to_async
    def get_conversation(self, conversation_id):
        try:
            return Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, message_type, content, metadata=None):
        conversation = Conversation.objects.get(id=self.conversation_id)
        return Message.objects.create(
            conversation=conversation,
            content=content,
            message_type=message_type,
            metadata=metadata or {},
        )

    @database_sync_to_async
    def autotitle_conversation(self, first_user_text):
        conversation = Conversation.objects.get(id=self.conversation_id)
        if conversation.title in ('', None, 'New Chat'):
            conversation.title = first_user_text[:60]
            conversation.save(update_fields=['title'])

    @database_sync_to_async
    def get_ai_response(self, query):
        conversation = Conversation.objects.get(id=self.conversation_id)
        rag_service = RAGService()
        return rag_service.query_documents(query, conversation.workspace_id)