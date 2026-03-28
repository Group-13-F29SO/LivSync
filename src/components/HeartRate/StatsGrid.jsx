'use client';

import StatsCard from './StatsCard';

export default function StatsGrid({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <StatsCard 
        label="Current Average" 
        value={stats.average} 
        unit="bpm" 
        color="blue"
      />
      <StatsCard 
        label="Maximum" 
        value={stats.max} 
        unit="bpm" 
        color="red"
      />
      <StatsCard 
        label="Minimum" 
        value={stats.min} 
        unit="bpm" 
        color="green"
      />
    </div>
  );
}
