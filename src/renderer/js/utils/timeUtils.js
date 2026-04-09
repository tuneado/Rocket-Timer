/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Time Utility Functions
 * Centralized time formatting and calculation utilities
 * /
 */
export class TimeUtils {
  /**
   * Format seconds into HH:MM:SS string
   * @param {number} totalSeconds - Total seconds to format
   * @param {boolean} allowNegative - Whether to show negative time
   * @returns {string} Formatted time string
   */
  static formatTime(totalSeconds, allowNegative = false) {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    
    const formatted = [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0')
    ].join(':');
    
    return (isNegative && allowNegative) ? `-${formatted}` : formatted;
  }

  /**
   * Parse time inputs into total seconds
   * @param {number} hours - Hours value
   * @param {number} minutes - Minutes value
   * @param {number} seconds - Seconds value
   * @returns {number} Total seconds
   */
  static parseTime(hours = 0, minutes = 0, seconds = 0) {
    return (hours * 3600) + (minutes * 60) + seconds;
  }

  /**
   * Calculate end time from current time and duration
   * @param {number} durationSeconds - Duration in seconds
   * @returns {Object} Object with Date and formatted string
   */
  static calculateEndTime(durationSeconds) {
    const now = new Date();
    const endTime = new Date(now.getTime() + (durationSeconds * 1000));
    const formatted = endTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    return { date: endTime, formatted };
  }

  /**
   * Calculate progress percentage
   * @param {number} remaining - Remaining seconds
   * @param {number} total - Total seconds
   * @returns {number} Progress percentage (0-100)
   */
  static getProgress(remaining, total) {
    if (total === 0) return 0;
    const progress = ((total - remaining) / total) * 100;
    return Math.max(0, Math.min(100, progress));
  }

  /**
   * Format duration for display (e.g., "5 minutes", "1 hour 30 minutes")
   * @param {number} seconds - Duration in seconds
   * @returns {string} Human-readable duration
   */
  static humanizeDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (secs > 0 && hours === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
    
    return parts.join(' ') || '0 seconds';
  }

  /**
   * Validate time input values
   * @param {number} hours - Hours value
   * @param {number} minutes - Minutes value
   * @param {number} seconds - Seconds value
   * @returns {Object} Validation result with isValid and message
   */
  static validateTime(hours, minutes, seconds) {
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      return { isValid: false, message: 'Time values must be numbers' };
    }
    
    if (hours < 0 || minutes < 0 || seconds < 0) {
      return { isValid: false, message: 'Time values cannot be negative' };
    }
    
    if (hours > 99) {
      return { isValid: false, message: 'Hours cannot exceed 99' };
    }
    
    if (minutes > 59 || seconds > 59) {
      return { isValid: false, message: 'Minutes and seconds must be between 0-59' };
    }
    
    return { isValid: true };
  }
}
