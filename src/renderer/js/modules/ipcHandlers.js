/**
 * IPC Handlers Module
 * 
 * Centralizes all IPC (Inter-Process Communication) event handlers for communication
 * between the renderer process and the main Electron process.
 * 
 * Handles:
 * - Menu commands (toggle display, toggle clock, theme changes, start/stop, reset)
 * - Companion API commands (start, stop, reset, setTime, loadPreset, changeLayout, setMessage)
 * - Display window sync (request-current-state, display-window-closed)
 * - Clock state requests
 * - Theme requests
 * - Video device changes
 * - Settings application
 */

/**
 * Initialize all IPC event handlers
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.ipcRenderer - Electron IPC renderer
 * @param {Object} deps.statusBar - Status bar module
 * @param {Object} deps.timerState - Timer state object with getters/setters
 * @param {Object} deps.clockState - Clock state object
 * @param {Object} deps.displayState - Display state object
 * @param {Function} deps.getCanvasRenderer - Function that returns current canvas renderer
 * @param {Function} deps.getElements - Function that returns DOM elements
 * @param {Object} deps.actions - Object with action functions
 */
export function initializeIPCHandlers(deps) {
  const {
    ipcRenderer,
    statusBar,
    timerState,
    clockState,
    displayState,
    getCanvasRenderer,
    getElements,
    actions
  } = deps;

  // ===============================
  // Settings Application
  // ===============================
  
  window.electron.ipcRenderer.on('apply-settings', (settings) => {
    console.log('Received apply-settings event:', settings);
    
    // Apply default time
    if (settings.defaultTime) {
      const { hours, minutes, seconds } = settings.defaultTime;
      const timeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
      
      // Only update if timer is not running
      if (!timerState.running) {
        timerState.setLastSetTime(timeInSeconds);
        timerState.setRemainingTime(timeInSeconds);
        timerState.setTotalTime(timeInSeconds);
        actions.updateDisplay();
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
      
      const canvasRenderer = getCanvasRenderer();
      if (canvasRenderer) {
        canvasRenderer.updateTheme(theme);
        actions.updateDisplay();
      }
      
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.checked = theme === 'dark';
      }
    }
    
    // Apply canvas colors
    if (settings.colors) {
      actions.applyCanvasColors(settings.colors);
      const canvasRenderer = getCanvasRenderer();
      if (canvasRenderer) {
        actions.updateDisplay();
      }
    }
    
    // Apply performance settings
    const canvasRenderer = getCanvasRenderer();
    if (canvasRenderer && settings.performance) {
      canvasRenderer.applyPerformanceSettings(settings.performance);
    }
  });

  // ===============================
  // Menu Commands
  // ===============================
  
  ipcRenderer.on('menu-toggle-display', (event, value) => {
    displayState.setVisible(value);
    ipcRenderer.send('toggle-display', displayState.visible);
    actions.updateMenuState();
  });

  ipcRenderer.on('menu-toggle-clock', (_, value) => {
    clockState.setVisible(value);
    if (clockState.visible) {
      actions.startClock();
    } else {
      actions.stopClock();
    }
    actions.updateMenuState();
  });

  ipcRenderer.on('menu-theme-change', (theme) => {
    actions.setTheme(theme === 'dark');
  });

  ipcRenderer.on('menu-start-stop', () => {
    const { startStopBtn } = getElements();
    if (startStopBtn) {
      startStopBtn.click();
    }
  });

  ipcRenderer.on('menu-reset', () => {
    const { resetBtn } = getElements();
    if (resetBtn) {
      resetBtn.click();
    }
  });

  // ===============================
  // Companion Server Status
  // ===============================
  
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

  // ===============================
  // Companion API Commands
  // ===============================
  
  ipcRenderer.on('companion-command', (command) => {
    console.log('🎮 Received companion command:', command);
    const { action, data } = command;
    const { startStopBtn, resetBtn, displayMessageBtn } = getElements();
    
    switch (action) {
      case 'start':
        if (!timerState.running && timerState.remainingTime > 0) {
          startStopBtn.click();
        }
        break;
        
      case 'stop':
      case 'pause':
        if (timerState.running) {
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
          if (timerState.running) {
            startStopBtn.click();
          }
          
          // Update input fields
          document.getElementById('hours').value = hours;
          document.getElementById('minutes').value = minutes;
          document.getElementById('seconds').value = seconds;
          
          // Update time and send state
          actions.updateTimeFromInputs();
          timerState.setLastSetTime(timerState.totalTime); // Save as last set time
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
          actions.changeLayout(data.layout);
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
    actions.sendStateUpdate();
  });

  // ===============================
  // Display Window Sync
  // ===============================
  
  ipcRenderer.on('display-window-closed', () => {
    console.log('Display window was closed');
  });
  
  ipcRenderer.on('request-current-state-for-display', () => {
    console.log('Syncing current state to display window');
    
    const canvasRenderer = getCanvasRenderer();
    if (!canvasRenderer) return;
    
    // Get current state from canvas renderer (most reliable source)
    const canvasState = canvasRenderer.state;
    
    console.log('Canvas state at sync:', canvasState);
    console.log('remainingTime:', timerState.remainingTime, 'totalTime:', timerState.totalTime);
    
    // Get current timer state - use canvas state as fallback
    const timerData = {
      formattedTime: canvasState.countdown || actions.formatTime(timerState.remainingTime),
      progressPercent: canvasState.progress !== undefined 
        ? canvasState.progress 
        : (timerState.totalTime > 0 ? (timerState.remainingTime / timerState.totalTime * 100) : 0)
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
    const videoManager = canvasRenderer.getVideoInputManager();
    if (videoManager && videoManager.isEnabled()) {
      const currentDevice = videoManager.getCurrentDevice();
      videoData = {
        enabled: true,
        deviceId: currentDevice ? currentDevice.id : null,
        opacity: videoManager.getOpacity()
      };
    }
    
    // Get current feature image state
    let featureImageData = null;
    if (canvasRenderer.featureImage.enabled) {
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

  // ===============================
  // Clock State Requests
  // ===============================
  
  ipcRenderer.on('request-clock-state', () => {
    const canvasRenderer = getCanvasRenderer();
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

  // ===============================
  // Theme Requests
  // ===============================
  
  ipcRenderer.on('request-current-theme-for-display', () => {
    const isLight = document.body.classList.contains('light');
    ipcRenderer.send('current-theme-response', isLight ? 'light' : 'dark');
  });

  // ===============================
  // Video Device Changes
  // ===============================
  
  ipcRenderer.on('video-device-changed', async (deviceId) => {
    console.log('📹 Video device changed from settings:', deviceId);
    
    // Update localStorage
    localStorage.setItem('selectedVideoDevice', deviceId);
    
    const canvasRenderer = getCanvasRenderer();
    if (!canvasRenderer) return;
    
    // If video is currently enabled, restart it with the new device
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
        
        console.log('✅ Video input restarted successfully');
      } catch (error) {
        console.error('❌ Failed to restart video input:', error);
      }
    }
  });

  // ===============================
  // Initial State Requests
  // ===============================
  
  // Request initial display window state when app loads
  ipcRenderer.send('request-display-state');
}
