/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Clock Manager Module
 * One ticker, aligned to the second. It always updates the info clock
 * ('ui.clockTime'); while the canvas clock is shown it also updates the canvas
 * and the display window.
 */
import { formatClockTime } from '../utils/timeFormatter.js';
import appState from './appState.js';

let ticker = null;
let canvasClockVisible = false;
let deps = { canvasRenderer: null, ipcRenderer: null };

function getClockFormat() {
  return localStorage.getItem('clockFormat') || '24h';
}

function tick() {
  const timeString = formatClockTime(new Date(), getClockFormat());
  appState.set('ui.clockTime', timeString);

  if (canvasClockVisible) {
    deps.canvasRenderer?.setState({ clock: timeString });
    deps.ipcRenderer?.send('clock-update', { time: timeString, visible: true });
  }
}

function scheduleTick() {
  ticker = setTimeout(() => {
    tick();
    scheduleTick();
  }, 1000 - (Date.now() % 1000));
}

/**
 * Start the ticker (once)
 * @param {Object} dependencies
 * @param {Object} dependencies.canvasRenderer
 * @param {Object} dependencies.ipcRenderer
 */
export function startTicker(dependencies) {
  deps = dependencies;
  if (ticker) return;
  tick();
  scheduleTick();
}

/**
 * Canvas, display window and appState follow the visibility
 */
function setVisible(visible) {
  canvasClockVisible = visible;
  if (visible) tick();
  deps.canvasRenderer?.setState({ showClock: visible });
  deps.ipcRenderer?.send('toggle-clock-visibility', visible);
  appState.set('clock.visible', visible);
}

/**
 * Show the clock on the canvas and display window
 */
export function startClock() {
  setVisible(true);
}

/**
 * Hide the clock on the canvas and display window
 */
export function stopClock() {
  setVisible(false);
}
