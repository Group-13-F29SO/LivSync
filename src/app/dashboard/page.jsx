'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Footprints, Heart, Flame, Droplets, Moon, Activity } from 'lucide-react';
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
import AppointmentsWidget from '@/components/Patient/AppointmentsWidget';
import DraggableWidget from '@/components/Dashboard/DraggableWidget';
import DashboardWidgetManager from '@/components/Dashboard/DashboardWidgetManager';
import { useAuth } from '@/hooks/useAuth';
import { useWidgetPreferences } from '@/hooks/useWidgetPreferences';
import { getBadgeDefinition } from '@/services/badgeDefinitions';
import { getRelativeSyncTime } from '@/utils/syncTimeFormatter';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const {
    preferences,
    toggleWidgetVisibility,
    reorderWidgets,
    resetToDefaults,
    getVisibleWidgets,
    getWidgetPreference,
    isLoading: preferencesLoading,
  } = useWidgetPreferences();

  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [dashboardData, setDashboardData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [badgeQueue, setBadgeQueue] = useState([]);
  const [currentBadge, setCurrentBadge] = useState(null);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [alertQueue, setAlertQueue] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Redirect provider to their dashboard
    if (!isLoading && user && user.userType === 'provider') {
      router.push('/provider');
    }
  }, [user, isLoading, router]);

  // Drag and drop handlers
  const handleDragStart = (widgetId) => {
    setDraggingId(widgetId);
  };

  const handleDragOver = (widgetId) => {
    if (!draggingId || draggingId === widgetId) return;
    setDragOverId(widgetId);
  };

  const handleDrop = (widgetId) => {
    if (!draggingId || draggingId === widgetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const visibleWidgets = getVisibleWidgets();
    const sourceIndex = visibleWidgets.findIndex((w) => w.id === draggingId);
    const destIndex = visibleWidgets.findIndex((w) => w.id === widgetId);

    if (sourceIndex !== -1 && destIndex !== -1) {
      reorderWidgets(sourceIndex, destIndex);
    }

    setDraggingId(null);
    setDragOverId(null);
  };

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

  if (isLoading || !user || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
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

      <main className="flex-1 p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 pb-32">
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

          <div className="flex gap-2 items-center flex-col justify-end h-24">
            <div className="flex gap-2 items-center ml-auto">
              <ConnectionRequestsNotification patientId={user?.id} />
            </div>
            
            {/* Widget Manager - Moved to header */}
            <DashboardWidgetManager
              isEditMode={isEditMode}
              onToggleEditMode={() => setIsEditMode(!isEditMode)}
              onResetToDefaults={resetToDefaults}
              visibleWidgetCount={getVisibleWidgets().length}
            />
          </div>
        </div>

        {/* Metric Cards Grid - Auto-sizing */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Render metric widgets based on preferences */}
          {getVisibleWidgets().filter(w => ['steps', 'heart-rate', 'calories', 'hydration', 'sleep', 'blood-glucose'].includes(w.id)).map((widget) => {
            switch (widget.id) {
              case 'steps':
                return (
                  <DraggableWidget
                    key={widget.id}
                    widgetId={widget.id}
                    isEditMode={isEditMode}
                    isVisible={getWidgetPreference(widget.id)?.visible !== false}
                    onToggleVisibility={toggleWidgetVisibility}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    draggingId={draggingId}
                    dragOverId={dragOverId}
                  >
                    <div className="h-full flex flex-col">
                      <button
                        onClick={() => router.push('/dashboard/steps')}
                        className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
                      >
                        <DashboardCard
                          title="Steps"
                          value={dashboardData ? dashboardData.steps : '...'}
                          unit="steps"
                          iconBgColor="bg-blue-50"
                          iconColor="text-blue-600"
                          icon={<Footprints className="w-6 h-6 text-blue-600" />}
                        />
                      </button>
                    </div>
                  </DraggableWidget>
                );

              case 'heart-rate':
                return (
                  <DraggableWidget
                    key={widget.id}
                    widgetId={widget.id}
                    isEditMode={isEditMode}
                    isVisible={getWidgetPreference(widget.id)?.visible !== false}
                    onToggleVisibility={toggleWidgetVisibility}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    draggingId={draggingId}
                    dragOverId={dragOverId}
                  >
                    <div className="h-full flex flex-col">
                      <button
                        onClick={() => router.push('/dashboard/heart-rate')}
                        className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
                      >
                        <DashboardCard
                          title="Heart Rate"
                          value={dashboardData ? dashboardData.heart_rate : '...'}
                          unit="bpm"
                          subtitle={dashboardData ? `Resting: ${dashboardData.resting_heart_rate} bpm` : '...'}
                          iconBgColor="bg-red-50"
                          iconColor="text-red-600"
                          icon={<Heart className="w-6 h-6 text-red-600" />}
                        />
                      </button>
                    </div>
                  </DraggableWidget>
                );

              case 'calories':
                return (
                  <DraggableWidget
                    key={widget.id}
                    widgetId={widget.id}
                    isEditMode={isEditMode}
                    isVisible={getWidgetPreference(widget.id)?.visible !== false}
                    onToggleVisibility={toggleWidgetVisibility}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    draggingId={draggingId}
                    dragOverId={dragOverId}
                  >
                    <div className="h-full flex flex-col">
                      <button
                        onClick={() => router.push('/dashboard/calories')}
                        className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
                      >
                        <DashboardCard
                          title="Calories Burned"
                          value={dashboardData ? dashboardData.calories : '...'}
                          unit="kcal"
                          iconBgColor="bg-orange-50"
                          iconColor="text-orange-600"
                          icon={<Flame className="w-6 h-6 text-orange-600" />}
                        />
                      </button>
                    </div>
                  </DraggableWidget>
                );

              case 'hydration':
                return (
                  <DraggableWidget
                    key={widget.id}
                    widgetId={widget.id}
                    isEditMode={isEditMode}
                    isVisible={getWidgetPreference(widget.id)?.visible !== false}
                    onToggleVisibility={toggleWidgetVisibility}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    draggingId={draggingId}
                    dragOverId={dragOverId}
                  >
                    <div className="h-full flex flex-col">
                      <button
                        onClick={() => router.push('/dashboard/hydration')}
                        className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
                      >
                        <DashboardCard
                          title="Hydration"
                          value={dashboardData ? dashboardData.hydration : '...'}
                          unit="glasses"
                          iconBgColor="bg-cyan-50"
                          iconColor="text-cyan-600"
                          icon={<Droplets className="w-6 h-6 text-cyan-600" />}
                        />
                      </button>
                    </div>
                  </DraggableWidget>
                );

              case 'sleep':
                return (
                  <DraggableWidget
                    key={widget.id}
                    widgetId={widget.id}
                    isEditMode={isEditMode}
                    isVisible={getWidgetPreference(widget.id)?.visible !== false}
                    onToggleVisibility={toggleWidgetVisibility}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    draggingId={draggingId}
                    dragOverId={dragOverId}
                  >
                    <div className="h-full flex flex-col">
                      <button
                        onClick={() => router.push('/dashboard/sleep')}
                        className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
                      >
                        <DashboardCard
                          title="Sleep"
                          value={dashboardData ? dashboardData.sleep : '...'}
                          unit="hours"
                          subtitle={dashboardData ? `Quality: ${dashboardData.sleep_quality}` : '...'}
                          iconBgColor="bg-purple-50"
                          iconColor="text-purple-600"
                          icon={<Moon className="w-6 h-6 text-purple-600" />}
                        />
                      </button>
                    </div>
                  </DraggableWidget>
                );

              case 'blood-glucose':
                return (
                  <DraggableWidget
                    key={widget.id}
                    widgetId={widget.id}
                    isEditMode={isEditMode}
                    isVisible={getWidgetPreference(widget.id)?.visible !== false}
                    onToggleVisibility={toggleWidgetVisibility}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    draggingId={draggingId}
                    dragOverId={dragOverId}
                  >
                    <div className="h-full flex flex-col">
                      <button
                        onClick={() => router.push('/dashboard/blood-glucose')}
                        className="w-full h-full bg-transparent border-none p-0 cursor-pointer"
                      >
                        <DashboardCard
                          title="Blood Glucose"
                          value={dashboardData ? dashboardData.blood_glucose : '...'}
                          unit="mg/dL"
                          subtitle={dashboardData ? `Status: ${dashboardData.blood_glucose_status}` : '...'}
                          iconBgColor="bg-green-50"
                          iconColor="text-green-600"
                          icon={<Activity className="w-6 h-6 text-green-600" />}
                        />
                      </button>
                    </div>
                  </DraggableWidget>
                );

              default:
                return null;
            }
          })}
        </div>

        {/* Other Widgets Grid - Articles & Manual Entry */}
        {getVisibleWidgets().filter(w => ['articles', 'manual-entry'].includes(w.id)).length > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getVisibleWidgets().filter(w => ['articles', 'manual-entry'].includes(w.id)).map((widget) => {
              switch (widget.id) {
                case 'articles':
                  return (
                    <DraggableWidget
                      key={widget.id}
                      widgetId={widget.id}
                      isEditMode={isEditMode}
                      isVisible={getWidgetPreference(widget.id)?.visible !== false}
                      onToggleVisibility={toggleWidgetVisibility}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      draggingId={draggingId}
                      dragOverId={dragOverId}
                    >
                      <ArticlesCard />
                    </DraggableWidget>
                  );

                case 'manual-entry':
                  return (
                    <DraggableWidget
                      key={widget.id}
                      widgetId={widget.id}
                      isEditMode={isEditMode}
                      isVisible={getWidgetPreference(widget.id)?.visible !== false}
                      onToggleVisibility={toggleWidgetVisibility}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      draggingId={draggingId}
                      dragOverId={dragOverId}
                    >
                      <QuickManualEntryCard />
                    </DraggableWidget>
                  );

                default:
                  return null;
              }
            })}
          </div>
        )}

        {/* Special Widgets - Rendered Separately */}
        {getVisibleWidgets().filter(w => ['streaks', 'summary'].includes(w.id)).map((widget) => {
          if (widget.id === 'streaks') {
            return (
              <div key={widget.id} className="mt-8 cursor-pointer" onClick={() => router.push('/dashboard/streaks')}>
                <DraggableWidget
                  widgetId={widget.id}
                  isEditMode={isEditMode}
                  isVisible={getWidgetPreference(widget.id)?.visible !== false}
                  onToggleVisibility={toggleWidgetVisibility}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  draggingId={draggingId}
                  dragOverId={dragOverId}
                >
                  <StreakCard
                    currentStreak={streakData?.currentStreak || 0}
                    targetMetric={streakData?.targetMetric || '10,000 steps'}
                    message={streakData?.message || 'Keep going!'}
                  />
                </DraggableWidget>
              </div>
            );
          }

          if (widget.id === 'summary') {
            return (
              <div key={widget.id} className="mt-6 cursor-pointer" onClick={() => router.push('/dashboard/weekly-summary')}>
                <DraggableWidget
                  widgetId={widget.id}
                  isEditMode={isEditMode}
                  isVisible={getWidgetPreference(widget.id)?.visible !== false}
                  onToggleVisibility={toggleWidgetVisibility}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  draggingId={draggingId}
                  dragOverId={dragOverId}
                >
                  <SummaryCard summaryData={dashboardData} />
                </DraggableWidget>
              </div>
            );
          }

          return null;
        })}

        {getVisibleWidgets().some((widget) => ['critical-events', 'appointments'].includes(widget.id)) && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getVisibleWidgets()
              .filter((widget) => ['critical-events', 'appointments'].includes(widget.id))
              .map((widget) => {
                if (widget.id === 'critical-events') {
                  return (
                    <DraggableWidget
                      key={widget.id}
                      widgetId={widget.id}
                      isEditMode={isEditMode}
                      isVisible={getWidgetPreference(widget.id)?.visible !== false}
                      onToggleVisibility={toggleWidgetVisibility}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      draggingId={draggingId}
                      dragOverId={dragOverId}
                    >
                      <CriticalEventsWidget />
                    </DraggableWidget>
                  );
                }

                if (widget.id === 'appointments') {
                  return (
                    <DraggableWidget
                      key={widget.id}
                      widgetId={widget.id}
                      isEditMode={isEditMode}
                      isVisible={getWidgetPreference(widget.id)?.visible !== false}
                      onToggleVisibility={toggleWidgetVisibility}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      draggingId={draggingId}
                      dragOverId={dragOverId}
                    >
                      <AppointmentsWidget />
                    </DraggableWidget>
                  );
                }

                return null;
              })}
          </div>
        )}
      </main>
    </div>
  );
}