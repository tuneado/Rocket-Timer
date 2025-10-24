/**
 * Timer Controls Module
 * Handles start, stop, reset, and timer completion logic
 */

import { createFlashAnimation } from '../canvas/canvasEffects.js';

/**
 * Flash red background with black text at timer completion
 * @param {Object} canvasRenderer - The canvas renderer instance
 * @param {Object} ipcRenderer - The IPC renderer for display window communication
 */
export function flashAtZero(canvasRenderer, ipcRenderer) {
  // Send flash event to display window
  if (window.electron && ipcRenderer) {
    ipcRenderer.send('flash-at-zero');
  }
  
  // Trigger flash animation on main window
  createFlashAnimation(canvasRenderer);
}

/**
 * Handle timer completion (when countdown reaches 0:00:00)
 * @param {HTMLElement} resetBtn - The reset button element
 * @param {Object} deps - Dependencies
 * @param {Function} deps.flashAtZero - Function to trigger flash animation
 */
export async function handleTimerComplete(resetBtn, { flashAtZero }) {
  try {
    const settings = await window.electron.settings.getAll();
    
    // Flash at zero if enabled
    if (settings.flashAtZero) {
      flashAtZero();
    }
    
    // Play sound notification if enabled
    if (settings.soundNotification) {
      // Create and play a beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('🔔 Timer complete sound played');
    }
    
    // Auto-reset if enabled
    if (settings.autoReset) {
      setTimeout(() => {
        resetBtn.click();
        console.log('🔄 Timer auto-reset');
      }, 1000); // Wait 1 second before resetting
    }
  } catch (error) {
    console.error('Error handling timer completion:', error);
  }
}

/**
 * Start the countdown timer
 * @param {Object} timerState - Timer state wrapper
 * @param {Object} deps - Dependencies
 * @param {HTMLElement} deps.startStopBtn - Start/stop button
 * @param {Function} deps.updateButtonIcon - Function to update button icon
 * @param {Function} deps.setInputsDisabled - Function to disable/enable inputs
 * @param {Function} deps.updateDisplay - Function to update display
 * @param {Function} deps.sendStateUpdate - Function to send state updates
 * @param {Function} deps.handleTimerComplete - Function to handle timer completion
 * @returns {number} The interval ID
 */
export function startTimer(timerState, { 
  startStopBtn, 
  updateButtonIcon, 
  setInputsDisabled, 
  updateDisplay, 
  sendStateUpdate,
  handleTimerComplete
}) {
  if (timerState.remainingTime <= 0) {
    return null;
  }

  timerState.setRunning(true);
  updateButtonIcon(startStopBtn, 'pause-fill', 'Stop');
  startStopBtn.classList.remove("start");
  startStopBtn.classList.add("stop");
  setInputsDisabled(true);
  sendStateUpdate();

  const countdown = setInterval(async () => {
    // Trigger completion actions when reaching exactly zero
    if (timerState.remainingTime === 0) {
      handleTimerComplete();
    }
    
    // Get auto-stop setting
    let autoStopAtZero = true;
    try {
      const settings = await window.electron.settings.getAll();
      autoStopAtZero = settings.autoStopAtZero !== false;
    } catch (error) {
      console.error('Error getting autoStopAtZero setting:', error);
    }

    if (autoStopAtZero && timerState.remainingTime <= 0) {
      clearInterval(countdown);
      timerState.setRunning(false);
      updateButtonIcon(startStopBtn, 'play-fill', 'Start');
      startStopBtn.classList.remove("stop");
      startStopBtn.classList.add("start");
      setInputsDisabled(false);
      return;
    }

    timerState.setRemainingTime(timerState.remainingTime - 1);
    updateDisplay();
    sendStateUpdate();
  }, 1000);

  return countdown;
}

/**
 * Stop the countdown timer
 * @param {number} countdown - The interval ID to clear
 * @param {Object} timerState - Timer state wrapper
 * @param {Object} deps - Dependencies
 * @param {HTMLElement} deps.startStopBtn - Start/stop button
 * @param {Function} deps.updateButtonIcon - Function to update button icon
 * @param {Function} deps.setInputsDisabled - Function to disable/enable inputs
 * @param {Function} deps.sendStateUpdate - Function to send state updates
 */
export function stopTimer(countdown, timerState, { 
  startStopBtn, 
  updateButtonIcon, 
  setInputsDisabled, 
  sendStateUpdate 
}) {
  clearInterval(countdown);
  timerState.setRunning(false);
  updateButtonIcon(startStopBtn, 'play-fill', 'Start');
  startStopBtn.classList.remove("stop");
  startStopBtn.classList.add("start");
  setInputsDisabled(false);
  sendStateUpdate();
}

/**
 * Reset the countdown timer to last set time
 * @param {number} countdown - The interval ID to clear
 * @param {Object} timerState - Timer state wrapper
 * @param {Object} deps - Dependencies
 * @param {HTMLElement} deps.startStopBtn - Start/stop button
 * @param {Function} deps.getElementById - Function to get element by ID
 * @param {Function} deps.updateButtonIcon - Function to update button icon
 * @param {Function} deps.setInputsDisabled - Function to disable/enable inputs
 * @param {Function} deps.updateDisplay - Function to update display
 * @param {Function} deps.sendStateUpdate - Function to send state updates
 */
export function resetTimer(countdown, timerState, { 
  startStopBtn, 
  getElementById,
  updateButtonIcon, 
  setInputsDisabled, 
  updateDisplay, 
  sendStateUpdate 
}) {
  clearInterval(countdown);
  timerState.setRunning(false);
  timerState.setTotalTime(timerState.lastSetTime);
  timerState.setRemainingTime(timerState.lastSetTime);

  // Reflect last set time in UI
  const h = Math.floor(timerState.lastSetTime / 3600);
  const m = Math.floor((timerState.lastSetTime % 3600) / 60);
  const s = timerState.lastSetTime % 60;

  getElementById("hours").value = h;
  getElementById("minutes").value = m;
  getElementById("seconds").value = s;

  updateDisplay();
  updateButtonIcon(startStopBtn, 'play-fill', 'Start');
  startStopBtn.classList.remove("stop");
  startStopBtn.classList.add("start");
  setInputsDisabled(false);
  sendStateUpdate();
}
