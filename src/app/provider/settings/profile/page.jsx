'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PrimaryButton, SecondaryButton } from '@/components/Settings/Buttons';

export default function ProviderProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    medicalLicenseNumber: '',
    workplaceName: '',
    workPhone: '',
    specialty: '',
    isVerified: false,
    createdAt: '',
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && user.userType !== 'provider') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user && user.id && user.userType === 'provider') {
      fetchUserProfile();
    }
  }, [user, isLoading]);

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch(`/api/provider/profile?providerId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfile({
        firstName: data.profile.firstName || '',
        lastName: data.profile.lastName || '',
        email: data.profile.email || '',
        medicalLicenseNumber: data.profile.medicalLicenseNumber || '',
        workplaceName: data.profile.workplaceName || '',
        workPhone: data.profile.workPhone || '',
        specialty: data.profile.specialty || '',
        isVerified: data.profile.isVerified || false,
        createdAt: data.profile.createdAt || '',
      });
      setProfileError(null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError('Failed to load profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
    setProfileSuccess(null);
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoadingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      const response = await fetch('/api/provider/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: user.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          workplaceName: profile.workplaceName,
          workPhone: profile.workPhone,
          specialty: profile.specialty,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfileSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 pb-32">
        <div className="p-8 max-w-4xl">
          {/* Page Header with Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors"
            >
              <BackIcon />
              <span className="font-medium">Back to Settings</span>
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 pb-1">
              Edit Profile
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Manage and update your professional information</p>
          </div>

          {/* Profile Info Display Card */}
          <div className="mb-8 p-6 bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Account Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Email
                </p>
                <p className="text-base text-slate-900 dark:text-slate-100 font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Member Since
                </p>
                <p className="text-base text-slate-900 dark:text-slate-100 font-medium">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Verification Status
                </p>
                <p className="text-base font-medium">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    profile.isVerified 
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {profile.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Medical License
                </p>
                <p className="text-base text-slate-900 dark:text-slate-100 font-medium">{profile.medicalLicenseNumber}</p>
              </div>
            </div>
          </div>

          {/* Editable Fields Section */}
          <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Professional Information</h2>

            <div className="space-y-6">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Medical Specialty
                </label>
                <input
                  type="text"
                  value={profile.specialty}
                  onChange={(e) => handleProfileChange('specialty', e.target.value)}
                  placeholder="Enter your specialty"
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 dark:border-gray-700"></div>

              {/* Workplace Name and Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Workplace Name
                  </label>
                  <input
                    type="text"
                    value={profile.workplaceName}
                    onChange={(e) => handleProfileChange('workplaceName', e.target.value)}
                    placeholder="Enter your workplace"
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Work Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.workPhone}
                    onChange={(e) => handleProfileChange('workPhone', e.target.value)}
                    placeholder="Enter your work phone"
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Error and Success Messages */}
              {profileError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  <p className="font-medium">Error</p>
                  <p>{profileError}</p>
                </div>
              )}
              {profileSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                  <p className="font-medium">Success</p>
                  <p>{profileSuccess}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-gray-700">
                <PrimaryButton onClick={handleSaveProfile} disabled={isLoadingProfile}>
                  {isLoadingProfile ? 'Saving...' : 'Save Changes'}
                </PrimaryButton>
                <SecondaryButton onClick={() => router.back()}>
                  Cancel
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
