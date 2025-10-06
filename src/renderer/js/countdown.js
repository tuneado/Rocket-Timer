let countdown;
let remainingTime = 0;
let totalTime = 0;
let running = false;
let clockInterval;
let lastSetTime = 45 * 60; // default to 45 minutes for first launch.

// Check if window.electron is available
if (!window.electron || !window.electron.ipcRenderer) {
  console.error('IPC renderer not available');
}

const { ipcRenderer } = window.electron;


const countdownEl = document.getElementById("countdown");
const startStopBtn = document.getElementById("startStop");
const resetBtn = document.getElementById("reset");
const progressBar = document.getElementById("progressBar");
const clockEl = document.getElementById("clock");
const addMinuteBtn = document.getElementById("addMinute");
const subtractMinuteBtn = document.getElementById("subtractMinute");
const messageInput = document.getElementById("messageInput");
const displayMessageBtn = document.getElementById("displayMessage");
const clearMessageBtn = document.getElementById("clearMessage");
const charCounter = document.getElementById("charCounter");
const messageArea = document.getElementById("messageArea");
const messageText = document.getElementById("messageText");


// --------------------
// Clock functions
// --------------------
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const timeString = `${h}:${m}:${s}`;
  
  // Update main window clock
  clockEl.textContent = timeString;
  
  // Send clock update to display window
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('clock-update', { time: timeString, visible: true });
  }
}

function startClock() {
  updateClock();
  clockEl.style.display = "block";
  clockInterval = setInterval(updateClock, 1000);
  localStorage.setItem("clock", "on");
  
  // Notify display window and update menu
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('toggle-clock-visibility', true);
    ipcRenderer.send('update-menu-states', document.body.classList.contains('dark') ? 'dark' : 'light', true);
  }
}

function stopClock() {
  clearInterval(clockInterval);
  clockEl.style.display = "none";
  localStorage.setItem("clock", "off");
  
  // Notify display window and update menu
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('toggle-clock-visibility', false);
    ipcRenderer.send('update-menu-states', document.body.classList.contains('dark') ? 'dark' : 'light', false);
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

// Helper function to update button icon using Bootstrap Icons classes
function updateButtonIcon(button, iconName, text) {
  // Find the icon element and update its Bootstrap Icons class
  const icon = button.querySelector('i.bi');
  if (icon) {
    // Remove all bi- classes and add the new one
    icon.className = `bi bi-${iconName}`;
  }
  
  // Update the text content (keeping the icon element)
  const textNodes = Array.from(button.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
  if (textNodes.length > 0) {
    textNodes[0].textContent = text;
  } else {
    button.appendChild(document.createTextNode(text));
  }
}

function updateProgressBarColor(progressPercent) {
  // Remove existing color classes
  progressBar.classList.remove('progress-green', 'progress-orange', 'progress-red');
  
  // Apply color based on percentage thresholds
  if (progressPercent >= 30) {
    progressBar.classList.add('progress-green');
  } else if (progressPercent >= 10) {
    progressBar.classList.add('progress-orange');
  } else {
    progressBar.classList.add('progress-red');
  }
}

function updateDisplay() {
  const formattedTime = formatTime(remainingTime);
  countdownEl.textContent = formattedTime;

  // Progress bar should go from 100% (full) to 0% (empty) as time runs down
  const progressPercent = totalTime > 0 ? (remainingTime / totalTime * 100) : 0;
  progressBar.style.width = `${progressPercent}%`;
  
  // Update progress bar color based on remaining time
  updateProgressBarColor(progressPercent);

  // Send updates to display window
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('timer-update', {
      formattedTime,
      progressPercent
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
    
    // Show in main window
    messageText.textContent = message;
    messageArea.style.display = 'flex';
    
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
  // Hide in main window
  messageText.textContent = '';
  messageArea.style.display = 'none';
  
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



// Theme toggle
function setTheme(dark) {
  if (dark) {
    // Dark mode: remove light class, add dark class
    document.body.classList.remove("light");
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    // Light mode: add light class, remove dark class
    document.body.classList.add("light");
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
  
  // Update menu state
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('update-theme', dark ? 'dark' : 'light');
    ipcRenderer.send('update-menu-states', dark ? 'dark' : 'light', clockEl.style.display !== 'none');
  }
}



// Minute adjustment button event listeners
addMinuteBtn.addEventListener("click", addMinute);
subtractMinuteBtn.addEventListener("click", subtractMinute);

// Message input event listeners
messageInput.addEventListener("input", updateCharCounter);
displayMessageBtn.addEventListener("click", displayMessage);
clearMessageBtn.addEventListener("click", clearMessage);

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
    
    // Send all current state to main process for forwarding to display window
    ipcRenderer.send('sync-current-state', {
      timer: timerData,
      clock: clockData,
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
updateDisplay();

// Bootstrap Icons work automatically with CSS classes - no initialization needed


