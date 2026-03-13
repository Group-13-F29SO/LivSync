'use client';

import { useEffect, useRef } from 'react';

export default function HeartRateChart({ startDate, endDate }) {
  const chartRef = useRef(null);

  // Sample heart rate data
  const generateChartData = () => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * 40) + 60 // 60-100 bpm
      });
    }
    return data;
  };

  const data = generateChartData();
  const maxValue = Math.max(...data.map(d => d.value), 100);
  const chartHeight = 300;
  const chartWidth = 800;

  // Calculate points for SVG path
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (item.value / maxValue) * chartHeight;
    return { x, y, value: item.value };
  });

  const pathD = points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div ref={chartRef} className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}
        className="w-full min-w-max"
        style={{ height: 'auto' }}
      >
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map((percent) => (
          <line
            key={`grid-${percent}`}
            x1="40"
            y1={chartHeight - (percent / 100) * chartHeight}
            x2={chartWidth}
            y2={chartHeight - (percent / 100) * chartHeight}
            stroke="currentColor"
            strokeDasharray="5,5"
            className="text-gray-200 dark:text-gray-700"
          />
        ))}

        {/* Y-Axis Labels */}
        {[0, 25, 50, 75, 100].map((percent) => (
          <text
            key={`label-${percent}`}
            x="35"
            y={chartHeight - (percent / 100) * chartHeight + 5}
            textAnchor="end"
            className="text-xs fill-gray-500 dark:fill-gray-400"
          >
            {Math.floor((percent / 100) * maxValue)}
          </text>
        ))}

        {/* Area Fill */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area Path */}
        <path
          d={`${pathD} L ${chartWidth} ${chartHeight} L 40 ${chartHeight} Z`}
          fill="url(#areaGradient)"
        />

        {/* Line Path */}
        <path
          d={pathD}
          fill="none"
          stroke="rgb(239, 68, 68)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points */}
        {points.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="rgb(239, 68, 68)"
            className="hover:r-6 transition-all cursor-pointer"
          />
        ))}

        {/* X-Axis Labels */}
        {points.map((point, index) => (
          index % Math.ceil(points.length / 7) === 0 && (
            <text
              key={`date-${index}`}
              x={point.x}
              y={chartHeight + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500 dark:fill-gray-400"
            >
              {data[index].date}
            </text>
          )
        ))}

        {/* X-Axis */}
        <line
          x1="40"
          y1={chartHeight}
          x2={chartWidth}
          y2={chartHeight}
          stroke="currentColor"
          className="text-gray-300 dark:text-gray-600"
        />
      </svg>
    </div>
  );
}
