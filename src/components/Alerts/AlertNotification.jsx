'use client';

import { useState, useEffect } from 'react';

export default function AlertNotification({ isVisible, metricType, value, thresholdType, thresholdValue, onClose }) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!isVisible) return;

    // Auto-fade after 4 seconds
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, 4000);

    // Close after fade completes
    const closeTimer = setTimeout(() => {
      onClose();
      setOpacity(1); // Reset for next alert
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getThresholdMessage = () => {
    if (thresholdType === 'min') {
      return `Below minimum threshold of ${thresholdValue}`;
    } else if (thresholdType === 'max') {
      return `Above maximum threshold of ${thresholdValue}`;
    }
    return 'Threshold exceeded';
  };

  const getMetricLabel = () => {
    const labels = {
      steps: 'Steps',
      heart_rate: 'Heart Rate',
      calories: 'Calories',
      hydration: 'Hydration',
      sleep: 'Sleep',
      blood_glucose: 'Blood Glucose',
    };
    return labels[metricType] || metricType;
  };

  const getAlertColor = () => {
    if (thresholdType === 'max') {
      return 'bg-red-500'; // High alert - red
    } else if (thresholdType === 'min') {
      return 'bg-yellow-500'; // Low alert - yellow
    }
    return 'bg-orange-500';
  };

  const getAlertIcon = () => {
    if (thresholdType === 'max') {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-opacity duration-1000 ease-out`}
      style={{ opacity }}
    >
      <div className={`${getAlertColor()} text-white rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-sm`}>
        <div className="flex-shrink-0 mt-0.5">{getAlertIcon()}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            {getMetricLabel()} Alert
          </h3>
          <p className="text-xs mb-1">
            Current: <span className="font-bold">{value}</span>
          </p>
          <p className="text-xs opacity-90">
            {getThresholdMessage()}
          </p>
        </div>
      </div>
    </div>
  );
}
