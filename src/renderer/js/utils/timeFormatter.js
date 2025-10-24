/**
 * Time Formatting Utilities
 * Pure functions for formatting time values - no state or DOM dependencies
 */

/**
 * Format seconds into HH:MM:SS string
 * @param {number} sec - Time in seconds (can be negative)
 * @returns {string} Formatted time string (e.g., "01:23:45" or "-00:05:30")
 */
export function formatTime(sec) {
  const isNegative = sec < 0;
  const absSec = Math.abs(sec);
  const h = String(Math.floor(absSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((absSec % 3600) / 60)).padStart(2, "0");
  const s = String(absSec % 60).padStart(2, "0");
  return `${isNegative ? '-' : ''}${h}:${m}:${s}`;
}
