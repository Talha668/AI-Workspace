import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Message } from '../../types';

interface ChatInterfaceProps {
  conversationId: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversationId }) => {
  const [input, setInput] = useState('');
  const { messages, isConnected, sendMessage, sendTyping } = useWebSocket(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    // Send typing indicator
    sendTyping(true);
    
    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Set new timeout to stop typing
    const timeout = setTimeout(() => {
      sendTyping(false);
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
      <div className="p-3 border-b bg-gray-50 flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: Message, index: number) => (
          <div
            key={index}
            className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.message_type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.metadata?.sources && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold">Sources:</p>
                  {message.metadata.sources.map((source: any, idx: number) => (
                    <p key={idx} className="text-xs mt-1">📄 {source.document_title}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your documents..."
            className="flex-1 input-field"
            disabled={!isConnected}
          />
          <button 
            onClick={handleSend} 
            className="btn-primary"
            disabled={!isConnected}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;