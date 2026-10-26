/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * IPC Handlers Module
 * Centralizes all IPC (Inter-Process Communication) event handlers for communication
 * between the renderer process and the main Electron process.
 * Handles:
 * - Menu commands (toggle display, toggle clock, theme changes, start/stop, reset)
 * - Companion API commands (start, stop, reset, setTime, loadPreset, changeLayout, setMessage)
 * - Display window sync (request-current-state, display-window-closed)
 * - Clock state requests
 * - Theme requests
 * - Video device changes
 * - Settings application
 * /
 */

/**
 * Initialize all IPC event handlers
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.ipcRenderer - Electron IPC renderer
 * @param {Object} deps.statusBar - Status bar module
 * @param {Object} deps.timerState - Timer state object with getters/setters
 * @param {Function} deps.getCanvasRenderer - Function that returns current canvas renderer
 * @param {Function} deps.getElements - Function that returns DOM elements
 * @param {Object} deps.actions - Object with action functions
 */
export function initializeIPCHandlers(deps) {
  const {
    ipcRenderer,
    statusBar,
    timerState,
    getCanvasRenderer,
    getElements,
    actions
  } = deps;

  // ===============================
  // Settings Application
  // ===============================
  
  window.electron.ipcRenderer.on('apply-settings', (settings) => {
    console.log('Received apply-settings event:', settings);
    
    // Apply default time ONLY if the timer is not running
    if (settings.defaultTime && !timerState.running) {
      const { hours, minutes, seconds } = settings.defaultTime;
      const timeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
      
      // Only reset if stoppedAtZero or if the default time actually changed
      if (timerState.stoppedAtZero || timerState.lastSetTime !== timeInSeconds) {
        actions.timerCommand({ action: 'set-time', seconds: timeInSeconds });
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
    
    // Apply timer threshold settings
    if (canvasRenderer) {
      canvasRenderer.applyTimerThresholds(settings);
      console.log('Applied timer thresholds from settings update');
    }
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
    // Update appState (automatically updates status bar)
    appState.update({
      'server.running': status.running,
      'server.port': status.port,
      'server.error': status.error
    });

    logger.info('IPC', `Companion server status: ${status.running ? 'running on port ' + status.port : 'inactive'}`);
    
    // Show error message if there is one
    if (status.error && statusBar) {
      statusBar.error(`API Server Error: ${status.error}`, 5000);
    }
  });


  // ===============================
  // Unified API Commands (New)
  // ===============================
  
  ipcRenderer.on('api-command', (command) => {
    console.log('🌐 Received unified API command:', command);
    const { action, data } = command;
    const { startStopBtn, resetBtn, displayMessageBtn, coverImageBtn } = getElements();

    const isMessageVisible = () => {
      if (!displayMessageBtn) return false;
      const icon = displayMessageBtn.querySelector('i.bi');
      return Boolean(icon && icon.classList.contains('bi-eye-slash-fill'));
    };
    
    switch (action) {
      case 'create-preset':
        if (data) {
          console.log('API: Creating preset:', data.name);
        }
        break;
        
      case 'update-settings':
        if (data) {
          console.log('API: Updating settings');
        }
        break;
        
      case 'trigger-flash':
        if (data) {
          console.log(`⚡ API: Triggering flash - ${data.cycles || 3} cycles`);
          const triggerFlashBtn = document.getElementById('flashButton');
          if (triggerFlashBtn) triggerFlashBtn.click();
        }
        break;
        
      case 'mute-sound':
        console.log('🔇 API: Muting sound');
        if (actions.setMuteState) {
          actions.setMuteState(true);
        }
        break;
        
      case 'unmute-sound':
        console.log('🔊 API: Unmuting sound');
        if (actions.setMuteState) {
          actions.setMuteState(false);
        }
        break;
        
      case 'toggle-sound':
        console.log('🔊 API: Toggling sound');
        if (actions.toggleMuteState) {
          actions.toggleMuteState();
        }
        break;
        
      case 'toggle-feature-image':
        console.log('🖼️ API: Toggling feature image');
        if (coverImageBtn) {
          coverImageBtn.click();
        }
        break;
        
      case 'set-feature-image':
        if (data && typeof data.enabled === 'boolean') {
          console.log(`🖼️ API: Setting feature image to ${data.enabled ? 'enabled' : 'disabled'}`);
          if (coverImageBtn) {
            // coverImage button uses btn-success while enabled.
            const currentlyEnabled = coverImageBtn.classList.contains('btn-success');
            if (currentlyEnabled !== data.enabled) {
              coverImageBtn.click();
            }
          }
        }
        break;
        
      case 'change-layout':
        if (data && data.layout) {
          console.log(`🎨 API: Changing layout to ${data.layout}`);
          if (actions.changeLayout) {
            actions.changeLayout(data.layout);
          }
        }
        break;
        
      case 'set-message':
        if (data && data.message) {
          console.log(`💬 API: Setting message: "${data.message}"`);
          const messageInput = document.getElementById('messageInput');
          if (messageInput) {
            messageInput.value = data.message;
            messageInput.dispatchEvent(new Event('input', { bubbles: true }));
            if (displayMessageBtn) {
              if (isMessageVisible()) {
                // Keep message visible and refresh the displayed text.
                const canvasRenderer = getCanvasRenderer();
                if (canvasRenderer) {
                  canvasRenderer.setState({
                    message: data.message,
                    showMessage: true,
                  });
                }

                if (window.electron && ipcRenderer) {
                  ipcRenderer.send('display-message', data.message);
                }
              } else {
                displayMessageBtn.click();
              }
            }
          }
        }
        break;

      case 'set-message-text':
        if (data && typeof data.message === 'string') {
          console.log(`💬 API: Setting message text only: "${data.message}"`);
          const messageInput = document.getElementById('messageInput');
          if (messageInput) {
            messageInput.value = data.message;
            messageInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        break;
        
      case 'hide-message':
        console.log('💬 API: Hiding message');
        if (displayMessageBtn && isMessageVisible()) {
          displayMessageBtn.click();
        }
        break;
        
      case 'toggle-message':
        console.log('💬 API: Toggling message');
        if (displayMessageBtn) {
          displayMessageBtn.click();
        }
        break;
        
      default:
        console.warn('Unknown API command:', action);
    }
    
    // Push message / cover image state to the API server right away
    // (timer state comes from the timer engine in the main process)
    setTimeout(() => {
      const messageInput = document.getElementById('messageInput');
      ipcRenderer.send('companion-state-update', {
        message: {
          visible: isMessageVisible(),
          text: messageInput ? messageInput.value : ''
        },
        coverImage: {
          enabled: Boolean(coverImageBtn && coverImageBtn.classList.contains('btn-success'))
        }
      });
    }, 10);
  });

  // ===============================
  // API Timer State Updates
  // ===============================
  
  ipcRenderer.on('api-timer-state-update', (timerState) => {
    // Only use warning level/color from API - time/progress is handled by displayManager
    const canvasRenderer = getCanvasRenderer();
    if (canvasRenderer) {
      canvasRenderer.setState({
        warningLevel: timerState.warningLevel,
        warningColor: timerState.warningColor
      });
      
      // Trigger color update if timer color matching is enabled
      const matchTimerColor = localStorage.getItem('matchTimerColor') === 'true';
      if (matchTimerColor) {
        canvasRenderer.updateDynamicColors(timerState.warningColor);
      }
    }
    
    // Update any other UI elements that need warning level information
    const statusBar = deps.statusBar;
    if (statusBar && timerState.warningLevel !== 'normal') {
      const levelMessages = {
        'warning': '⚠️ Timer entering warning zone',
        'critical': '🚨 Timer critical - time running low',
        'overtime': '⏰ Timer exceeded - in overtime'
      };
      
      if (levelMessages[timerState.warningLevel]) {
        statusBar.info(levelMessages[timerState.warningLevel], 2000);
      }
    }
  });

  // ===============================
  // Display Window Sync
  // ===============================
  
  ipcRenderer.on('display-window-closed', () => {
    console.log('Display window was closed');
  });
  
  ipcRenderer.on('request-current-state-for-display', () => {
    console.log('🔄 Syncing current state to display window');
    
    const canvasRenderer = getCanvasRenderer();
    if (!canvasRenderer) {
      console.error('❌ Canvas renderer not available for sync');
      return;
    }
    
    // Get current state from canvas renderer (most reliable source)
    const canvasState = canvasRenderer.state;
    
    console.log('📊 Canvas state at sync:', canvasState);
    console.log('⏱️ Timer values - remainingTime:', timerState.remainingTime, 'totalTime:', timerState.totalTime);
    
    // Get current timer state - use canvas state as fallback
    const timerData = {
      formattedTime: canvasState.countdown || actions.formatTime(timerState.remainingTime),
      progressPercent: canvasState.progress !== undefined 
        ? canvasState.progress 
        : (timerState.totalTime > 0 ? (timerState.remainingTime / timerState.totalTime * 100) : 0),
      elapsed: canvasState.elapsed || '--:--:--',
      endTime: canvasState.endTime || '--:--:--',
      remainingTime: timerState.remainingTime,
      totalTime: timerState.totalTime
    };
    
    console.log('📤 Sending timer data to display:', timerData);
    
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
    if (canvasRenderer.featureImage && canvasRenderer.featureImage.enabled) {
      featureImageData = {
        enabled: true,
        path: canvasRenderer.featureImage.path
      };
    }

    // Send all current state to main process for forwarding to display window
    const syncData = {
      timer: timerData,
      clock: clockData,
      message: messageData,
      clockVisible: canvasState.showClock,
      video: videoData,
      featureImage: featureImageData
    };
    
    console.log('📤 Sending sync-current-state to main process:', syncData);
    ipcRenderer.send('sync-current-state', syncData);
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
    } else {
      // Video not currently running - check if current layout needs it
      const currentLayout = canvasRenderer.layout;
      const needsVideo = (currentLayout?.videoFrame && currentLayout.videoFrame.enabled) || 
                        (currentLayout?.video && currentLayout.video.enabled);
      
      if (needsVideo && deviceId) {
        console.log('🎬 Current layout needs video, auto-starting with new device:', deviceId);
        
        try {
          await canvasRenderer.enableVideoInput(deviceId);
          console.log('✅ Video input auto-started successfully');
        } catch (error) {
          console.error('❌ Failed to auto-start video input:', error);
          
          // Show error in status bar
          if (statusBar) {
            const errorMsg = error.name === 'NotAllowedError' 
              ? 'Camera access denied - check permissions'
              : error.name === 'NotFoundError'
              ? 'Camera device not found'
              : error.name === 'NotReadableError'
              ? 'Camera already in use'
              : 'Camera access failed';
            
            statusBar.setCameraStatus('error');
            statusBar.error(errorMsg, 0);
          }
        }
      }
    }
  });

  // ===============================
  // Video Mirror Setting
  // ===============================
  
  ipcRenderer.on('video-mirror-changed', (enabled) => {
    console.log('🪞 Video mirror changed:', enabled);
    
    const canvasRenderer = getCanvasRenderer();
    if (canvasRenderer) {
      canvasRenderer.setVideoMirror(enabled);
    }
  });

  // ===============================
  // Video Scaling Setting
  // ===============================
  
  ipcRenderer.on('video-scaling-changed', (mode) => {
    console.log('📐 Video scaling changed:', mode);
    
    const canvasRenderer = getCanvasRenderer();
    if (canvasRenderer) {
      canvasRenderer.setVideoScaling(mode);
    }
  });

  // ===============================
  // Initial State Requests
  // ===============================
  
  // Request initial display window state when app loads
  ipcRenderer.send('request-display-state');
}
