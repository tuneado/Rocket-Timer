/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Display Manager Module
 * Pushes the timer engine's state to the canvas, the display window and
 * appState (UI components and the API server), and switches layouts.
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
 * Update the preview with current timer state (from the timer engine);
 * the external display mirrors the preview (displaySync.js)
 * @returns {Object} Calculated values (progressPercent, warningLevel) for reuse
 */
export function updateDisplay(timerState, { canvasRenderer }) {
  const remainingTimeMs = timerState.remainingTimeMs;
  const totalTimeMs = timerState.totalTimeMs;
  const formattedTime = formatTime(timerState.remainingTime);
  const progressPercent = calculateProgress(remainingTimeMs, totalTimeMs);

  // Real running time (unaffected by +/- adjustments); hidden until the timer has run
  const elapsedDisplay = timerState.started ? formatElapsedTime(timerState.elapsedMs / 1000) : '--:--:--';
  const endTimeDisplay = formatEndTime(timerState.endAt);
  const warningLevel = timerState.warningLevel;

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

  return { progressPercent, warningLevel, endTimeDisplay };
}

/**
 * Mirror the timer into appState (UI components, status bar, and the
 * non-timer state the API server receives)
 */
export function sendStateUpdate(timerState) {
  const remainingTime = timerState.remainingTime;
  const absTime = Math.abs(remainingTime);

  appState.update({
    'timer.running': timerState.running,
    'timer.paused': timerState.paused,
    'timer.stoppedAtZero': timerState.stoppedAtZero,
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
    'timer.elapsedFormatted': timerState.started ? formatElapsedTime(timerState.elapsedMs / 1000) : '--:--:--',
    'timer.preset': timerState.preset
  });
}

/**
 * Switch the canvas (and, through the main process, the display window) to a layout
 * @returns {Object|null} the layout, or null if there is none with that id
 */
export function changeLayout(layoutId, { canvasRenderer, LayoutRegistry, ipcRenderer }) {
  const layout = LayoutRegistry.getLayout(layoutId);
  if (!canvasRenderer || !layout) return null;

  canvasRenderer.setLayout(layout);
  appState.update({
    'layout.previous': appState.get('layout.current'),
    'layout.current': layoutId
  });
  localStorage.setItem('canvasLayout', layoutId);
  ipcRenderer.send('layout-changed', layoutId);
  return layout;
}
