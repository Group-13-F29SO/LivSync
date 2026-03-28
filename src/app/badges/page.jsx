'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CategorySection from '@/components/CategorySection/CategorySection';
import BadgeNotification from '@/components/Badges/BadgeNotification';
import { useAuth } from '@/hooks/useAuth';
import { useBadges } from '@/hooks/useBadges';

export default function BadgesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { badges, stats, isLoading: badgesLoading, error } = useBadges();
  const [displayNotification, setDisplayNotification] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Only allow patients to access this page
    if (!isLoading && user && user.userType === 'provider') {
      router.push('/provider');
    }
  }, [user, isLoading, router]);

  // Convert flat badges object to CategorySection format
  const badgesData = Object.entries(badges).map(([category, categoryBadges]) => ({
    category,
    badges: categoryBadges,
  }));

  const earnedCount = stats.earned || 0;
  const totalCount = stats.total || 0;

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Badge Notification */}
      <BadgeNotification
        isVisible={displayNotification !== null}
        badgeName={displayNotification?.badgeName || ''}
        badgeDescription={displayNotification?.badgeDescription || ''}
        badgeId={displayNotification?.badgeId || ''}
        onClose={() => setDisplayNotification(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 pb-32">
        {/* Page Header & Summary Section */}
        <div className="mb-12">
          {/* Main Title */}
          <h1 className="mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-3xl font-bold text-transparent">
            Achievements
          </h1>

          {/* Main Subtitle */}
          <p className="mb-8 text-slate-500 dark:text-slate-400">
            {badgesLoading ? (
              'Loading your achievements...'
            ) : (
              <>
                You've earned {earnedCount} out of {totalCount} badges
              </>
            )}
          </p>

          {/* Trophy Case Card */}
          <div className="mb-12 flex flex-col items-center justify-between gap-6 rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-md dark:shadow-lg md:flex-row md:gap-12">
            {/* Left Side */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Trophy Case</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Keep achieving your goals to unlock more badges!
              </p>
            </div>

            {/* Right Side */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-7xl font-bold text-transparent">
                {badgesLoading ? '...' : earnedCount}
              </div>
              <p className="text-slate-600 dark:text-slate-400">Badges Earned</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
            <p className="font-semibold">Error loading achievements</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {badgesLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : badgesData.length === 0 ? (
          <div className="rounded-lg bg-slate-100 dark:bg-gray-800 p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              No badges available yet. Start logging your health metrics to earn achievements!
            </p>
          </div>
        ) : (
          /* Categories & Badges */
          <div>
            {badgesData.map((section) => (
              <CategorySection
                key={section.category}
                category={section.category}
                badges={section.badges}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
