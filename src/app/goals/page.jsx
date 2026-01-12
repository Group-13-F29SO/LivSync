'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import GoalCard from '@/components/GoalCard/GoalCard';
import { FootprintsIcon, FlameIcon, DropIcon, MoonIcon, PlusIcon } from '@/components/Icons/GoalIcons';
import { useAuth } from '@/hooks/useAuth';

export default function GoalsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if no user is found
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Goal data array
  const goalsData = [
    {
      id: 1,
      title: 'Daily Steps',
      icon: FootprintsIcon,
      streak: 12,
      currentValue: 7834,
      targetValue: 10000,
      unit: 'steps',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 2,
      title: 'Calories Burned',
      icon: FlameIcon,
      streak: 8,
      currentValue: 1847,
      targetValue: 2200,
      unit: 'kcal',
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      id: 3,
      title: 'Water Intake',
      icon: DropIcon,
      streak: 15,
      currentValue: 6,
      targetValue: 8,
      unit: 'glasses',
      iconBgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600'
    },
    {
      id: 4,
      title: 'Sleep Duration',
      icon: MoonIcon,
      streak: 5,
      currentValue: 7.5,
      targetValue: 8,
      unit: 'hours',
      iconBgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    }
  ];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-blue-50">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 p-8 ml-20 overflow-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            Goals & Streaks
          </h1>
          <p className="text-slate-500 mt-2">Set and track your personal health goals</p>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {goalsData.map((goal) => (
            <GoalCard
              key={goal.id}
              title={goal.title}
              icon={goal.icon}
              streak={goal.streak}
              currentValue={goal.currentValue}
              targetValue={goal.targetValue}
              unit={goal.unit}
              iconBgColor={goal.iconBgColor}
              iconColor={goal.iconColor}
            />
          ))}
        </div>

        {/* Add New Goal Button */}
        <button className="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 flex items-center justify-center gap-3 hover:border-gray-400 hover:bg-gray-50 transition-all group">
          <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-gray-500" />
          <span className="text-gray-500 font-medium group-hover:text-gray-600">Add New Goal</span>
        </button>
      </main>
    </div>
  );
}
