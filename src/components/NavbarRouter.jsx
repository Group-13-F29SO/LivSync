'use client';

import { useAuth } from '@/hooks/useAuth';
import PatientFloatingNav from './FloatingBottomNav/PatientFloatingNav';
import ProviderFloatingNav from './Provider/ProviderFloatingNav';

export default function NavbarRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Show provider navbar for providers
  if (user && user.userType === 'provider') {
    return <ProviderFloatingNav />;
  }

  // Show patient navbar for patients
  if (user && user.userType !== 'provider') {
    return <PatientFloatingNav />;
  }

  return null;
}
