'use client';

import { useEffect, useState } from 'react';

const BADGE_ICONS = {
  'first-steps': '👟',
  'marathon-master': '🏃',
  'centurion': '⭐',
  'week-warrior': '🔥',
  'consistency-king': '👑',
  'iron-will': '🛡️',
  'heart-health-hero': '❤️',
  'cardio-champion': '💓',
  'glucose-guardian': '💧',
  'goal-getter': '🎯',
  'goal-master': '🏅',
  'hydration-hero': '💧',
  'hydration-hacker': '🍋',
  'sleep-champion': '🌙',
  'rest-master': '🛏️',
  'calorie-counter': '🔥',
  'first-entry': '✨',
};

export default function BadgeNotification({
  isVisible = false,
  badgeName = '',
  badgeDescription = '',
  badgeId = '',
  onClose = () => {},
}) {
  const [isShowing, setIsShowing] = useState(isVisible);

  useEffect(() => {
    setIsShowing(isVisible);

    if (isVisible) {
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const icon = BADGE_ICONS[badgeId] || '🏆';

  return (
    <>
      {/* Backdrop */}
      {isShowing && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      {/* Celebration Modal */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ${
          isShowing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Celebration Container */}
        <div
          className={`relative max-w-md w-full mx-4 transform transition-all duration-300 ${
            isShowing
              ? 'scale-100 translate-y-0'
              : 'scale-95 translate-y-8'
          }`}
        >
          {/* Confetti-like background elements */}
          <div className="absolute -top-10 left-1/4 animate-bounce text-4xl">🎉</div>
          <div className="absolute -top-10 right-1/4 animate-bounce text-4xl" style={{ animationDelay: '0.1s' }}>
            🎊
          </div>
          <div className="absolute -bottom-10 left-1/3 animate-bounce text-4xl" style={{ animationDelay: '0.2s' }}>
            ✨
          </div>

          {/* Main Card */}
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 rounded-3xl shadow-2xl p-8 text-center text-white overflow-hidden relative">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 animate-pulse" />

            {/* Content */}
            <div className="relative z-10">
              {/* Badge Icon - Large */}
              <div className="text-8xl mb-6 drop-shadow-lg animate-bounce">
                {icon}
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold mb-2 drop-shadow-md">
                Achievement Unlocked!
              </h2>

              {/* Badge Name */}
              <h3 className="text-2xl font-bold mb-4 drop-shadow-md">
                {badgeName}
              </h3>

              {/* Badge Description */}
              <p className="text-white text-opacity-90 mb-6 drop-shadow-md">
                {badgeDescription}
              </p>

              {/* CTA Button */}
              <button
                onClick={handleClose}
                className="bg-white text-purple-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                View Badge
              </button>
            </div>

            {/* Gradient overlay edges */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* CSS for additional animations */}
      <style>{`
        @keyframes celebrate {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
        }

        .animate-celebrate {
          animation: celebrate 0.5s ease-in-out;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
