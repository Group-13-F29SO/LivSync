/**
 * Badge Definitions
 * Defines all available badges with their criteria and descriptions
 */

export const BADGE_DEFINITIONS = [
  // Activity Badges
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Completed your first 10,000 steps in a day',
    category: 'Activity',
    icon: 'footprints',
    criteria: {
      type: 'daily_metric_threshold',
      metric: 'steps',
      threshold: 10000,
      unit: 'steps',
    },
  },
  {
    id: 'marathon-master',
    name: 'Marathon Master',
    description: 'Walk 100,000 steps in total',
    category: 'Activity',
    icon: 'trophy',
    criteria: {
      type: 'total_metric_threshold',
      metric: 'steps',
      threshold: 100000,
      unit: 'steps',
    },
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Reach 1,000,000 total steps',
    category: 'Activity',
    icon: 'star',
    criteria: {
      type: 'total_metric_threshold',
      metric: 'steps',
      threshold: 1000000,
      unit: 'steps',
    },
  },

  // Streak Badges
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintained a 7-day streak of logging activity',
    category: 'Streaks',
    icon: 'flame',
    criteria: {
      type: 'daily_logging_streak',
      days: 7,
      metric: 'any',
    },
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Maintain a 30-day streak of logging activity',
    category: 'Streaks',
    icon: 'crown',
    criteria: {
      type: 'daily_logging_streak',
      days: 30,
      metric: 'any',
    },
  },
  {
    id: 'iron-will',
    name: 'Iron Will',
    description: 'Maintain a 100-day streak of logging activity',
    category: 'Streaks',
    icon: 'shield',
    criteria: {
      type: 'daily_logging_streak',
      days: 100,
      metric: 'any',
    },
  },

  // Heart Health Badges
  {
    id: 'heart-health-hero',
    name: 'Heart Health Hero',
    description: 'Logged heart rate for 30 consecutive days',
    category: 'Health',
    icon: 'heart',
    criteria: {
      type: 'daily_metric_logging_streak',
      metric: 'heart_rate',
      days: 30,
    },
  },
  {
    id: 'cardio-champion',
    name: 'Cardio Champion',
    description: 'Recorded 100+ heart rate measurements',
    category: 'Health',
    icon: 'heart-pulse',
    criteria: {
      type: 'total_metric_count',
      metric: 'heart_rate',
      threshold: 100,
    },
  },
  {
    id: 'glucose-guardian',
    name: 'Glucose Guardian',
    description: 'Logged blood glucose for 30 consecutive days',
    category: 'Health',
    icon: 'droplet',
    criteria: {
      type: 'daily_metric_logging_streak',
      metric: 'blood_glucose',
      days: 30,
    },
  },

  // Goal Badges
  {
    id: 'goal-getter',
    name: 'Goal Getter',
    description: 'Achieved all daily goals for 5 consecutive days',
    category: 'Goals',
    icon: 'target',
    criteria: {
      type: 'daily_goal_completion',
      threshold: 5,
      percentRequired: 100,
    },
  },
  {
    id: 'goal-master',
    name: 'Goal Master',
    description: 'Achieved all daily goals for 30 consecutive days',
    category: 'Goals',
    icon: 'medal',
    criteria: {
      type: 'daily_goal_completion',
      threshold: 30,
      percentRequired: 100,
    },
  },

  // Hydration Badges
  {
    id: 'hydration-hero',
    name: 'Hydration Hero',
    description: 'Meet your hydration goal for 14 consecutive days',
    category: 'Wellness',
    icon: 'water-droplet',
    criteria: {
      type: 'daily_goal_streak',
      goalType: 'hydration',
      days: 14,
    },
  },
  {
    id: 'hydration-hacker',
    name: 'Hydration Hacker',
    description: 'Log 100+ hydration entries',
    category: 'Wellness',
    icon: 'bottle',
    criteria: {
      type: 'total_metric_count',
      metric: 'hydration',
      threshold: 100,
    },
  },

  // Sleep Badges
  {
    id: 'sleep-champion',
    name: 'Sleep Champion',
    description: 'Get 8+ hours of sleep for 7 consecutive nights',
    category: 'Sleep',
    icon: 'moon',
    criteria: {
      type: 'daily_metric_threshold_streak',
      metric: 'sleep',
      threshold: 480, // 8 hours in minutes
      days: 7,
      operator: 'gte',
    },
  },
  {
    id: 'rest-master',
    name: 'Rest Master',
    description: 'Maintain an average of 8+ hours sleep for 30 days',
    category: 'Sleep',
    icon: 'bed',
    criteria: {
      type: 'average_metric_threshold',
      metric: 'sleep',
      threshold: 480, // 8 hours in minutes
      days: 30,
      operator: 'gte',
    },
  },

  // Calorie Badges
  {
    id: 'calorie-counter',
    name: 'Calorie Counter',
    description: 'Log 50 calorie entries',
    category: 'Nutrition',
    icon: 'flame-alt',
    criteria: {
      type: 'total_metric_count',
      metric: 'calories',
      threshold: 50,
    },
  },

  // First Achievement
  {
    id: 'first-entry',
    name: 'Welcome Aboard',
    description: 'Log your first health metric',
    category: 'Getting Started',
    icon: 'star',
    criteria: {
      type: 'first_entry',
    },
  },
];

/**
 * Get badge definition by ID
 */
export function getBadgeDefinition(badgeId) {
  return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId);
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category) {
  return BADGE_DEFINITIONS.filter((badge) => badge.category === category);
}

/**
 * Get all badge categories
 */
export function getAllBadgeCategories() {
  const categories = new Set(BADGE_DEFINITIONS.map((badge) => badge.category));
  return Array.from(categories);
}

/**
 * Get all badges grouped by category
 */
export function getAllBadgesGroupedByCategory() {
  const grouped = {};
  BADGE_DEFINITIONS.forEach((badge) => {
    if (!grouped[badge.category]) {
      grouped[badge.category] = [];
    }
    grouped[badge.category].push(badge);
  });
  return grouped;
}
