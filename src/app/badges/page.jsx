'use client';

import CategorySection from '@/components/CategorySection/CategorySection';
import Navbar from '@/components/Navbar/Navbar';

const badgesData = [
  {
    category: 'Activity',
    badges: [
      {
        id: 'first-steps',
        name: 'First Steps',
        description: 'Completed your first 10,000 steps in a day',
        status: 'earned',
        earnedDate: '2025-10-15',
      },
      {
        id: 'marathon-master',
        name: 'Marathon Master',
        description: 'Walk 100,000 steps in total',
        status: 'locked',
        earnedDate: null,
      },
    ],
  },
  {
    category: 'Streaks',
    badges: [
      {
        id: 'week-warrior',
        name: 'Week Warrior',
        description: 'Maintained a 7-day streak',
        status: 'earned',
        earnedDate: '2025-10-22',
      },
      {
        id: 'consistency-king',
        name: 'Consistency King',
        description: 'Maintain a 30-day streak',
        status: 'locked',
        earnedDate: null,
      },
    ],
  },
  {
    category: 'Health',
    badges: [
      {
        id: 'heart-health-hero',
        name: 'Heart Health Hero',
        description: 'Logged heart rate for 30 consecutive days',
        status: 'earned',
        earnedDate: '2025-10-28',
      },
    ],
  },
  {
    category: 'Goals',
    badges: [
      {
        id: 'goal-getter',
        name: 'Goal Getter',
        description: 'Achieved all daily goals for 5 consecutive days',
        status: 'locked',
        earnedDate: null,
      },
    ],
  },
  {
    category: 'Wellness',
    badges: [
      {
        id: 'hydration-hero',
        name: 'Hydration Hero',
        description: 'Meet your hydration goal for 14 days',
        status: 'locked',
        earnedDate: null,
      },
    ],
  },
  {
    category: 'Sleep',
    badges: [
      {
        id: 'sleep-champion',
        name: 'Sleep Champion',
        description: 'Get 8+ hours of sleep for 7 consecutive nights',
        status: 'locked',
        earnedDate: null,
      },
    ],
  },
];

export default function AchievementsPage() {
  // Calculate earned badges count
  const earnedCount = badgesData.reduce(
    (count, category) =>
      count + category.badges.filter((badge) => badge.status === 'earned').length,
    0
  );

  const totalCount = badgesData.reduce(
    (count, category) => count + category.badges.length,
    0
  );

  return (
    <div className="min-h-screen flex bg-blue-50">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 p-8 ml-20 overflow-auto">
        {/* Page Header & Summary Section */}
        <div className="mb-12">
          {/* Main Title */}
          <h1 className="mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-3xl font-bold text-transparent">
            Achievements
          </h1>

          {/* Main Subtitle */}
          <p className="mb-8 text-slate-500">
            You've earned {earnedCount} out of {totalCount} badges
          </p>

          {/* Trophy Case Card */}
          <div className="mb-12 flex flex-col items-center justify-between gap-6 rounded-2xl bg-white p-8 shadow-md md:flex-row md:gap-12">
            {/* Left Side */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="mb-2 text-2xl font-bold text-slate-900">Trophy Case</h2>
              <p className="text-slate-600">
                Keep achieving your goals to unlock more badges!
              </p>
            </div>

            {/* Right Side */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-7xl font-bold text-transparent">
                {earnedCount}
              </div>
              <p className="text-slate-600">Badges Earned</p>
            </div>
          </div>
        </div>

        {/* Categories & Badges */}
        <div>
          {badgesData.map((section) => (
            <CategorySection
              key={section.category}
              category={section.category}
              badges={section.badges}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
