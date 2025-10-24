// Import canvas effects module
import { createFlashAnimation } from './canvas/canvasEffects.js';
import statusBar from './statusBar.js';
import { formatTime } from './utils/timeFormatter.js';
import * as TimeInputs from './modules/timeInputs.js';
import * as ClockManager from './modules/clockManager.js';
import * as MessageManager from './modules/messageManager.js';

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
  try {
    const settings = await window.electron.settings.getAll();
    console.log('Loaded settings:', settings);
    
    // Apply default time
    if (settings.defaultTime) {
      const { hours, minutes, seconds } = settings.defaultTime;
      const timeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
      lastSetTime = timeInSeconds;
      remainingTime = timeInSeconds;
      totalTime = timeInSeconds;
      
      // Update input fields
      const hoursInput = document.getElementById('hours');
      const minutesInput = document.getElementById('minutes');
      const secondsInput = document.getElementById('seconds');
      if (hoursInput) hoursInput.value = hours;
      if (minutesInput) minutesInput.value = minutes;
      if (secondsInput) secondsInput.value = seconds;
      
      console.log('Applied default time:', hours, 'h', minutes, 'm', seconds, 's');
    }
    
    // Apply default layout
    if (settings.defaultLayout) {
      localStorage.setItem('canvasLayout', settings.defaultLayout);
      const layoutSelector = document.getElementById('layoutSelector');
      if (layoutSelector) {
        layoutSelector.value = settings.defaultLayout;
      }
    }
    
    // Apply default theme
    if (settings.defaultTheme) {
      const theme = settings.defaultTheme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.defaultTheme;
      
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.checked = theme === 'dark';
      }
    }
    
    // Apply canvas colors if they exist
    if (settings.colors) {
      applyCanvasColors(settings.colors);
    }
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Apply canvas colors from settings
 */
function applyCanvasColors(colors) {
  const root = document.documentElement;
  
  if (colors.countdown) root.style.setProperty('--canvas-countdown-color', colors.countdown);
  if (colors.clock) root.style.setProperty('--canvas-clock-color', colors.clock);
  if (colors.elapsed) root.style.setProperty('--canvas-elapsed-color', colors.elapsed);
  if (colors.message) root.style.setProperty('--canvas-message-color', colors.message);
  if (colors.messageBackground) root.style.setProperty('--canvas-message-background-color', colors.messageBackground);
  if (colors.separator) root.style.setProperty('--canvas-separator-color', colors.separator);
  if (colors.background) root.style.setProperty('--canvas-background', colors.background);
  
  if (colors.progressSuccess) {
    root.style.setProperty('--canvas-progress-success-start', colors.progressSuccess);
    root.style.setProperty('--canvas-progress-success-end', colors.progressSuccess);
  }
  if (colors.progressWarning) {
    root.style.setProperty('--canvas-progress-warning-start', colors.progressWarning);
    root.style.setProperty('--canvas-progress-warning-end', colors.progressWarning);
  }
  if (colors.progressDanger) {
    root.style.setProperty('--canvas-progress-danger-start', colors.progressDanger);
    root.style.setProperty('--canvas-progress-danger-end', colors.progressDanger);
  }
  
  console.log('Applied canvas colors from settings');
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

// Initialize canvas renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize status bar
  statusBar.init();
  
  // Load and apply settings
  await loadAndApplySettings();
  
  // Load saved layout or use default from settings
  const savedLayoutId = localStorage.getItem('canvasLayout') || LayoutRegistry.getDefaultLayout();
  const layout = LayoutRegistry.getLayout(savedLayoutId);
  
  // Create canvas renderer with layout
  canvasRenderer = new CanvasRenderer('timerCanvas', layout);
  
  // Apply theme to canvas (already set by loadAndApplySettings)
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  canvasRenderer.updateTheme(currentTheme);
  
  // Update display to show initial time with correct progress (100%)
  updateDisplay();
  
  // Send initial state to companion server
  sendStateUpdate();
  
  // Start clock if the layout has clock enabled
  if (layout.clock && layout.clock.enabled) {
    startClock();
  }
  
  // Notify main process that renderer is ready
  ipcRenderer.send('main-window-ready');
});

// Listen for settings updates from settings window
if (window.electron && window.electron.ipcRenderer) {
  window.electron.ipcRenderer.on('apply-settings', (settings) => {
    console.log('Received apply-settings event:', settings);
    
    // Apply default time
    if (settings.defaultTime) {
      const { hours, minutes, seconds } = settings.defaultTime;
      const timeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
      
      // Only update if timer is not running
      if (!running) {
        lastSetTime = timeInSeconds;
        remainingTime = timeInSeconds;
        totalTime = timeInSeconds;
        updateDisplay();
      }
    }
    
    // Note: We don't apply defaultLayout here because it's a preference for NEW sessions
    // The user may have manually selected a different layout in the current session
    // defaultLayout is only used on app startup (see DOMContentLoaded)
    
    // Apply theme
    if (settings.defaultTheme) {
      const theme = settings.defaultTheme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.defaultTheme;
      
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      if (canvasRenderer) {
        canvasRenderer.updateTheme(theme);
        updateDisplay();
      }
      
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.checked = theme === 'dark';
      }
    }
    
    // Apply canvas colors
    if (settings.colors) {
      applyCanvasColors(settings.colors);
      if (canvasRenderer) {
        updateDisplay();
      }
    }
    
    // Apply performance settings
    if (canvasRenderer) {
      canvasRenderer.applyPerformanceSettings(settings);
    }
    
    console.log('Settings applied successfully');
  });
}

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
  // Send flash event to display window
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('flash-at-zero');
  }
  
  // Trigger flash animation on main window
  createFlashAnimation(canvasRenderer);
}

/**
 * Handle timer completion (when countdown reaches 0:00:00)
 */
async function handleTimerComplete() {
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

function updateDisplay() {
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
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('timer-update', {
      formattedTime,
      progressPercent,
      elapsed: elapsedDisplay
    });
  }
}

/**
 * Send state update to companion server
 */
function sendStateUpdate() {
  if (!window.electron || !window.electron.ipcRenderer) return;
  
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
 * Change canvas layout by ID
 */
function changeLayout(layoutId) {
  if (canvasRenderer) {
    const layout = LayoutRegistry.getLayout(layoutId);
    if (layout) {
      canvasRenderer.setLayout(layout);
      
      // Update layout selector if it exists
      const layoutSelector = document.getElementById('layoutSelector');
      if (layoutSelector) {
        layoutSelector.value = layoutId;
      }
      
      // Save to localStorage
      localStorage.setItem('canvasLayout', layoutId);
      
      // Notify display window
      if (window.electron && window.electron.ipcRenderer) {
        ipcRenderer.send('layout-changed', layoutId);
      }
      
      // Auto-manage video input based on layout
      handleVideoInputForLayout(layout);
    }
  }
}

ipcRenderer.on('menu-toggle-display', (event, value) => {
  displayVisible = value;
  ipcRenderer.send('toggle-display', displayVisible);
  updateMenuState();
});

ipcRenderer.on('menu-toggle-clock', (_, value) => {
  clockVisible = value;
  if (clockVisible) {
    startClock();
  } else {
    stopClock();
  }
  updateMenuState();
});

// Listen for companion server status updates
ipcRenderer.on('companion-server-status', (status) => {
  if (status.running) {
    statusBar.setServerStatus('active', status.port);
  } else if (status.error) {
    statusBar.setServerStatus('error');
    statusBar.error(`API Server Error: ${status.error}`, 5000);
  } else {
    statusBar.setServerStatus('inactive');
  }
});

// Listen for companion commands from API
ipcRenderer.on('companion-command', (command) => {
  console.log('🎮 Received companion command:', command);
  const { action, data } = command;
  
  switch (action) {
    case 'start':
      if (!running && remainingTime > 0) {
        startStopBtn.click();
      }
      break;
      
    case 'stop':
    case 'pause':
      if (running) {
        startStopBtn.click();
      }
      break;
      
    case 'reset':
      resetBtn.click();
      break;
      
    case 'setTime':
      if (data) {
        const { hours = 0, minutes = 0, seconds = 0 } = data;
        
        // Stop timer if running
        if (running) {
          startStopBtn.click();
        }
        
        // Update input fields
        document.getElementById('hours').value = hours;
        document.getElementById('minutes').value = minutes;
        document.getElementById('seconds').value = seconds;
        
        // Update time and send state
        updateTimeFromInputs();
        lastSetTime = totalTime; // Save as last set time
      }
      break;
      
    case 'loadPreset':
      if (data && data.preset) {
        const presetBtn = document.querySelector(`button[data-preset="${data.preset}"]`);
        if (presetBtn) presetBtn.click();
      }
      break;
      
    case 'changeLayout':
      if (data && data.layout) {
        changeLayout(data.layout);
      }
      break;
      
    case 'setMessage':
      if (data && data.message) {
        document.getElementById('messageInput').value = data.message;
        displayMessageBtn.click();
      }
      break;
  }
  
  // Send state update after command
  sendStateUpdate();
});

function updateMenuState() {
  ipcRenderer.send('update-menu-state', {
    clockVisible,
    displayVisible
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
      running = true;
      updateButtonIcon(startStopBtn, 'pause-fill', 'Stop');
      startStopBtn.classList.remove("start");
      startStopBtn.classList.add("stop");
      setInputsDisabled(true); // 🔧 Disable inputs while running
      sendStateUpdate(); // Notify companion server

      countdown = setInterval(async () => {
        // Trigger completion actions when reaching exactly zero
        if (remainingTime === 0) {
          handleTimerComplete();
        }
        
        // Get auto-stop setting
        let autoStopAtZero = true; // Default to true
        try {
          const settings = await window.electron.settings.getAll();
          autoStopAtZero = settings.autoStopAtZero !== false;
        } catch (error) {
          console.error('Error getting autoStopAtZero setting:', error);
        }

        if (autoStopAtZero && remainingTime <= 0) {
          clearInterval(countdown);
          running = false;
          updateButtonIcon(startStopBtn, 'play-fill', 'Start');
          startStopBtn.classList.remove("stop");
          startStopBtn.classList.add("start");
          setInputsDisabled(false); // ✅ Re-enable inputs
          return;
        }

        remainingTime--;
        updateDisplay();
        sendStateUpdate(); // Notify companion server of time change
      }, 1000);
    }

  } else {
    clearInterval(countdown);
    running = false;
    updateButtonIcon(startStopBtn, 'play-fill', 'Start');
    startStopBtn.classList.remove("stop");
    startStopBtn.classList.add("start");
    setInputsDisabled(false); // ✅ Re-enable inputs on stop
    sendStateUpdate(); // Notify companion server
  }
});


// Reset
resetBtn.addEventListener("click", () => {
  clearInterval(countdown);
  running = false;
  totalTime = lastSetTime;
  remainingTime = lastSetTime;

  // Reflect last set time in UI
  const h = Math.floor(lastSetTime / 3600);
  const m = Math.floor((lastSetTime % 3600) / 60);
  const s = lastSetTime % 60;

  document.getElementById("hours").value = h;
  document.getElementById("minutes").value = m;
  document.getElementById("seconds").value = s;

  updateDisplay();
  updateButtonIcon(startStopBtn, 'play-fill', 'Start');
  startStopBtn.classList.remove("stop");
  startStopBtn.classList.add("start");
  setInputsDisabled(false);
  sendStateUpdate(); // Notify companion server
});


// Flash Button - Manually trigger flash effect
const flashBtn = document.getElementById("flashButton");
if (flashBtn) {
  flashBtn.addEventListener("click", () => {
    console.log('🔥 Manual flash triggered');
    flashAtZero();
  });
}


// Mute Sounds Button - Toggle sound notifications
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  muteSoundsBtn = document.getElementById("muteSounds");

  if (muteSoundsBtn) {
    // Load initial mute state from settings
    window.electron.settings.getAll().then(settings => {
      soundsMuted = !settings.soundNotification;
      updateMuteButtonState();
    }).catch(error => {
      console.error('Error loading sound settings:', error);
    });

    muteSoundsBtn.addEventListener("click", async () => {
      soundsMuted = !soundsMuted;
      
      // Update settings
      try {
        await window.electron.settings.save('soundNotification', !soundsMuted);
        updateMuteButtonState();
        console.log('🔊 Sound notifications:', !soundsMuted ? 'enabled' : 'disabled');
      } catch (error) {
        console.error('Error updating sound settings:', error);
      }
    });
  }
});

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
  const hours = parseInt(document.getElementById("hours").value) || 0;
  const minutes = parseInt(document.getElementById("minutes").value) || 0;
  const seconds = parseInt(document.getElementById("seconds").value) || 0;
  
  // Calculate total time in seconds
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const totalMinutes = Math.floor(totalSeconds / 60);
  
  // Don't allow empty or zero time
  if (totalSeconds === 0) {
    alert("Please set a time before updating the preset!");
    return;
  }
  
  // Update button's data attribute and display text
  button.dataset.minutes = totalMinutes;
  
  // Format display text (show hours:minutes if hours > 0, otherwise just minutes:seconds)
  let displayText;
  if (hours > 0) {
    displayText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (minutes > 0) {
    displayText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    displayText = `00:${String(seconds).padStart(2, '0')}`;
  }
  
  button.textContent = displayText;
  
  // Save to localStorage for persistence
  const presetIndex = Array.from(document.querySelectorAll(".preset")).indexOf(button);
  localStorage.setItem(`preset-${presetIndex}`, JSON.stringify({
    minutes: totalMinutes,
    displayText: displayText,
    totalSeconds: totalSeconds
  }));
  
  // Visual feedback
  button.style.backgroundColor = 'var(--countdown)';
  button.style.color = 'white';
  setTimeout(() => {
    button.style.backgroundColor = '';
    button.style.color = '';
  }, 200);
  
  console.log(`Preset updated: ${displayText} (${totalSeconds} seconds)`);
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
  // Default preset values: 5, 10, 15, 20, 25, 30, 45, 60 minutes
  const defaultPresets = [5, 10, 15, 20, 25, 30, 45, 60];
  const presetButtons = document.querySelectorAll(".preset");
  
  presetButtons.forEach((btn, index) => {
    if (index < defaultPresets.length) {
      const minutes = defaultPresets[index];
      btn.setAttribute("data-minutes", minutes);
      
      // Format time display
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = hours > 0 ? 
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00` : 
        `${String(mins).padStart(2, '0')}:00`;
      
      btn.textContent = timeString;
      
      // Clear saved preset from localStorage
      localStorage.removeItem(`preset-${index}`);
    }
  });
  
  console.log("Presets reset to default values");
}

// Initialize character counter
updateCharCounter();



// Display window management (handled via menu)
// Listen for display window state changes from main process
if (window.electron && window.electron.ipcRenderer) {
  // Listen for when display window is closed manually
  ipcRenderer.on('display-window-closed', () => {
    console.log('Display window was closed');
  });
  
  // Listen for requests to sync current state to display window
  ipcRenderer.on('request-current-state-for-display', () => {
    console.log('Syncing current state to display window');
    
    // Get current state from canvas renderer (most reliable source)
    const canvasState = canvasRenderer.state;
    
    console.log('Canvas state at sync:', canvasState);
    console.log('remainingTime:', remainingTime, 'totalTime:', totalTime);
    
    // Get current timer state - use canvas state as fallback
    const timerData = {
      formattedTime: canvasState.countdown || formatTime(remainingTime),
      progressPercent: canvasState.progress !== undefined ? canvasState.progress : (totalTime > 0 ? (remainingTime / totalTime * 100) : 0)
    };
    
    // Get current clock state from canvasRenderer
    const clockData = {
      time: canvasState.clock || '--:--:--',
      visible: canvasState.showClock || false
    };
    
    // Get current message state from canvasRenderer
    const messageData = {
      visible: canvasState.showMessage || false,
      text: canvasState.message || ''
    };
    
    // Get current video input state
    let videoData = null;
    if (canvasRenderer) {
      const videoManager = canvasRenderer.getVideoInputManager();
      if (videoManager && videoManager.isEnabled()) {
        const currentDevice = videoManager.getCurrentDevice();
        videoData = {
          enabled: true,
          deviceId: currentDevice ? currentDevice.id : null,
          opacity: videoManager.getOpacity()
        };
      }
    }
    
    // Get current feature image state
    let featureImageData = null;
    if (canvasRenderer && canvasRenderer.featureImage.enabled) {
      featureImageData = {
        enabled: true,
        path: canvasRenderer.featureImage.path
      };
    }

    // Send all current state to main process for forwarding to display window
    ipcRenderer.send('sync-current-state', {
      timer: timerData,
      clock: clockData,
      message: messageData,
      clockVisible: canvasState.showClock,
      video: videoData,
      featureImage: featureImageData
    });
  });
}

// Request initial display window state when app loads
if (window.electron && window.electron.ipcRenderer) {
  ipcRenderer.send('request-display-state');
}

// Listen for clock state requests
ipcRenderer.on('request-clock-state', () => {
  if (canvasRenderer && canvasRenderer.state) {
    const state = canvasRenderer.state;
    const isClockVisible = state.showClock;
    const currentTime = state.clock || '';
    
    ipcRenderer.send('clock-state-response', { 
      time: currentTime, 
      visible: isClockVisible 
    });
  } else {
    // Fallback if canvasRenderer not ready
    ipcRenderer.send('clock-state-response', { 
      time: '', 
      visible: false 
    });
  }
});

// Listen for theme requests from display window
ipcRenderer.on('request-current-theme-for-display', () => {
  const isLight = document.body.classList.contains('light');
  ipcRenderer.send('current-theme-response', isLight ? 'light' : 'dark');
});

// Function to load saved presets from localStorage
function loadSavedPresets() {
  document.querySelectorAll(".preset").forEach((button, index) => {
    const savedPreset = localStorage.getItem(`preset-${index}`);
    if (savedPreset) {
      try {
        const presetData = JSON.parse(savedPreset);
        button.dataset.minutes = presetData.minutes;
        button.textContent = presetData.displayText;
        console.log(`Loaded preset ${index}: ${presetData.displayText}`);
      } catch (error) {
        console.warn(`Failed to load preset ${index}:`, error);
      }
    }
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Load saved presets from localStorage
  loadSavedPresets();
  
  // Initialize layout selector
  const layoutSelector = document.getElementById('layoutSelector');
  if (layoutSelector) {
    // Set saved layout
    const savedLayoutId = localStorage.getItem('canvasLayout') || LayoutRegistry.getDefaultLayout();
    layoutSelector.value = savedLayoutId;
    
    // Handle layout changes
    layoutSelector.addEventListener('change', async (e) => {
      const layoutId = e.target.value;
      
      // Update canvas renderer
      if (canvasRenderer) {
        const layout = LayoutRegistry.getLayout(layoutId);
        canvasRenderer.setLayout(layout);
        
        // Auto-manage video input based on layout
        await handleVideoInputForLayout(layout);
      }
      
      // Save to localStorage
      localStorage.setItem('canvasLayout', layoutId);
      
      // Notify display window
      if (window.electron && window.electron.ipcRenderer) {
        ipcRenderer.send('layout-changed', layoutId);
      }
      
      // Notify companion server
      sendStateUpdate();
    });
  }
  
  // Note: Video input controls have been moved to the settings page
  // They are no longer in the main window, so we don't initialize them here
  
  // Auto-start video input if current layout uses video
  setTimeout(async () => {
    const currentLayoutId = localStorage.getItem('canvasLayout') || LayoutRegistry.getDefaultLayout();
    const currentLayout = LayoutRegistry.getLayout(currentLayoutId);
    await handleVideoInputForLayout(currentLayout);
  }, 500); // Small delay to ensure canvas is ready
  
  // Initialize theme based on stored preference or default to dark
  if (localStorage.getItem("theme") === "light") {
    setTheme(false);
  } else {
    setTheme(true); // Default to dark mode
  }
  
  // Initialize clock state and update menu
  if (localStorage.getItem("clock") === "on") {
    startClock();
  } else {
    stopClock();
  }
  
  // Send initial menu state after theme is set
  setTimeout(() => {
    if (window.electron && window.electron.ipcRenderer && canvasRenderer && canvasRenderer.state) {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const state = canvasRenderer.state;
      const clockVisible = state.showClock;
      ipcRenderer.send('update-menu-states', currentTheme, clockVisible);
    }
  }, 100);
});

// Menu event listeners
if (window.electron && window.electron.ipcRenderer) {
  // Theme change from menu
  ipcRenderer.on('menu-theme-change', (theme) => {
    setTheme(theme === 'dark');
  });
  
  // Clock toggle from menu
  ipcRenderer.on('menu-toggle-clock', (visible) => {
    if (visible) {
      startClock();
    } else {
      stopClock();
    }
  });
  
  // Start/Stop from menu
  ipcRenderer.on('menu-start-stop', () => {
    if (startStopBtn) {
      startStopBtn.click();
    }
  });
  
  // Reset from menu
  ipcRenderer.on('menu-reset', () => {
    if (resetBtn) {
      resetBtn.click();
    }
  });
}

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
  // Check if layout requires video input
  const needsVideo = layout.videoFrame && layout.videoFrame.enabled;
  
  if (!canvasRenderer) {
    console.warn('Canvas renderer not available');
    return;
  }
  
  // Initialize video manager if needed
  if (!canvasRenderer.getVideoInputManager()) {
    canvasRenderer.initializeVideoInput();
  }
  
  const videoManager = canvasRenderer.getVideoInputManager();
  
  if (needsVideo) {
    // Layout needs video - try to start it
    console.log('📹 Layout requires video input, attempting to start...');
    
    // Check if we have a selected device
    const savedDeviceId = localStorage.getItem('selectedVideoDevice');
    
    if (savedDeviceId && !videoManager.isEnabled()) {
      try {
        // Auto-detect devices first if not already detected
        if (videoManager.devices.length === 0) {
          await videoManager.initialize();
        }
        
        // Start video with saved/selected device
        await canvasRenderer.enableVideoInput(savedDeviceId);
        console.log('✅ Video input auto-started for layout');
        
        // Notify display window
        if (window.electron && window.electron.ipcRenderer) {
          ipcRenderer.send('video-input-started', savedDeviceId);
        }
      } catch (error) {
        console.warn('Could not auto-start video input:', error.message);
      }
    } else if (!savedDeviceId) {
      // No device selected - user needs to configure in settings
      console.log('⚠️ No video device selected - configure in settings');
    } else if (videoManager.isEnabled()) {
      console.log('✅ Video already active');
    }
    
  } else {
    // Layout doesn't need video - stop it to save resources
    if (videoManager.isEnabled()) {
      console.log('⏹️ Layout doesn\'t use video, stopping to save resources...');
      
      canvasRenderer.disableVideoInput();
      
      // Notify display window
      if (window.electron && window.electron.ipcRenderer) {
        ipcRenderer.send('video-input-stopped');
      }
      
      console.log('✅ Video input auto-stopped to save resources');
    }
  }
}

function initializeVideoInputControls() {
  const detectDevicesBtn = document.getElementById('detectDevices');
  const videoDeviceSelector = document.getElementById('videoDeviceSelector');
  const startVideoBtn = document.getElementById('startVideo');
  const stopVideoBtn = document.getElementById('stopVideo');
  const videoStatus = document.getElementById('videoStatus');
  
  if (!detectDevicesBtn || !videoDeviceSelector || !startVideoBtn || !stopVideoBtn) {
    console.warn('Video input controls not found in DOM');
    return;
  }
  
  // Detect video devices
  detectDevicesBtn.addEventListener('click', async () => {
    try {
      detectDevicesBtn.disabled = true;
      detectDevicesBtn.classList.add('is-loading');
      
      // Initialize video input manager if needed
      if (canvasRenderer && !canvasRenderer.getVideoInputManager()) {
        canvasRenderer.initializeVideoInput();
      }
      
      const videoManager = canvasRenderer.getVideoInputManager();
      const devices = await videoManager.initialize();
      
      // Populate dropdown
      videoDeviceSelector.innerHTML = '';
      
      if (devices.length === 0) {
        videoDeviceSelector.innerHTML = '<option value="">No video devices found</option>';
        videoDeviceSelector.disabled = true;
        startVideoBtn.disabled = true;
        updateVideoStatus('No Devices', 'is-light');
      } else {
        devices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.id;
          option.textContent = device.label;
          videoDeviceSelector.appendChild(option);
        });
        
        // Restore previously selected device if available
        const savedDeviceId = localStorage.getItem('selectedVideoDevice');
        if (savedDeviceId) {
          videoDeviceSelector.value = savedDeviceId;
        }
        
        videoDeviceSelector.disabled = false;
        startVideoBtn.disabled = false;
        updateVideoStatus(`${devices.length} Device${devices.length > 1 ? 's' : ''} Found`, 'is-info');
      }
      
      console.log(`📹 Found ${devices.length} video device(s)`);
      
    } catch (error) {
      console.error('Error detecting video devices:', error);
      alert('Error detecting video devices. Please ensure you have granted camera permissions.');
      updateVideoStatus('Error', 'is-danger');
    } finally {
      detectDevicesBtn.disabled = false;
      detectDevicesBtn.classList.remove('is-loading');
    }
  });
  
  // Start video input
  startVideoBtn.addEventListener('click', async () => {
    try {
      const deviceId = videoDeviceSelector.value;
      if (!deviceId) {
        alert('Please select a video device first');
        return;
      }
      
      startVideoBtn.disabled = true;
      startVideoBtn.classList.add('is-loading');
      
      const videoInfo = await canvasRenderer.enableVideoInput(deviceId);
      
      console.log('✅ Video input started:', videoInfo);
      
      // Save selected device for auto-start
      localStorage.setItem('selectedVideoDevice', deviceId);
      
      // Sync with display window
      if (window.electron && window.electron.ipcRenderer) {
        ipcRenderer.send('video-input-started', deviceId);
      }
      
      // Update UI
      updateVideoStatus('Active', 'is-success');
      stopVideoBtn.disabled = false;
      videoDeviceSelector.disabled = true;
      detectDevicesBtn.disabled = true;
      
    } catch (error) {
      console.error('Error starting video input:', error);
      alert('Error starting video input: ' + error.message);
      updateVideoStatus('Error', 'is-danger');
    } finally {
      startVideoBtn.disabled = false;
      startVideoBtn.classList.remove('is-loading');
    }
  });
  
  // Stop video input
  stopVideoBtn.addEventListener('click', () => {
    canvasRenderer.disableVideoInput();
    
    // Sync with display window
    if (window.electron && window.electron.ipcRenderer) {
      ipcRenderer.send('video-input-stopped');
    }
    
    // Update UI
    updateVideoStatus('Inactive', 'is-light');
    stopVideoBtn.disabled = true;
    startVideoBtn.disabled = false;
    videoDeviceSelector.disabled = false;
    detectDevicesBtn.disabled = false;
    
    console.log('⏹️ Video input stopped');
  });
  
  // Save device selection when changed
  videoDeviceSelector.addEventListener('change', (e) => {
    const deviceId = e.target.value;
    if (deviceId) {
      localStorage.setItem('selectedVideoDevice', deviceId);
      console.log('📹 Video device selected:', deviceId);
    }
  });
}

function updateVideoStatus(text, colorClass) {
  const videoStatus = document.getElementById('videoStatus');
  if (videoStatus) {
    // Remove existing color classes
    videoStatus.classList.remove('is-light', 'is-info', 'is-success', 'is-warning', 'is-danger');
    
    // Add new color class
    if (colorClass) {
      videoStatus.classList.add(colorClass);
    }
    
    // Update text
    const textSpan = videoStatus.querySelector('span:last-child');
    if (textSpan) {
      textSpan.textContent = text;
    }
  }
}


