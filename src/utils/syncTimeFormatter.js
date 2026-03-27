/**
 * Format relative time since last sync
 * @param {Date|string|null} lastSyncTime - The last sync timestamp
 * @returns {string} Formatted time string (e.g., "5 minutes ago", "2 hours ago")
 */
export function getRelativeSyncTime(lastSyncTime) {
  if (!lastSyncTime) {
    return 'Never synced';
  }

  const lastSyncDate = new Date(lastSyncTime);
  const now = new Date();
  const diffMs = now - lastSyncDate;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  // For older dates, show the actual date
  return lastSyncDate.toLocaleDateString();
}
