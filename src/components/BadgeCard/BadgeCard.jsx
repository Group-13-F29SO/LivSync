export default function BadgeCard({ name, description, status, earnedDate }) {
  const isEarned = status === 'earned';

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow">
      {/* Badge Icon - Blank White Circle */}
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 ${isEarned ? 'opacity-100' : 'opacity-30'}`}>
        <div className="h-12 w-12 rounded-full bg-white"></div>
      </div>

      {/* Badge Name */}
      <h3 className={`mb-2 text-lg font-bold ${isEarned ? 'text-slate-900' : 'text-slate-400'}`}>
        {name}
      </h3>

      {/* Description */}
      <p className="mb-4 text-sm text-slate-600">
        {description}
      </p>

      {/* Status Button */}
      <div className={`rounded-full px-4 py-2 text-sm font-medium ${
        isEarned
          ? 'bg-purple-500 text-white'
          : 'bg-slate-100 text-slate-400'
      }`}>
        {isEarned ? `Earned ${earnedDate}` : 'Locked'}
      </div>
    </div>
  );
}

