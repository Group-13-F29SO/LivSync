'use client';

import { useEffect } from 'react';

/**
 * Hook to force light mode on specific pages (login, signup)
 * This prevents dark mode from being applied when users navigate to these pages
 * even if they had dark mode enabled previously
 */
export function useForceLightMode() {
  useEffect(() => {
    // Remove dark class from html element
    document.documentElement.classList.remove('dark');
    
    // Cleanup: restore the previous theme preference when leaving the page
    return () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);
}
