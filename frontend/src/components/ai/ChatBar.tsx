import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api'; // Adjust path if needed


export default function ChatBar({ conversationId }: { conversationId: number }) {
  const [query, setQuery] = useState('');
  // We store a local history just for this UI session
  const [messages, setMessages] = useState<Array<{role: string, text: string}>>([]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiService.sendMessage(conversationId, content),
    onSuccess: (data) => {
      // Return AI response
      const aiResponseText = data?.ai_message?.content || "AI responded successfully.";
      setMessages(prev => [...prev, { role: 'ai', text: aiResponseText }]);
    },
    onError: (error) => {
      setMessages(prev => [...prev, { role: 'ai', text: "Error: Failed to get response from AI." }]);
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || sendMutation.isPending) return;

    const userText = query;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setQuery('');
    
    // Trigger the real API call
    sendMutation.mutate(userText);
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {messages.length > 0 && (
        <div className="max-h-48 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? "flex justify-end" : "flex justify-start"}>
              <div className={msg.role === 'user' ? "max-w-[70%] px-4 py-2 rounded-lg text-sm bg-blue-600 text-white" : "max-w-[70%] px-4 py-2 rounded-lg text-sm bg-white border border-gray-200 text-gray-800"}>
                {msg.text}
              </div>
            </div>
          ))}
          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-500 animate-pulse">
                AI is thinking...
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 flex items-center space-x-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI about your documents..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          disabled={sendMutation.isPending}
        />
        <button 
          type="submit" 
          disabled={sendMutation.isPending || !query.trim()}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}