'use client';

import { useState } from 'react';
import { Watch } from 'lucide-react';

const DEVICE_OPTIONS = [
  { id: 'apple-health', name: 'Apple Health', label: 'iPhone/Apple Watch' },
  { id: 'google-fit', name: 'Google Fit', label: 'Android/Wear OS' },
  { id: 'fitbit', name: 'Fitbit', label: 'Fitbit Devices' },
  { id: 'garmin', name: 'Garmin', label: 'Garmin Devices' },
  { id: 'samsung', name: 'Samsung Galaxy Watch', label: 'Samsung Wearables' },
];

const BENEFITS = [
  'Real-time health data tracking',
  'Automatic biometric syncing',
  'Better personalized insights',
  'Enhanced health monitoring',
];

export default function Step5SignUp({ formData, handleChange, handleNext, isLoading }) {
  const [connectionStep, setConnectionStep] = useState('select'); // 'select', 'connecting', 'success'
  const [selectedDevice, setSelectedDevice] = useState(null);

  const handleSelectDevice = (deviceId) => {
    const device = DEVICE_OPTIONS.find(d => d.id === deviceId);
    setSelectedDevice(device);
    handleChange('connectedDevice', device);
    setConnectionStep('connecting');

    // Simulate connection delay
    setTimeout(() => {
      setConnectionStep('success');
    }, 2000);
  };

  const handleSkip = (e) => {
    e.preventDefault();
    handleChange('connectedDevice', null);
    handleNext(e);
  };

  const handleConfirmDevice = (e) => {
    e.preventDefault();
    handleNext(e);
  };

  const SmartWatchIcon = () => (
    <Watch className="w-12 h-12 text-white" strokeWidth={1.5} />
  );

  const CheckmarkIcon = ({ className = '' }) => (
    <svg className={`w-5 h-5 text-blue-600 ${className}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  if (connectionStep === 'select') {
    return (
      <div className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
            <SmartWatchIcon />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center">
            Connect Your Wearable Device
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Enable automatic syncing of your health and fitness data for better insights
          </p>
        </div>

        {/* Benefits Box */}
        <div className="bg-white dark:bg-gray-900 bg-opacity-20 dark:bg-opacity-30 backdrop-blur-sm rounded-xl p-6 space-y-4 border border-white dark:border-gray-700 border-opacity-30">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Benefits of Connecting:</h2>
          <div className="space-y-3">
            {BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckmarkIcon />
                <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device Options */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {DEVICE_OPTIONS.map((device) => (
            <button
              key={device.id}
              onClick={() => handleSelectDevice(device.id)}
              disabled={isLoading}
              className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 text-left"
            >
              <div className="font-medium text-gray-900 dark:text-white">{device.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{device.label}</div>
            </button>
          ))}
        </div>

        {/* Skip for now */}
        <button
          onClick={handleSkip}
          disabled={isLoading}
          className="w-full text-center text-gray-600 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    );
  }

  if (connectionStep === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <SmartWatchIcon />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Connecting to {selectedDevice?.name}...
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please wait while we establish the connection
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  if (connectionStep === 'success') {
    return (
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connection Successful!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {selectedDevice?.name} has been connected to your account
          </p>
        </div>

        {/* Connected Device Info */}
        <div className="bg-green-50 dark:bg-slate-800 border-2 border-green-300 dark:border-green-700 rounded-lg p-4">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-white mb-1">
              {selectedDevice?.name}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedDevice?.label}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleConfirmDevice}
          disabled={isLoading}
          className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Setting up...' : 'Continue'}
        </button>

        {/* Change Device Option */}
        <button
          onClick={() => {
            setConnectionStep('select');
            setSelectedDevice(null);
          }}
          disabled={isLoading}
          className="w-full text-center text-gray-600 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          Connect a different device
        </button>
      </div>
    );
  }
}
