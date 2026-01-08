'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

  const router = useRouter();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const NavItem = ({ id, icon, label, onClick }) => {
    const isActive = activePage === id;
    return (
      <button 
        onClick={() => { if (onClick) onClick(id); router.push(`/${id}`); }}
        className="relative w-full flex justify-center py-2 transition-colors group"
      >
        {/* Container with background */}
        <div className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors w-20 mx-1 flex-shrink-0 ${
          isActive 
            ? 'bg-blue-100' 
            : 'group-hover:bg-gray-50'
        }`}>
          {/* Blue vertical bar indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-1 bg-blue-600 rounded-r"></div>
          )}
          
          {/* Icon */}
          <div className={`transition-colors ${
            isActive 
              ? 'text-blue-600' 
              : 'text-gray-600 group-hover:text-gray-800'
          }`}>
            {icon}
          </div>
          
          {/* Label */}
          {label && (
            <span className={`text-xs font-semibold ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {label}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Vertical Navigation Bar */}
      <nav className="w-23 bg-white flex flex-col shadow-lg">
        {/* Spacer */}
        <div className="h-24"></div>
        
        {/* Middle Nav Items */}
        <div className="flex flex-col gap-2">
          {/* Dashboard */}
          <NavItem 
            id="dashboard"
            onClick={setActivePage}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
              </svg>
            }
            label="Dashboard"
          />

          {/* Goals */}
          <NavItem 
            id="goals"
            onClick={setActivePage}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Goals"
          />

          {/* Badges */}
          <NavItem 
            id="badges"
            onClick={setActivePage}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
            label="Badges"
          />

          {/* Chat */}
          <NavItem 
            id="chat"
            onClick={setActivePage}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            label="Chat"
          />
        </div>

        {/* Spacer to push bottom items down */}
        <div className="flex-1"></div>

        {/* Bottom Nav Items */}
        <div className="flex flex-col pb-6 gap-0">
          {/* Moon Icon - Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="w-full flex justify-center py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <div className="p-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
          </button>

          {/* Settings */}
          <NavItem 
            id="settings"
            onClick={setActivePage}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Settings"
          />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-auto bg-blue-50">
        <h1 className="inline-block text-3xl font-bold text-gray-800 bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your wellness dashboard</p>
        <p className="text-gray-600 mt-2">Last Synced:</p>
        
        {/* Dashboard content will go here */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder cards */}
          <div className="bg-white p-6 rounded-lg shadow transform transition-transform duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-md">
                <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 20c-1.5 0-2.5-1.5-2-3 1-2.5 3-4 4.5-4.5 1.5-.5 2.5.5 2 2-.5 1.5-2 6.5-4.5 5.5z" />
                  <path d="M16 18c1.5 0 2-2 1-3.5-1.5-2-3.5-3-5-2.5-1.5.5-1 2 0 3.5 1 1.5 3 2.5 4 2.5z" />
                  <path d="M9 7c0-1.5 1-3 2.5-3S14 5 14 6.5 13 9 11.5 9 9 8.5 9 7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Steps</h3>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="inline-block text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">7,834</span>
              <span className="text-sm text-gray-500">steps</span>
            </div>
          </div>
          


          <div className="bg-white p-6 rounded-lg shadow transform transition-transform duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-md">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.682 4.318 12.682a4.5 4.5 0 010-6.364z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Heart Rate</h3>
            </div>
            
            <p className="text-gray-500 mt-2">Resting: 65 bpm</p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="inline-block text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">72</span>
              <span className="text-sm text-gray-500">bpm</span>
            </div>
          </div>
          


          <div className="bg-white p-6 rounded-lg shadow transform transition-transform duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-md">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3s-3 3.2-3 6.2a3 3 0 006 0C15 6.2 12 3 12 3z" />
                  <path d="M9.5 13.5c-.8 1.5-.5 3 1 4.5 1.5 1.5 4 1.2 5-1 .6-1.4.2-2.8-1.2-4.2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Calories Burned</h3>
            </div>
            
            
            <div className="mt-4 flex items-baseline gap-3">
              <span className="inline-block text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">1847</span>
              <span className="text-sm text-gray-500">kcal</span>
            </div>
          </div>



          <div className="bg-white p-6 rounded-lg shadow transform transition-transform duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-md">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3s-6 6.5-6 10.5A6 6 0 0018 14c0-4-6-11-6-11z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Hydration</h3>
            </div>
            
            <div className="mt-4 flex items-baseline gap-3">
              <span className="inline-block text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">6</span>
              <span className="text-sm text-gray-500">glasses</span>
            </div>
          </div>



          <div className="bg-white p-6 rounded-lg shadow transform transition-transform duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-md">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Sleep</h3>
            </div>
            
            <p className="text-gray-500 mt-2">Quality: Good</p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="inline-block text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">7.5</span>
              <span className="text-sm text-gray-500">hours</span>
            </div>
          </div>



          <div className="bg-white p-6 rounded-lg shadow transform transition-transform duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-md">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
                  <path d="M12 12l4-4" />
                  <path d="M12 12h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Blood Glucose</h3>
            </div>
            
            <p className="text-gray-500 mt-2">Status: Normal</p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="inline-block text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">95</span>
              <span className="text-sm text-gray-500">mg/dL</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
