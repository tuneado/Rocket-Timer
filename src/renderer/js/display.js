const { ipcRenderer } = window.electron;

const countdownEl = document.getElementById('countdown');
const progressBar = document.getElementById('progressBar');
const clockEl = document.getElementById('clock');

// Listen for timer updates from the main process
ipcRenderer.on('update-display', (data) => {
  if (data && typeof data === 'object') {
    if (data.formattedTime !== undefined) {
      countdownEl.textContent = data.formattedTime;
    }
    if (data.progressPercent !== undefined) {
      progressBar.style.width = `${data.progressPercent}%`;
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
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
});

// Request current theme when display window loads
if (window.electron && window.electron.ipcRenderer) {
  ipcRenderer.send('request-current-theme');
}