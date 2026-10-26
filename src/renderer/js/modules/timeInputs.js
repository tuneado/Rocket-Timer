/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Time Input Management
 * Normalizes the hours/minutes/seconds inputs
 * /
 */
/**
 * Normalize time inputs (handle overflow of seconds/minutes)
 * @returns {Object} Normalized time values {hours, minutes, seconds}
 */
export function normalizeTimeInputs() {
  const hoursInput = document.getElementById("hours");
  const minutesInput = document.getElementById("minutes");
  const secondsInput = document.getElementById("seconds");
  
  let h = parseInt(hoursInput.value) || 0;
  let m = parseInt(minutesInput.value) || 0;
  let s = parseInt(secondsInput.value) || 0;
  
  // Normalize seconds (carry over to minutes)
  if (s >= 60) {
    const extraMinutes = Math.floor(s / 60);
    m += extraMinutes;
    s = s % 60;
  }
  
  // Normalize minutes (carry over to hours)
  if (m >= 60) {
    const extraHours = Math.floor(m / 60);
    h += extraHours;
    m = m % 60;
  }
  
  // Update the input fields with normalized values
  hoursInput.value = h.toString().padStart(2, '0');
  minutesInput.value = m.toString().padStart(2, '0');
  secondsInput.value = s.toString().padStart(2, '0');
  
  return { hours: h, minutes: m, seconds: s };
}

/**
 * Update timer state from input fields
 * @param {Object} state - Timer state object with setters
 * @param {Function} updateDisplay - Function to update display
 * @param {Function} sendStateUpdate - Function to send state to companion API
 */
