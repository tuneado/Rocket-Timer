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

// Cached threshold settings to avoid IPC on every tick  
let _cachedThresholdSettings = null;
let _thresholdCacheTime = 0;
const THRESHOLD_CACHE_TTL = 5000; // Refresh cache every 5 seconds

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
  
  // Use cached settings when available, refresh periodically
  const now = Date.now();
  if (!_cachedThresholdSettings || (now - _thresholdCacheTime) > THRESHOLD_CACHE_TTL) {
    if (window.electron && window.electron.settings) {
      try {
        _cachedThresholdSettings = await window.electron.settings.getAll();
        _thresholdCacheTime = now;
      } catch (error) {
        console.warn('Could not load threshold settings:', error);
        if (!_cachedThresholdSettings) _cachedThresholdSettings = {};
      }
    } else {
      _cachedThresholdSettings = {};
    }
  }
  
  const settings = _cachedThresholdSettings;
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
 * Invalidate the cached threshold settings (call when settings change)
 */
export function invalidateThresholdCache() {
  _cachedThresholdSettings = null;
  _thresholdCacheTime = 0;
}

/**
 * End time as shown on screen, in the user's clock format
 */
function formatEndTime(endAt) {
  if (!endAt) return '--:--:--';
  return new Date(endAt).toLocaleTimeString('en-US', {
    hour12: (localStorage.getItem('clockFormat') || '24h') === '12h',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Update display with current timer state (from the timer engine)
 * @returns {Object} Calculated values (progressPercent, warningLevel) for reuse
 */
export function updateDisplay(timerState, { canvasRenderer, ipcRenderer }) {
  const remainingTimeMs = timerState.remainingTimeMs;
  const totalTimeMs = timerState.totalTimeMs;
  const formattedTime = formatTime(timerState.remainingTime);
  const progressPercent = calculateProgress(remainingTimeMs, totalTimeMs);

  // Real running time (unaffected by +/- adjustments); hidden until the timer has run
  const elapsedDisplay = timerState.started ? formatElapsedTime(timerState.elapsedMs / 1000) : '--:--:--';
  const endTimeDisplay = formatEndTime(timerState.endAt);
  const warningLevel = timerState.warningLevel;

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
      remainingTime: remainingTimeMs,
      totalTime: totalTimeMs
    });
  }

  // Send updates to display window
  if (window.electron && ipcRenderer) {
    ipcRenderer.send('timer-update', {
      formattedTime,
      progressPercent,
      warningLevel,
      remainingPercent: progressPercent,
      elapsed: elapsedDisplay,
      endTime: endTimeDisplay,
      remainingTime: remainingTimeMs,
      totalTime: totalTimeMs
    });
  }

  return { progressPercent, warningLevel, endTimeDisplay };
}

/**
 * Mirror the timer into appState (UI components, status bar, and the
 * non-timer state the API server receives)
 */
export function sendStateUpdate(timerState, { canvasRenderer }) {
  const remainingTime = timerState.remainingTime;
  const absTime = Math.abs(remainingTime);

  appState.update({
    'timer.running': timerState.running,
    'timer.paused': timerState.paused,
    'timer.remainingTime': timerState.remainingTimeMs,
    'timer.totalTime': timerState.totalTimeMs,
    'timer.lastSetTime': timerState.lastSetTime * 1000,
    'timer.elapsedTime': Math.max(0, Math.floor(timerState.elapsedMs / 1000)),
    'timer.hours': Math.floor(absTime / 3600),
    'timer.minutes': Math.floor((absTime % 3600) / 60),
    'timer.seconds': absTime % 60,
    'timer.percentage': calculateProgress(timerState.remainingTimeMs, timerState.totalTimeMs),
    'timer.formattedTime': formatTime(remainingTime),
    'timer.warningLevel': timerState.warningLevel,
    'timer.endTimeFormatted': formatEndTime(timerState.endAt),
    'timer.preset': timerState.preset,
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
