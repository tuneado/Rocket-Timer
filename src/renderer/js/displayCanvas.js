/**
 * Display Canvas Handler for External Display Window
 * Creates a canvas renderer that mirrors the main window's canvas
 * Receives state updates via IPC (Electron) or WebSocket (Browser)
 */

// Import canvas effects module
import { createFlashAnimation } from './canvas/canvasEffects.js';

// Detect if running in Electron or browser
const isElectron = typeof window.electron !== 'undefined';
const ipcRenderer = isElectron ? window.electron.ipcRenderer : null;

// WebSocket connection for browser mode
let ws = null;

// Initialize canvas renderer for external display
let displayRenderer = null;

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
  
  console.log('Applied canvas colors in display window');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing unified display canvas...');
  
  // Wait for fonts to load before initializing canvas
  try {
    console.log('Loading fonts for display canvas...');
    // Load the monospace fonts explicitly
    await Promise.all([
      document.fonts.load('400 16px "JetBrains Mono"'),
      document.fonts.load('bold 16px "JetBrains Mono"'),
      document.fonts.load('600 16px "JetBrains Mono"'),
      document.fonts.load('400 16px "SF Mono"'),
      document.fonts.load('bold 16px "SF Mono"'),
      document.fonts.load('600 16px "SF Mono"'),
      document.fonts.load('400 16px Consolas'),
      document.fonts.load('bold 16px Consolas'),
      document.fonts.load('400 16px Monaco'),
      document.fonts.load('bold 16px Monaco')
    ]).catch(() => {
      // Font loading might fail if fonts aren't available, that's ok
      console.log('Some fonts failed to load, using system fallbacks');
    });
    
    // Ensure all fonts are ready
    await document.fonts.ready;
    console.log('Fonts ready for display canvas');
  } catch (error) {
    console.warn('Font loading encountered an issue, continuing:', error);
  }
  
  // Load settings and apply colors
  try {
    let settings;
    if (isElectron) {
      settings = await window.electron.settings.getAll();
    } else {
      // In browser, fetch settings from API
      const response = await fetch(`${window.location.origin}/api/state`);
      const state = await response.json();
      settings = state.settings || {};
    }
    
    if (settings.colors) {
      applyCanvasColors(settings.colors);
    }
  } catch (error) {
    console.error('Error loading settings in display window:', error);
  }
  
  // Load saved layout or use default
  const savedLayoutId = localStorage.getItem('canvasLayout') || LayoutRegistry.getDefaultLayout();
  const layout = LayoutRegistry.getLayout(savedLayoutId);
  
  // Get display canvas
  const displayCanvas = document.getElementById('displayCanvas');
  
  // Get canvas resolution from settings
  let resolution = ['1920', '1080']; // Default resolution
  try {
    if (isElectron) {
      const currentSettings = await window.electron.settings.getAll();
      if (currentSettings.canvasResolution) {
        resolution = currentSettings.canvasResolution.split('x');
      }
    } else {
      // In browser, use settings from API response
      const response = await fetch(`${window.location.origin}/api/state`);
      const state = await response.json();
      if (state.settings?.canvasResolution) {
        resolution = state.settings.canvasResolution.split('x');
      }
    }
  } catch (error) {
    console.warn('Could not load canvas resolution from settings, using default:', error);
  }
  
  const width = parseInt(resolution[0]);
  const height = parseInt(resolution[1]);
  
  console.log('📺 Creating UnifiedCanvasRenderer for display with resolution:', `${width}x${height}`);
  displayRenderer = new UnifiedCanvasRenderer(width, height);
  
  // Add the display canvas as fullscreen output
  displayRenderer.addOutput('external', displayCanvas, {
    scale: 1.0, // Full resolution for external display
    enabled: true,
    aspectRatio: 16/9
  });
  
  // Set initial layout
  displayRenderer.setLayout(layout);
  
  // Load and apply timer threshold settings to display renderer
  try {
    let thresholdSettings;
    if (isElectron) {
      thresholdSettings = await window.electron.settings.getAll();
    } else {
      // In browser, fetch settings from API
      const response = await fetch(`${window.location.origin}/api/state`);
      const state = await response.json();
      thresholdSettings = state.settings || {};
    }
    
    if (thresholdSettings) {
      displayRenderer.applyTimerThresholds(thresholdSettings);
      console.log('📺 Applied timer thresholds to display renderer');
      
      // Apply watermark setting
      if (thresholdSettings.showWatermark === false) {
        displayRenderer.watermark.enabled = false;
      }
    }
  } catch (error) {
    console.warn('Could not load timer threshold settings for display:', error);
  }
  
  // Start the renderer
  displayRenderer.start();
  
  console.log('📺 Unified display renderer initialized');
  
  if (isElectron) {
    // Electron mode: use IPC
    ipcRenderer.send('request-current-theme');
    // Delay the sync request to ensure all IPC handlers are registered
    setTimeout(() => {
      console.log('📺 Requesting display sync after initialization');
      ipcRenderer.send('request-display-sync');
    }, 100);
  } else {
    // Browser mode: setup WebSocket connection
    setupWebSocket();
  }
  
  console.log('Display canvas initialized with layout:', savedLayoutId);
});

/**
 * Setup video element to display canvas stream
 */
function setupStreamDisplay(stream) {
  const canvas = document.getElementById('displayCanvas');
  const container = canvas.parentNode;
  
  // Create a video element to receive the stream
  const video = document.createElement('video');
  video.id = 'displayVideo';
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'contain';
  video.style.backgroundColor = '#121212';
  
  // Replace canvas with video
  container.replaceChild(video, canvas);
  
  video.onloadedmetadata = () => {
    console.log('📺 Canvas stream connected and playing');
    video.play().catch(err => console.error('Error playing stream:', err));
  };
  
  video.onerror = (error) => {
    console.error('📺 Error loading canvas stream:', error);
  };
  
  console.log('📺 Video element created, waiting for stream...');
}

/**
 * Setup WebSocket connection for browser mode
 */
function setupWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}`;
  
  console.log('Connecting to WebSocket:', wsUrl);
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = async () => {
    console.log('✅ WebSocket connected');
    
    // Fetch initial state
    try {
      const response = await fetch(`${window.location.origin}/api/state`);
      const state = await response.json();
      updateDisplayFromState(state);
    } catch (error) {
      console.error('Error fetching initial state:', error);
    }
  };
  
  ws.onmessage = (event) => {
    try {
      const state = JSON.parse(event.data);
      updateDisplayFromState(state);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket closed, reconnecting in 3s...');
    setTimeout(setupWebSocket, 3000);
  };
}

/**
 * Update display from state object (for browser mode)
 */
function updateDisplayFromState(state) {
  if (!displayRenderer || !state) return;
  
  const updates = {};
  
  if (state.formattedTime !== undefined) updates.countdown = state.formattedTime;
  if (state.progressPercent !== undefined) updates.progress = state.progressPercent;
  if (state.elapsed !== undefined) updates.elapsed = state.elapsed;
  if (state.clock !== undefined) updates.clock = state.clock;
  if (state.showClock !== undefined) updates.showClock = state.showClock;
  if (state.message !== undefined) updates.message = state.message;
  if (state.running !== undefined) updates.running = state.running;
  if (state.paused !== undefined) updates.paused = state.paused;
  
  displayRenderer.setState(updates);
}

// Listen for timer updates from main window (Electron only)
if (isElectron) {
  ipcRenderer.on('update-display', (data) => {
    console.log('📺 Received update-display:', data);
    if (displayRenderer && data && typeof data === 'object') {
      const updates = {};
      
      if (data.formattedTime !== undefined) {
        updates.countdown = data.formattedTime;
      }
      if (data.progressPercent !== undefined) {
        updates.progress = data.progressPercent;
      }
      if (data.elapsed !== undefined) {
        updates.elapsed = data.elapsed;
      }
      if (data.remainingTime !== undefined) {
        updates.remainingTime = data.remainingTime;
      }
      if (data.totalTime !== undefined) {
        updates.totalTime = data.totalTime;
      }
      if (data.endTime !== undefined) {
        updates.endTime = data.endTime;
      }
      
      console.log('📺 Applying updates to display:', updates);
      displayRenderer.setState(updates);
      console.log('📺 Display state after update:', displayRenderer.state);
    }
    // If using stream display, updates are handled automatically by the unified renderer
  });
}

// Listen for clock updates (Electron only)
if (isElectron) {
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
}

// Listen for clock visibility toggle (Electron only)
if (isElectron) {
  ipcRenderer.on('toggle-clock-display', (visible) => {
    if (displayRenderer && visible !== undefined) {
      displayRenderer.setState({ showClock: visible });
    }
  });
}

// Listen for theme updates (Electron only)
if (isElectron) {
  ipcRenderer.on('theme-updated', (theme) => {
    console.log('Theme updated in display window:', theme);
    if (displayRenderer) {
      displayRenderer.updateTheme(theme);
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
  });
}

// Listen for layout changes (Electron only)
if (isElectron) {
  ipcRenderer.on('layout-changed', (layoutId) => {
    console.log('Layout changed in display window:', layoutId);
    if (displayRenderer) {
      const layout = LayoutRegistry.getLayout(layoutId);
      displayRenderer.setLayout(layout);
      localStorage.setItem('canvasLayout', layoutId);
    }
  });
}

// Listen for message display (Electron only)
if (isElectron) {
  ipcRenderer.on('show-message', (message) => {
    if (displayRenderer && message && typeof message === 'string') {
      displayRenderer.setState({
        message: message,
        showMessage: true
      });
    }
  });
}

// Listen for message clear (Electron only)
if (isElectron) {
  ipcRenderer.on('clear-message', () => {
    if (displayRenderer) {
      displayRenderer.setState({
        message: '',
        showMessage: false
      });
    }
  });
}

// Listen for flash at zero (Electron only)
if (isElectron) {
  ipcRenderer.on('flash-at-zero', () => {
    console.log('⚡ Flash at zero triggered in display window');
    createFlashAnimation(displayRenderer);
  });
}

// Listen for cover image toggle (Electron only)
if (isElectron) {
  ipcRenderer.on('toggle-cover-image', async (enabled) => {
    console.log('📷 Cover image toggle in display window:', enabled);
    
    try {
      const settings = await window.electron.settings.getAll();
      
      if (enabled && settings.coverImage && settings.coverImage.path) {
        await displayRenderer.enableCoverImage(settings.coverImage.path);
      } else {
        displayRenderer.disableCoverImage();
      }
    } catch (error) {
      console.error('Error toggling cover image in display window:', error);
    }
  });
}

// Listen for cover image sync (when display opens with cover image already enabled) (Electron only)
if (isElectron) {
  ipcRenderer.on('sync-cover-image', async (data) => {
    console.log('📷 Syncing cover image in display window:', data);
    
    if (displayRenderer && data.enabled && data.path) {
      try {
        await displayRenderer.enableCoverImage(data.path);
      } catch (error) {
        console.error('Error syncing cover image in display window:', error);
      }
    }
  });
}

// Listen for background image sync (when display opens or background image is set) (Electron only)
if (isElectron) {
  ipcRenderer.on('sync-background-image', async (data) => {
    console.log('🖼️ Syncing background image in display window:', data);
    
    if (displayRenderer && data.enabled && data.path) {
      try {
        await displayRenderer.enableBackgroundImage(data.path, data.opacity || 1.0);
      } catch (error) {
        console.error('Error syncing background image in display window:', error);
      }
    } else if (displayRenderer) {
      displayRenderer.disableBackgroundImage();
    }
  });
}

// Listen for video input start (Electron only)
if (isElectron) {
  ipcRenderer.on('video-input-start', async (deviceId) => {
    console.log('Starting video input in display window:', deviceId);
    if (displayRenderer) {
      try {
        await displayRenderer.enableVideoInput(deviceId);
        console.log('✅ Video input started in display window');
        
        // Apply mirror and scaling settings from stored settings
        if (window.electron && window.electron.settings) {
          try {
            const settings = await window.electron.settings.getAll();
            if (settings) {
              if (settings.mirrorVideo !== undefined) {
                displayRenderer.setVideoMirror(settings.mirrorVideo);
              }
              if (settings.videoScaling !== undefined) {
                displayRenderer.setVideoScaling(settings.videoScaling);
              }
            }
          } catch (err) {
            console.warn('Could not apply video settings:', err.message);
          }
        }
      } catch (error) {
        console.error('Error starting video in display window:', error);
      }
    }
  });
}

// Listen for video input stop (Electron only)
if (isElectron) {
  ipcRenderer.on('video-input-stop', () => {
    console.log('Stopping video input in display window');
    if (displayRenderer) {
      displayRenderer.disableVideoInput();
    }
  });
}

// Listen for video device changes from settings (Electron only)
if (isElectron) {
  ipcRenderer.on('video-device-changed', async (deviceId) => {
    console.log('📹 Video device changed in display window:', deviceId);
    
    // If video is currently enabled, restart it with the new device
    if (displayRenderer) {
      const videoManager = displayRenderer.getVideoInputManager();
      
      if (videoManager && videoManager.isEnabled()) {
        console.log('🔄 Restarting video input with new device:', deviceId);
        
        try {
          // Stop current video
          displayRenderer.disableVideoInput();
          
          // Small delay to ensure cleanup
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Start with new device
          await displayRenderer.enableVideoInput(deviceId);
          
          console.log('✅ Video input switched to new device successfully in display window');
          
          // Force canvas redraw to show new video
          displayRenderer.renderFrame();
        } catch (error) {
          console.error('Error switching video device in display window:', error);
        }
      } else {
        console.log('Video not currently active in display window');
      }
    }
  });
}

// Listen for video opacity change (Electron only)
if (isElectron) {
  ipcRenderer.on('video-opacity-change', (opacity) => {
    if (displayRenderer) {
      displayRenderer.setVideoOpacity(opacity);
    }
  });
}

// Listen for video mirror change (Electron only)
if (isElectron) {
  ipcRenderer.on('video-mirror-changed', (enabled) => {
    console.log('🪞 Display: Video mirror changed:', enabled);
    if (displayRenderer) {
      displayRenderer.setVideoMirror(enabled);
    }
  });
}

// Listen for video scaling change (Electron only)
if (isElectron) {
  ipcRenderer.on('video-scaling-changed', (mode) => {
    console.log('📐 Display: Video scaling changed:', mode);
    if (displayRenderer) {
      displayRenderer.setVideoScaling(mode);
    }
  });
}

// Listen for settings updates (Electron only)
if (isElectron && window.electron && window.electron.settings) {
  window.electron.settings.onUpdate((settings) => {
    console.log('Settings updated in display window', settings);
    
    // Reapply colors
    if (settings.colors) {
      applyCanvasColors(settings.colors);
      // Force canvas redraw
      if (displayRenderer) {
        displayRenderer.renderFrame();
      }
    }
    
    // Apply timer threshold settings
    if (displayRenderer) {
      displayRenderer.applyTimerThresholds(settings);
      console.log('📺 Applied timer thresholds from settings.onUpdate in display window');
    }
    
    // Update theme if changed
    if (settings.defaultTheme || settings.appearanceTheme) {
      const theme = settings.appearanceTheme || settings.defaultTheme;
      const resolvedTheme = theme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      if (displayRenderer) {
        displayRenderer.updateTheme(resolvedTheme);
      }
    }
  });
}

// Listen for apply-settings from settings window close (Electron only)
if (isElectron && window.electron && window.electron.ipcRenderer) {
  window.electron.ipcRenderer.on('apply-settings', (settings) => {
    console.log('Received apply-settings in display window:', settings);
    
    // Apply colors
    if (settings.colors) {
      applyCanvasColors(settings.colors);
    }
    
    // Apply theme
    if (settings.defaultTheme) {
      const theme = settings.defaultTheme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.defaultTheme;
      
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      if (displayRenderer) {
        displayRenderer.updateTheme(theme);
      }
    }
    
    // Note: We don't apply defaultLayout here because it's a preference for NEW sessions
    // The user may have manually selected a different layout in the current session
    // defaultLayout is only used on app startup (see DOMContentLoaded)
    
    // Apply watermark setting
    if (displayRenderer && settings.showWatermark !== undefined) {
      displayRenderer.watermark.enabled = settings.showWatermark;
    }

    // Apply performance settings
    if (displayRenderer) {
      displayRenderer.applyPerformanceSettings(settings);
    }
    
    // Apply timer threshold settings
    if (displayRenderer) {
      displayRenderer.applyTimerThresholds(settings);
      console.log('📺 Applied timer thresholds from settings update in display window');
    }
    
    // Force redraw
    if (displayRenderer) {
      displayRenderer.renderFrame();
    }
    
    console.log('Settings applied in display window');
  });
}

// Cleanup on window close
window.addEventListener('beforeunload', () => {
  if (displayRenderer) {
    displayRenderer.destroy();
  }
  
  // Close WebSocket in browser mode
  if (!isElectron && ws) {
    ws.close();
  }
});
