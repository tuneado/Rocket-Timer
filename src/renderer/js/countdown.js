let countdown;
let remainingTime = 0;
let totalTime = 0;
let running = false;
let clockInterval;
let lastSetTime = 45 * 60; // default to 45 minutes for first launch.

// Initialize Canvas Renderer
let canvasRenderer = null;

// Check if window.electron is available
if (!window.electron || !window.electron.ipcRenderer) {
  console.error('IPC renderer not available');
}

const { ipcRenderer } = window.electron;

// Initialize canvas renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load saved layout or use default
  const savedLayoutId = localStorage.getItem('canvasLayout') || LayoutRegistry.getDefaultLayout();
  const layout = LayoutRegistry.getLayout(savedLayoutId);
  
  // Create canvas renderer with layout
  canvasRenderer = new CanvasRenderer('timerCanvas', layout);
  console.log('Canvas renderer initialized with layout:', savedLayoutId);
  
  // Set initial theme
  const savedTheme = localStorage.getItem("theme") || "dark";
  canvasRenderer.updateTheme(savedTheme);
  
  // Update display to show initial time with correct progress (100%)
  console.log('Calling updateDisplay - totalTime:', totalTime, 'remainingTime:', remainingTime);
  updateDisplay();
});

// Note: DOM elements for countdown/progress are no longer used in main window
// They've been replaced by canvas rendering
// Keep references for backward compatibility but they won't be displayed
const countdownEl = { textContent: '00:25:00' }; // Dummy object
const progressBar = { value: 100, classList: { remove: () => {}, add: () => {} } }; // Dummy object
const clockEl = { textContent: '--:--:--', style: { display: 'block' } }; // Dummy object
const messageArea = { style: { opacity: '0' } }; // Dummy object
const messageText = { textContent: '' }; // Dummy object

// Real DOM elements that still exist (controls)
const startStopBtn = document.getElementById("startStop");
const resetBtn = document.getElementById("reset");
const addMinuteBtn = document.getElementById("addMinute");
const subtractMinuteBtn = document.getElementById("subtractMinute");
const messageInput = document.getElementById("messageInput");
const displayMessageBtn = document.getElementById("displayMessage");
const clearMessageBtn = document.getElementById("clearMessage");
const charCounter = document.getElementById("charCounter");


// --------------------
// Clock functions
// --------------------
function updateClock() {
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
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('clock-update', { time: timeString, visible: true });
  }
}

function startClock() {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
  
  // Update canvas renderer
  if (canvasRenderer) {
    canvasRenderer.setState({ showClock: true });
  }
  
  localStorage.setItem("clock", "on");
  
  // Update menu state
  if (window.electron && window.electron.ipcRenderer) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    ipcRenderer.send('update-menu-states', currentTheme, true);
  }
}

function stopClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  
  // Update canvas renderer
  if (canvasRenderer) {
    canvasRenderer.setState({ showClock: false });
  }
  
  localStorage.setItem("clock", "off");
  
  // Update menu state
  if (window.electron && window.electron.ipcRenderer) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    ipcRenderer.send('update-menu-states', currentTheme, false);
  }
}



// Restore saved clock setting
if (localStorage.getItem("clock") === "on") {
  startClock();
} else {
  stopClock();
}

// --------------------
// Countdown functions
// --------------------
function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

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

function updateProgressBarColor(progressPercent) {
  // Remove existing Bulma color classes
  progressBar.classList.remove('is-success', 'is-warning', 'is-danger');
  
  // Apply Bulma color classes based on percentage thresholds
  if (progressPercent >= 30) {
    progressBar.classList.add('is-success');
  } else if (progressPercent >= 10) {
    progressBar.classList.add('is-warning');
  } else {
    progressBar.classList.add('is-danger');
  }
}

function updateDisplay() {
  const formattedTime = formatTime(remainingTime);
  
  // Progress bar should go from 100% (full) to 0% (empty) as time runs down
  const progressPercent = totalTime > 0 ? (remainingTime / totalTime * 100) : 0;
  
  console.log('updateDisplay called - totalTime:', totalTime, 'remainingTime:', remainingTime, 'progressPercent:', progressPercent);
  
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

      countdown = setInterval(() => {
        if (remainingTime <= 0) {
          clearInterval(countdown);
          running = false;
          updateButtonIcon(startStopBtn, 'play-fill', 'Start');
          startStopBtn.classList.remove("stop");
          startStopBtn.classList.add("start");
          setInputsDisabled(false); // ✅ Re-enable inputs
          // Optional: alarm/notification
          return;
        }

        remainingTime--;
        updateDisplay();
      }, 1000);
    }

  } else {
    clearInterval(countdown);
    running = false;
    updateButtonIcon(startStopBtn, 'play-fill', 'Start');
    startStopBtn.classList.remove("stop");
    startStopBtn.classList.add("start");
    setInputsDisabled(false); // ✅ Re-enable inputs on stop
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
});


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

function normalizeTimeInputs() {
  const hoursInput = document.getElementById("hours");
  const minutesInput = document.getElementById("minutes");
  const secondsInput = document.getElementById("seconds");
  
  let h = parseInt(hoursInput.value) || 0;
  let m = parseInt(minutesInput.value) || 0;
  let s = parseInt(secondsInput.value) || 0;
  
  // Normalize seconds (carry over to minutes)
  if (s >= 60) {
    const extraMinutes = Math.floor(s / 60);
    m += extraMinutes;
    s = s % 60;
  }
  
  // Normalize minutes (carry over to hours)
  if (m >= 60) {
    const extraHours = Math.floor(m / 60);
    h += extraHours;
    m = m % 60;
  }
  
  // Update the input fields with normalized values
  hoursInput.value = h.toString().padStart(2, '0');
  minutesInput.value = m.toString().padStart(2, '0');
  secondsInput.value = s.toString().padStart(2, '0');
  
  return { hours: h, minutes: m, seconds: s };
}

function updateTimeFromInputs() {
  const normalized = normalizeTimeInputs();
  totalTime = normalized.hours * 3600 + normalized.minutes * 60 + normalized.seconds;
  remainingTime = totalTime;
  updateDisplay();
}

// Minute adjustment functions
function addMinute() {
  // Add 60 seconds (1 minute) to remaining time
  remainingTime += 60;
  
  // Also update total time if timer is not running (so progress bar works correctly)
  if (!running) {
    totalTime += 60;
    // Update the minutes input field to reflect the change
    const currentMinutes = parseInt(document.getElementById("minutes").value) || 0;
    document.getElementById("minutes").value = currentMinutes + 1;
  }
  
  updateDisplay();
}

function subtractMinute() {
  // Don't allow going below 0
  if (remainingTime <= 60) {
    remainingTime = 0;
    if (!running) {
      totalTime = 0;
      document.getElementById("minutes").value = 0;
      document.getElementById("hours").value = 0;
      document.getElementById("seconds").value = 0;
    }
  } else {
    // Subtract 60 seconds (1 minute) from remaining time
    remainingTime -= 60;
    
    // Also update total time if timer is not running
    if (!running) {
      totalTime -= 60;
      // Update the minutes input field to reflect the change
      const currentMinutes = parseInt(document.getElementById("minutes").value) || 0;
      if (currentMinutes > 0) {
        document.getElementById("minutes").value = currentMinutes - 1;
      }
    }
  }
  
  updateDisplay();
}

// --------------------
// Message functions
// --------------------
function updateCharCounter() {
  const currentLength = messageInput.value.length;
  const maxLength = messageInput.getAttribute('maxlength') || 100;
  
  charCounter.textContent = `${currentLength}/${maxLength}`;
  
  // Change color based on character count
  charCounter.classList.remove('warning', 'danger');
  if (currentLength >= maxLength * 0.9) {
    charCounter.classList.add('danger');
  } else if (currentLength >= maxLength * 0.7) {
    charCounter.classList.add('warning');
  }
}

let messageDisplayed = false;

function displayMessage() {
  const message = messageInput.value.trim();
  
  if (!messageDisplayed) {
    // Display message
    if (!message) {
      alert('Please enter a message to display.');
      return;
    }
    
    // Update canvas renderer
    if (canvasRenderer) {
      canvasRenderer.setState({
        message: message,
        showMessage: true
      });
    }
    
    // Send message to display window via IPC
    if (window.electron && window.electron.ipcRenderer) {
      ipcRenderer.send('display-message', message);
    }
    
    // Update button state
    updateButtonIcon(displayMessageBtn, 'eye-slash-fill', 'Hide Message');
    messageDisplayed = true;
  } else {
    // Hide message
    hideMessage();
  }
}

function hideMessage() {
  // Update canvas renderer
  if (canvasRenderer) {
    canvasRenderer.setState({
      message: '',
      showMessage: false
    });
  }
  
  // Clear message from display window
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('clear-message');
  }
  
  // Update button state
  updateButtonIcon(displayMessageBtn, 'display-fill', 'Display Message');
  messageDisplayed = false;
}

function clearMessage() {
  messageInput.value = '';
  updateCharCounter();
  
  // Hide message if it's currently displayed
  if (messageDisplayed) {
    hideMessage();
  }
}

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


// Set default startup time to 00:45:00
(function initializeDefaultTime() {
  const h = 0, m = 45, s = 0;
  document.getElementById("hours").value = h;
  document.getElementById("minutes").value = m;
  document.getElementById("seconds").value = s;

  totalTime = h * 3600 + m * 60 + s;
  remainingTime = totalTime;
  updateDisplay();
})();



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

// Add manual paste function for troubleshooting
async function manualPaste() {
  try {
    const clipboardText = await window.electron.clipboard.readText();
    if (clipboardText) {
      const maxLength = parseInt(messageInput.getAttribute('maxlength')) || 100;
      const currentPos = messageInput.selectionStart;
      const currentValue = messageInput.value;
      const beforeCursor = currentValue.substring(0, currentPos);
      const afterCursor = currentValue.substring(messageInput.selectionEnd);
      
      // Calculate how much text can be pasted
      const availableSpace = maxLength - beforeCursor.length - afterCursor.length;
      const textToPaste = clipboardText.substring(0, Math.max(0, availableSpace));
      
      // Insert the text
      const newValue = beforeCursor + textToPaste + afterCursor;
      messageInput.value = newValue;
      
      // Set cursor position after pasted text
      const newCursorPos = beforeCursor.length + textToPaste.length;
      messageInput.setSelectionRange(newCursorPos, newCursorPos);
      
      // Update character counter
      updateCharCounter();
      
      console.log('Manual paste successful:', textToPaste.length, 'characters');
    }
  } catch (error) {
    console.error('Manual paste failed:', error);
  }
}

// Handle right-click context menu
function handleContextMenu(event) {
  // Allow default context menu
}

// Handle paste events with Electron clipboard API
async function handlePaste(event) {
  console.log('Paste event detected');
  event.preventDefault(); // Prevent default paste behavior
  
  // Use the working manual paste logic
  await manualPaste();
}

// Handle keyboard shortcuts including Ctrl+V/Cmd+V
function handleKeyDown(event) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isCtrlV = (isMac && event.metaKey && event.key === 'v') || 
                  (!isMac && event.ctrlKey && event.key === 'v');
  
  if (isCtrlV) {
    console.log('Ctrl+V detected, triggering manual paste');
    event.preventDefault();
    manualPaste();
    return;
  }
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
    
    // Get current timer state
    const timerData = {
      formattedTime: formatTime(remainingTime),
      progressPercent: totalTime > 0 ? (remainingTime / totalTime * 100) : 0
    };
    
    // Get current clock state
    const isClockVisible = clockEl && clockEl.style.display !== 'none';
    const currentTime = clockEl ? clockEl.textContent : '00:00:00';
    const clockData = {
      time: currentTime,
      visible: isClockVisible
    };
    
    // Get current message state
    const isMessageVisible = messageArea && messageArea.style.opacity === '1';
    const currentMessage = messageText ? messageText.textContent : '';
    const messageData = {
      visible: isMessageVisible,
      text: currentMessage
    };

    // Send all current state to main process for forwarding to display window
    ipcRenderer.send('sync-current-state', {
      timer: timerData,
      clock: clockData,
      message: messageData,
      clockVisible: isClockVisible
    });
  });
}

// Request initial display window state when app loads
if (window.electron && window.electron.ipcRenderer) {
  ipcRenderer.send('request-display-state');
}

// Listen for clock state requests
ipcRenderer.on('request-clock-state', () => {
  const isClockVisible = clockEl.style.display !== 'none';
  const currentTime = clockEl.textContent;
  
  ipcRenderer.send('clock-state-response', { 
    time: currentTime, 
    visible: isClockVisible 
  });
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
    layoutSelector.addEventListener('change', (e) => {
      const layoutId = e.target.value;
      
      // Update canvas renderer
      if (canvasRenderer) {
        const layout = LayoutRegistry.getLayout(layoutId);
        canvasRenderer.setLayout(layout);
      }
      
      // Save to localStorage
      localStorage.setItem('canvasLayout', layoutId);
      
      // Notify display window
      if (window.electron && window.electron.ipcRenderer) {
        ipcRenderer.send('layout-changed', layoutId);
      }
    });
  }
  
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
    if (window.electron && window.electron.ipcRenderer) {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const clockVisible = clockEl.style.display !== 'none';
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


