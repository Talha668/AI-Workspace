import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Conversation, Message
from apps.ai.services import RAGService


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'message')
        
        if message_type == 'message':
            await self.handle_message(data)
        elif message_type == 'typing':
            await self.handle_typing(data)

    async def handle_message(self, data):
        content = data['content']
        
        # Save user message
        user_message = await self.save_message('user', content)
        
        # Send user message to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': user_message.id,
                    'content': content,
                    'message_type': 'user',
                    'created_at': user_message.created_at.isoformat()
                }
            }
        )
        
        # Get AI response
        ai_response = await self.get_ai_response(content)
        
        # Save and send AI message
        ai_message = await self.save_message('assistant', ai_response['answer'], 
                                             {'sources': ai_response['sources']})
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': ai_message.id,
                    'content': ai_response['answer'],
                    'message_type': 'assistant',
                    'metadata': {'sources': ai_response['sources']},
                    'created_at': ai_message.created_at.isoformat()
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def handle_typing(self, data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.scope['user'].id,
                'is_typing': data.get('is_typing', False)
            }
        )

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))

    @sync_to_async
    def save_message(self, message_type, content, metadata=None):
        conversation = Conversation.objects.get(id=self.conversation_id)
        return Message.objects.create(
            conversation=conversation,
            content=content,
            message_type=message_type,
            metadata=metadata or {}
        )

    @sync_to_async
    def get_ai_response(self, query):
        conversation = Conversation.objects.get(id=self.conversation_id)
        rag_service = RAGService()
        return rag_service.query_documents(query, conversation.workspace_id)