'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import DashboardCard from '@/components/DashboardCard/DashboardCard';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage (set during login)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies in request
      });

      if (response.ok) {
        // Clear user from localStorage only after successful logout
        localStorage.removeItem('user');
        
        // Redirect to login
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="inline-block text-3xl font-bold text-gray-800 bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user?.firstName || 'User'}</p>
            <p className="text-gray-600 mt-1">Last Synced: Just now</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
        
        {/* Dashboard content will go here */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Steps Card */}
          <DashboardCard
            title="Steps"
            value="7,834"
            unit="steps"
            icon={
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M7 20c-1.5 0-2.5-1.5-2-3 1-2.5 3-4 4.5-4.5 1.5-.5 2.5.5 2 2-.5 1.5-2 6.5-4.5 5.5z" />
                <path d="M16 18c1.5 0 2-2 1-3.5-1.5-2-3.5-3-5-2.5-1.5.5-1 2 0 3.5 1 1.5 3 2.5 4 2.5z" />
                <path d="M9 7c0-1.5 1-3 2.5-3S14 5 14 6.5 13 9 11.5 9 9 8.5 9 7z" />
              </svg>
            }
          />

          {/* Heart Rate Card */}
          <DashboardCard
            title="Heart Rate"
            value="72"
            unit="bpm"
            subtitle="Resting: 65 bpm"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.682 4.318 12.682a4.5 4.5 0 010-6.364z" />
              </svg>
            }
          />

          {/* Calories Burned Card */}
          <DashboardCard
            title="Calories Burned"
            value="1847"
            unit="kcal"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3s-3 3.2-3 6.2a3 3 0 006 0C15 6.2 12 3 12 3z" />
                <path d="M9.5 13.5c-.8 1.5-.5 3 1 4.5 1.5 1.5 4 1.2 5-1 .6-1.4.2-2.8-1.2-4.2" />
              </svg>
            }
          />

          {/* Hydration Card */}
          <DashboardCard
            title="Hydration"
            value="6"
            unit="glasses"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3s-6 6.5-6 10.5A6 6 0 0018 14c0-4-6-11-6-11z" />
              </svg>
            }
          />

          {/* Sleep Card */}
          <DashboardCard
            title="Sleep"
            value="7.5"
            unit="hours"
            subtitle="Quality: Good"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            }
          />

          {/* Blood Glucose Card */}
          <DashboardCard
            title="Blood Glucose"
            value="95"
            unit="mg/dL"
            subtitle="Status: Normal"
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
            icon={
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
                <path d="M12 12l4-4" />
                <path d="M12 12h.01" />
              </svg>
            }
          />
        </div>
      </main>
    </div>
  );
}
