/**
 * Hook: useBadges
 * Manages badge state and checking for newly earned badges
 */

import { useEffect, useState, useCallback } from 'react';

export function useBadges() {
  const [badges, setBadges] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    earned: 0,
    locked: 0,
    progressPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  /**
   * Fetch all badges for the user
   */
  const fetchBadges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/patient/achievements', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }

      const data = await response.json();

      if (data.success) {
        setBadges(data.data.badges);
        setStats(data.data.stats);
      } else {
        setError(data.error || 'Failed to fetch badges');
      }
    } catch (err) {
      console.error('Error fetching badges:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check for new badges and award them
   */
  const checkForNewBadges = useCallback(async () => {
    try {
      const response = await fetch('/api/patient/check-badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check for new badges');
      }

      const data = await response.json();

      if (data.success && data.data.newBadges.length > 0) {
        // Set new badges to trigger notification
        setNewBadges(data.data.newBadges);

        // Refetch badges to update the list
        await fetchBadges();

        return data.data.newBadges;
      }

      return [];
    } catch (err) {
      console.error('Error checking for new badges:', err);
      return [];
    }
  }, [fetchBadges]);

  /**
   * Clear the new badges notification
   */
  const clearNewBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  // Fetch badges on mount
  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return {
    badges,
    stats,
    isLoading,
    error,
    newBadges,
    fetchBadges,
    checkForNewBadges,
    clearNewBadges,
  };
}

/**
 * Hook: useBadgeMonitor
 * Monitors user actions and checks for newly earned badges
 */
export function useBadgeMonitor() {
  const { checkForNewBadges, newBadges, clearNewBadges } = useBadges();
  const [awardedBadges, setAwardedBadges] = useState([]);

  /**
   * Trigger badge check (typically after user action)
   */
  const triggerBadgeCheck = useCallback(async () => {
    const awarded = await checkForNewBadges();
    if (awarded.length > 0) {
      setAwardedBadges(awarded);
    }
  }, [checkForNewBadges]);

  /**
   * Clear awarded badge from display
   */
  const dismissBadge = useCallback((index = 0) => {
    setAwardedBadges((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    awardedBadges,
    triggerBadgeCheck,
    dismissBadge,
  };
}
