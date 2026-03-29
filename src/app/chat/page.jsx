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
  const [healthData, setHealthData] = useState({});
  const [userGoals, setUserGoals] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch today's health data and user goals
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const [healthResponse, goalsResponse] = await Promise.all([
          fetch(`/api/biometrics/today?patientId=${user.id}`),
          fetch(`/api/biometrics/goals?patientId=${user.id}`)
        ]);

        if (healthResponse.ok) {
          const data = await healthResponse.json();
          setHealthData(data.currentValues || {});
        } else {
          console.error('Failed to fetch health data:', healthResponse.status);
        }

        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json();
          setUserGoals(goalsData.goals || []);
        } else {
          console.error('Failed to fetch goals:', goalsResponse.status);
        }

        setDataLoaded(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        setDataLoaded(true);
      }
    };

    fetchData();
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

  const getMetricUnit = (metricType) => {
    const unitMap = {
      'steps': 'steps',
      'sleep': 'hours',
      'water': 'glasses',
      'calories': 'kcal',
      'heart_rate': 'bpm',
      'blood_glucose': 'mg/dL'
    };
    return unitMap[metricType] || '';
  };

  const getGoalValue = (metricType) => {
    const defaultGoals = {
      'steps': 10000,
      'sleep': 8,
      'water': 8,
      'calories': 2200,
      'heart_rate': 60,
      'blood_glucose': 100
    };

    // Find the actual goal for this metric type
    const goal = userGoals.find(g => g.metric_type === metricType);
    return goal ? goal.target_value : defaultGoals[metricType] || null;
  };

  const generateAssistantResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Help/What can I ask
    if (lowerMessage.includes('help') || lowerMessage.includes('what can') || lowerMessage.includes('options')) {
      return "I can help you with information about:\n\n📊 Health Metrics:\n• Steps & Activity\n• Sleep duration\n• Water intake (Hydration)\n• Calories burned\n• Heart rate\n• Blood glucose\n\n🎯 Goals:\n• Your active health goals\n• Goal progress\n• Target values\n\n📈 Summary:\n• Daily health summary\n• Overall progress\n\nTry asking me: 'How many steps today?', 'Show my goals', or 'Daily summary'";
    }

    // Goals queries
    if (lowerMessage.includes('goal')) {
      if (userGoals.length === 0) {
        return "You don't have any active health goals set yet. Consider setting goals for steps, sleep, water intake, and calories to stay motivated and track your progress!";
      }

      let goalsInfo = "📋 Your Active Health Goals:\n\n";
      userGoals.forEach((goal) => {
        const currentValue = healthData[goal.metric_type] || 0;
        const unit = getMetricUnit(goal.metric_type);
        const percentage = Math.round((currentValue / goal.target_value) * 100);
        const metricName = goal.metric_type.replace(/_/g, ' ').toUpperCase();

        goalsInfo += `• ${metricName}: ${goal.target_value} ${unit}\n`;
        goalsInfo += `  Current: ${formatNumber(currentValue)} ${unit} (${percentage}%)\n`;
        goalsInfo += `  Status: ${percentage >= 100 ? '✅ Achieved!' : percentage >= 80 ? '🟢 On track' : percentage >= 60 ? '🟡 Making progress' : '🔴 Keep pushing'}\n\n`;
      });

      return goalsInfo;
    }

    // Summary
    if (lowerMessage.includes('summary')) {
      const steps = Math.round(healthData.steps || 0);
      const sleep = (healthData.sleep || 0).toFixed(1);
      const water = Math.round(healthData.water || 0);
      const calories = Math.round(healthData.calories || 0);
      const heartRate = Math.round(healthData.heart_rate || 0);
      const bloodGlucose = Math.round(healthData.blood_glucose || 0);

      const stepsGoal = getGoalValue('steps');
      const sleepGoal = getGoalValue('sleep');
      const waterGoal = getGoalValue('water');
      const caloriesGoal = getGoalValue('calories');

      const stepsStatus = getHealthStatus('steps', steps, stepsGoal);
      const sleepStatus = getHealthStatus('sleep', sleep, sleepGoal);
      const waterStatus = getHealthStatus('water', water, waterGoal);
      const caloriesStatus = getHealthStatus('calories', calories, caloriesGoal);

      let summary = `📊 Your Daily Summary:\n\n`;
      summary += `👟 Steps: ${formatNumber(steps)} / ${formatNumber(stepsGoal)} (${Math.round((steps / stepsGoal) * 100)}%)\n`;
      summary += `😴 Sleep: ${sleep} hours / ${sleepGoal} hours (${Math.round((sleep / sleepGoal) * 100)}%)\n`;
      summary += `💧 Water: ${water} / ${waterGoal} glasses (${Math.round((water / waterGoal) * 100)}%)\n`;
      summary += `🔥 Calories: ${formatNumber(calories)} / ${formatNumber(caloriesGoal)} kcal (${Math.round((calories / caloriesGoal) * 100)}%)\n`;

      if (heartRate) {
        summary += `❤️ Heart Rate: ${heartRate} bpm\n`;
      }
      if (bloodGlucose) {
        summary += `🩸 Blood Glucose: ${bloodGlucose} mg/dL\n`;
      }

      summary += `\n💡 Keep up the great work on your health journey!`;
      return summary;
    }

    // Sleep
    if (lowerMessage.includes('sleep')) {
      const sleep = (healthData.sleep || 0).toFixed(1);
      if (!healthData.sleep || healthData.sleep === 0) {
        return "I don't have your sleep data from last night yet. Make sure your device is synced to see your sleep information. The recommended sleep is 7-9 hours per night.";
      }
      const sleepGoal = getGoalValue('sleep');
      let sleepStatus = '';
      if (sleep >= 7 && sleep <= 9) {
        sleepStatus = '✅ Perfect! ';
      } else if (sleep < 6) {
        sleepStatus = '⚠️ Too low. ';
      } else if (sleep > 9) {
        sleepStatus = '💤 A bit much. ';
      } else {
        sleepStatus = '🟢 Good. ';
      }

      return `😴 Sleep Report:\n\nLast night you got ${sleep} hours of sleep.\n${sleepStatus}The recommended range is 7-9 hours.\n\n${sleep >= 7 ? '✨ Great job getting quality sleep! Keep it up.' : '💪 Try to improve your sleep tonight. Good sleep is essential for your health.'}`;
    }

    // Steps
    if (lowerMessage.includes('step')) {
      const steps = Math.round(healthData.steps || 0);
      const goalSteps = getGoalValue('steps');
      if (steps === 0) {
        return `👟 Steps Report:\n\nYou haven't recorded any steps yet today. Get moving and check back later to see your progress! Try to reach your daily goal of ${formatNumber(goalSteps)} steps.`;
      }
      const percentage = Math.round((steps / goalSteps) * 100);
      const remaining = Math.max(0, goalSteps - steps);
      return `👟 Steps Report:\n\nYou've reached ${formatNumber(steps)} steps today!\n• Daily Goal: ${formatNumber(goalSteps)} steps\n• Progress: ${percentage}%\n\n${remaining > 0 ? `💪 You need ${formatNumber(remaining)} more steps to reach your goal!` : '🎉 Congratulations! You reached your daily step goal!'}`;
    }

    // Water/Hydration
    if (lowerMessage.includes('water') || lowerMessage.includes('hydration') || lowerMessage.includes('drink')) {
      const water = Math.round(healthData.water || 0);
      const goalWater = getGoalValue('water');
      if (water === 0) {
        return `💧 Hydration Report:\n\nYou haven't logged any water intake today. Remember to stay hydrated!\n• Daily Recommendation: ${goalWater} glasses\n• Daily Goal: 2-3 liters\n\n💡 Tip: Drink a glass of water every hour to stay healthy!`;
      }
      const percentage = Math.round((water / goalWater) * 100);
      return `💧 Hydration Report:\n\nYou've had ${water} glasses of water today!\n• Daily Goal: ${goalWater} glasses\n• Progress: ${percentage}%\n\n${percentage >= 100 ? '✅ Excellent hydration! You\'ve hit your daily target.' : '💪 Keep drinking water throughout the day!'}`;
    }

    // Calories
    if (lowerMessage.includes('calor')) {
      const calories = Math.round(healthData.calories || 0);
      const goalCalories = getGoalValue('calories');
      if (calories === 0) {
        return "🔥 Calories Report:\n\nYou haven't recorded any calorie burn data yet today. Your activity data will show up here as you move throughout the day. Keep active!";
      }
      const percentage = Math.round((calories / goalCalories) * 100);
      return `🔥 Calories Report:\n\nYou've burned ${formatNumber(calories)} calories today!\n• Daily Goal: ${formatNumber(goalCalories)} calories\n• Progress: ${percentage}%\n\n${percentage >= 100 ? '💪 Great activity level! You\'ve exceeded your daily goal.' : '✨ Keep up the activity!'}`;
    }

    // Heart Rate
    if (lowerMessage.includes('heart') || lowerMessage.includes('pulse')) {
      const heartRate = Math.round(healthData.heart_rate || 0);
      if (!heartRate) {
        return "❤️ Heart Rate Report:\n\nI don't have your heart rate data yet. Make sure your wearable device is synced properly. Normal resting heart rate is 60-100 bpm.";
      }
      let heartStatus = '';
      if (heartRate < 60) {
        heartStatus = '✅ Excellent - Well-trained or resting';
      } else if (heartRate <= 100) {
        heartStatus = '✅ Normal - Healthy range';
      } else {
        heartStatus = '⚠️ Elevated - Consider relaxing';
      }
      return `❤️ Heart Rate Report:\n\nYour current heart rate: ${heartRate} bpm\n\n${heartStatus}\n\nNormal resting heart rate range: 60-100 bpm`;
    }

    // Blood Glucose
    if (lowerMessage.includes('glucose') || lowerMessage.includes('sugar')) {
      const bloodGlucose = Math.round(healthData.blood_glucose || 0);
      if (!bloodGlucose) {
        return "🩸 Blood Glucose Report:\n\nI don't have your blood glucose data yet. Make sure to log your measurements. Normal fasting glucose: 70-100 mg/dL.";
      }
      let glucoseStatus = '';
      if (bloodGlucose < 70) {
        glucoseStatus = '⚠️ Low - Consider having a snack';
      } else if (bloodGlucose <= 100) {
        glucoseStatus = '✅ Normal - Great!';
      } else if (bloodGlucose <= 125) {
        glucoseStatus = '🟡 Slightly elevated';
      } else {
        glucoseStatus = '⚠️ High - Consult your provider';
      }
      return `🩸 Blood Glucose Report:\n\nYour blood glucose: ${bloodGlucose} mg/dL\n\n${glucoseStatus}\n\nNormal fasting range: 70-100 mg/dL`;
    }

    // Default response with suggestions
    return "I can help you with your health data! Try asking me about:\n\n• 'How many steps today?'\n• 'How's my sleep?'\n• 'Water intake'\n• 'Calories burned'\n• 'Show my goals'\n• 'Daily summary'\n• 'Heart rate'\n• 'Blood glucose'\n\nOr type 'help' to see all options!";
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
