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
const themeToggle = document.getElementById("themeToggle");
const progressBar = document.getElementById("progressBar");
const clockEl = document.getElementById("clock");
const clockToggle = document.getElementById("clockToggle");


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
  clockToggle.textContent = "🕒 Hide Clock";
  localStorage.setItem("clock", "on");
  
  // Notify display window that clock is visible
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('toggle-clock-visibility', true);
  }
}

function stopClock() {
  clearInterval(clockInterval);
  clockEl.style.display = "none";
  clockToggle.textContent = "🕒 Show Clock";
  localStorage.setItem("clock", "off");
  
  // Notify display window that clock is hidden
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('toggle-clock-visibility', false);
  }
}

clockToggle.addEventListener("click", () => {
  if (clockEl.style.display === "none") {
    startClock();
  } else {
    stopClock();
  }
});

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

function updateDisplay() {
  const formattedTime = formatTime(remainingTime);
  countdownEl.textContent = formattedTime;

  // Progress bar should go from 100% (full) to 0% (empty) as time runs down
  const progressPercent = totalTime > 0 ? (remainingTime / totalTime * 100) : 0;
  progressBar.style.width = `${progressPercent}%`;

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
      startStopBtn.textContent = "Stop";
      startStopBtn.classList.remove("start");
      startStopBtn.classList.add("stop");
      setInputsDisabled(true); // 🔧 Disable inputs while running

      countdown = setInterval(() => {
        if (remainingTime <= 0) {
          clearInterval(countdown);
          running = false;
          startStopBtn.textContent = "Start";
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
    startStopBtn.textContent = "Start";
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
  startStopBtn.textContent = "Start";
  startStopBtn.classList.remove("stop");
  startStopBtn.classList.add("start");
  setInputsDisabled(false);
});


// Presets
document.querySelectorAll(".preset").forEach(btn => {
  btn.addEventListener("click", () => {
    const minutes = parseInt(btn.dataset.minutes);
    totalTime = minutes * 60;
    remainingTime = totalTime;
    lastSetTime = totalTime;
    updateDisplay();
  });
});


//SET TIME
const timeInputs = ["hours", "minutes", "seconds"].map(id => document.getElementById(id));

function updateTimeFromInputs() {
  const h = parseInt(document.getElementById("hours").value) || 0;
  const m = parseInt(document.getElementById("minutes").value) || 0;
  const s = parseInt(document.getElementById("seconds").value) || 0;
  totalTime = h * 3600 + m * 60 + s;
  remainingTime = totalTime;
  updateDisplay();
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
      startStopBtn.textContent = "Start";
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
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ Light Mode";
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "🌙 Dark Mode";
    localStorage.setItem("theme", "light");
  }
  
  // Send theme update to display window via IPC
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('update-theme', dark ? 'dark' : 'light');
  }
}

themeToggle.addEventListener("click", () => {
  setTheme(!document.body.classList.contains("dark"));
});

if (localStorage.getItem("theme") === "dark") {
  setTheme(true);
} else {
  setTheme(false);
}

//Toggle display
const toggleDisplayBtn = document.getElementById('toggleDisplay');
let displayVisible = false;

// Function to update button text based on display state
function updateDisplayButton(isVisible) {
  displayVisible = isVisible;
  toggleDisplayBtn.textContent = displayVisible ? "📺 Hide Display" : "📺 Show Display";
}

toggleDisplayBtn.addEventListener('click', () => {
  if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer.send('toggle-display-window');
  }
});

// Listen for display window state changes from main process
if (window.electron && window.electron.ipcRenderer) {
  ipcRenderer.on('display-window-state-changed', (isVisible) => {
    console.log('Display window state changed:', isVisible);
    updateDisplayButton(isVisible);
  });
  
  // Listen for when display window is closed manually
  ipcRenderer.on('display-window-closed', () => {
    console.log('Display window was closed');
    updateDisplayButton(false);
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
  const isDark = document.body.classList.contains('dark');
  ipcRenderer.send('current-theme-response', isDark ? 'dark' : 'light');
});

// Init
updateDisplay();

