'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Target, Medal, FileText, Flame, Calendar, AlertTriangle, MessageSquare, User, Watch, Settings, Moon, Sun, Pill } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function FloatingBottomNav() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // Hide navbar on login and signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  // Helper function to determine if a route is active
  const isActive = (path) => {
    if (path === '/dashboard') {
      // Only match exact dashboard path, not subpages like /dashboard/streaks
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    if (path === '/settings') {
      // Only match exact settings path, not subpages like /settings/profile
      return pathname === '/settings' || pathname === '/settings/';
    }
    // For other paths, use the startsWith logic
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-6 h-6" />,
    },
    {
      id: 'goals',
      path: '/goals',
      label: 'Goals',
      icon: <Target className="w-6 h-6" />,
    },
    {
      id: 'badges',
      path: '/badges',
      label: 'Badges',
      icon: <Medal className="w-6 h-6" />,
    },
    {
      id: 'articles',
      path: '/articles',
      label: 'Articles',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      id: 'prescriptions',
      path: '/prescriptions',
      label: 'Prescriptions',
      icon: <Pill className="w-6 h-6" />,
    },
    {
      id: 'streaks',
      path: '/dashboard/streaks',
      label: 'Streaks',
      icon: <Flame className="w-6 h-6" />,
    },
    {
      id: 'weekly-summary',
      path: '/dashboard/weekly-summary',
      label: 'Weekly Summary',
      icon: <Calendar className="w-6 h-6" />,
    },
    {
      id: 'critical-events',
      path: '/critical-events',
      label: 'Critical Events',
      icon: <AlertTriangle className="w-6 h-6" />,
    },
    {
      id: 'chat',
      path: '/chat',
      label: 'Chat',
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      id: 'profile',
      path: '/settings/profile',
      label: 'Profile',
      icon: <User className="w-6 h-6" />,
    },
    {
      id: 'devices',
      path: '/settings/devices',
      label: 'Devices',
      icon: <Watch className="w-6 h-6" />,
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Settings',
      icon: <Settings className="w-6 h-6" />,
    },
  ];

  const handleNavClick = (path) => {
    router.push(path);
  };

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 flex gap-2 px-4 py-3 rounded-full shadow-2xl transition-colors ${
      isDarkMode 
        ? 'bg-gray-900 border border-gray-700' 
        : 'bg-white border border-gray-200'
    }`}>
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.path)}
            className={`relative flex items-center justify-center p-3 rounded-full transition-all duration-200 group ${
              active
                ? isDarkMode
                  ? 'bg-blue-900 bg-opacity-60 text-blue-400'
                  : 'bg-blue-100 text-blue-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title={item.label}
            aria-label={item.label}
          >
            {item.icon}
            
            {/* Tooltip on hover */}
            <div className={`absolute bottom-full mb-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
              isDarkMode
                ? 'bg-gray-800 text-gray-100'
                : 'bg-gray-700 text-white'
            }`}>
              {item.label}
            </div>
          </button>
        );
      })}

      {/* Separator */}
      <div className={`h-12 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className={`relative flex items-center justify-center p-3 rounded-full transition-all duration-200 group ${
          isDarkMode
            ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }`}
        title={isDarkMode ? 'Light mode' : 'Dark mode'}
        aria-label={isDarkMode ? 'Light mode' : 'Dark mode'}
      >
        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        
        {/* Tooltip on hover */}
        <div className={`absolute bottom-full mb-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
          isDarkMode
            ? 'bg-gray-800 text-gray-100'
            : 'bg-gray-700 text-white'
        }`}>
          {isDarkMode ? 'Light mode' : 'Dark mode'}
        </div>
      </button>
    </div>
  );
}
