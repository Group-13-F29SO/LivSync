'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Footprints, Heart, Flame, Droplets, Moon, Activity, LogOut } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import DashboardCard from '@/components/DashboardCard/DashboardCard';
import StreakCard from '@/components/Dashboard/StreakCard';
import SummaryCard from '@/components/Dashboard/SummaryCard';
import ArticlesCard from '@/components/Dashboard/ArticlesCard';
import QuickManualEntryCard from '@/components/Dashboard/QuickManualEntryCard';
import SyncButton from '@/components/SyncButton/SyncButton';
import BadgeNotification from '@/components/Badges/BadgeNotification';
import ConnectionRequestsNotification from '@/components/Provider/ConnectionRequestsNotification';
import AlertNotification from '@/components/Alerts/AlertNotification';
import CriticalEventsWidget from '@/components/Alerts/CriticalEventsWidget';
import { useAuth } from '@/hooks/useAuth';
import { getBadgeDefinition } from '@/services/badgeDefinitions';
import { getRelativeSyncTime } from '@/utils/syncTimeFormatter';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [dashboardData, setDashboardData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [badgeQueue, setBadgeQueue] = useState([]);
  const [currentBadge, setCurrentBadge] = useState(null);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [alertQueue, setAlertQueue] = useState([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Redirect provider to their dashboard
    if (!isLoading && user && user.userType === 'provider') {
      router.push('/provider');
    }
  }, [user, isLoading, router]);

  // Handle badge queue - show next badge after current one closes
  useEffect(() => {
    if (!currentBadge && badgeQueue.length > 0) {
      const nextBadge = badgeQueue[0];
      setCurrentBadge(nextBadge);
      setBadgeQueue(badgeQueue.slice(1));
    }
  }, [currentBadge, badgeQueue]);

  // Handle alert queue - show next alert after current one closes
  useEffect(() => {
    if (!currentAlert && alertQueue.length > 0) {
      const nextAlert = alertQueue[0];
      setCurrentAlert(nextAlert);
      setAlertQueue(alertQueue.slice(1));
    }
  }, [currentAlert, alertQueue]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/biometrics/dashboard-summary');
      const json = await res.json();

      if (json.success) {
        setDashboardData(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  // Fetch streaks data for all metrics and find the highest streak
  const fetchStreakData = async () => {
    try {
      const metrics = ['steps', 'calories', 'hydration', 'sleep'];
      let maxStreak = 0;
      let maxMetric = 'steps';
      let maxGoalValue = 0;
      let hasAnyGoals = false;

      for (const metric of metrics) {
        const res = await fetch(`/api/biometrics/streaks?metric=${metric}`);
        const data = await res.json();

        // Check if any goals exist
        if (!data.goalNotFound) {
          hasAnyGoals = true;
        }

        if (data.currentStreak > maxStreak) {
          maxStreak = data.currentStreak;
          maxMetric = metric;
          maxGoalValue = data.goalValue || 0;
        }
      }

      // Format the goal value with metric unit
      const getMetricDisplay = (metric, goalValue) => {
        if (goalValue === 0) return '';
        const metricUnits = {
          steps: `${goalValue.toLocaleString()} steps`,
          calories: `${goalValue.toLocaleString()} kcal`,
          hydration: `${goalValue} glasses`,
          sleep: `${goalValue} hours`,
        };
        return metricUnits[metric] || '';
      };

      let targetMetric = '';
      let message = 'Keep going!';

      if (!hasAnyGoals) {
        // No goals set at all
        targetMetric = 'No goals set';
        message = 'Set a goal to start tracking!';
      } else if (maxStreak === 0) {
        // Goals exist but no active streak
        targetMetric = getMetricDisplay(maxMetric, maxGoalValue);
        message = 'Start a new streak!';
      } else {
        // Active streak with goal
        targetMetric = getMetricDisplay(maxMetric, maxGoalValue);
        message = 'Keep going!';
      }

      setStreakData({
        currentStreak: maxStreak,
        targetMetric,
        message,
      });
    } catch (err) {
      console.error('Failed to load streak data', err);
    }
  };

  // Fetch last sync time
  const fetchLastSyncTime = async () => {
    try {
      const res = await fetch('/api/patient/last-sync');
      const json = await res.json();

      if (json.success && json.lastSync) {
        setLastSyncTime(getRelativeSyncTime(json.lastSync));
      } else {
        setLastSyncTime('Never synced');
      }
    } catch (err) {
      console.error('Failed to load last sync time', err);
      setLastSyncTime('Unknown');
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      fetchDashboardData();
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (!isLoading && user) {
      fetchStreakData();
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (!isLoading && user) {
      fetchLastSyncTime();
    }
  }, [isLoading, user]);

  const handleLogout = () => {
    logout();
  };

  const handleSyncComplete = (syncResult) => {
    setLastSyncTime(getRelativeSyncTime(new Date()));

    // Refresh dashboard data and streaks after sync completes
    fetchDashboardData();
    fetchStreakData();

    // Handle newly earned badges
    if (syncResult?.newBadges && syncResult.newBadges.length > 0) {
      const badgeNotifications = syncResult.newBadges.map((badge) => {
        const badgeDef = getBadgeDefinition(badge.id);
        return {
          id: badge.id,
          name: badge.name,
          description: badgeDef?.description || 'Badge unlocked!',
        };
      });

      setBadgeQueue(badgeNotifications);
    }

    // Handle triggered alerts
    if (syncResult?.alerts && syncResult.alerts.length > 0) {
      const alertNotifications = syncResult.alerts.map((alert) => ({
        id: alert.id,
        metricType: alert.metric_type,
        value: alert.value,
        thresholdType: alert.threshold_type,
        thresholdValue: alert.threshold_value,
      }));

      setAlertQueue(alertNotifications);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <Navbar />

      {/* Badge Notification */}
      <BadgeNotification
        isVisible={currentBadge !== null}
        badgeName={currentBadge?.name || ''}
        badgeDescription={currentBadge?.description || ''}
        badgeId={currentBadge?.id || ''}
        onClose={() => setCurrentBadge(null)}
      />

      {/* Alert Notification */}
      <AlertNotification
        isVisible={currentAlert !== null}
        metricType={currentAlert?.metricType || ''}
        value={currentAlert?.value || ''}
        thresholdType={currentAlert?.thresholdType || ''}
        thresholdValue={currentAlert?.thresholdValue || ''}
        onClose={() => setCurrentAlert(null)}
      />

      <main className="flex-1 p-8 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.firstName || 'User'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-600 dark:text-gray-400">
                Last Synced: {lastSyncTime}
              </p>
              <SyncButton onSyncComplete={handleSyncComplete} />
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <ConnectionRequestsNotification patientId={user?.id} />
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          

          <button
            onClick={() => router.push('/dashboard/steps')}
            className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
          >
            <DashboardCard
              title="Steps"
              value={dashboardData ? dashboardData.steps : "..."}
              unit="steps"
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
              icon={<Footprints className="w-6 h-6 text-blue-600" />}
            />
          </button>

          <button
            onClick={() => router.push('/dashboard/heart-rate')}
            className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
          >
            <DashboardCard
              title="Heart Rate"
              value={dashboardData ? dashboardData.heart_rate : "..."}
              unit="bpm"
              subtitle={dashboardData ? `Resting: ${dashboardData.resting_heart_rate} bpm` : "..."}
              iconBgColor="bg-red-50"
              iconColor="text-red-600"
              icon={<Heart className="w-6 h-6 text-red-600" />}
            />
          </button>

          <button
            onClick={() => router.push('/dashboard/calories')}
            className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
          >
            <DashboardCard
              title="Calories Burned"
              value={dashboardData ? dashboardData.calories : "..."}
              unit="kcal"
              iconBgColor="bg-orange-50"
              iconColor="text-orange-600"
              icon={<Flame className="w-6 h-6 text-orange-600" />}
            />
          </button>

          <button
            onClick={() => router.push('/dashboard/hydration')}
            className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
          >
            <DashboardCard
              title="Hydration"
              value={dashboardData ? dashboardData.hydration : "..."}
              unit="glasses"
              iconBgColor="bg-cyan-50"
              iconColor="text-cyan-600"
              icon={<Droplets className="w-6 h-6 text-cyan-600" />}
            />
          </button>

          <button
            onClick={() => router.push('/dashboard/sleep')}
            className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
          >
            <DashboardCard
              title="Sleep"
              value={dashboardData ? dashboardData.sleep : "..."}
              unit="hours"
              subtitle={dashboardData ? `Quality: ${dashboardData.sleep_quality}` : "..."}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-600"
              icon={<Moon className="w-6 h-6 text-purple-600" />}
            />
          </button>

          <button
            onClick={() => router.push('/dashboard/blood-glucose')}
            className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
          >
            <DashboardCard
              title="Blood Glucose"
              value={dashboardData ? dashboardData.blood_glucose : "..."}
              unit="mg/dL"
              subtitle={dashboardData ? `Status: ${dashboardData.blood_glucose_status}` : "..."}
              iconBgColor="bg-green-50"
              iconColor="text-green-600"
              icon={<Activity className="w-6 h-6 text-green-600" />}
            />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ArticlesCard />
          </div>

          <div className="lg:col-span-1">
            <QuickManualEntryCard />
          </div>
        </div>

        <div className="mt-8 cursor-pointer" onClick={() => router.push('/dashboard/streaks')}>
          <StreakCard
            currentStreak={streakData?.currentStreak || 0}
            targetMetric={streakData?.targetMetric || '10,000 steps'}
            message={streakData?.message || 'Keep going!'}
          />
        </div>

        <div className="mt-6">
          <SummaryCard summaryData={dashboardData} />
        </div>

        <div className="mt-8">
          <CriticalEventsWidget />
        </div>
      </main>
    </div>
  );
}