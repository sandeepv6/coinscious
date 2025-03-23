'use client'

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type AiChatProps = {
  userID: string;
};

export default function AiChat({ userID }: AiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your banking assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Send user message to backend and get AI response
    try {
      const response = await fetch(`http://localhost:5000/api/agent/${userID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error during AI chat:', error);
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 transition-all z-50"
        aria-label="Open chat"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-3/4 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden z-40 border border-gray-200">
          {/* Chat header */}
          <div className="bg-orange-500 text-white p-3 flex justify-between items-center">
            <h3 className="font-medium">Banking Assistant</h3>
            <button 
              onClick={toggleChat}
              className="text-white hover:text-gray-200"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p>{message.content}</p>
                  <span 
                    className={`text-xs block mt-1 ${
                      message.sender === 'user' ? 'text-orange-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-orange-500 text-white p-2 rounded-r-lg hover:bg-orange-600"
                disabled={!inputValue.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
