import { FootprintsIcon, FlameIcon, DropIcon, MoonIcon } from '@/components/Icons/GoalIcons';

const EmojiIcon = ({ emoji }) => (
  <span className="text-xl leading-none">{emoji}</span>
);

export const GOAL_CATALOG = [
  // Core goals (always shown)
  {
    metric_type: 'steps',
    title: 'Daily Steps',
    unit: 'steps',
    defaultTarget: 10000,
    defaultFrequency: 'daily',
    icon: FootprintsIcon,
    iconBgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    core: true,
  },
  {
    metric_type: 'calories',
    title: 'Calories Burned',
    unit: 'kcal',
    defaultTarget: 2200,
    defaultFrequency: 'daily',
    icon: FlameIcon,
    iconBgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    core: true,
  },
  {
    metric_type: 'water',
    title: 'Water Intake',
    unit: 'glasses',
    defaultTarget: 8,
    defaultFrequency: 'daily',
    icon: DropIcon,
    iconBgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    core: true,
  },
  {
    metric_type: 'sleep',
    title: 'Sleep Duration',
    unit: 'hours',
    defaultTarget: 8,
    defaultFrequency: 'daily',
    icon: MoonIcon,
    iconBgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    core: true,
  },

  // Structured add-on goals (only shown once added)
  {
    metric_type: 'workouts',
    title: 'Workout Sessions',
    unit: 'sessions',
    defaultTarget: 4,
    defaultFrequency: 'weekly', // ✅ default weekly
    icon: () => <EmojiIcon emoji="🏋️" />,
    iconBgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    core: false,
  },
  {
    metric_type: 'protein',
    title: 'Protein Intake',
    unit: 'g',
    defaultTarget: 120,
    defaultFrequency: 'daily',
    icon: () => <EmojiIcon emoji="🥩" />,
    iconBgColor: 'bg-amber-100',
    iconColor: 'text-amber-700',
    core: false,
  },
  {
    metric_type: 'medication',
    title: 'Medication',
    unit: 'doses',
    defaultTarget: 1,
    defaultFrequency: 'daily',
    icon: () => <EmojiIcon emoji="💊" />,
    iconBgColor: 'bg-rose-100',
    iconColor: 'text-rose-700',
    core: false,
  },
];