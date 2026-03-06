import StatCard from '@/components/Dashboard/StatCard';

export default function StepsStats({ stats, period, goal }) {
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
      {period === 'today' ? (
        !goal ? (
          <StatCard
            label="Goal Achievement"
            value="No Goal Set"
            subLabel="Set a goal to track progress"
            color="orange"
          />
        ) : (
          <StatCard
            label="Goal Achievement"
            value={stats.goalAchieved ? 'Achieved' : 'Not Met'}
            subLabel={`${goal.target_value} steps/day goal`}
            color="orange"
          />
        )
      ) : (
        <StatCard
          label={period === 'year' ? 'Months with Data' : 'Days with Data'}
          value={period === 'year' ? stats.monthsWithData : stats.daysWithData}
          subLabel={period === 'year' ? `of ${stats.totalMonths} months` : `of ${stats.totalDays} days`}
          color="orange"
        />
      )}
    </div>
  );
}
