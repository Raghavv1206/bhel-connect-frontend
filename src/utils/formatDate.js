import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Format date consistently (e.g. "07 Jun 2026, 01:23 PM")
export const formatDate = (dateString, formatStr = 'dd MMM yyyy, hh:mm a') => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Get relative time from now (e.g. "3 hours ago", "just now")
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return dateString;
  }
};
