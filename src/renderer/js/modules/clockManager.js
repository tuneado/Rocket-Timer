/**
 * Clock Manager Module
 * 
 * Manages the real-time clock display that can be toggled on/off.
 * Handles clock updates, starting/stopping the clock interval, and
 * synchronization with the display window.
 */

import { formatClockTime } from '../utils/timeFormatter.js';

// Lightweight DOM-only clock interval (runs when main canvas clock disabled)
let infoClockInterval = null;

function updateInfoClockDom() {
  const clockTimeEl = document.getElementById('clockTime');
  if (!clockTimeEl) return;
  const now = new Date();
  // Align to chosen format
  const timeString = formatClockTime(now, getClockFormat());
  clockTimeEl.textContent = timeString;
}

export function startInfoClock() {
  if (infoClockInterval) return; // Already running
  // Initial paint
  updateInfoClockDom();
  infoClockInterval = setTimeout(function tick() {
    updateInfoClockDom();
    // Schedule next tick aligned roughly to the next second boundary
    const now = new Date();
    const delay = 1000 - now.getMilliseconds();
    infoClockInterval = setTimeout(tick, delay);
  }, 1000);
}

export function stopInfoClock() {
  if (infoClockInterval) {
    clearTimeout(infoClockInterval);
    infoClockInterval = null;
  }
}

/**
 * Get clock format from localStorage (with fallback to 24h)
 * @returns {string} Clock format ('12h' or '24h')
 */
function getClockFormat() {
  return localStorage.getItem('clockFormat') || '24h';
}

/**
 * Updates the clock display with current time
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Object} dependencies.ipcRenderer - IPC renderer for sending updates
 */
export function updateClock({ canvasRenderer, ipcRenderer }) {
  const now = new Date();
  const clockFormat = getClockFormat();
  const timeString = formatClockTime(now, clockFormat);
  
  // Always update card DOM (covers both info + main clock modes)
  const clockTimeEl = document.getElementById('clockTime');
  if (clockTimeEl) {
    clockTimeEl.textContent = timeString;
  }
  
  // Update canvas renderer
  if (canvasRenderer) {
    canvasRenderer.setState({ clock: timeString });
  }
  
  // Send clock update to display window
  if (window.electron && ipcRenderer) {
    ipcRenderer.send('clock-update', { time: timeString, visible: true });
  }
}

/**
 * Starts the clock interval and shows the clock
 * @param {Object} clockState - Clock state object with getters/setters
 * @param {Function} clockState.getInterval - Get current clock interval
 * @param {Function} clockState.setInterval - Set clock interval
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Object} dependencies.ipcRenderer - IPC renderer for sending updates
 * @param {Function} dependencies.updateDisplay - Function to force display redraw
 */
export function startClock(clockState, { canvasRenderer, ipcRenderer, updateDisplay }) {
  // Stop lightweight info clock (avoid duplicate DOM updates)
  stopInfoClock();
  // First update for canvas/display
  updateClock({ canvasRenderer, ipcRenderer });
  
  // Start interval
  const interval = setInterval(() => {
    updateClock({ canvasRenderer, ipcRenderer });
  }, 1000);
  clockState.setInterval(interval);
  
  // Update canvas renderer
  if (canvasRenderer) {
    canvasRenderer.setState({ showClock: true });
    if (updateDisplay) {
      updateDisplay(); // Force immediate redraw
    }
  }
  
  localStorage.setItem("clock", "on");
  
  // Update menu state
  if (window.electron && ipcRenderer) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    ipcRenderer.send('update-menu-states', currentTheme, true);
  }
}

/**
 * Stops the clock interval and hides the clock
 * @param {Object} clockState - Clock state object with getters/setters
 * @param {Function} clockState.getInterval - Get current clock interval
 * @param {Function} clockState.setInterval - Set clock interval
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Object} dependencies.ipcRenderer - IPC renderer for sending updates
 */
export function stopClock(clockState, { canvasRenderer, ipcRenderer }) {
  const interval = clockState.getInterval();
  if (interval) {
    clearInterval(interval);
    clockState.setInterval(null);
  }
  // Resume lightweight DOM-only clock
  startInfoClock();
  
  // Update canvas renderer
  if (canvasRenderer) {
    canvasRenderer.setState({ showClock: false });
  }
  
  localStorage.setItem("clock", "off");
  
  // Update menu state
  if (window.electron && ipcRenderer) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    ipcRenderer.send('update-menu-states', currentTheme, false);
  }
}
