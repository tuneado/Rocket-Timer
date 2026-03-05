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
  const absSec = Math.abs(Math.floor(sec)); // Ensure integer seconds for proper formatting
  const h = String(Math.floor(absSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((absSec % 3600) / 60)).padStart(2, "0");
  const s = String(absSec % 60).padStart(2, "0");
  return `${isNegative ? '-' : ''}${h}:${m}:${s}`;
}

/**
 * Format elapsed time with seconds (replaces formatTimeNoSeconds)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time as HH:MM:SS
 */
export function formatElapsedTime(seconds) {
  if (seconds < 0) return '--:--:--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format current time for clock display
 * @param {Date} date - Date object
 * @param {string} format - '12h' or '24h' format
 * @returns {string} Formatted time string
 */
export function formatClockTime(date, format = '24h') {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  let ampm = '';
  
  if (format === '12h') {
    ampm = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12;
    if (hours === 0) hours = 12; // Convert 0 to 12 for 12-hour format
  }
  
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');
  
  return `${h}:${m}:${s}${ampm}`;
}
