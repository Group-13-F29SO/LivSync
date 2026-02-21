'use client';

import StatsCard from './StatsCard';

export default function StatsGrid({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatsCard 
        label="Average Level" 
        value={stats.average} 
        unit="mg/dL" 
        color="indigo"
      />
      <StatsCard 
        label="Maximum" 
        value={stats.max} 
        unit="mg/dL" 
        color="red"
      />
      <StatsCard 
        label="Minimum" 
        value={stats.min} 
        unit="mg/dL" 
        color="green"
      />
      <StatsCard 
        label="Data Points" 
        value={stats.count} 
        unit="readings" 
        color="purple"
      />
    </div>
  );
}
