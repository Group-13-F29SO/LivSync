'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatMessage from '@/components/Chat/ChatMessage';
import QuickPrompts from '@/components/Chat/QuickPrompts';
import ChatInput from '@/components/Chat/ChatInput';
import { useAuth } from '@/hooks/useAuth';

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [healthDataLoading, setHealthDataLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch today's health data
  useEffect(() => {
    if (!user?.id) return;

    const fetchHealthData = async () => {
      try {
        setHealthDataLoading(true);
        const response = await fetch(`/api/biometrics/today?patientId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setHealthData(data.currentValues || {});
        }
      } catch (error) {
        console.error('Error fetching health data:', error);
        setHealthData({});
      } finally {
        setHealthDataLoading(false);
      }
    };

    fetchHealthData();
  }, [user?.id]);

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
    // Only allow patients to access this page
    if (!isLoading && user && user.userType === 'provider') {
      router.push('/provider');
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

  const formatNumber = (num) => {
    return num ? Number(num).toLocaleString() : '0';
  };

  const getHealthStatus = (metric, value, target) => {
    if (!value && value !== 0) return 'gray';
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 60) return 'fair';
    return 'low';
  };

  const generateAssistantResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    if (!healthData || (Object.keys(healthData).length === 0 && !healthDataLoading)) {
      return "I'm sorry, I couldn't retrieve your health data at the moment. Please try again in a few moments.";
    }

    if (lowerMessage.includes('summary')) {
      const steps = Math.round(healthData.steps || 0);
      const sleep = (healthData.sleep || 0).toFixed(1);
      const water = Math.round(healthData.water || 0);
      const calories = Math.round(healthData.calories || 0);

      const stepsStatus = getHealthStatus('steps', steps, 10000);
      const sleepStatus = getHealthStatus('sleep', sleep, 8);
      const waterStatus = getHealthStatus('water', water, 8);
      const caloriesStatus = getHealthStatus('calories', calories, 2200);

      return `Here's your daily summary:\n\n📊 Steps: ${formatNumber(steps)} steps (${Math.round((steps / 10000) * 100)}% of goal)\n😴 Sleep: ${sleep} hours (${sleepStatus === 'excellent' ? 'Great!' : sleepStatus === 'good' ? 'Good!' : sleepStatus === 'fair' ? 'Fair' : 'Low'})\n💧 Water: ${water} glasses (${Math.round((water / 8) * 100)}% of goal)\n🔥 Calories: ${formatNumber(calories)} kcal burned\n\nKeep up the great work on your health journey!`;
    } else if (lowerMessage.includes('sleep')) {
      const sleep = (healthData.sleep || 0).toFixed(1);
      if (!healthData.sleep) {
        return "I don't have your sleep data from last night yet. Make sure your device is synced to see your sleep information.";
      }
      const sleepGoal = 8;
      const sleepStatus = sleep >= 8 && sleep <= 9 ? 'perfect' : sleep < 6 ? 'too low' : 'good';
      return `Last night you got ${sleep} hours of sleep. That's ${sleepStatus}. The recommended range is 7-9 hours. ${sleep >= 7 ? 'Great job getting quality sleep!' : 'Try to get a bit more sleep tonight.'}`;
    } else if (lowerMessage.includes('steps') || lowerMessage.includes('step')) {
      const steps = Math.round(healthData.steps || 0);
      if (steps === 0) {
        return "You haven't recorded any steps yet today. Get moving and check back later to see your progress!";
      }
      const goalSteps = 10000;
      const percentage = Math.round((steps / goalSteps) * 100);
      const remaining = Math.max(0, goalSteps - steps);
      return `You've reached ${formatNumber(steps)} steps today! That's ${percentage}% of your daily goal of ${formatNumber(goalSteps)} steps. ${remaining > 0 ? `Keep moving to reach your target! You need ${formatNumber(remaining)} more steps.` : '🎉 Congratulations! You reached your daily step goal!'}`;
    } else if (lowerMessage.includes('water') || lowerMessage.includes('hydration')) {
      const water = Math.round(healthData.water || 0);
      if (water === 0) {
        return "You haven't logged any water intake today. Remember to stay hydrated! The recommended intake is 8 glasses per day.";
      }
      const goalWater = 8;
      const percentage = Math.round((water / goalWater) * 100);
      return `You've had ${water} glasses of water today. That's ${percentage}% of your daily goal of ${goalWater} glasses. Keep drinking water throughout the day!`;
    } else if (lowerMessage.includes('calories')) {
      const calories = Math.round(healthData.calories || 0);
      if (calories === 0) {
        return "You haven't recorded any calorie burn data yet today. Your activity data will show up here as you move throughout the day.";
      }
      const goalCalories = 2200;
      const percentage = Math.round((calories / goalCalories) * 100);
      return `You've burned ${formatNumber(calories)} calories today. That's ${percentage}% of your daily goal of ${formatNumber(goalCalories)} calories. Keep up the activity!`;
    } else {
      return "I can help you with information about your daily summary, steps, sleep, water intake, and calories burned. Just ask me about any of these!";
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
      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
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
