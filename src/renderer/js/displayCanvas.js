/**
 * Display Canvas Handler for External Display Window
 * Creates a canvas renderer that mirrors the main window's canvas
 * Receives state updates via IPC and renders them
 */

// Import canvas effects module
import { createFlashAnimation } from './canvas/canvasEffects.js';

const { ipcRenderer } = window.electron;

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
  console.log('Initializing display canvas renderer...');
  
  // Load settings and apply colors
  try {
    const settings = await window.electron.settings.getAll();
    if (settings.colors) {
      applyCanvasColors(settings.colors);
    }
  } catch (error) {
    console.error('Error loading settings in display window:', error);
  }
  
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
    if (data.elapsed !== undefined) {
      displayRenderer.setState({ elapsed: data.elapsed });
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

// Listen for flash at zero
ipcRenderer.on('flash-at-zero', () => {
  console.log('⚡ Flash at zero triggered in display window');
  createFlashAnimation(displayRenderer);
});

// Listen for feature image toggle
ipcRenderer.on('toggle-feature-image', async (enabled) => {
  console.log('📷 Feature image toggle in display window:', enabled);
  
  try {
    const settings = await window.electron.settings.getAll();
    
    if (enabled && settings.featureImage && settings.featureImage.path) {
      await displayRenderer.enableFeatureImage(settings.featureImage.path);
    } else {
      displayRenderer.disableFeatureImage();
    }
  } catch (error) {
    console.error('Error toggling feature image in display window:', error);
  }
});

// Listen for feature image sync (when display opens with feature image already enabled)
ipcRenderer.on('sync-feature-image', async (data) => {
  console.log('📷 Syncing feature image in display window:', data);
  
  if (displayRenderer && data.enabled && data.path) {
    try {
      await displayRenderer.enableFeatureImage(data.path);
    } catch (error) {
      console.error('Error syncing feature image in display window:', error);
    }
  }
});

// Listen for video input start
ipcRenderer.on('video-input-start', async (deviceId) => {
  console.log('Starting video input in display window:', deviceId);
  if (displayRenderer) {
    try {
      await displayRenderer.enableVideoInput(deviceId);
      console.log('✅ Video input started in display window');
    } catch (error) {
      console.error('Error starting video in display window:', error);
    }
  }
});

// Listen for video input stop
ipcRenderer.on('video-input-stop', () => {
  console.log('Stopping video input in display window');
  if (displayRenderer) {
    displayRenderer.disableVideoInput();
  }
});

// Listen for video device changes from settings
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
        displayRenderer.render();
      } catch (error) {
        console.error('Error switching video device in display window:', error);
      }
    } else {
      console.log('Video not currently active in display window');
    }
  }
});

// Listen for video opacity change
ipcRenderer.on('video-opacity-change', (opacity) => {
  if (displayRenderer) {
    displayRenderer.setVideoOpacity(opacity);
  }
});

// Listen for settings updates
if (window.electron && window.electron.settings) {
  window.electron.settings.onUpdate((settings) => {
    console.log('Settings updated in display window', settings);
    
    // Reapply colors
    if (settings.colors) {
      applyCanvasColors(settings.colors);
      // Force canvas redraw
      if (displayRenderer) {
        displayRenderer.render();
      }
    }
    
    // Update theme if changed
    if (settings.defaultTheme || settings.appearanceTheme) {
      const theme = settings.appearanceTheme || settings.defaultTheme;
      const resolvedTheme = theme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      
      if (displayRenderer) {
        displayRenderer.updateTheme(resolvedTheme);
      }
    }
  });
}

// Listen for apply-settings from settings window close
if (window.electron && window.electron.ipcRenderer) {
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
      
      if (displayRenderer) {
        displayRenderer.updateTheme(theme);
      }
    }
    
    // Note: We don't apply defaultLayout here because it's a preference for NEW sessions
    // The user may have manually selected a different layout in the current session
    // defaultLayout is only used on app startup (see DOMContentLoaded)
    
    // Apply performance settings
    if (displayRenderer) {
      displayRenderer.applyPerformanceSettings(settings);
    }
    
    // Force redraw
    if (displayRenderer) {
      displayRenderer.render();
    }
    
    console.log('Settings applied in display window');
  });
}

// Cleanup on window close
window.addEventListener('beforeunload', () => {
  if (displayRenderer) {
    displayRenderer.destroy();
  }
});
