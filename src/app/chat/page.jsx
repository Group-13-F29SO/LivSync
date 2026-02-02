'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import ChatMessage from '@/components/Chat/ChatMessage';
import QuickPrompts from '@/components/Chat/QuickPrompts';
import ChatInput from '@/components/Chat/ChatInput';
import { useAuth } from '@/hooks/useAuth';

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: 'assistant',
        text: "Hello! I'm your LivSync health assistant. I can help you track your health data, answer questions, and provide insights. What would you like to know?",
        timestamp: getCurrentTime()
      }
    ]);
  }, []);

  // Redirect to login if no user is found
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
  };

  const generateAssistantResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('summary')) {
      return "Here's your daily summary:\n\n📊 Steps: 7,834 steps\n😴 Sleep: 7.5 hours\n💧 Water: 8 glasses\n🏃 Active Time: 45 minutes\n\nGreat job staying on track!";
    } else if (lowerMessage.includes('sleep')) {
      return "Last night you got 7.5 hours of sleep. That's within the recommended 7-9 hours range. Your sleep quality was good with minimal interruptions.";
    } else if (lowerMessage.includes('steps') || lowerMessage.includes('step')) {
      return "You've reached 7,834 steps today! That's 78% of your daily goal of 10,000 steps. Keep moving to reach your target!";
    } else {
      return "I'm sorry, I'm still learning. Can you ask about your sleep, steps, or daily summary?";
    }
  };

  const handleSendMessage = (messageText) => {
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: messageText,
      timestamp: getCurrentTime()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsWaitingForResponse(true);

    // Simulate assistant thinking and responding
    setTimeout(() => {
      const assistantMessage = {
        id: messages.length + 2,
        sender: 'assistant',
        text: generateAssistantResponse(messageText),
        timestamp: getCurrentTime()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsWaitingForResponse(false);
    }, 800);
  };

  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 p-8 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            Health Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ask me anything about your health data and goals
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col h-[calc(100vh-260px)] w-full mx-auto">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isUser={message.sender === 'user'}
              />
            ))}
            {isWaitingForResponse && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                  H
                </div>
                <div className="flex items-center gap-1 px-4 py-3 bg-slate-100 dark:bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <QuickPrompts onPromptSelect={handleQuickPrompt} />

          {/* Chat Input */}
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </main>
    </div>
  );
}
