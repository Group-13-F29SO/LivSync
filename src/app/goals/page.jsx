'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import GoalCard from '@/components/GoalCard/GoalCard';
import { FootprintsIcon, FlameIcon, DropIcon, MoonIcon, PlusIcon } from '@/components/Icons/GoalIcons';
import { useAuth } from '@/hooks/useAuth';

export default function GoalsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Prefer patient_id if your auth provides it; otherwise fallback to id
  const patientId = useMemo(() => {
    return user?.patient_id || user?.id || null;
  }, [user]);

  const [goalsData, setGoalsData] = useState([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Base UI definition (keeps your same styling/labels)
  const baseCards = useMemo(
    () => [
      {
        metric_type: 'steps',
        title: 'Daily Steps',
        icon: FootprintsIcon,
        streak: 12,
        currentValue: 7834,
        defaultTarget: 10000,
        unit: 'steps',
        iconBgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        metric_type: 'calories',
        title: 'Calories Burned',
        icon: FlameIcon,
        streak: 8,
        currentValue: 1847,
        defaultTarget: 2200,
        unit: 'kcal',
        iconBgColor: 'bg-orange-100',
        iconColor: 'text-orange-600',
      },
      {
        metric_type: 'water',
        title: 'Water Intake',
        icon: DropIcon,
        streak: 15,
        currentValue: 6,
        defaultTarget: 8,
        unit: 'glasses',
        iconBgColor: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
      },
      {
        metric_type: 'sleep',
        title: 'Sleep Duration',
        icon: MoonIcon,
        streak: 5,
        currentValue: 7.5,
        defaultTarget: 8,
        unit: 'hours',
        iconBgColor: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      },
    ],
    []
  );

  // Load goals from DB and merge into the base UI cards
  useEffect(() => {
    if (!patientId) return;

    const loadGoals = async () => {
      try {
        const res = await fetch(`/api/biometrics/goals?patientId=${patientId}`, { cache: 'no-store' });
        const data = await res.json();

        const rows = Array.isArray(data?.goals) ? data.goals : [];
        const byMetric = new Map(rows.map((g) => [g.metric_type, g]));

        const merged = baseCards.map((card, idx) => {
          const dbGoal = byMetric.get(card.metric_type);

          return {
            // UI fields
            id: idx + 1,
            title: card.title,
            icon: card.icon,
            streak: card.streak,
            currentValue: card.currentValue,
            unit: card.unit,
            iconBgColor: card.iconBgColor,
            iconColor: card.iconColor,

            // DB fields
            goalId: dbGoal?.id ?? null, // primary key in goals table
            metric_type: card.metric_type,
            targetValue: dbGoal?.target_value ?? card.defaultTarget,
          };
        });

        setGoalsData(merged);
      } catch (e) {
        console.error('Failed to load goals:', e);
      }
    };

    loadGoals();
  }, [patientId, baseCards]);

  // PATCH update target in DB, then update UI state immediately
  const updateTarget = async ({ goalId, metric_type, targetValue }) => {
    if (!patientId) return;

    // If goalId doesn't exist, it means DB row missing; for now we bail
    // (Later we can implement "create if missing")
    if (!goalId) {
      console.warn('No goalId found for', metric_type);
      return;
    }

    const res = await fetch('/api/biometrics/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalId,
        patientId,
        targetValue,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Failed to update goal:', err);
      return;
    }

    // Update local UI state so it reflects immediately
    setGoalsData((prev) =>
      prev.map((g) => (g.goalId === goalId ? { ...g, targetValue: Number(targetValue) } : g))
    );
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
          {goalsData.map((goal) => (
            <GoalCard
              key={goal.metric_type}
              title={goal.title}
              icon={goal.icon}
              streak={goal.streak}
              currentValue={goal.currentValue}
              targetValue={goal.targetValue}
              unit={goal.unit}
              iconBgColor={goal.iconBgColor}
              iconColor={goal.iconColor}
              onUpdateTarget={(newTarget) =>
                updateTarget({
                  goalId: goal.goalId,
                  metric_type: goal.metric_type,
                  targetValue: newTarget,
                })
              }
            />
          ))}
        </div>

        <button
          type="button"
          className="w-full bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex items-center justify-center gap-3 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
          onClick={() => {
            // Not implemented yet (we can add a modal + POST later)
            alert('Add New Goal is not wired yet.');
          }}
        >
          <PlusIcon className="w-6 h-6 text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400 font-medium group-hover:text-gray-600 dark:group-hover:text-gray-300">
            Add New Goal
          </span>
        </button>
      </main>
    </div>
  );
}