'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import SettingsSection from '@/components/Settings/SettingsSection';
import DeviceCard from '@/components/Settings/DeviceCard';
import EmptyDevicesState from '@/components/Settings/EmptyDevicesState';
import { PrimaryButton } from '@/components/Settings/Buttons';

const SUPPORTED_DEVICES = [
  'Apple Watch',
  'Fitbit',
  'Garmin',
  'Samsung Galaxy Watch',
  'Polar',
  'Whoop',
];

const DEVICE_PERMISSIONS = [
  'Heart rate and cardiovascular metrics',
  'Step count and activity data',
  'Sleep patterns and quality',
  'Workout sessions and calories burned',
  'Blood oxygen levels (if supported)',
];

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState([
    {
      id: 1,
      name: 'Apple Watch Series 8',
      type: 'watch',
      status: 'connected',
      lastSync: '2 minutes ago',
      battery: 85,
    },
  ]);

  const handleRemoveDevice = (deviceId) => {
    setDevices(devices.filter(device => device.id !== deviceId));
  };

  const handleSyncDevice = (deviceId) => {
    // In a real implementation, this would sync the device
    console.log('Syncing device:', deviceId);
  };

  const handleAddDevice = () => {
    // In a real implementation, this would open a device pairing dialog
    console.log('Opening device pairing dialog');
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <Navbar />

      <main className="flex-1 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <div className="p-8 max-w-4xl">
          <BackButton onClick={() => router.push('/settings')} />
          <PageHeader />
          <ConnectedDevicesSection 
            devices={devices}
            onSync={handleSyncDevice}
            onRemove={handleRemoveDevice}
          />
          <AddDeviceSection onAddDevice={handleAddDevice} />
          <DevicePermissionsSection />
        </div>
      </main>
    </div>
  );
}

// Page Components
function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span className="font-medium">Back to Settings</span>
    </button>
  );
}

function PageHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 pb-1">
        Connected Devices
      </h1>
      <p className="text-slate-500 dark:text-slate-400">
        Manage your wearables and health tracking devices
      </p>
    </div>
  );
}

function ConnectedDevicesSection({ devices, onSync, onRemove }) {
  const DevicesIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="mb-8">
      <SettingsSection icon={<DevicesIcon />} title="Your Devices">
        {devices.length > 0 ? (
          <div className="space-y-4">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onSync={() => onSync(device.id)}
                onRemove={() => onRemove(device.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyDevicesState />
        )}
      </SettingsSection>
    </div>
  );
}

function AddDeviceSection({ onAddDevice }) {
  const AddIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  return (
    <div className="mb-8">
      <SettingsSection icon={<AddIcon />} title="Add New Device">
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-400">
            Connect a new wearable device to sync your health and fitness data automatically.
          </p>

          <SupportedDevicesList />
          <ConnectionInstructions />

          <div>
            <PrimaryButton onClick={onAddDevice}>
              <div className="flex items-center gap-2">
                <AddIcon />
                Add Device
              </div>
            </PrimaryButton>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

function SupportedDevicesList() {
  return (
    <div>
      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
        Supported Devices:
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {SUPPORTED_DEVICES.map((deviceType) => (
          <div
            key={deviceType}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-sm text-slate-700 dark:text-slate-300"
          >
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {deviceType}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionInstructions() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        How to Connect
      </h4>
      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
        <li>Make sure your device is charged and nearby</li>
        <li>Enable Bluetooth on your device</li>
        <li>Click the "Add Device" button below</li>
        <li>Follow the on-screen pairing instructions</li>
      </ol>
    </div>
  );
}

function DevicePermissionsSection() {
  const InfoIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="mb-8">
      <SettingsSection icon={<InfoIcon />} title="Device Permissions">
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Connected devices will have access to sync the following data:
          </p>
          <ul className="space-y-2">
            {DEVICE_PERMISSIONS.map((permission, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{permission}</span>
              </li>
            ))}
          </ul>
          <div className="pt-4 text-sm text-slate-500 dark:text-slate-400">
            <p>
              All data is encrypted and stored securely. You can revoke device access at any time by removing the device from this page.
            </p>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
