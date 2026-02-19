import StatCard from '@/components/Dashboard/StatCard';

export default function StepsStats({ stats, period }) {
  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Total Steps"
        value={stats.total}
        subLabel={period === 'today' ? 'steps' : period === 'year' ? 'total steps' : 'total steps'}
        color="blue"
      />
      <StatCard
        label={period === 'today' ? 'Daily Average' : period === 'year' ? 'Average Steps/Month' : 'Average Daily Steps'}
        value={stats.average}
        subLabel={period === 'today' ? 'steps/hour' : period === 'year' ? 'steps/day' : 'steps/day'}
        color="purple"
      />
      <StatCard
        label="Peak"
        value={stats.max}
        subLabel={period === 'today' ? 'steps/hour' : period === 'year' ? 'steps/day' : 'steps'}
        color="green"
      />
      <StatCard
        label={period === 'today' ? 'Goal Achievement' : period === 'year' ? 'Months with Data' : 'Days with Data'}
        value={period === 'today' ? (stats.goalAchieved ? 'Achieved' : 'Not Met') : period === 'year' ? stats.monthsWithData : stats.daysWithData}
        subLabel={period === 'today' ? `${stats.goal} steps/day goal` : period === 'year' ? `of ${stats.totalMonths} months` : `of ${stats.totalDays} days`}
        color="orange"
      />
    </div>
  );
}
