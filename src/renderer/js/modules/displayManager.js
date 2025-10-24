/**
 * Display Manager Module
 * 
 * Manages display updates for both canvas and external display window:
 * - Updates canvas renderer with current timer state
 * - Syncs state to companion server for API/Socket.IO
 * - Handles layout changes
 */

import { formatTime } from '../utils/timeFormatter.js';

/**
 * Updates the display with current timer state
 * @param {Object} timerState - Timer state object
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Object} dependencies.ipcRenderer - IPC renderer for sending updates
 */
export function updateDisplay(timerState, { canvasRenderer, ipcRenderer }) {
  const remainingTime = timerState.remainingTime;
  const totalTime = timerState.totalTime;
  const formattedTime = formatTime(remainingTime);
  
  console.log('updateDisplay called - remainingTime:', remainingTime, 'formatted:', formattedTime);
  
  // Progress bar should go from 100% (full) to 0% (empty) as time runs down
  const progressPercent = totalTime > 0 ? (remainingTime / totalTime * 100) : 0;
  
  // Calculate elapsed time (can go negative if timer exceeds set time)
  const elapsedSeconds = totalTime - remainingTime;
  const formattedElapsed = formatTime(Math.abs(elapsedSeconds));
  const elapsedDisplay = elapsedSeconds >= 0 ? formattedElapsed : `-${formattedElapsed}`;
  
  // Update canvas renderer
  if (canvasRenderer) {
    canvasRenderer.setState({
      countdown: formattedTime,
      progress: progressPercent,
      elapsed: elapsedDisplay
    });
  }

  // Send updates to display window
  if (window.electron && ipcRenderer) {
    ipcRenderer.send('timer-update', {
      formattedTime,
      progressPercent,
      elapsed: elapsedDisplay
    });
  }
}

/**
 * Sends state update to companion server
 * @param {Object} timerState - Timer state object
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Object} dependencies.ipcRenderer - IPC renderer for sending updates
 */
export function sendStateUpdate(timerState, { canvasRenderer, ipcRenderer }) {
  if (!window.electron || !ipcRenderer) return;
  
  const remainingTime = timerState.remainingTime;
  const totalTime = timerState.totalTime;
  const running = timerState.running;
  
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;
  const formattedTime = formatTime(remainingTime);
  const progressPercent = totalTime > 0 ? Math.round((remainingTime / totalTime) * 100) : 0;
  
  const state = {
    running,
    paused: !running && remainingTime < totalTime && remainingTime > 0,
    timeRemaining: remainingTime,
    totalTime,
    hours,
    minutes,
    seconds,
    percentage: progressPercent,
    formattedTime,
    layout: canvasRenderer ? canvasRenderer.layout.name : 'detailed',
    preset: 'custom'
  };
  
  ipcRenderer.send('companion-state-update', state);
}

/**
 * Changes canvas layout by ID
 * @param {string} layoutId - The layout ID to switch to
 * @param {Object} dependencies - Required dependencies
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Function} dependencies.LayoutRegistry - Layout registry for getting layouts
 * @param {Function} dependencies.getElementById - Function to get DOM elements
 */
export function changeLayout(layoutId, { canvasRenderer, LayoutRegistry, getElementById }) {
  if (canvasRenderer) {
    const layout = LayoutRegistry.getLayout(layoutId);
    if (layout) {
      canvasRenderer.setLayout(layout);
      
      // Update layout selector if it exists
      const layoutSelector = getElementById('layoutSelector');
      if (layoutSelector) {
        layoutSelector.value = layoutId;
      }
      
      // Save to localStorage
      localStorage.setItem('canvasLayout', layoutId);
      
      console.log('Layout changed to:', layout.name);
    }
  }
}
