from django.urls import path
from . import views


urlpatterns = [
    # 1. Conversation List & Create
    path('conversations/', views.ConversationViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='conversation-list'),

    # 2. Conversation Detail (Retrieve, Update, Delete)
    path('conversations/<int:pk>/', views.ConversationViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='conversation-detail'),

    # 3. THE FIX: Send Message Action
    path('conversations/<int:pk>/send_message/', views.ConversationViewSet.as_view({
        'post': 'send_message'
    }), name='conversation-send-message'),

    # 4. Message List
    path('messages/', views.MessageViewSet.as_view({
        'get': 'list',
    }), name='message-list'),

    # 5. Message Detail
    path('messages/<int:pk>/', views.MessageViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='message-detail'),
]