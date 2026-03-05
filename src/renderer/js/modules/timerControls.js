/**
 * Timer Controls Module
 * Handles start, stop, reset, and timer completion logic
 */

import { createFlashAnimation } from '../canvas/canvasEffects.js';
import { formatTime } from '../utils/timeFormatter.js';
import PrecisionTimer from '../utils/precisionTimer.js';
import appState from './appState.js';

// Global high-precision timer tracking to prevent multiple timers
let globalPrecisionTimer = null;

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
 * Play the default beep sound using Web Audio API
 */
function playDefaultBeep() {
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
}

/**
 * Handle timer completion (when countdown reaches 0:00:00)
 * @param {HTMLElement} resetBtn - The reset button element
 * @param {Object} deps - Dependencies
 * @param {Function} deps.flashAtZero - Function to trigger flash animation
 */
export async function handleTimerComplete(resetBtn, { flashAtZero }) {
  console.log('🎯 Timer completion triggered!');
  try {
    const settings = await window.electron.settings.getAll();
    console.log('⚙️ Settings loaded:', { 
      flashAtZero: settings.flashAtZero, 
      soundNotification: settings.soundNotification, 
      autoReset: settings.autoReset,
      hasCustomSound: !!settings.customSoundFile,
      customSoundFileName: settings.customSoundFileName
    });
    
    // Flash at zero if enabled
    if (settings.flashAtZero) {
      console.log('⚡ Triggering flash at zero');
      flashAtZero();
    }
    
    // Play sound notification if enabled
    if (settings.soundNotification) {
      console.log('🔊 Playing sound notification');
      
      // Try to play custom sound first, fall back to beep
      if (settings.customSoundFile) {
        try {
          console.log('🎵 Attempting to play custom sound:', settings.customSoundFileName || 'unknown file');
          const audio = new Audio(settings.customSoundFile);
          audio.volume = 0.5;
          await audio.play();
          console.log('✅ Custom sound played successfully');
        } catch (error) {
          console.error('❌ Error playing custom sound, falling back to beep:', error);
          playDefaultBeep();
        }
      } else {
        console.log('🔔 No custom sound set, playing default beep');
        playDefaultBeep();
      }
    }
    
    // Auto-reset if enabled
    if (settings.autoReset) {
      console.log('🔄 Auto-reset enabled, resetting in 1 second');
      setTimeout(() => {
        resetBtn.click();
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
export async function startTimer(timerState, { 
  startStopBtn, 
  updateButtonIcon, 
  setInputsDisabled, 
  updateDisplay, 
  sendStateUpdate,
  handleTimerComplete
}) {
  // Clear any existing precision timer to prevent duplicates
  if (globalPrecisionTimer) {
    globalPrecisionTimer.stop();
    globalPrecisionTimer = null;
  }

  if (timerState.remainingTimeMs <= 0) {
    return null;
  }

  timerState.setRunning(true);
  timerState.setStoppedAtZero(false); // Clear stopped at zero state
  
  // Calculate end time based on milliseconds
  const now = new Date();
  const endTime = new Date(now.getTime() + timerState.remainingTimeMs);
  
  // Get clock format from settings
  let clockFormat = '24h';
  try {
    const settings = await window.electron.settings.getAll();
    clockFormat = settings.clockFormat || '24h';
  } catch (error) {
    console.warn('Could not load clock format for end time:', error);
  }
  
  const endTimeFormatted = endTime.toLocaleTimeString('en-US', { 
    hour12: clockFormat === '12h', 
    hour: '2-digit', 
    minute: '2-digit'
  });
  
  // Update appState
  appState.update({
    'timer.running': true,
    'timer.endTime': endTime,
    'timer.endTimeFormatted': endTimeFormatted
  });
  
  updateButtonIcon(startStopBtn, 'pause-fill', 'Stop');
  startStopBtn.classList.remove("start");
  startStopBtn.classList.add("stop");
  setInputsDisabled(true);
  
  // Update display immediately before starting timer to show correct initial time
  updateDisplay();
  sendStateUpdate();

  // Track if we've triggered completion events (to avoid triggering multiple times)
  let completionTriggered = false;
  
  // Create high-precision timer with 100ms intervals
  globalPrecisionTimer = new PrecisionTimer(async () => {
    // Store previous time to detect zero crossing
    const previousTime = timerState.remainingTimeMs;
    
    // Decrement the timer by 100ms for high precision
    timerState.setRemainingTimeMs(timerState.remainingTimeMs - 100);
    
    // Trigger completion events when crossing from positive to zero/negative
    if (!completionTriggered && previousTime > 0 && timerState.remainingTimeMs <= 0) {
      console.log('⏰ Timer reached zero - triggering completion events');
      completionTriggered = true;
      handleTimerComplete();
    }
    
    // Get auto-stop setting (check localStorage first for cross-window sync)
    let autoStopAtZero = true;
    try {
      // Check localStorage first
      const localStorageValue = localStorage.getItem('autoStopAtZero');
      if (localStorageValue !== null) {
        autoStopAtZero = localStorageValue === 'true';
      } else {
        // Fallback to IPC settings
        const settings = await window.electron.settings.getAll();
        autoStopAtZero = settings.autoStopAtZero !== false;
      }
    } catch (error) {
      console.error('Error getting autoStopAtZero setting:', error);
    }
    
    // Check if we should stop after going to zero or negative
    if (autoStopAtZero && timerState.remainingTimeMs <= 0) {
      // Set back to 0 if it went negative
      if (timerState.remainingTimeMs < 0) {
        timerState.setRemainingTimeMs(0);
        updateDisplay(); // Force immediate display update to show 00:00:00
      }
      
      globalPrecisionTimer.stop();
      globalPrecisionTimer = null;
      timerState.setRunning(false);
      timerState.setStoppedAtZero(true); // Mark as stopped at zero
      
      // Update appState - keep timer in stopped state but don't change button to start
      appState.update({
        'timer.running': false,
        'timer.remainingTime': 0,
        'timer.hours': 0,
        'timer.minutes': 0,
        'timer.seconds': 0,
        'timer.formattedTime': '00:00:00',
        'timer.percentage': 0
      });
      
      // Don't change button back to start - keep it showing stop state
      // Keep inputs disabled since timer is still in "stop" state, not reset
      return;
    }
    
    // Recalculate end time to account for precision timing
    const now = new Date();
    const endTime = new Date(now.getTime() + timerState.remainingTimeMs);
    
    // Get clock format from settings (use localStorage for performance in timer loop)
    let clockFormat = localStorage.getItem('clockFormat') || '24h';
    
    const endTimeFormatted = endTime.toLocaleTimeString('en-US', { 
      hour12: clockFormat === '12h', 
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    // Calculate formatted time for this tick - handle negative time correctly
    // Convert milliseconds to seconds for compatibility with existing display code
    const remainingSeconds = Math.floor(timerState.remainingTimeMs / 1000);
    const isNegative = remainingSeconds < 0;
    const absTime = Math.abs(remainingSeconds);
    const hours = Math.floor(absTime / 3600);
    const minutes = Math.floor((absTime % 3600) / 60);
    const seconds = absTime % 60;
    const formattedTime = formatTime(remainingSeconds);
    const percentage = timerState.totalTimeMs > 0 ? Math.max(0, Math.round((timerState.remainingTimeMs / timerState.totalTimeMs) * 100)) : 0;
    
    // Update appState with remaining time, formatted time, and end time
    appState.update({
      'timer.remainingTime': timerState.remainingTimeMs,
      'timer.hours': hours,
      'timer.minutes': minutes,
      'timer.seconds': seconds,
      'timer.formattedTime': formattedTime,
      'timer.percentage': percentage,
      'timer.endTime': endTime,
      'timer.endTimeFormatted': endTimeFormatted
    });
    
    updateDisplay();
    // Note: sendStateUpdate() is not needed here as appState subscription handles API updates
  }, 100); // 100ms high-precision intervals

  // Start the precision timer
  globalPrecisionTimer.start();

  return globalPrecisionTimer;
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
  // Stop precision timer
  if (globalPrecisionTimer) {
    globalPrecisionTimer.stop();
    globalPrecisionTimer = null;
  }
  
  // Legacy support - also clear interval if passed
  if (countdown && typeof countdown === 'number') {
    clearInterval(countdown);
  }
  
  timerState.setRunning(false);
  timerState.setStoppedAtZero(false); // Clear stopped at zero state
  
  // Update appState - clear end time when stopped
  appState.update({
    'timer.running': false,
    'timer.endTime': null,
    'timer.endTimeFormatted': '--:--'
  });
  
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
  // Stop precision timer
  if (globalPrecisionTimer) {
    globalPrecisionTimer.stop();
    globalPrecisionTimer = null;
  }
  
  // Legacy support - also clear interval if passed
  if (countdown && typeof countdown === 'number') {
    clearInterval(countdown);
  }
  
  timerState.setRunning(false);
  timerState.setStoppedAtZero(false); // Clear stopped at zero state
  
  // Set time values using millisecond precision
  const lastSetTimeMs = timerState.lastSetTime * 1000; // Convert to ms
  timerState.setTotalTimeMs(lastSetTimeMs);
  timerState.setRemainingTimeMs(lastSetTimeMs);

  // Calculate formatted time for reset state (convert back to seconds for display)
  const lastSetTimeSeconds = timerState.lastSetTime;
  const hours = Math.floor(lastSetTimeSeconds / 3600);
  const minutes = Math.floor((lastSetTimeSeconds % 3600) / 60);
  const seconds = lastSetTimeSeconds % 60;
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const percentage = 100; // Reset to 100%
  
  // Update appState - clear end time when reset
  appState.update({
    'timer.running': false,
    'timer.remainingTime': lastSetTimeMs,
    'timer.totalTime': lastSetTimeMs,
    'timer.hours': hours,
    'timer.minutes': minutes,
    'timer.seconds': seconds,
    'timer.formattedTime': formattedTime,
    'timer.percentage': percentage,
    'timer.endTime': null,
    'timer.endTimeFormatted': '--:--'
  });

  // Reflect last set time in UI (use seconds for input fields)
  const h = Math.floor(lastSetTimeSeconds / 3600);
  const m = Math.floor((lastSetTimeSeconds % 3600) / 60);
  const s = lastSetTimeSeconds % 60;

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
