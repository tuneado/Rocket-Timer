/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Display Canvas Handler - Simplified
 * Uses UnifiedCanvasRenderer's addOutput() method to register this window's canvas
 * Main window's renderer distributes frames to all registered outputs
 * /
 */
// Detect if running in Electron
const isElectron = typeof window.electron !== 'undefined';
const ipcRenderer = isElectron ? window.electron.ipcRenderer : null;

let displayCanvas = null;

/**
 * Apply canvas colors from settings
 */
function applyCanvasColors(colors) {
  const root = document.documentElement;
  
  if (colors.background) {
    root.style.setProperty('--canvas-background', colors.background);
    document.body.style.backgroundColor = colors.background;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📺 Display window initializing...');
  
  // Load settings and apply colors
  try {
    if (isElectron) {
      const settings = await window.electron.settings.getAll();
      if (settings.colors) {
        applyCanvasColors(settings.colors);
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  // Setup canvas
  setupCanvas();
  
  if (isElectron) {
    // Register this canvas with main window's renderer
    console.log('📺 Registering canvas with main window renderer...');
    ipcRenderer.send('register-display-canvas');
  }
});

/**
 * Setup canvas element
 */
function setupCanvas() {
  const container = document.getElementById('displayContainer');
  
  displayCanvas = document.createElement('canvas');
  displayCanvas.id = 'displayCanvas';
  displayCanvas.style.width = '100%';
  displayCanvas.style.height = '100%';
  displayCanvas.style.objectFit = 'contain';
  displayCanvas.style.backgroundColor = '#121212';
  
  container.appendChild(displayCanvas);
  
  console.log('📺 Canvas element created');
}

// IPC Handlers
if (isElectron) {
  // Handle canvas registration confirmation
  ipcRenderer.on('canvas-registered', () => {
    console.log('✅ Canvas registered with main renderer');
  });
  
  // Handle frame updates from main window
  ipcRenderer.on('canvas-frame', (imageData) => {
    if (displayCanvas && imageData) {
      const ctx = displayCanvas.getContext('2d');
      // Draw the received frame
      // Note: imageData needs to be in a drawable format
      // This might need adjustment based on how frames are sent
    }
  });
  
  // Handle settings updates
  ipcRenderer.on('apply-settings', (settings) => {
    if (settings.colors) {
      applyCanvasColors(settings.colors);
    }
  });
  
  // Handle theme updates
  ipcRenderer.on('theme-updated', (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const bgColor = theme === 'dark' ? '#121212' : '#f7f7f7';
    document.body.style.backgroundColor = bgColor;
    if (displayCanvas) {
      displayCanvas.style.backgroundColor = bgColor;
    }
  });
}

// Cleanup
window.addEventListener('beforeunload', () => {
  if (isElectron) {
    ipcRenderer.send('unregister-display-canvas');
  }
  console.log('📺 Display window closing');
});
