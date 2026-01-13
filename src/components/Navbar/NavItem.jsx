'use client';

import { useTheme } from '../../hooks/useTheme';

export default function NavItem({ id, icon, label, isActive, onClick }) {
  const { isDarkMode } = useTheme();

  return (
    <button 
      onClick={onClick}
      className="relative w-full flex justify-center py-2 transition-colors group"
    >
      {/* Container with background */}
      <div className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors w-20 mx-1 flex-shrink-0 ${
        isActive 
          ? isDarkMode
            ? 'bg-blue-900 bg-opacity-60'
            : 'bg-blue-100'
          : isDarkMode
            ? 'group-hover:bg-gray-800'
            : 'group-hover:bg-gray-50'
      }`}>
        {/* Blue vertical bar indicator */}
        {isActive && (
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-1 rounded-r ${
            isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
          }`}></div>
        )}
        
        {/* Icon */}
        <div className={`transition-colors ${
          isActive 
            ? isDarkMode
              ? 'text-blue-400'
              : 'text-blue-600'
            : isDarkMode
              ? 'text-gray-400 group-hover:text-gray-200'
              : 'text-gray-600 group-hover:text-gray-800'
        }`}>
          {icon}
        </div>
        
        {/* Label */}
        {label && (
          <span className={`text-xs font-semibold transition-colors ${
            isActive 
              ? isDarkMode
                ? 'text-blue-400'
                : 'text-blue-600'
              : isDarkMode
                ? 'text-gray-400'
                : 'text-gray-600'
          }`}>
            {label}
          </span>
        )}
      </div>
    </button>
  );
}
