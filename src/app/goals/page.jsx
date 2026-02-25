'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import GoalCard from '@/components/GoalCard/GoalCard';
import { PlusIcon } from '@/components/Icons/GoalIcons';
import { useAuth } from '@/hooks/useAuth';
import { GOAL_CATALOG } from '@/constants/goalCatalog';

export default function GoalsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const patientId = useMemo(() => user?.patient_id || user?.id || null, [user]);

  const [cards, setCards] = useState([]);

  // Add Goal modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('workouts');
  const [newTarget, setNewTarget] = useState('');
  const [newFrequency, setNewFrequency] = useState('daily');
  const [addError, setAddError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  const buildCardsFromDb = useCallback((dbGoals) => {
    const byMetric = new Map(dbGoals.map((g) => [g.metric_type, g]));

    // These are placeholders until you implement logging.
    // Core goals show your existing demo current values; add-ons show 0 for now.
    const defaultCurrentByMetric = {
      steps: 7834,
      calories: 1847,
      water: 6,
      sleep: 7.5,
      workouts: 0,
      protein: 0,
      medication: 0,
    };

    // Keep streak placeholder values (you can calculate later)
    const defaultStreakByMetric = {
      steps: 12,
      calories: 8,
      water: 15,
      sleep: 5,
      workouts: 0,
      protein: 0,
      medication: 0,
    };

    const toRender = [];

    for (const item of GOAL_CATALOG) {
      const row = byMetric.get(item.metric_type);

      if (item.core) {
        // core always shown
        toRender.push({
          metric_type: item.metric_type,
          goalId: row?.id ?? null,
          title: item.title,
          icon: item.icon,
          unit: item.unit,
          iconBgColor: item.iconBgColor,
          iconColor: item.iconColor,
          streak: defaultStreakByMetric[item.metric_type] ?? 0,
          currentValue: defaultCurrentByMetric[item.metric_type] ?? 0,
          targetValue: row?.target_value ?? item.defaultTarget,
          frequency: row?.frequency ?? item.defaultFrequency ?? 'daily',
        });
      } else {
        // add-ons only shown if they exist in DB
        if (row) {
          toRender.push({
            metric_type: item.metric_type,
            goalId: row.id,
            title: item.title,
            icon: item.icon,
            unit: item.unit,
            iconBgColor: item.iconBgColor,
            iconColor: item.iconColor,
            streak: defaultStreakByMetric[item.metric_type] ?? 0,
            currentValue: defaultCurrentByMetric[item.metric_type] ?? 0,
            targetValue: row.target_value ?? item.defaultTarget,
            frequency: row.frequency ?? item.defaultFrequency ?? 'daily',
          });
        }
      }
    }

    setCards(toRender);
  }, []);

  const fetchGoals = useCallback(async () => {
    if (!patientId) return;

    // Initialize core goals if not already done
    await fetch(`/api/biometrics/goals/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId }),
    }).catch(console.error);

    // Then fetch all goals
    const res = await fetch(`/api/biometrics/goals?patientId=${patientId}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    const goals = Array.isArray(data?.goals) ? data.goals : [];
    buildCardsFromDb(goals);
  }, [patientId, buildCardsFromDb]);

  useEffect(() => {
    if (patientId) fetchGoals();
  }, [patientId, fetchGoals]);

  const updateTarget = async (goalId, targetValue) => {
    if (!patientId || !goalId) return;

    const res = await fetch('/api/biometrics/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, patientId, targetValue }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(err);
      alert(err?.error || 'Failed to update target');
      return;
    }

    setCards((prev) =>
      prev.map((c) => (c.goalId === goalId ? { ...c, targetValue: Number(targetValue) } : c))
    );
  };

  const availableAddOns = useMemo(() => {
    const existing = new Set(cards.map((c) => c.metric_type));
    return GOAL_CATALOG.filter((g) => !g.core && !existing.has(g.metric_type));
  }, [cards]);

  const openAdd = () => {
    setAddError('');

    const first = availableAddOns[0]?.metric_type || 'workouts';
    const item = GOAL_CATALOG.find((g) => g.metric_type === first);

    setSelectedMetric(first);
    setNewTarget(String(item?.defaultTarget ?? ''));
    setNewFrequency(item?.defaultFrequency || 'daily'); // ✅ workouts defaults to weekly
    setIsAddOpen(true);
  };

  const submitAdd = async () => {
    setAddError('');

    const target = Number(newTarget);
    if (!Number.isFinite(target) || target <= 0) {
      setAddError('Target must be a positive number.');
      return;
    }

    const res = await fetch('/api/biometrics/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        metricType: selectedMetric,
        targetValue: target,
        frequency: newFrequency,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setAddError(data?.error || 'Failed to add goal.');
      return;
    }

    setIsAddOpen(false);
    await fetchGoals();
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

      <main className="flex-1 p-8 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            Goals & Streaks
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Set and track your personal health goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {cards.map((goal) => (
            <GoalCard
              key={goal.metric_type}
              title={goal.title}
              icon={goal.icon}
              streak={goal.streak}
              currentValue={goal.currentValue}
              targetValue={goal.targetValue}
              unit={goal.unit}
              frequency={goal.frequency}
              iconBgColor={goal.iconBgColor}
              iconColor={goal.iconColor}
              onUpdateTarget={(newTargetValue) => updateTarget(goal.goalId, newTargetValue)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={openAdd}
          disabled={availableAddOns.length === 0}
          className="w-full bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex items-center justify-center gap-3 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-6 h-6 text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400 font-medium group-hover:text-gray-600 dark:group-hover:text-gray-300">
            {availableAddOns.length === 0 ? 'All goals added' : 'Add New Goal'}
          </span>
        </button>

        {isAddOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add New Goal</h2>
                <button
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setIsAddOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                    Goal Type
                  </label>
                  <select
                    value={selectedMetric}
                    onChange={(e) => {
                      const next = e.target.value;
                      const item = GOAL_CATALOG.find((g) => g.metric_type === next);

                      setSelectedMetric(next);
                      setNewTarget(String(item?.defaultTarget ?? ''));
                      setNewFrequency(item?.defaultFrequency || 'daily');
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    {availableAddOns.map((g) => (
                      <option key={g.metric_type} value={g.metric_type}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                    Target
                  </label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                    Frequency
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                {addError && <p className="text-sm text-red-500">{addError}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAdd}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors"
                  >
                    Add Goal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}