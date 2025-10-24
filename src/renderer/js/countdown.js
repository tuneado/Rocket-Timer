// Import canvas effects module
import { createFlashAnimation } from './canvas/canvasEffects.js';
import statusBar from './statusBar.js';
import { formatTime } from './utils/timeFormatter.js';
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
let remainingTime = 0;
let totalTime = 0;
let running = false;
let clockInterval;
let lastSetTime = 45 * 60; // default to 45 minutes for first launch.

// Initialize Canvas Renderer
let canvasRenderer = null;

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
  get remainingTime() { return remainingTime; },
  get totalTime() { return totalTime; },
  get running() { return running; },
  get lastSetTime() { return lastSetTime; },
  setRemainingTime(value) { remainingTime = value; },
  setTotalTime(value) { totalTime = value; },
  setRunning(value) { running = value; },
  setLastSetTime(value) { lastSetTime = value; }
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
    console.log('Settings updated, reapplying...', settings);
    
    // Reapply colors
    if (settings.colors) {
      applyCanvasColors(settings.colors);
      // Force canvas redraw
      if (canvasRenderer) {
        updateDisplay();
      }
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

function addMinute() {
  TimeInputs.addMinute(timerState, updateDisplay);
}

function subtractMinute() {
  TimeInputs.subtractMinute(timerState, updateDisplay);
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
  
  // 2. Load and apply settings
  await loadAndApplySettings();
  
  // 3. Load saved layout or use default from settings
  const savedLayoutId = localStorage.getItem('canvasLayout') || LayoutRegistry.getDefaultLayout();
  const layout = LayoutRegistry.getLayout(savedLayoutId);
  
  // 4. Create canvas renderer with layout
  canvasRenderer = new CanvasRenderer('timerCanvas', layout);
  
  // 5. Apply theme to canvas
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  canvasRenderer.updateTheme(currentTheme);
  
  // 6. Initialize theme toggle
  if (localStorage.getItem("theme") === "light") {
    setTheme(false);
  } else {
    setTheme(true); // Default to dark mode
  }
  
  // 7. Update display to show initial time with correct progress (100%)
  updateDisplay();
  
  // 8. Send initial state to companion server
  sendStateUpdate();
  
  // 9. Start clock if enabled
  if (layout.clock && layout.clock.enabled) {
    startClock();
  }
  
  // Initialize clock state from localStorage
  if (localStorage.getItem("clock") === "on") {
    startClock();
  } else {
    stopClock();
  }
  
  // 10. Load saved presets from localStorage
  loadSavedPresets();
  
  // 11. Initialize layout selector
  const layoutSelector = document.getElementById('layoutSelector');
  if (layoutSelector) {
    layoutSelector.value = savedLayoutId;
    
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
  
  // 12. Initialize mute sounds button
  muteSoundsBtn = document.getElementById("muteSounds");
  if (muteSoundsBtn) {
    try {
      const settings = await window.electron.settings.getAll();
      soundsMuted = !settings.soundNotification;
      updateMuteButtonState();
    } catch (error) {
      console.error('Error loading sound settings:', error);
    }

    muteSoundsBtn.addEventListener("click", async () => {
      soundsMuted = !soundsMuted;
      
      try {
        await window.electron.settings.save('soundNotification', !soundsMuted);
        updateMuteButtonState();
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
});

// Note: IPC handlers are now initialized in modules/ipcHandlers.js
// See initialization at the end of this file

// Note: DOM elements for countdown/progress are no longer used in main window
// They've been replaced by canvas rendering

// Real DOM elements that still exist (controls)
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
    hideMessage
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
// Clock functions (now imported from ./modules/clockManager.js)
// --------------------



// --------------------
// Countdown functions
// --------------------
// Note: formatTime() now imported from ./utils/timeFormatter.js

// Helper function to update button icon and text using Bulma's button structure
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

function updateDisplay() {
  DisplayManager.updateDisplay(timerState, { canvasRenderer, ipcRenderer });
}

/**
 * Send state update to companion server
 */
function sendStateUpdate() {
  DisplayManager.sendStateUpdate(timerState, { canvasRenderer, ipcRenderer });
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
startStopBtn.addEventListener("click", () => {
  if (!running) {
    if (remainingTime <= 0) {
      const h = parseInt(document.getElementById("hours").value) || 0;
      const m = parseInt(document.getElementById("minutes").value) || 0;
      const s = parseInt(document.getElementById("seconds").value) || 0;
      totalTime = h * 3600 + m * 60 + s;
      remainingTime = totalTime;
      updateDisplay();
    }

    if (remainingTime > 0) {
      countdown = TimerControls.startTimer(timerState, {
        startStopBtn,
        updateButtonIcon,
        setInputsDisabled,
        updateDisplay,
        sendStateUpdate,
        handleTimerComplete
      });
    }
  } else {
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
    console.log('🔥 Manual flash triggered');
    flashAtZero();
  });
}

// Mute button state updater
function updateMuteButtonState() {
  if (!muteSoundsBtn) return;
  
  const icon = muteSoundsBtn.querySelector('i');
  
  if (soundsMuted) {
    icon.className = 'bi bi-volume-mute-fill';
    muteSoundsBtn.title = 'Unmute';
    muteSoundsBtn.classList.add('is-danger');
    muteSoundsBtn.classList.remove('is-light');
  } else {
    icon.className = 'bi bi-volume-up-fill';
    muteSoundsBtn.title = 'Mute';
    muteSoundsBtn.classList.remove('is-danger');
    muteSoundsBtn.classList.add('is-light');
  }
}

// Feature Image Button - Toggle feature image overlay
const featureImageBtn = document.getElementById("featureImage");
let featureImageEnabled = false;

if (featureImageBtn) {
  // Load initial state from settings
  window.electron.settings.getAll().then(settings => {
    if (settings.featureImage) {
      featureImageEnabled = settings.featureImage.enabled;
      updateFeatureImageButtonState();
      
      // Apply feature image if enabled and canvas is ready
      if (featureImageEnabled && settings.featureImage.path && canvasRenderer) {
        canvasRenderer.enableFeatureImage(settings.featureImage.path).catch(error => {
          console.error('Error loading feature image:', error);
        });
      }
    }
  }).catch(error => {
    console.error('Error loading feature image settings:', error);
  });

  featureImageBtn.addEventListener("click", async () => {
    try {
      const settings = await window.electron.settings.getAll();
      
      if (!settings.featureImage || !settings.featureImage.path) {
        alert('Please select a feature image in Settings > Appearance first.');
        return;
      }
      
      featureImageEnabled = !featureImageEnabled;
      
      // Update settings
      const featureImage = {
        ...settings.featureImage,
        enabled: featureImageEnabled
      };
      await window.electron.settings.save('featureImage', featureImage);
      
      // Toggle feature image on canvas
      if (featureImageEnabled) {
        await canvasRenderer.enableFeatureImage(settings.featureImage.path);
      } else {
        canvasRenderer.disableFeatureImage();
      }
      
      // Send to display window
      window.electron.ipcRenderer.send('toggle-feature-image', featureImageEnabled);
      
      updateFeatureImageButtonState();
      console.log('📷 Feature image:', featureImageEnabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Error toggling feature image:', error);
    }
  });
}

function updateFeatureImageButtonState() {
  if (!featureImageBtn) return;
  
  const icon = featureImageBtn.querySelector('i');
  
  if (featureImageEnabled) {
    icon.className = 'bi bi-image-fill';
    featureImageBtn.title = 'Hide Image';
    featureImageBtn.classList.add('is-primary');
    featureImageBtn.classList.remove('is-light');
  } else {
    icon.className = 'bi bi-image';
    featureImageBtn.title = 'Feature Image';
    featureImageBtn.classList.remove('is-primary');
    featureImageBtn.classList.add('is-light');
  }
}


// Presets
document.querySelectorAll(".preset").forEach(btn => {
  btn.addEventListener("click", (event) => {
    // Check if Cmd (Mac) or Ctrl (Windows/Linux) is held down
    if (event.metaKey || event.ctrlKey) {
      // Update preset with current input values
      updatePresetFromInputs(btn);
    } else {
      // Normal behavior: load preset time
      const minutes = parseInt(btn.dataset.minutes);
      totalTime = minutes * 60;
      remainingTime = totalTime;
      lastSetTime = totalTime;
      updateDisplay();
    }
  });
});

// Function to update preset button with current input values
function updatePresetFromInputs(button) {
  PresetManager.updatePresetFromInputs(button, { getElementById: document.getElementById.bind(document) });
}

//SET TIME
const timeInputs = ["hours", "minutes", "seconds"].map(id => document.getElementById(id));

// --------------------
// Message functions (now imported from ./modules/messageManager.js)
// --------------------

function setInputsDisabled(disabled) {
  // Time input fields
  ["hours", "minutes", "seconds"].forEach(id => {
    const input = document.getElementById(id);
    input.disabled = disabled;
    input.classList.toggle("muted", disabled);  // Add class for custom style
  });

  // Preset buttons
  document.querySelectorAll(".preset").forEach(btn => {
    btn.disabled = disabled;
    btn.classList.toggle("muted", disabled);  // Optional: to match the dimmed look
  });
}

// Handle manual input changes
timeInputs.forEach(input => {
  input.addEventListener("input", () => {
    if (running) {
      clearInterval(countdown);
      running = false;
      updateButtonIcon(startStopBtn, 'play-fill', 'Start');
      startStopBtn.classList.remove("stop");
      startStopBtn.classList.add("start");
      setInputsDisabled(false);
    }

    updateTimeFromInputs();

    // Save current input as last set time
    lastSetTime = totalTime;
  });
});


// Note: Default startup time is now set by loadAndApplySettings() from settings
// This ensures the time inputs match the defaultTime setting


// Theme toggle using Bulma's data-theme approach
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

// Message input event listeners
messageInput.addEventListener("input", updateCharCounter);
messageInput.addEventListener("paste", handlePaste);
messageInput.addEventListener("keydown", handleKeyDown);
messageInput.addEventListener("contextmenu", handleContextMenu);
displayMessageBtn.addEventListener("click", displayMessage);
clearMessageBtn.addEventListener("click", clearMessage);

// Handle right-click context menu
function handleContextMenu(event) {
  // Allow default context menu
}

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

// Init
loadSavedPresets();
// Note: updateDisplay() is now called in DOMContentLoaded after canvasRenderer is initialized

// Bootstrap Icons work automatically with CSS classes - no initialization needed

// Note: Video device change handler moved to modules/ipcHandlers.js

// Init
loadSavedPresets();
// Note: updateDisplay() is now called in DOMContentLoaded after canvasRenderer is initialized

// Bootstrap Icons work automatically with CSS classes - no initialization needed

// Listen for device changes from settings window (global listener)
if (window.electron && window.electron.ipcRenderer) {
  ipcRenderer.on('video-device-changed', async (deviceId) => {
    console.log('📹 Video device changed from settings:', deviceId);
    
    // Update localStorage
    localStorage.setItem('selectedVideoDevice', deviceId);
    
    // If video is currently enabled, restart it with the new device
    if (canvasRenderer) {
      const videoManager = canvasRenderer.getVideoInputManager();
      
      if (videoManager && videoManager.isEnabled()) {
        console.log('🔄 Restarting video input with new device:', deviceId);
        
        try {
          // Stop current video
          canvasRenderer.disableVideoInput();
          
          // Small delay to ensure cleanup
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Start with new device
          await canvasRenderer.enableVideoInput(deviceId);
          console.log('✅ Video input switched to new device successfully');
          
          // Force canvas redraw to show new video
          updateDisplay();
          
          // Notify main process that video is active
          if (window.electron && window.electron.ipcRenderer) {
            ipcRenderer.send('video-input-started', deviceId);
          }
        } catch (error) {
          console.error('Error switching video device:', error);
          alert('Error switching video device: ' + error.message);
        }
      } else {
        console.log('Video not currently active, device selection saved for next activation');
      }
    }
  });
}

// --------------------
// Video Input Controls (HDMI Capture)
// --------------------

/**
 * Automatically manage video input based on layout requirements
 * Starts video if layout has videoFrame enabled, stops if disabled
 */
async function handleVideoInputForLayout(layout) {
  await VideoManager.handleVideoInputForLayout(layout, { canvasRenderer, ipcRenderer });
}

function initializeVideoInputControls() {
  VideoManager.initializeVideoInputControls({
    canvasRenderer,
    ipcRenderer,
    getElementById: document.getElementById.bind(document),
    updateVideoStatus
  });
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
    displayMessageBtn
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
    updateMenuState
  }
});


