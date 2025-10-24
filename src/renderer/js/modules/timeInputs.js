/**
 * Time Input Management
 * Functions for handling time input normalization and updates
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
export function updateTimeFromInputs(state, updateDisplay, sendStateUpdate) {
  const normalized = normalizeTimeInputs();
  const timeInSeconds = normalized.hours * 3600 + normalized.minutes * 60 + normalized.seconds;
  
  state.setTotalTime(timeInSeconds);
  state.setRemainingTime(timeInSeconds);
  
  updateDisplay();
  sendStateUpdate();
}

/**
 * Add one minute to the timer
 * @param {Object} state - Timer state object
 * @param {Function} updateDisplay - Function to update display
 */
export function addMinute(state, updateDisplay) {
  // Add 60 seconds (1 minute) to remaining time
  state.setRemainingTime(state.remainingTime + 60);
  
  // Also update total time if timer is not running (so progress bar works correctly)
  if (!state.running) {
    state.setTotalTime(state.totalTime + 60);
    // Update the minutes input field to reflect the change
    const currentMinutes = parseInt(document.getElementById("minutes").value) || 0;
    document.getElementById("minutes").value = currentMinutes + 1;
  }
  
  updateDisplay();
}

/**
 * Subtract one minute from the timer
 * @param {Object} state - Timer state object
 * @param {Function} updateDisplay - Function to update display
 */
export function subtractMinute(state, updateDisplay) {
  // Don't allow going below 0
  if (state.remainingTime <= 60) {
    state.setRemainingTime(0);
    if (!state.running) {
      state.setTotalTime(0);
      document.getElementById("minutes").value = 0;
      document.getElementById("hours").value = 0;
      document.getElementById("seconds").value = 0;
    }
  } else {
    // Subtract 60 seconds (1 minute) from remaining time
    state.setRemainingTime(state.remainingTime - 60);
    
    // Also update total time if timer is not running
    if (!state.running) {
      state.setTotalTime(state.totalTime - 60);
      // Update the minutes input field to reflect the change
      const currentMinutes = parseInt(document.getElementById("minutes").value) || 0;
      if (currentMinutes > 0) {
        document.getElementById("minutes").value = currentMinutes - 1;
      }
    }
  }
  
  updateDisplay();
}
