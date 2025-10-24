/**
 * Clock Manager Module
 * 
 * Manages the real-time clock display that can be toggled on/off.
 * Handles clock updates, starting/stopping the clock interval, and
 * synchronization with the display window.
 */

/**
 * Updates the clock display with current time
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Object} dependencies.ipcRenderer - IPC renderer for sending updates
 */
export function updateClock({ canvasRenderer, ipcRenderer }) {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const timeString = `${h}:${m}:${s}`;
  
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
  // First update
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
