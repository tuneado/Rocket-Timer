const { ipcRenderer } = window.electron;

const countdownEl = document.getElementById('countdown');
const progressBar = document.getElementById('progressBar');
const clockEl = document.getElementById('clock');

// Function to update progress bar color based on percentage
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

// Listen for timer updates from the main process
ipcRenderer.on('update-display', (data) => {
  if (data && typeof data === 'object') {
    if (data.formattedTime !== undefined) {
      countdownEl.textContent = data.formattedTime;
    }
    if (data.progressPercent !== undefined) {
      progressBar.style.width = `${data.progressPercent}%`;
      // Update color based on progress
      updateProgressBarColor(data.progressPercent);
    }
  } else {
    console.warn('Invalid update-display data:', data);
  }
});

// Listen for clock updates from the main process
ipcRenderer.on('update-clock', (data) => {
  if (data && typeof data === 'object') {
    if (data.time !== undefined) {
      clockEl.textContent = data.time;
    }
    if (data.visible !== undefined) {
      clockEl.style.display = data.visible ? 'block' : 'none';
    }
  } else {
    console.warn('Invalid update-clock data:', data);
  }
});

// Listen for clock visibility changes
ipcRenderer.on('toggle-clock-display', (visible) => {
  if (visible !== undefined) {
    clockEl.style.display = visible ? 'block' : 'none';
  } else {
    console.warn('Invalid toggle-clock-display data:', visible);
  }
});

// Listen for theme changes from main process
ipcRenderer.on('theme-updated', (theme) => {
  console.log('Theme updated in display window:', theme);
  if (theme === 'light') {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  } else {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
  }
});

// Request current theme when display window loads
if (window.electron && window.electron.ipcRenderer) {
  // Theme synchronization - Request current theme
  ipcRenderer.send('request-current-theme');
}

// Bootstrap Icons work automatically with CSS classes - no initialization needed

// Message handling
const messageArea = document.getElementById('messageArea');
const messageText = document.getElementById('messageText');

// Listen for message display
ipcRenderer.on('show-message', (message) => {
  if (message && typeof message === 'string') {
    messageText.textContent = message;
    messageArea.style.display = 'flex';
  } else {
    console.warn('Invalid show-message data:', message);
  }
});

// Listen for message clear
ipcRenderer.on('clear-message', () => {
  messageText.textContent = '';
  messageArea.style.display = 'none';
});