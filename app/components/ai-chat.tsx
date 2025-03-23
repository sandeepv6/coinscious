'use client'

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Mic, MicOff } from 'lucide-react';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type AiChatProps = {
  userID: string;
};

// Define a type for the SpeechRecognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

// Define a global interface for the window object
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

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
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const startRecording = () => {
    if (isRecording) return;
    
    setErrorMessage(null);
    
    try {
      // Check if browser supports speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setErrorMessage('Speech recognition is not supported in your browser');
        return;
      }
      
      // Create a new recognition instance
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Handle results
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update state with transcripts
        if (finalTranscript) {
          setInputValue((prev) => {
            const trimmedPrev = prev.trim();
            const trimmedTranscript = finalTranscript.trim();
            return trimmedPrev ? `${trimmedPrev} ${trimmedTranscript}` : trimmedTranscript;
          });
        }
        
        setInterimTranscript(interimTranscript);
      };
      
      // Handle errors
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setErrorMessage(`Speech recognition error: ${event.error}`);
        stopRecording();
      };
      
      // Handle end of recognition
      recognition.onend = () => {
        // Only set recording to false if this is the current recognition instance
        if (recognitionRef.current === recognition) {
          setIsRecording(false);
          
          // Add any remaining interim transcript to the input
          if (interimTranscript) {
            setInputValue((prev) => {
              const trimmedPrev = prev.trim();
              const trimmedTranscript = interimTranscript.trim();
              return trimmedPrev ? `${trimmedPrev} ${trimmedTranscript}` : trimmedTranscript;
            });
            setInterimTranscript('');
            
            // Automatically submit after a short delay
            setTimeout(() => {
              if (inputValue.trim() || interimTranscript.trim()) {
                const formEvent = new Event('submit', { cancelable: true, bubbles: true }) as unknown as React.FormEvent;
                handleSubmit(formEvent);
              }
            }, 300);
          }
        }
      };
      
      // Start recognition
      recognition.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setErrorMessage('Failed to start speech recognition');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!isRecording || !recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
      
      // Add any remaining interim transcript to the input
      if (interimTranscript) {
        setInputValue((prev) => {
          const trimmedPrev = prev.trim();
          const trimmedTranscript = interimTranscript.trim();
          return trimmedPrev ? `${trimmedPrev} ${trimmedTranscript}` : trimmedTranscript;
        });
        setInterimTranscript('');
      }
      
      // Automatically submit the form after a short delay to allow state updates
      setTimeout(() => {
        if (inputValue.trim() || interimTranscript.trim()) {
          const formEvent = new Event('submit', { cancelable: true, bubbles: true }) as unknown as React.FormEvent;
          handleSubmit(formEvent);
        }
      }, 300);
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
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
            
            {/* Interim transcript */}
            {interimTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg p-3 bg-orange-300 text-white rounded-tr-none italic">
                  <p>{interimTranscript}</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="text-center p-2 text-red-500 text-sm border-t border-gray-200">
              {errorMessage}
            </div>
          )}
          
          {/* Chat input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={isRecording ? "Listening..." : "Type your message..."}
                className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isRecording}
              />
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                type="submit"
                className="bg-orange-500 text-white p-2 rounded-r-lg hover:bg-orange-600"
                disabled={!inputValue.trim() && !interimTranscript}
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
