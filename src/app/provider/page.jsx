'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PatientCard from '@/components/Provider/PatientCard';
import ConnectionRequestModal from '@/components/Provider/ConnectionRequestModal';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, Search, Filter } from 'lucide-react';

export default function ProviderPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Patients');
  const [patientCount, setPatientCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sample patient data
  const samplePatients = [
    {
      id: 1,
      name: 'Sarah Mitchell',
      age: 34,
      status: 'Active',
      lastSync: 5,
      statusColor: 'green',
      alert: null
    },
    {
      id: 2,
      name: 'John Anderson',
      age: 52,
      status: 'Active',
      lastSync: 12,
      statusColor: 'orange',
      alert: { icon: '⚠️', message: 'High Heart Rate — 185 bpm' }
    },
    {
      id: 3,
      name: 'Emma Johnson',
      age: 28,
      status: 'Active',
      lastSync: 2,
      statusColor: 'green',
      alert: null
    },
    {
      id: 4,
      name: 'Robert Chen',
      age: 67,
      status: 'Active',
      lastSync: 45,
      statusColor: 'red',
      alert: { icon: '⚠️', message: 'Critical Blood Glucose — 450 mg/dL' }
    },
    {
      id: 5,
      name: 'Maria Garcia',
      age: 41,
      status: 'Active',
      lastSync: 8,
      statusColor: 'green',
      alert: null
    }
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Set initial patient data
    setPatients(samplePatients);
    setPatientCount(samplePatients.length);
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All Patients' || patient.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleConnectPatient = () => {
    setIsModalOpen(true);
  };

  const handleSendRequest = async (emailOrUsername) => {
    try {
      // Here you would typically send an API request
      console.log('Sending connection request to:', emailOrUsername);
      // const response = await fetch('/api/provider/connection-request', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ emailOrUsername })
      // });
      setIsModalOpen(false);
      // Show success message
      alert('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request');
    }
  };

  const handleDisconnect = (patientId) => {
    setPatients(patients.filter(p => p.id !== patientId));
    setPatientCount(prev => prev - 1);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <ConnectionRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSend={handleSendRequest}
      />

      <main className="flex-1 p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent mb-2">
              Patient Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {patientCount} active patients
            </p>
          </div>

          {/* Connect Patient Button */}
          <button
            onClick={handleConnectPatient}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white font-medium rounded-lg transition-all transform hover:scale-105"
          >
            <UserPlus size={20} />
            Connect Patient
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex gap-3 mb-8">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search patients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter size={18} />
              <span>{filterType}</span>
              <span className={`text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {/* Dropdown Menu */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                {['All Patients', 'Active', 'Pending', 'Revoked'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setFilterType(option);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      filterType === option
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patient Cards Section */}
        <div className="space-y-4">
          {filteredPatients.length > 0 ? (
            filteredPatients.map(patient => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onDisconnect={handleDisconnect}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No patients found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
