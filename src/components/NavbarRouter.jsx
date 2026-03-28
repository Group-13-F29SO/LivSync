'use client';

import { useAuth } from '@/hooks/useAuth';
import PatientFloatingNav from './FloatingBottomNav/PatientFloatingNav';
import ProviderFloatingNav from './Provider/ProviderFloatingNav';
import AdminFloatingNav from './Admin/AdminFloatingNav';

export default function NavbarRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Show admin navbar for admins
  if (user && user.role === 'admin') {
    return <AdminFloatingNav />;
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
