export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatInterval(scheduledDays: number, dueTimestamp?: number): string {
  if (dueTimestamp) {
    const diffMs = dueTimestamp - Date.now();
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 60 && diffMins > 0) {
      return `${diffMins}m`;
    }
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 24 && diffHours > 0) {
      return `${diffHours}h`;
    }
  }

  if (scheduledDays <= 0) return '<1d';
  if (scheduledDays === 1) return '1d';
  if (scheduledDays < 30) return `${Math.round(scheduledDays)}d`;
  if (scheduledDays < 365) return `${Math.round(scheduledDays / 30)}mo`;
  return `${(scheduledDays / 365).toFixed(1)}y`;
}

export function getStartOfDay(timestamp = Date.now()): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getEndOfDay(timestamp = Date.now()): number {
  const d = new Date(timestamp);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function getDaysAgo(days: number): number {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
