// Import canvas effects module
import { createFlashAnimation } from './canvas/canvasEffects.js';
import statusBar from './statusBar.js';
import { formatTime, formatClockTime } from './utils/timeFormatter.js';
import { ONE_SECOND, HUNDRED_MS } from './utils/constants.js';
import { KeyboardManager, VisualFeedback } from './utils/keyboardManager.js';
import appState from './modules/appState.js';
import * as TimeInputs from './modules/timeInputs.js';
import * as ClockManager from './modules/clockManager.js';
import * as MessageManager from './modules/messageManager.js';
import * as PresetManager from './modules/presetManager.js';
import * as SettingsManager from './modules/settingsManager.js';
import * as DisplayManager from './modules/displayManager.js';
import * as TimerControls from './modules/timerControls.js';
import * as VideoManager from './modules/videoManager.js';
import { initializeIPCHandlers } from './modules/ipcHandlers.js';

let countdown;
let lastSetTime = 300000; // 5 minute fallback (300 seconds * 1000ms) - will be overridden by settings
let remainingTime = 300000; // 5 minute fallback - will be overridden by settings
let totalTime = 300000; // 5 minute fallback - will be overridden by settings
let running = false;
let stoppedAtZero = false; // Track when timer auto-stopped at zero
let clockInterval;

// High-resolution timer variables
let timerStartTime = 0;
let timerExpectedTime = 0;
let timerDrift = 0;
const TIMER_INTERVAL = 100; // 100ms for smooth updates

// Elapsed time tracking (independent of remaining/total time adjustments)
let actualStartTimestamp = 0; // Wall clock time when timer started (Date.now())
let pausedElapsedTime = 0; // Accumulated elapsed time before pause

// Initialize Canvas Renderer
let canvasRenderer = null;

// Initialize Keyboard Manager
const keyboard = new KeyboardManager();

// Sound notification state
let soundsMuted = false;
let muteSoundsBtn = null;

// Menu state tracking
let displayVisible = false;
let clockVisible = false;

// Check if window.electron is available
if (!window.electron || !window.electron.ipcRenderer) {
  console.error('IPC renderer not available');
}

const { ipcRenderer } = window.electron;

// State wrapper for passing to modules
const timerState = {
  get remainingTime() { return Math.floor(remainingTime / 1000); }, // Convert ms to seconds for compatibility
  get totalTime() { return Math.floor(totalTime / 1000); }, // Convert ms to seconds for compatibility
  get remainingTimeMs() { return remainingTime; }, // Direct ms access
  get totalTimeMs() { return totalTime; }, // Direct ms access
  get running() { return running; },
  get stoppedAtZero() { return stoppedAtZero; },
  get lastSetTime() { return Math.floor(lastSetTime / 1000); },
  get actualStartTimestamp() { return actualStartTimestamp; }, // Wall clock start time
  get pausedElapsedTime() { return pausedElapsedTime; }, // Elapsed time before pause
  setRemainingTime(value) { 
    const previousTime = remainingTime;
    remainingTime = value * 1000; // Convert seconds to ms
    // Check for zero crossing (works whether timer is running or not)
    if (previousTime > 0 && remainingTime <= 0) {
      console.log('⏰ Time crossed zero via setRemainingTime - triggering completion events');
      // Use setTimeout to avoid blocking the setter
      setTimeout(() => {
        if (window.handleTimerComplete) {
          window.handleTimerComplete();
        }
      }, 0);
    }
  },
  setTotalTime(value) { totalTime = value * 1000; }, // Convert seconds to ms
  setRemainingTimeMs(value) { 
    const previousTime = remainingTime;
    remainingTime = value; // Direct ms setter
    // Check for zero crossing (works whether timer is running or not)
    if (previousTime > 0 && remainingTime <= 0) {
      console.log('⏰ Time crossed zero via setRemainingTimeMs - triggering completion events');
      // Use setTimeout to avoid blocking the setter
      setTimeout(() => {
        if (window.handleTimerComplete) {
          window.handleTimerComplete();
        }
      }, 0);
    }
  },
  setTotalTimeMs(value) { totalTime = value; }, // Direct ms setter
  setRunning(value) { running = value; },
  setStoppedAtZero(value) { stoppedAtZero = value; },
  setLastSetTime(value) { lastSetTime = value * 1000; }
};

// Clock state wrapper for passing to modules
const clockState = {
  getInterval() { return clockInterval; },
  setInterval(value) { clockInterval = value; }
};

// Message state wrapper for passing to modules
let messageDisplayed = false;
const messageState = {
  isDisplayed() { return messageDisplayed; },
  setDisplayed(value) { messageDisplayed = value; }
};

/**
 * Load settings and apply them to the application
 */
async function loadAndApplySettings() {
  await SettingsManager.loadAndApplySettings(timerState, { getElementById: document.getElementById.bind(document) });
}

/**
 * Apply canvas colors from settings
 */
function applyCanvasColors(colors) {
  SettingsManager.applyCanvasColors(colors);
}

/**
 * Listen for settings updates
 */
if (window.electron && window.electron.settings) {
  window.electron.settings.onUpdate((settings) => {
    
    // Reapply colors
    if (settings.colors) {
      applyCanvasColors(settings.colors);
      // Force canvas redraw
      if (canvasRenderer) {
        updateDisplay();
      }
    }
    
    // Apply timer threshold settings
    if (canvasRenderer) {
      canvasRenderer.applyTimerThresholds(settings);
      console.log('Applied timer thresholds from settings.onUpdate');
      // Force redraw to update colors
      updateDisplay();
    }
    
    // Update theme if changed
    if (settings.defaultTheme || settings.appearanceTheme) {
      const theme = settings.appearanceTheme || settings.defaultTheme;
      const resolvedTheme = theme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      localStorage.setItem('theme', resolvedTheme);
      
      if (canvasRenderer) {
        canvasRenderer.updateTheme(resolvedTheme);
      }
    }
    
    // Update sound notification state
    if (settings.soundNotification !== undefined) {
      soundsMuted = !settings.soundNotification;
      updateMuteButtonState();
    }
    
    // Update clock format in localStorage when settings change
    if (settings.clockFormat !== undefined) {
      localStorage.setItem('clockFormat', settings.clockFormat);
    }
  });
}

// ============================================================================
// TIME INPUT WRAPPER FUNCTIONS
// ============================================================================
// Note: These wrapper functions maintain compatibility with existing code
// while delegating to the imported TimeInputs module. They must be defined
// before DOMContentLoaded handlers so they're available to IPC listeners.

function normalizeTimeInputs() {
  return TimeInputs.normalizeTimeInputs();
}

function updateTimeFromInputs() {
  TimeInputs.updateTimeFromInputs(timerState, updateDisplay, sendStateUpdate);
}

/**
 * Add specified number of minutes to the timer
 * @param {number} minutes - Number of minutes to add
 */
function addMinutes(minutes) {
  if (minutes === 1) {
    // Use TimeInputs module for 1-minute adjustments (maintains compatibility)
    TimeInputs.addMinute(timerState, updateDisplay);
    return;
  }
  
  const minutesMs = minutes * 60 * 1000;
  // Use setter to trigger zero-crossing detection
  timerState.setRemainingTimeMs(remainingTime + minutesMs);
  
  // Only adjust totalTime if timer is NOT running
  // When running, totalTime should stay fixed so elapsed time tracks correctly
  if (!running) {
    timerState.setTotalTimeMs(Math.max(totalTime + minutesMs, remainingTime));
    
    // Update input fields to reflect the new time
    const totalSeconds = Math.floor(remainingTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    document.getElementById("hours").value = hours;
    document.getElementById("minutes").value = mins;
    document.getElementById("seconds").value = secs;
  }
  
  // Update appState with new values
  appState.update({
    'timer.remainingTime': remainingTime,
    'timer.totalTime': totalTime,
    'timer.hours': Math.floor(remainingTime / 1000 / 3600),
    'timer.minutes': Math.floor((remainingTime / 1000 % 3600) / 60),
    'timer.seconds': Math.floor(remainingTime / 1000) % 60,
    'timer.percentage': totalTime > 0 ? Math.round((remainingTime / totalTime) * 100) : 100,
    'timer.formattedTime': formatTime(Math.floor(remainingTime / 1000)),
    'timer.preset': running ? appState.getState().timer.preset : null // Set to custom when not running
  });
  
  updateTimerState(true);

}

/**
 * Subtract specified number of minutes from the timer
 * @param {number} minutes - Number of minutes to subtract
 */
function subtractMinutes(minutes) {
  if (minutes === 1) {
    // Use TimeInputs module for 1-minute adjustments (maintains compatibility)
    TimeInputs.subtractMinute(timerState, updateDisplay);
    return;
  }
  
  const minutesMs = minutes * 60 * 1000;
  // Use setter to trigger zero-crossing detection
  timerState.setRemainingTimeMs(remainingTime - minutesMs);
  
  // Only adjust totalTime if timer is NOT running
  // When running, totalTime should stay fixed so elapsed time tracks correctly
  if (!running) {
    timerState.setTotalTimeMs(Math.max(0, totalTime - minutesMs));
    
    // Update input fields to reflect the new time
    const totalSeconds = Math.max(0, Math.floor(remainingTime / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    document.getElementById("hours").value = hours;
    document.getElementById("minutes").value = mins;
    document.getElementById("seconds").value = secs;
  }
  
  // Update appState with new values
  appState.update({
    'timer.remainingTime': remainingTime,
    'timer.totalTime': totalTime,
    'timer.hours': Math.floor(remainingTime / 1000 / 3600),
    'timer.minutes': Math.floor((remainingTime / 1000 % 3600) / 60),
    'timer.seconds': Math.floor(remainingTime / 1000) % 60,
    'timer.percentage': totalTime > 0 ? Math.round((remainingTime / totalTime) * 100) : 100,
    'timer.formattedTime': formatTime(Math.floor(remainingTime / 1000)),
    'timer.preset': running ? appState.getState().timer.preset : null // Set to custom when not running
  });
  
  updateTimerState(true);

}

// Wrapper functions for backward compatibility and convenience
function addMinute() {
  addMinutes(1);
}

function subtractMinute() {
  subtractMinutes(1);
}

function addFiveMinutes() {
  addMinutes(5);
}

function subtractFiveMinutes() {
  subtractMinutes(5);
}

function addTenMinutes() {
  addMinutes(10);
}

function subtractTenMinutes() {
  subtractMinutes(10);
}

// ============================================================================
// CLOCK WRAPPER FUNCTIONS
// ============================================================================
// Note: These wrapper functions maintain compatibility with existing code
// while delegating to the imported ClockManager module.

function updateClock() {
  ClockManager.updateClock({ canvasRenderer, ipcRenderer });
}

function startClock() {
  ClockManager.startClock(clockState, { canvasRenderer, ipcRenderer, updateDisplay });
}

function stopClock() {
  ClockManager.stopClock(clockState, { canvasRenderer, ipcRenderer });
}

// ============================================================================
// MESSAGE WRAPPER FUNCTIONS
// ============================================================================
// Note: These wrapper functions will be populated after DOM loads with access
// to messageInput, displayMessageBtn, charCounter elements.
// Placeholder functions to be overwritten in DOMContentLoaded.

let updateCharCounter = () => {};
let displayMessage = () => {};
let hideMessage = () => {};
let clearMessage = () => {};
let manualPaste = async () => {};
let handlePaste = async () => {};
let handleKeyDown = () => {};

// ============================================================================
// DOM INITIALIZATION - Consolidated from 3 separate listeners
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize status bar
  statusBar.init();
  
  // 2. Request current server status from main process
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('request-server-status');
  }
  
  // 3. Load and apply settings
  await loadAndApplySettings();
  
  // 3. Load saved layout or use default from settings
  const savedLayoutId = localStorage.getItem('canvasLayout') || LayoutRegistry.getDefaultLayout();
  const layout = LayoutRegistry.getLayout(savedLayoutId);
  
  console.log('🎨 Loading layout:', layout?.name);
  
  // 4. Create unified canvas renderer with layout
  // Get canvas resolution from settings
  let resolution = ['1920', '1080']; // Default resolution
  try {
    if (window.electron && window.electron.settings) {
      const settings = await window.electron.settings.getAll();
      if (settings.canvasResolution) {
        resolution = settings.canvasResolution.split('x');
      }
    }
  } catch (error) {
    console.warn('Could not load canvas resolution from settings, using default:', error);
  }
  
  const width = parseInt(resolution[0]);
  const height = parseInt(resolution[1]);
  
  canvasRenderer = new UnifiedCanvasRenderer(width, height);
  
  // Add preview canvas output (smaller scale for UI)
  const previewCanvas = document.getElementById('timerCanvas');
  if (previewCanvas) {
    canvasRenderer.addOutput('preview', previewCanvas, {
      scale: 1,
      enabled: true,
      aspectRatio: 16/9
    });
    // CSS handles responsive sizing automatically
  }
  
  // Set initial layout
  canvasRenderer.setLayout(layout);
  
  // Load and apply timer threshold settings to renderer
  try {
    if (window.electron && window.electron.settings) {
      const settings = await window.electron.settings.getAll();
      canvasRenderer.applyTimerThresholds(settings);
      console.log('Applied timer thresholds to renderer:', settings);
    }
  } catch (error) {
    console.warn('Could not load timer threshold settings:', error);
  }
  
  // Start the unified renderer
  canvasRenderer.start();
  
  // 5. Ensure canvas is updated with the correct layout (same as when user changes layout)  
  if (canvasRenderer && layout) {
    await handleVideoInputForLayout(layout);
  }
  
  // 6. Apply theme to canvas
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  canvasRenderer.updateTheme(currentTheme);
  
  // 7. Initialize theme toggle
  if (localStorage.getItem("theme") === "light") {
    setTheme(false);
  } else {
    setTheme(true); // Default to dark mode
  }
  
  // 7. Update display to show initial time with correct progress (100%)
  updateDisplay();
  
  // 8. Send initial state to REST API server
  sendStateUpdate();
  
  // 9. Initialize lightweight info clock first (always shows system time)
  // Main canvas clock (with IPC) will override & stop this when enabled.
  ClockManager.startInfoClock();

  // If layout or stored preference wants full clock, start main clock (will stop info clock)
  const clockPrefOn = localStorage.getItem("clock") === "on";
  if ((layout.clock && layout.clock.enabled) || clockPrefOn) {
    startClock();
  }
  else {
    // Ensure canvas clock hidden while info clock runs
    stopClock(); // stopClock will restart info clock; safe since already running
  }
  
  // 10. Load saved presets from localStorage
  loadSavedPresets();
  
  // 11. Initialize layout selector
  const layoutSelector = document.getElementById('layoutSelector');
  if (layoutSelector) {
    // Populate layout selector
    refreshLayoutSelector();
    layoutSelector.value = savedLayoutId;
    
    // Ensure the unified renderer outputs match the layout selector value
    // The unified renderer handles both preview and external display synchronization
    if (canvasRenderer) {
      const layout = LayoutRegistry.getLayout(savedLayoutId);
      canvasRenderer.setLayout(layout);
      await handleVideoInputForLayout(layout);
    }
    
    layoutSelector.addEventListener('change', async (e) => {
      const layoutId = e.target.value;
      
      if (canvasRenderer) {
        const layout = LayoutRegistry.getLayout(layoutId);
        canvasRenderer.setLayout(layout);
        await handleVideoInputForLayout(layout);
      }
      
      localStorage.setItem('canvasLayout', layoutId);
      
      if (window.electron && window.electron.ipcRenderer) {
        ipcRenderer.send('layout-changed', layoutId);
      }
      
      sendStateUpdate();
    });
  }

  // Responsive layout now handled purely by CSS grid and ResizeObserver.
  
  // 12. Initialize mute sounds button
  muteSoundsBtn = document.getElementById("muteSounds");
  if (muteSoundsBtn) {
    try {
      const settings = await window.electron.settings.getAll();
      soundsMuted = !settings.soundNotification;
      updateMuteButtonState();
      
      // Initialize appState with sound settings (sync with actual settings)
      appState.update({
        'settings.soundEnabled': settings.soundNotification || false
      });
    } catch (error) {
      console.error('Error loading sound settings:', error);
      
      // Initialize with defaults if settings loading fails
      soundsMuted = false; // Default to sound enabled
      updateMuteButtonState();
      appState.update({
        'settings.soundEnabled': true
      });
    }

    muteSoundsBtn.addEventListener("click", async () => {
      soundsMuted = !soundsMuted;
      
      try {
        await window.electron.settings.save('soundNotification', !soundsMuted);
        updateMuteButtonState();
        
        // Update appState for API consistency  
        appState.update({
          'settings.soundEnabled': !soundsMuted
        });
        
        console.log('🔊 Sound notifications:', !soundsMuted ? 'enabled' : 'disabled');
      } catch (error) {
        console.error('Error updating sound settings:', error);
      }
    });
  }
  
  // 13. Auto-start video input if current layout uses video
  setTimeout(async () => {
    await handleVideoInputForLayout(layout);
  }, 500);
  
  // 14. Send initial menu state
  setTimeout(() => {
    if (window.electron && window.electron.ipcRenderer && canvasRenderer && canvasRenderer.state) {
      const clockVisible = canvasRenderer.state.showClock;
      ipcRenderer.send('update-menu-states', currentTheme, clockVisible);
    }
  }, 100);
  
  // 15. Notify main process that renderer is ready
  ipcRenderer.send('main-window-ready');
  
  // 16. Setup throttled appState subscription for REST API server updates
  let stateUpdateThrottle = null;
  appState.subscribe('*', (newValue, oldValue, path) => {
    // Throttle updates to max 10 per second (100ms interval)
    // This reduces IPC traffic from 60fps to 10fps
    if (stateUpdateThrottle) return;
    
    stateUpdateThrottle = setTimeout(() => {
      // Send complete appState to REST API server
      const state = appState.getState();
      ipcRenderer.send('companion-state-update', state);
      stateUpdateThrottle = null;
    }, 100);
  });
  

  
  // 17. Listen for settings updates from settings window
  if (window.electron && window.electron.settings) {
    window.electron.settings.onUpdate((settings) => {
      // Update localStorage for cross-window access
      if (typeof settings.matchTimerColor !== 'undefined') {
        localStorage.setItem('matchTimerColor', settings.matchTimerColor.toString());
      }
      
      // Apply updated colors to canvas
      if (settings.colors && canvasRenderer) {
        SettingsManager.applyCanvasColors(settings.colors);
        canvasRenderer.updateStyleCache();
      }
    });
  }
  
  // 18. Initialize appState with current timer values and other states
  appState.update({
    'timer.remainingTime': remainingTime, // Already in ms with high-resolution timer
    'timer.totalTime': totalTime,
    'timer.lastSetTime': lastSetTime,
    'timer.running': running,
    'timer.paused': false,
    'timer.preset': null, // Start as custom time (null = custom, 0-7 = preset index)
    'timer.hours': Math.floor(remainingTime / 3600000), // Convert ms to hours
    'timer.minutes': Math.floor((remainingTime % 3600000) / 60000), // Convert ms to minutes  
    'timer.seconds': Math.floor((remainingTime % 60000) / 1000), // Convert ms to seconds
    'timer.percentage': totalTime > 0 ? Math.round((remainingTime / totalTime) * 100) : 100,
    'timer.formattedTime': formatTime(Math.floor(remainingTime / 1000)), // Convert ms to seconds for formatter
    'layout.current': savedLayoutId || 'classic',
    'theme': localStorage.getItem("theme") === "light" ? 'light' : 'dark',
    'clock.visible': localStorage.getItem("clock") === "on",
    // Initialize message state (will be updated when messages are shown/hidden)
    'message.visible': false,
    'message.text': ''
  });
  
  // Send initial state immediately
  ipcRenderer.send('companion-state-update', appState.getState());
});

// IPC handlers initialized at end of file

// Real DOM elements (controls)
const startStopBtn = document.getElementById("startStop");
const resetBtn = document.getElementById("reset");
const addMinuteBtn = document.getElementById("addMinute");
const subtractMinuteBtn = document.getElementById("subtractMinute");
const messageInput = document.getElementById("messageInput");
const displayMessageBtn = document.getElementById("displayMessage");
const clearMessageBtn = document.getElementById("clearMessage");
const charCounter = document.getElementById("charCounter");

// Assign message wrapper functions now that DOM elements are available
updateCharCounter = () => {
  MessageManager.updateCharCounter(messageInput, charCounter);
};

displayMessage = () => {
  MessageManager.displayMessage(messageState, {
    messageInput,
    displayMessageBtn,
    canvasRenderer,
    ipcRenderer,
    updateButtonIcon,
    hideMessage,
    statusBar
  });
};

hideMessage = () => {
  MessageManager.hideMessage(messageState, {
    displayMessageBtn,
    canvasRenderer,
    ipcRenderer,
    updateButtonIcon
  });
};

clearMessage = () => {
  MessageManager.clearMessage(messageState, {
    messageInput,
    charCounter,
    updateCharCounter,
    hideMessage
  });
};

manualPaste = async () => {
  await MessageManager.manualPaste(messageInput, updateCharCounter);
};

handlePaste = async (event) => {
  await MessageManager.handlePaste(event, manualPaste);
};

handleKeyDown = (event) => {
  MessageManager.handleKeyDown(event, manualPaste);
};


// --------------------
// Countdown functions

// Helper function to update button icon and text
function updateButtonIcon(button, iconName, text) {
  // Find the icon element and update its Bootstrap Icons class
  const icon = button.querySelector('i.bi');
  if (icon) {
    // Remove all bi- classes and add the new one
    icon.className = `bi bi-${iconName}`;
  }
  
  // Find the text span and update its content
  const textSpan = button.querySelector('span:not(.icon)');
  if (textSpan) {
    textSpan.textContent = text;
  } else {
    // Fallback: create new text span if not found
    const newTextSpan = document.createElement('span');
    newTextSpan.textContent = text;
    button.appendChild(newTextSpan);
  }
}
/**
 * Flash red background with black text at timer completion
 */
function flashAtZero() {
  TimerControls.flashAtZero(canvasRenderer, ipcRenderer);
}

/**
 * Handle timer completion (when countdown reaches 0:00:00)
 */
async function handleTimerComplete() {
  await TimerControls.handleTimerComplete(resetBtn, { flashAtZero });
}

// Export to window for access from timeInputs module
window.handleTimerComplete = handleTimerComplete;

async function updateDisplay() {
  return await DisplayManager.updateDisplay(timerState, { canvasRenderer, ipcRenderer });
}

/**
 * Send state update to REST API server
 * @param {Object} cachedValues - Optional cached values from updateDisplay to avoid recalculation
 */
async function sendStateUpdate(cachedValues = null) {
  await DisplayManager.sendStateUpdate(timerState, { canvasRenderer, ipcRenderer }, cachedValues);
}

/**
 * Update display and send state update efficiently (reuses calculated values)
 */
async function updateDisplayAndState() {
  const cachedValues = await updateDisplay();
  await sendStateUpdate(cachedValues);
}

// Unified timer state update helper
async function updateTimerState(broadcast = false) {
  const cachedValues = await updateDisplay();
  if (broadcast) {
    await sendStateUpdate(cachedValues);
  }
  return cachedValues;
}

/**
 * Change canvas layout by ID
 */
function changeLayout(layoutId) {
  DisplayManager.changeLayout(layoutId, { 
    canvasRenderer, 
    LayoutRegistry, 
    getElementById: document.getElementById.bind(document) 
  });
}

// Start/Stop toggle
startStopBtn.addEventListener("click", async () => {
  if (!running) {
    if (remainingTime <= 0) {
      const h = parseInt(document.getElementById("hours").value) || 0;
      const m = parseInt(document.getElementById("minutes").value) || 0;
      const s = parseInt(document.getElementById("seconds").value) || 0;
      const totalTimeSeconds = h * 3600 + m * 60 + s;
      
      // Convert to milliseconds for precision timer system
      totalTime = totalTimeSeconds * 1000;
      remainingTime = totalTime;
      updateDisplay();
    }

    if (remainingTime > 0) {
      // Record actual start time for elapsed time tracking
      actualStartTimestamp = Date.now();
      pausedElapsedTime = 0; // Reset on fresh start
      
      countdown = await TimerControls.startTimer(timerState, {
        startStopBtn,
        updateButtonIcon,
        setInputsDisabled,
        updateDisplay,
        sendStateUpdate,
        handleTimerComplete
      });
    }
  } else {
    // Stop/Pause: save elapsed time
    if (running && actualStartTimestamp > 0) {
      pausedElapsedTime += (Date.now() - actualStartTimestamp);
    }
    
    TimerControls.stopTimer(countdown, timerState, {
      startStopBtn,
      updateButtonIcon,
      setInputsDisabled,
      sendStateUpdate
    });
  }
});


// Reset
resetBtn.addEventListener("click", () => {
  // Reset elapsed time tracking
  actualStartTimestamp = 0;
  pausedElapsedTime = 0;
  
  countdown = TimerControls.resetTimer(countdown, timerState, {
    startStopBtn,
    getElementById: document.getElementById.bind(document),
    updateButtonIcon,
    setInputsDisabled,
    updateDisplay,
    sendStateUpdate
  });
});


// Flash Button - Manually trigger flash effect
const flashBtn = document.getElementById("flashButton");
if (flashBtn) {
  flashBtn.addEventListener("click", () => {
    flashAtZero();
  });
}

// Mute button state updater
function updateMuteButtonState() {
  if (!muteSoundsBtn) return;
  
  const icon = muteSoundsBtn.querySelector('i');
  
  if (soundsMuted) {
    icon.className = 'bi bi-volume-mute-fill text-xl';
    muteSoundsBtn.title = 'Unmute';
    muteSoundsBtn.classList.remove('btn-light');
    muteSoundsBtn.classList.add('btn-danger');
  } else {
    icon.className = 'bi bi-volume-up-fill text-xl';
    muteSoundsBtn.title = 'Mute';
    muteSoundsBtn.classList.remove('btn-danger');
    muteSoundsBtn.classList.add('btn-light');
  }
}

// Feature Image Button - Toggle feature image overlay
const coverImageBtn = document.getElementById("coverImage");
let coverImageEnabled = false;

// Initialize cover image and background image state after canvas is ready
async function initializeFeatureImage() {
  if (!coverImageBtn) return;
  
  try {
    const settings = await window.electron.settings.getAll();
    
    // Initialize cover image state (with defaults if not set)
    if (settings.coverImage) {
      coverImageEnabled = settings.coverImage.enabled || false;
    } else {
      coverImageEnabled = false;
    }
    
    updateFeatureImageButtonState();
    
    // Always initialize appState with cover image settings (including defaults)
    appState.update({
      'coverImage.enabled': coverImageEnabled,
      'coverImage.path': settings.coverImage?.path || null,
      'coverImage.opacity': settings.coverImage?.opacity || 1.0
    });
    
    // Apply cover image if enabled and canvas is ready
    if (coverImageEnabled && settings.coverImage?.path && canvasRenderer) {
      // Add a small delay to ensure canvas is fully initialized
      setTimeout(async () => {
        try {
          await canvasRenderer.enableCoverImage(settings.coverImage.path);
          // Force multiple display updates to ensure the image appears
          updateDisplay();
          setTimeout(() => updateDisplay(), 100);
          console.log('✅ Cover image enabled and display updated at startup');
        } catch (error) {
          console.error('Error loading cover image:', error);
        }
      }, 100);
    }
    
    // Initialize and load background image if present
    if (settings.backgroundImage && settings.backgroundImage.enabled && settings.backgroundImage.path && canvasRenderer) {
      setTimeout(async () => {
        try {
          await canvasRenderer.enableBackgroundImage(settings.backgroundImage.path, settings.backgroundImage.opacity || 1.0);
          updateDisplay();
          setTimeout(() => updateDisplay(), 100);
          console.log('✅ Background image loaded at startup:', settings.backgroundImage.path);
        } catch (error) {
          console.error('Error loading background image:', error);
        }
      }, 150);
    }

  } catch (error) {
    console.error('Error loading image settings:', error);
    
    // Initialize with defaults if settings loading fails
    coverImageEnabled = false;
    updateFeatureImageButtonState();
    appState.update({
      'coverImage.enabled': false,
      'coverImage.path': null,
      'coverImage.opacity': 1.0
    });
  }
}

if (coverImageBtn) {
  // Initialize after a delay to ensure canvas is ready
  setTimeout(initializeFeatureImage, 200);

  coverImageBtn.addEventListener("click", async () => {
    try {
      const settings = await window.electron.settings.getAll();
      
      if (!settings.coverImage || !settings.coverImage.path) {
        statusBar.warning('Please select a feature image in Settings > Appearance first.', 5000);
        return;
      }
      
      coverImageEnabled = !coverImageEnabled;
      
      // Update settings
      const coverImage = {
        ...settings.coverImage,
        enabled: coverImageEnabled
      };
      await window.electron.settings.save('coverImage', coverImage);
      
      // Toggle feature image on canvas
      if (coverImageEnabled) {
        await canvasRenderer.enableFeatureImage(settings.coverImage.path);
      } else {
        canvasRenderer.disableFeatureImage();
      }
      
      // Send to display window
      window.electron.ipcRenderer.send('toggle-cover-image', coverImageEnabled);
      
      updateFeatureImageButtonState();
      
      // Update appState for API consistency
      appState.update({
        'coverImage.enabled': coverImageEnabled,
        'coverImage.path': settings.coverImage.path,
        'coverImage.opacity': settings.coverImage.opacity || 1.0
      });
      

    } catch (error) {
      console.error('Error toggling feature image:', error);
    }
  });
}

function updateFeatureImageButtonState() {
  if (!coverImageBtn) return;
  
  const icon = coverImageBtn.querySelector('i');
  
  if (coverImageEnabled) {
    icon.className = 'bi bi-image-fill text-xl';
    coverImageBtn.title = 'Hide Image';
    coverImageBtn.classList.remove('btn-light');
    coverImageBtn.classList.add('btn-success');
  } else {
    icon.className = 'bi bi-image text-xl';
    coverImageBtn.title = 'Feature Image';
    coverImageBtn.classList.remove('btn-success');
    coverImageBtn.classList.add('btn-light');
  }
}


// Presets - Initialize long-press handlers first
PresetManager.initializeLongPressHandlers({
  getElementById: document.getElementById.bind(document),
  statusBar
});

document.querySelectorAll(".preset").forEach(btn => {
  btn.addEventListener("click", (event) => {
    // Skip click if it was a long-press
    if (PresetManager.checkIsLongPress()) {
      return;
    }
    
    // Check if Cmd (Mac) or Ctrl (Windows/Linux) is held down
    if (event.metaKey || event.ctrlKey) {
      // Update preset with current input values
      updatePresetFromInputs(btn);
    } else {
      // Normal behavior: load preset time (convert to milliseconds for precision timer)
      const minutes = parseInt(btn.dataset.minutes);
      const totalTimeSeconds = minutes * 60;
      
      // Set time values in milliseconds for precision timer system
      totalTime = totalTimeSeconds * 1000;
      remainingTime = totalTime;
      lastSetTime = totalTime;
      
      updateDisplay();
      
      // Get preset index (0-7)
      const presetButtons = Array.from(document.querySelectorAll(".preset"));
      const presetIndex = presetButtons.indexOf(btn);
      
      // Update appState with selected preset (values already in ms)
      appState.update({
        'timer.preset': presetIndex,
        'timer.totalTime': totalTime,
        'timer.remainingTime': remainingTime,
        'timer.lastSetTime': lastSetTime,
        'timer.hours': Math.floor(totalTimeSeconds / 3600),
        'timer.minutes': Math.floor((totalTimeSeconds % 3600) / 60),
        'timer.seconds': totalTimeSeconds % 60,
        'timer.percentage': 100,
        'timer.formattedTime': formatTime(totalTimeSeconds)
      });
      
      console.log(`⏰ Preset loaded: ${minutes} minutes (${totalTime}ms)`);
      
      // Visual feedback
      VisualFeedback.flashSuccess(btn);
    }
  });
});

// Function to update preset button with current input values
function updatePresetFromInputs(button) {
  PresetManager.updatePresetFromInputs(button, { 
    getElementById: document.getElementById.bind(document),
    statusBar 
  });
}

//SET TIME
const timeInputs = ["hours", "minutes", "seconds"].map(id => document.getElementById(id));

function setInputsDisabled(disabled) {
  // Time input fields and presets - disabled when timer is running
  ["hours", "minutes", "seconds"].forEach(id => {
    const input = document.getElementById(id);
    input.disabled = disabled;
    input.classList.toggle("muted", disabled);  // Add class for custom style
  });

  // Preset buttons - disabled when timer is running
  document.querySelectorAll(".preset").forEach(btn => {
    btn.disabled = disabled;
    btn.classList.toggle("muted", disabled);  // Optional: to match the dimmed look
  });

  // +1/-1 minute buttons - only disabled when stopped at zero, not when running
  const minuteButtonsDisabled = timerState.stoppedAtZero;
  ["addMinute", "subtractMinute"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = minuteButtonsDisabled;
      btn.classList.toggle("muted", minuteButtonsDisabled);
    }
  });
}

// Handle manual input changes
timeInputs.forEach(input => {
  input.addEventListener("input", () => {
    if (running) {
      // Stop precision timer properly
      if (countdown && countdown.stop) {
        countdown.stop();
      } else {
        clearInterval(countdown);
      }
      running = false;
      updateButtonIcon(startStopBtn, 'play-fill', 'Start');
      startStopBtn.classList.remove("stop");
      startStopBtn.classList.add("start");
      setInputsDisabled(false);
    }

    updateTimeFromInputs();

    // Save current input as last set time (totalTime is already in ms)
    lastSetTime = totalTime;
  });
});


// Theme toggle
function setTheme(dark) {
  const htmlElement = document.documentElement;
  const theme = dark ? 'dark' : 'light';
  
  if (dark) {
    // Dark mode: set data-theme attribute
    htmlElement.setAttribute('data-theme', 'dark');
    localStorage.setItem("theme", "dark");
  } else {
    // Light mode: set data-theme attribute  
    htmlElement.setAttribute('data-theme', 'light');
    localStorage.setItem("theme", "light");
  }
  
  // Update canvas renderer theme
  if (canvasRenderer) {
    canvasRenderer.updateTheme(theme);
  }
  
  // Update menu state
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('update-theme', theme);
    const clockVisible = localStorage.getItem("clock") === "on";
    ipcRenderer.send('update-menu-states', theme, clockVisible);
  }
}



// Minute adjustment button event listeners
addMinuteBtn.addEventListener("click", addMinute);
subtractMinuteBtn.addEventListener("click", subtractMinute);

// Advanced time control button event listeners
const addFiveBtn = document.getElementById("addFive");
const subtractFiveBtn = document.getElementById("subtractFive");
const addTenBtn = document.getElementById("addTen");
const subtractTenBtn = document.getElementById("subtractTen");

if (addFiveBtn) addFiveBtn.addEventListener("click", () => addMinutes(5));
if (subtractFiveBtn) subtractFiveBtn.addEventListener("click", () => subtractMinutes(5));
if (addTenBtn) addTenBtn.addEventListener("click", () => addMinutes(10));
if (subtractTenBtn) subtractTenBtn.addEventListener("click", () => subtractMinutes(10));

// Message input event listeners
messageInput.addEventListener("input", updateCharCounter);
messageInput.addEventListener("paste", handlePaste);
messageInput.addEventListener("keydown", handleKeyDown);
displayMessageBtn.addEventListener("click", displayMessage);
clearMessageBtn.addEventListener("click", clearMessage);

// Reset presets functionality
const resetPresetsBtn = document.getElementById("resetPresets");
if (resetPresetsBtn) {
  resetPresetsBtn.addEventListener("click", resetPresetsToDefault);
}

function resetPresetsToDefault() {
  PresetManager.resetPresetsToDefault();
}

// Initialize character counter
updateCharCounter();

// Function to load saved presets from localStorage
function loadSavedPresets() {
  PresetManager.loadSavedPresets();
}

// Initialize saved presets
loadSavedPresets();

// Video input controls

async function handleVideoInputForLayout(layout) {
  await VideoManager.handleVideoInputForLayout(layout, { canvasRenderer, ipcRenderer });
}

function updateVideoStatus(text, colorClass) {
  VideoManager.updateVideoStatus(text, colorClass, { getElementById: document.getElementById.bind(document) });
}

// ===============================
// IPC Handlers Initialization
// ===============================

/**
 * Helper function to update menu state
 */
function updateMenuState() {
  if (canvasRenderer && canvasRenderer.state) {
    const clockVisible = canvasRenderer.state.showClock;
    ipcRenderer.send('update-menu-state', {
      clockVisible,
      displayVisible
    });
  }
}

// Initialize all IPC handlers with dependencies
initializeIPCHandlers({
  ipcRenderer,
  statusBar,
  timerState,
  clockState,
  displayState: {
    get visible() { return displayVisible; },
    setVisible(value) { displayVisible = value; }
  },
  getCanvasRenderer: () => canvasRenderer,
  getElements: () => ({
    startStopBtn,
    resetBtn,
    displayMessageBtn,
    coverImageBtn,
    updateButtonIcon,
    setInputsDisabled
  }),
  actions: {
    updateDisplay,
    formatTime,
    updateTimeFromInputs,
    sendStateUpdate,
    changeLayout,
    applyCanvasColors,
    setTheme,
    startClock,
    stopClock,
    updateMenuState,
    stopTimer: () => {
      // Stop the timer using the same logic as the stop button
      if (running || stoppedAtZero) {
        TimerControls.stopTimer(countdown, timerState, {
          startStopBtn,
          updateButtonIcon,
          setInputsDisabled,
          sendStateUpdate
        });
        running = false;
        stoppedAtZero = false;
      }
    },
    setMuteState: async (muted) => {
      soundsMuted = muted;
      try {
        await window.electron.settings.save('soundNotification', !soundsMuted);
        updateMuteButtonState();
        // Update appState for API consistency (soundEnabled = NOT soundsMuted)
        appState.update({
          'settings.soundEnabled': !soundsMuted
        });
        console.log('🔊 Sound notifications:', !soundsMuted ? 'enabled' : 'disabled');
      } catch (error) {
        console.error('Error updating sound settings:', error);
      }
    },
    toggleMuteState: async () => {
      soundsMuted = !soundsMuted;
      try {
        await window.electron.settings.save('soundNotification', !soundsMuted);
        updateMuteButtonState();
        // Update appState for API consistency (soundEnabled = NOT soundsMuted)
        appState.update({
          'settings.soundEnabled': !soundsMuted
        });
        console.log('🔊 Sound notifications:', !soundsMuted ? 'enabled' : 'disabled');
      } catch (error) {
        console.error('Error updating sound settings:', error);
      }
    },
    flashAtZero: () => {
      console.log('🔥 Manual flash triggered via API');
      flashAtZero(); // Call the same function as the flash button
    }
  }
});

// ===================================
// KEYBOARD SHORTCUTS INITIALIZATION
// ===================================

// Initialize keyboard shortcuts
keyboard.register('space', () => {
  if (startStopBtn && !startStopBtn.disabled) {
    VisualFeedback.ripple(startStopBtn, { clientX: 0, clientY: 0 });
    startStopBtn.click();
  }
}, 'Start/Stop timer');

keyboard.register('r', () => {
  if (resetBtn && !resetBtn.disabled) {
    VisualFeedback.ripple(resetBtn, { clientX: 0, clientY: 0 });
    resetBtn.click();
  }
}, 'Reset timer');

keyboard.register('arrowup', () => {
  const addBtn = document.getElementById('addMinute');
  if (addBtn && !addBtn.disabled) {
    VisualFeedback.pulse(addBtn);
    addBtn.click();
  }
}, 'Add one minute');

keyboard.register('arrowdown', () => {
  const subBtn = document.getElementById('subtractMinute');
  if (subBtn && !subBtn.disabled) {
    VisualFeedback.pulse(subBtn);
    subBtn.click();
  }
}, 'Subtract one minute');

// Advanced time controls with Shift and Ctrl modifiers
keyboard.register('shift+arrowup', () => {
  if (!stoppedAtZero) {
    VisualFeedback.flashSuccess(document.getElementById('addMinute'));
    addMinutes(5);
  }
}, 'Add 5 minutes');

keyboard.register('shift+arrowdown', () => {
  if (!stoppedAtZero) {
    VisualFeedback.flashSuccess(document.getElementById('subtractMinute'));
    subtractMinutes(5);
  }
}, 'Subtract 5 minutes');

keyboard.register('ctrl+arrowup', () => {
  if (!stoppedAtZero) {
    VisualFeedback.flashSuccess(document.getElementById('addMinute'));
    addMinutes(10);
  }
}, 'Add 10 minutes');

keyboard.register('ctrl+arrowdown', () => {
  if (!stoppedAtZero) {
    VisualFeedback.flashSuccess(document.getElementById('subtractMinute'));
    subtractMinutes(10);
  }
}, 'Subtract 10 minutes');

keyboard.register('f', () => {
  const flashBtn = document.getElementById('flashButton');
  if (flashBtn) {
    VisualFeedback.flashSuccess(flashBtn);
    flashBtn.click();
  }
}, 'Flash screen');

keyboard.register('m', () => {
  if (muteSoundsBtn) {
    VisualFeedback.pulse(muteSoundsBtn);
    muteSoundsBtn.click();
  }
}, 'Toggle sound mute');

keyboard.register('i', () => {
  const featureBtn = document.getElementById('coverImage');
  if (featureBtn) {
    VisualFeedback.pulse(featureBtn);
    featureBtn.click();
  }
}, 'Toggle feature image');

// Number keys 1-8 for quick presets
for (let i = 1; i <= 8; i++) {
  keyboard.register(String(i), () => {
    const presets = document.querySelectorAll('.preset');
    if (presets[i - 1]) {
      VisualFeedback.flashSuccess(presets[i - 1]);
      presets[i - 1].click();
    }
  }, `Activate preset ${i}`);
}

// Initialize keyboard manager
keyboard.init();



/**
 * Refresh the layout selector dropdown with current available layouts
 */
function refreshLayoutSelector() {
  const layoutSelector = document.getElementById('layoutSelector');
  if (!layoutSelector) return;
  
  const currentValue = layoutSelector.value;
  const availableLayouts = LayoutRegistry.getAllLayouts();
  
  // Get hidden layouts from localStorage
  let hiddenLayouts = [];
  try {
    hiddenLayouts = JSON.parse(localStorage.getItem('hiddenBuiltinLayouts') || '[]');
  } catch (e) {
    hiddenLayouts = [];
  }
  
  // Filter out hidden built-in layouts
  const visibleLayouts = availableLayouts.filter(layout => {
    if (layout.type === 'builtin' && hiddenLayouts.includes(layout.id)) {
      return false;
    }
    return true;
  });
  
  layoutSelector.innerHTML = '';
  
  visibleLayouts.forEach(layout => {
    const option = document.createElement('option');
    option.value = layout.id;
    option.textContent = layout.name;
    layoutSelector.appendChild(option);
  });
  
  // Restore previous selection if it still exists
  if (LayoutRegistry.hasLayout(currentValue)) {
    layoutSelector.value = currentValue;
  } else {
    // Fallback to default layout if current selection no longer exists
    layoutSelector.value = LayoutRegistry.getDefaultLayout();
    if (canvasRenderer) {
      const layout = LayoutRegistry.getLayout(layoutSelector.value);
      canvasRenderer.setLayout(layout);
    }
  }
}

// IPC handlers for layout management
if (window.electron && window.electron.ipcRenderer) {
  // Handle layout list updates from settings window
  window.electron.ipcRenderer.on('layout-list-updated', () => {
    refreshLayoutSelector();
  });
  
  // Handle external display connection to unified renderer
  window.electron.ipcRenderer.on('display-window-ready', (displayWindowId) => {
    if (canvasRenderer && canvasRenderer.getStream) {
      // Make the stream globally available for the display window
      window.canvasStream = canvasRenderer.getStream();
    }
  });
  
  // Handle server status updates from main process
  window.electron.ipcRenderer.on('companion-server-status', (serverStatus) => {
    logger.info('IPC', 'Received server status update:', serverStatus);
    
    // Update appState with server information
    appState.update({
      'server.running': serverStatus.running,
      'server.port': serverStatus.port,
      'server.error': serverStatus.error || null
    });
    
    logger.debug('SYSTEM', `Server status updated: ${serverStatus.running ? 'running' : 'stopped'}${serverStatus.port ? ` on port ${serverStatus.port}` : ''}`);
  });
  
  // Handle background image sync from settings window
  window.electron.ipcRenderer.on('sync-background-image', async (data) => {
    console.log('🖼️ Syncing background image in main window:', data);
    
    if (canvasRenderer && data.enabled && data.path) {
      try {
        await canvasRenderer.enableBackgroundImage(data.path, data.opacity || 1.0);
        updateDisplay();
        console.log('✅ Background image synced to preview canvas');
      } catch (error) {
        console.error('Error syncing background image:', error);
      }
    } else if (canvasRenderer && !data.enabled) {
      canvasRenderer.disableBackgroundImage();
      updateDisplay();
      console.log('✅ Background image disabled in preview canvas');
    }
  });
  
  // Handle request for current layout ID (removed - using direct JavaScript execution instead)
}

