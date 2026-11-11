import { useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';

export interface ChatMessage {
  id?: number;
  content: string;
  message_type: 'user' | 'assistant';
  created_at?: string;
  metadata?: { sources?: { document_title?: string }[]; error?: string };
}

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export const useWebSocket = (conversationId: number | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // 1) Load chat history via REST
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    apiService.api
      .get('/messages/', { params: { conversation: conversationId } })
      .then((res) => {
        if (cancelled) return;
        const list: any[] = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setMessages(
          list.map((m) => ({
            id: m.id,
            content: m.content ?? '',
            message_type: m.message_type === 'user' ? ('user' as const) : ('assistant' as const),
            created_at: m.created_at,
            metadata: m.metadata ?? {},
          }))
        );
      })
      .catch(() => {
        // messages endpoint unavailable — start with an empty chat
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // 2) Live WebSocket connection
  useEffect(() => {
    if (!conversationId) return;

    const token = localStorage.getItem('access_token');
    const wsUrl = `${WS_BASE}/ws/chat/${conversationId}/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Typing pings are not chat messages — ignore them
      if (data.type === 'typing') return;
      setMessages((prev) => [...prev, data as ChatMessage]);
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [conversationId]);

  const sendMessage = (content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }));
    }
  };

  return { messages, isConnected, sendMessage };
};