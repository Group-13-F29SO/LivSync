'use client';

export default function NavItem({ id, icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
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
}
