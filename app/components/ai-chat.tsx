'use client'

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Mic, MicOff, Volume2 } from 'lucide-react';

// SpeechRecognition 타입 정의
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

// 전역 인터페이스 확장
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  actions?: string[];
};

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am your financial assistant AI. How can I help you?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechRecognition = useRef<SpeechRecognition | null>(null);

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

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setInputValue(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };
      
      speechRecognition.current = recognition;
    }

    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
    };
  }, [isListening]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const toggleListening = () => {
    if (!speechRecognition.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      speechRecognition.current.stop();
      setIsListening(false);
    } else {
      speechRecognition.current.start();
      setIsListening(true);
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessageToAgent = async (message: string) => {
    try {
      setIsLoading(true);
      
      // Call backend API
      const response = await fetch('http://localhost:5000/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user123', // Replace with actual user ID
          input: message,
        }),
      });

      if (!response.ok) {
        throw new Error('API response error');
      }

      const data = await response.json();
      
      // Add AI response message
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date(),
        actions: data.actions,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      
      // Automatic voice response (accessibility feature)
      if (isSpeaking) {
        speakMessage(data.response);
      }
    } catch (error) {
      console.error('Agent API error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, an error occurred while processing your request.',
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Stop listening if active
    if (isListening) {
      toggleListening();
    }
    
    // Send message to backend AI agent
    sendMessageToAgent(inputValue);
    
    setInputValue('');
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
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden z-40 border border-gray-200">
          {/* Chat header */}
          <div className="bg-orange-500 text-white p-3 flex justify-between items-center">
            <h3 className="font-medium">Financial Assistant AI</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => speakMessage(messages[messages.length - 1].content)}
                className={`text-white hover:text-gray-200 ${isSpeaking ? 'text-gray-200' : ''}`}
                aria-label="Listen with voice"
                title="Listen with voice"
              >
                <Volume2 size={18} />
              </button>
              <button 
                onClick={toggleChat}
                className="text-white hover:text-gray-200"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
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
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 text-xs">
                      <p className="font-semibold">Executed tasks:</p>
                      <ul className="list-disc pl-4 mt-1">
                        {message.actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 rounded-lg rounded-tl-none p-3 shadow-sm max-w-[80%]">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-l-lg ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                title={isListening ? 'Stop speech input' : 'Speak to input'}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 border-l-0 border-r-0 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`p-2 rounded-r-lg ${
                  !inputValue.trim() || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
                disabled={!inputValue.trim() || isLoading}
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
