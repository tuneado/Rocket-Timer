/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Display Manager Module
 * Manages display updates for both canvas and external display window:
 * - Updates canvas renderer with current timer state
 * - Syncs state to companion server for API/Socket.IO
 * - Handles layout changes
 * /
 */
import { formatTime, formatElapsedTime } from '../utils/timeFormatter.js';
import appState from './appState.js';

/**
 * Calculate progress percentage (unified calculation to prevent inconsistencies)
 * @param {number} remainingTime - Remaining time in milliseconds
 * @param {number} totalTime - Total time in milliseconds
 * @returns {number} Progress percentage (0-100) with 1 decimal place
 */
function calculateProgress(remainingTime, totalTime) {
  // Use one decimal place for smoother visual animation
  // This allows the progress bar to update more smoothly between timer ticks
  // Clamp to 0-100 range (remainingTime can briefly exceed totalTime after adding time)
  const progress = totalTime > 0 ? Math.max(0, Math.min(100, Math.round((remainingTime / totalTime) * 1000) / 10)) : 0;
  
  return progress;
}

/**
 * Calculate warning level based on settings
 * This is the SINGLE SOURCE OF TRUTH for warning level calculations
 * @param {number} remainingTime - Remaining time in seconds
 * @param {number} totalTime - Total time in seconds
 * @returns {Promise<string>} Warning level: 'normal', 'warning', 'critical', or 'overtime'
 */
export async function calculateWarningLevel(remainingTime, totalTime) {
  if (remainingTime < 0) return 'overtime';
  if (totalTime === 0) return 'normal';
  
  // Get threshold settings
  let settings = {};
  if (window.electron && window.electron.settings) {
    try {
      settings = await window.electron.settings.getAll();
    } catch (error) {
      console.warn('Could not load threshold settings:', error);
    }
  }
  
  const thresholdType = settings.timerThresholdType || 'percentage';
  
  if (thresholdType === 'percentage') {
    const warningPercentage = settings.warningPercentage || 30;
    const criticalPercentage = settings.criticalPercentage || 5;
    const remainingPercentage = (remainingTime / totalTime) * 100;
    
    if (remainingPercentage > warningPercentage) return 'normal';
    if (remainingPercentage > criticalPercentage) return 'warning';
    return 'critical';
  } else {
    // Time-based thresholds
    const warningTimeMinutes = settings.warningTimeMinutes || 2;
    const warningTimeSeconds = settings.warningTimeSeconds || 0;
    const criticalTimeMinutes = settings.criticalTimeMinutes || 0;
    const criticalTimeSeconds = settings.criticalTimeSeconds || 30;
    
    const warningTimeTotal = (warningTimeMinutes * 60) + warningTimeSeconds;
    const criticalTimeTotal = (criticalTimeMinutes * 60) + criticalTimeSeconds;
    
    if (remainingTime > warningTimeTotal) return 'normal';
    if (remainingTime > criticalTimeTotal) return 'warning';
    return 'critical';
  }
}

/**
 * Update display with current timer state
 * @returns {Object} Calculated values (progressPercent, warningLevel) for reuse
 */
export async function updateDisplay(timerState, { canvasRenderer, ipcRenderer }) {
  // Use millisecond values for precise progress calculation
  const remainingTimeMs = timerState.remainingTimeMs;
  const totalTimeMs = timerState.totalTimeMs;
  const remainingTime = timerState.remainingTime; // Seconds for formatting
  const totalTime = timerState.totalTime; // Seconds for warnings
  const formattedTime = formatTime(remainingTime);
  
  // Calculate progress using unified function with millisecond precision
  const progressPercent = calculateProgress(remainingTimeMs, totalTimeMs);
  
  // Calculate elapsed time based on actual wall clock time (unaffected by +/- adjustments)
  let elapsedSeconds = 0;
  let elapsedDisplay;
  
  if (totalTime === 0 || (!timerState.running && remainingTime === totalTime)) {
    // No timer set or timer not started
    elapsedDisplay = '--:--:--';
  } else if (timerState.running && timerState.actualStartTimestamp > 0) {
    // Timer is running: calculate from actual start time
    const currentElapsed = (Date.now() - timerState.actualStartTimestamp) + timerState.pausedElapsedTime;
    elapsedSeconds = currentElapsed / 1000;
    const formattedElapsed = formatElapsedTime(Math.abs(elapsedSeconds));
    elapsedDisplay = elapsedSeconds >= 0 ? formattedElapsed : `-${formattedElapsed}`;
  } else {
    // Timer paused: use saved elapsed time
    elapsedSeconds = timerState.pausedElapsedTime / 1000;
    const formattedElapsed = formatElapsedTime(Math.abs(elapsedSeconds));
    elapsedDisplay = elapsedSeconds >= 0 ? formattedElapsed : `-${formattedElapsed}`;
  }
  
  // Get end time from appState 
  const endTimeDisplay = appState.get('timer.endTimeFormatted') || '--:--:--';
  
  // Update timer information display elements (exclude clock - handled by clockManager)
  const timerValueEl = document.getElementById('timerValue');
  const elapsedTimeEl = document.getElementById('elapsedTime');
  const endsAtTimeEl = document.getElementById('endsAtTime');

  if (timerValueEl) timerValueEl.textContent = formattedTime;
  if (elapsedTimeEl) elapsedTimeEl.textContent = elapsedDisplay;
  if (endsAtTimeEl) endsAtTimeEl.textContent = endTimeDisplay;
  
  // Update canvas renderer
  if (canvasRenderer) {
    canvasRenderer.setState({
      countdown: formattedTime,
      progress: progressPercent,
      elapsed: elapsedDisplay,
      endTime: endTimeDisplay,
      remainingTime: remainingTimeMs, // Already in milliseconds
      totalTime: totalTimeMs // Already in milliseconds
    });
  }

  // Calculate warning level using dynamic thresholds
  const warningLevel = await calculateWarningLevel(remainingTime, totalTime);

  // Send updates to display window
  if (window.electron && ipcRenderer) {
    ipcRenderer.send('timer-update', {
      formattedTime,
      progressPercent,
      warningLevel,
      remainingPercent: progressPercent, // Use same value for consistency
      elapsed: elapsedDisplay,
      endTime: endTimeDisplay,
      remainingTime: remainingTimeMs, // Already in milliseconds
      totalTime: totalTimeMs // Already in milliseconds
    });
  }
  
  // Return calculated values for potential reuse
  return { progressPercent, warningLevel };
}

/**
 * Sends state update to companion server
 * @param {Object} timerState - Timer state wrapper
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Object} dependencies.ipcRenderer - IPC renderer for sending updates
 * @param {Object} cachedValues - Optional pre-calculated values from updateDisplay to avoid recalculation
 */
export async function sendStateUpdate(timerState, { canvasRenderer, ipcRenderer }, cachedValues = null) {
  if (!window.electron || !ipcRenderer) return;
  
  const remainingTime = timerState.remainingTime;
  const totalTime = timerState.totalTime;
  const running = timerState.running;
  
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;
  const formattedTime = formatTime(remainingTime);
  
  // Use cached values if available, otherwise calculate
  const progressPercent = cachedValues?.progressPercent ?? calculateProgress(remainingTime, totalTime);
  const warningLevel = cachedValues?.warningLevel ?? await calculateWarningLevel(remainingTime, totalTime);

  // Compute real elapsed time from wall clock (unaffected by time adjustments)
  let elapsedSeconds = 0
  if (running && timerState.actualStartTimestamp > 0) {
    elapsedSeconds = Math.floor((timerState.pausedElapsedTime + (Date.now() - timerState.actualStartTimestamp)) / 1000)
  } else if (timerState.pausedElapsedTime > 0) {
    elapsedSeconds = Math.floor(timerState.pausedElapsedTime / 1000)
  }

  // Update appState instead of sending direct IPC - let appState subscription handle API updates
  appState.update({
    'timer.running': running,
    'timer.paused': !running && remainingTime < totalTime && remainingTime > 0,
    'timer.remainingTime': remainingTime * 1000, // Convert to milliseconds for appState
    'timer.totalTime': totalTime * 1000,
    'timer.elapsedTime': elapsedSeconds,
    'timer.hours': hours,
    'timer.minutes': minutes,
    'timer.seconds': seconds,
    'timer.percentage': progressPercent,
    'timer.formattedTime': formattedTime,
    'timer.warningLevel': warningLevel,
    'layout.current': canvasRenderer ? canvasRenderer.layout.name : 'detailed'
  });
}

/**
 * Changes canvas layout by ID
 * @param {string} layoutId - The layout ID to switch to
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Function} dependencies.LayoutRegistry - Layout registry for getting layouts
 * @param {Function} dependencies.getElementById - Function to get DOM elements
 */
export function changeLayout(layoutId, { canvasRenderer, LayoutRegistry, getElementById, ipcRenderer }) {
  if (canvasRenderer) {
    const layout = LayoutRegistry.getLayout(layoutId);
    if (layout) {
      canvasRenderer.setLayout(layout);
      
      // Update appState
      appState.update({
        'layout.previous': appState.get('layout.current'),
        'layout.current': layoutId
      });
      
      // Update layout selector if it exists
      const layoutSelector = getElementById('layoutSelector');
      if (layoutSelector) {
        layoutSelector.value = layoutId;
      }
      
      // Save to localStorage
      localStorage.setItem('canvasLayout', layoutId);
      
      // Notify main process so the external display window gets updated
      if (window.electron && ipcRenderer) {
        ipcRenderer.send('layout-changed', layoutId);
      }
      
      console.log('Layout changed to:', layout.name);
    }
  }
}
