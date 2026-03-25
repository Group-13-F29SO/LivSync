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

export default function BadgeCard({ id, name, description, status, earnedDate }) {
  const isEarned = status === 'earned';
  const icon = BADGE_ICONS[id] || '🏆';

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-gray-900 p-6 text-center shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-lg transition-shadow">
      {/* Badge Icon */}
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 dark:from-indigo-900 to-purple-100 dark:to-purple-900 ${isEarned ? 'opacity-100' : 'opacity-30'}`}>
        <div className="text-4xl">{icon}</div>
      </div>

      {/* Badge Name */}
      <h3 className={`mb-2 text-lg font-bold ${isEarned ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>
        {name}
      </h3>

      {/* Description */}
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>

      {/* Status Button */}
      <div className={`rounded-full px-4 py-2 text-sm font-medium ${
        isEarned
          ? 'bg-purple-500 text-white'
          : 'bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-slate-500'
      }`}>
        {isEarned ? `Earned ${earnedDate}` : 'Locked'}
      </div>
    </div>
  );
}

