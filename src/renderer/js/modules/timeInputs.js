/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Time Input Management
 * Functions for handling time input normalization and updates
 * /
 */
import { formatTime } from '../utils/timeFormatter.js';
import appState from './appState.js';

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
  
  // Manual time input = custom preset (null)
  appState.update({
    'timer.preset': null,
    'timer.totalTime': timeInSeconds * 1000,
    'timer.remainingTime': timeInSeconds * 1000,
    'timer.lastSetTime': timeInSeconds * 1000,
    'timer.hours': normalized.hours,
    'timer.minutes': normalized.minutes,
    'timer.seconds': normalized.seconds,
    'timer.percentage': 100,
    'timer.formattedTime': formatTime(timeInSeconds)
  });
  
  updateDisplay();
  sendStateUpdate();
}

/**
 * Add one minute to the timer
 * @param {Object} state - Timer state object
 * @param {Function} updateDisplay - Function to update display
 */
export function addMinute(state, updateDisplay) {
  // Don't allow adding time when stopped at zero (but allow when running)
  if (state.stoppedAtZero) {
    return;
  }
  
  // Add 60 seconds (1 minute) to remaining time
  state.setRemainingTime(state.remainingTime + 60);
  
  // Adjust totalTime: when not running, add the full amount;
  // when running, expand totalTime if remainingTime now exceeds it
  if (!state.running) {
    // If we're coming back from negative time, update totalTime appropriately
    const newRemainingTime = state.remainingTime;
    if (newRemainingTime > 0) {
      state.setTotalTime(Math.max(state.totalTime + 60, newRemainingTime));
      state.setLastSetTime(state.totalTime); // Update last set time for reset
      
      // Update input fields with the new positive time
      const hours = Math.floor(newRemainingTime / 3600);
      const minutes = Math.floor((newRemainingTime % 3600) / 60);
      const seconds = newRemainingTime % 60;
      
      document.getElementById("hours").value = hours;
      document.getElementById("minutes").value = minutes;
      document.getElementById("seconds").value = seconds;
    } else {
      // Still negative - keep inputs at 00:00:00
      document.getElementById("hours").value = 0;
      document.getElementById("minutes").value = 0;
      document.getElementById("seconds").value = 0;
    }
  } else if (state.remainingTime > state.totalTime) {
    // When running and added time pushes remaining past total,
    // expand totalTime so progress bar calculates correctly
    state.setTotalTime(state.remainingTime);
  }
  
  updateDisplay();
  
  // Update appState with new values for API consistency
  const formattedTime = formatTime(state.remainingTime);
  const updateData = {
    'timer.remainingTime': state.remainingTime * 1000,
    'timer.hours': Math.floor(Math.abs(state.remainingTime) / 3600),
    'timer.minutes': Math.floor((Math.abs(state.remainingTime) % 3600) / 60),
    'timer.seconds': Math.abs(state.remainingTime) % 60,
    'timer.formattedTime': formattedTime,
    'timer.percentage': state.totalTime > 0 ? Math.max(0, Math.min(100, Math.round((state.remainingTime / state.totalTime) * 100))) : 100
  };
  
  // Update totalTime when not running, or when running and totalTime was expanded
  if (!state.running) {
    updateData['timer.totalTime'] = state.totalTime * 1000;
    updateData['timer.lastSetTime'] = state.totalTime * 1000;
    updateData['timer.preset'] = null;
  } else if (state.remainingTime >= state.totalTime) {
    updateData['timer.totalTime'] = state.totalTime * 1000;
  }
  
  appState.update(updateData);
}

/**
 * Subtract one minute from the timer
 * @param {Object} state - Timer state object
 * @param {Function} updateDisplay - Function to update display
 */
export function subtractMinute(state, updateDisplay) {
  // Don't allow subtracting time when stopped at zero (but allow when running)
  if (state.stoppedAtZero) {
    return;
  }
  
  // Subtract 60 seconds (1 minute) from remaining time (allow negative values)
  state.setRemainingTime(state.remainingTime - 60);
  
  // Also update total time if timer is not running
  if (!state.running) {
    state.setTotalTime(Math.max(0, state.totalTime - 60)); // Keep totalTime non-negative for progress calculation
    state.setLastSetTime(state.totalTime); // Update last set time for reset
    
    // Update the input fields to reflect the change
    const currentMinutes = parseInt(document.getElementById("minutes").value) || 0;
    const currentHours = parseInt(document.getElementById("hours").value) || 0;
    const currentSeconds = parseInt(document.getElementById("seconds").value) || 0;
    
    // Calculate new time values
    let totalSeconds = (currentHours * 3600) + (currentMinutes * 60) + currentSeconds - 60;
    
    if (totalSeconds >= 0) {
      // Positive time - update inputs normally
      const newHours = Math.floor(totalSeconds / 3600);
      const newMinutes = Math.floor((totalSeconds % 3600) / 60);
      const newSecs = totalSeconds % 60;
      
      document.getElementById("hours").value = newHours;
      document.getElementById("minutes").value = newMinutes;
      document.getElementById("seconds").value = newSecs;
    } else {
      // Negative time - show 00:00:00 in inputs but keep negative remainingTime
      document.getElementById("hours").value = 0;
      document.getElementById("minutes").value = 0;
      document.getElementById("seconds").value = 0;
    }
  }
  
  updateDisplay();
  
  // Update appState with new values for API consistency
  const formattedTime = formatTime(state.remainingTime);
  const updateData = {
    'timer.remainingTime': state.remainingTime * 1000,
    'timer.hours': Math.floor(Math.abs(state.remainingTime) / 3600),
    'timer.minutes': Math.floor((Math.abs(state.remainingTime) % 3600) / 60),
    'timer.seconds': Math.abs(state.remainingTime) % 60,
    'timer.formattedTime': formattedTime,
    'timer.percentage': state.totalTime > 0 ? Math.max(0, Math.min(100, Math.round((state.remainingTime / state.totalTime) * 100))) : 100
  };
  
  // Only update totalTime and preset when timer is not running
  if (!state.running) {
    updateData['timer.totalTime'] = state.totalTime * 1000;
    updateData['timer.lastSetTime'] = state.totalTime * 1000;
    updateData['timer.preset'] = null;
  }
  
  appState.update(updateData);
}
