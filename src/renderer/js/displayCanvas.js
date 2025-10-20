/**
 * Display Canvas Handler for External Display Window
 * Creates a canvas renderer that mirrors the main window's canvas
 * Receives state updates via IPC and renders them
 */

const { ipcRenderer } = window.electron;

// Initialize canvas renderer for external display
let displayRenderer = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing display canvas renderer...');
  
  // Load saved layout or use default
  const savedLayoutId = localStorage.getItem('canvasLayout') || LayoutRegistry.getDefaultLayout();
  const layout = LayoutRegistry.getLayout(savedLayoutId);
  
  // Create canvas renderer for fullscreen display
  displayRenderer = new CanvasRenderer('displayCanvas', layout);
  
  // Request current theme
  ipcRenderer.send('request-current-theme');
  
  // Request current state sync
  ipcRenderer.send('request-display-sync');
  
  console.log('Display canvas renderer initialized with layout:', savedLayoutId);
});

// Listen for timer updates from main window
ipcRenderer.on('update-display', (data) => {
  if (displayRenderer && data && typeof data === 'object') {
    if (data.formattedTime !== undefined) {
      displayRenderer.setState({ countdown: data.formattedTime });
    }
    if (data.progressPercent !== undefined) {
      displayRenderer.setState({ progress: data.progressPercent });
    }
  }
});

// Listen for clock updates
ipcRenderer.on('update-clock', (data) => {
  if (displayRenderer && data && typeof data === 'object') {
    if (data.time !== undefined) {
      displayRenderer.setState({ clock: data.time });
    }
    if (data.visible !== undefined) {
      displayRenderer.setState({ showClock: data.visible });
    }
  }
});

// Listen for clock visibility toggle
ipcRenderer.on('toggle-clock-display', (visible) => {
  if (displayRenderer && visible !== undefined) {
    displayRenderer.setState({ showClock: visible });
  }
});

// Listen for theme updates
ipcRenderer.on('theme-updated', (theme) => {
  console.log('Theme updated in display window:', theme);
  if (displayRenderer) {
    displayRenderer.updateTheme(theme);
  }
  document.documentElement.setAttribute('data-theme', theme);
});

// Listen for layout changes
ipcRenderer.on('layout-changed', (layoutId) => {
  console.log('Layout changed in display window:', layoutId);
  if (displayRenderer) {
    const layout = LayoutRegistry.getLayout(layoutId);
    displayRenderer.setLayout(layout);
    localStorage.setItem('canvasLayout', layoutId);
  }
});

// Listen for message display
ipcRenderer.on('show-message', (message) => {
  if (displayRenderer && message && typeof message === 'string') {
    displayRenderer.setState({
      message: message,
      showMessage: true
    });
  }
});

// Listen for message clear
ipcRenderer.on('clear-message', () => {
  if (displayRenderer) {
    displayRenderer.setState({
      message: '',
      showMessage: false
    });
  }
});

// Cleanup on window close
window.addEventListener('beforeunload', () => {
  if (displayRenderer) {
    displayRenderer.destroy();
  }
});
