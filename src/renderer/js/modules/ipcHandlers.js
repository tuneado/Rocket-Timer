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
      
      // Stop any running timer first
      if (timerState.running || timerState.stoppedAtZero) {
        // Use the stopTimer action if available
        if (actions.stopTimer) {
          actions.stopTimer();
        }
      }
      
      // Reset timer state and apply new time
      timerState.setRunning(false);
      timerState.setStoppedAtZero(false);
      timerState.setLastSetTime(timeInSeconds);
      timerState.setRemainingTime(timeInSeconds);
      timerState.setTotalTime(timeInSeconds);
      
      // Reset button to start state
      const { startStopBtn, updateButtonIcon, setInputsDisabled } = actions.getElements();
      if (startStopBtn && updateButtonIcon) {
        updateButtonIcon(startStopBtn, 'play-fill', 'Start');
        startStopBtn.classList.remove("stop");
        startStopBtn.classList.add("start");
      }
      
      // Enable all inputs
      if (setInputsDisabled) {
        setInputsDisabled(false);
      }
      
      actions.updateDisplay();
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
      // Start main clock (will stop lightweight info clock internally)
      actions.startClock();
    } else {
      // Stop main clock (will restart lightweight info clock internally)
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
        
      case 'setHours':
        if (data && typeof data.hours === 'number') {
          // Stop timer if running
          if (timerState.running) {
            startStopBtn.click();
          }
          
          // Update only hours field, keep current minutes and seconds
          document.getElementById('hours').value = data.hours;
          
          // Update time and send state
          actions.updateTimeFromInputs();
          timerState.setLastSetTime(timerState.totalTime);
        }
        break;
        
      case 'setMinutes':
        if (data && typeof data.minutes === 'number') {
          // Stop timer if running
          if (timerState.running) {
            startStopBtn.click();
          }
          
          // Update only minutes field, keep current hours and seconds
          document.getElementById('minutes').value = data.minutes;
          
          // Update time and send state
          actions.updateTimeFromInputs();
          timerState.setLastSetTime(timerState.totalTime);
        }
        break;
        
      case 'setSeconds':
        if (data && typeof data.seconds === 'number') {
          // Stop timer if running
          if (timerState.running) {
            startStopBtn.click();
          }
          
          // Update only seconds field, keep current hours and minutes
          document.getElementById('seconds').value = data.seconds;
          
          // Update time and send state
          actions.updateTimeFromInputs();
          timerState.setLastSetTime(timerState.totalTime);
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

      case 'addMinute':
        if (!timerState.running) {
          const currentMinutes = parseInt(document.getElementById('minutes').value) || 0;
          const newMinutes = Math.min(59, currentMinutes + 1);
          document.getElementById('minutes').value = newMinutes;
          actions.updateTimeFromInputs();
          timerState.setLastSetTime(timerState.totalTime);
        }
        break;

      case 'subtractMinute':
        if (!timerState.running) {
          const currentMinutes = parseInt(document.getElementById('minutes').value) || 0;
          const newMinutes = Math.max(0, currentMinutes - 1);
          document.getElementById('minutes').value = newMinutes;
          actions.updateTimeFromInputs();
          timerState.setLastSetTime(timerState.totalTime);
        }
        break;

      case 'toggleFeatureImage':
        // Toggle feature image using the same logic as the feature image button
        const { featureImageBtn } = getElements();
        if (featureImageBtn) {
          featureImageBtn.click();
        }
        break;

      case 'flashScreen':
        // Use the same flash function as the flash button
        if (actions.flashAtZero) {
          actions.flashAtZero();
        }
        break;

      case 'muteSound':
        // Set mute state
        if (actions.setMuteState) {
          actions.setMuteState(true);
        }
        break;

      case 'unmuteSound':
        // Unmute sound
        if (actions.setMuteState) {
          actions.setMuteState(false);
        }
        break;

      case 'toggleSound':
        // Toggle mute state
        if (actions.toggleMuteState) {
          actions.toggleMuteState();
        }
        break;
    }
    
    // Send immediate state update after command
    setTimeout(() => {
      actions.sendStateUpdate();
    }, 10); // Small delay to ensure DOM updates are processed
  });

  // ===============================
  // Unified API Commands (New)
  // ===============================
  
  ipcRenderer.on('api-command', (command) => {
    console.log('🌐 Received unified API command:', command);
    const { action, data } = command;
    const { startStopBtn, resetBtn, displayMessageBtn } = getElements();
    
    switch (action) {
      case 'start-timer':
        if (!timerState.running && timerState.remainingTime > 0) {
          console.log('⏰ API: Starting timer');
          startStopBtn.click();
        }
        break;
        
      case 'stop-timer':
        if (timerState.running) {
          console.log('⏹️ API: Stopping timer');
          startStopBtn.click();
        }
        break;
        
      case 'pause-timer':
        if (timerState.running && !timerState.paused) {
          console.log('⏸️ API: Pausing timer');
          startStopBtn.click();
        }
        break;
        
      case 'resume-timer':
        if (timerState.paused) {
          console.log('▶️ API: Resuming timer');
          startStopBtn.click();
        }
        break;
        
      case 'reset-timer':
        console.log('🔄 API: Resetting timer');
        resetBtn.click();
        break;
        
      case 'adjust-time':
        if (data && typeof data.seconds === 'number') {
          console.log(`⏱️ API: Adjusting time by ${data.seconds} seconds`);
          
          // Adjust only the remaining time, keep total time unchanged
          const currentRemainingTime = timerState.remainingTime;
          const adjustment = data.seconds;
          const newRemainingTime = Math.max(0, currentRemainingTime + adjustment);
          
          // Update the timer state directly (don't change total time)
          timerState.remainingTime = newRemainingTime;
          
          // Update the display to reflect the change
          actions.updateDisplay();
          
          console.log(`⏱️ Adjusted from ${currentRemainingTime}s to ${newRemainingTime}s (${adjustment >= 0 ? '+' : ''}${adjustment}s)`);
        }
        break;
        
      case 'set-time':
        if (data && typeof data.totalSeconds === 'number') {
          console.log(`⏱️ API: Setting time to ${data.totalSeconds} seconds`);
          
          // Stop timer if running
          if (timerState.running) {
            startStopBtn.click();
          }
          
          // Convert to hours, minutes, seconds
          const hours = Math.floor(data.totalSeconds / 3600);
          const minutes = Math.floor((data.totalSeconds % 3600) / 60);
          const seconds = Math.floor(data.totalSeconds % 60);
          
          // Update input fields
          document.getElementById('hours').value = hours;
          document.getElementById('minutes').value = minutes;
          document.getElementById('seconds').value = seconds;
          
          // Update time
          actions.updateTimeFromInputs();
          timerState.setLastSetTime(timerState.totalTime);
        }
        break;
        
      case 'load-preset':
        if (data && data.presetId) {
          console.log(`📋 API: Loading preset ${data.presetId}`);
          // TODO: Implement preset loading from settings
        }
        break;
        
      case 'create-preset':
        if (data) {
          console.log('📋 API: Creating preset:', data.name);
          // TODO: Implement preset creation
        }
        break;
        
      case 'update-settings':
        if (data) {
          console.log('⚙️ API: Updating settings');
          // TODO: Implement settings update
        }
        break;
        
      case 'trigger-flash':
        if (data) {
          console.log(`⚡ API: Triggering flash - ${data.cycles} cycles`);
          const canvasRenderer = getCanvasRenderer();
          if (canvasRenderer && canvasRenderer.triggerFlash) {
            canvasRenderer.triggerFlash(data.cycles || 3, data.duration || 500);
          }
        }
        break;
        
      default:
        console.warn('Unknown API command:', action);
    }
    
    // Send immediate state update after command
    setTimeout(async () => {
      actions.sendStateUpdate();
      
      // Import calculateWarningLevel for consistent state updates
      const { calculateWarningLevel } = await import('./displayManager.js');
      const warningLevel = await calculateWarningLevel(timerState.remainingTime, timerState.totalTime);
      
      // Get current settings colors
      const currentColors = {
        progressSuccess: '#4ade80',
        progressWarning: '#f59e0b', 
        progressDanger: '#ef4444'
      };
      
      ipcRenderer.send('companion-state-update', {
        timer: {
          totalTime: timerState.totalTime,
          remainingTime: timerState.remainingTime,
          running: timerState.running,
          paused: timerState.paused,
          startTime: timerState.startTime,
          endTime: timerState.endTime,
          endTimeFormatted: timerState.endTimeFormatted,
          formattedTime: actions.formatTime(timerState.remainingTime),
          percentage: timerState.totalTime > 0 ? (timerState.remainingTime / timerState.totalTime * 100) : 0,
          warningLevel: warningLevel
        },
        settings: {
          colors: currentColors
        }
      });
    }, 10);
  });

  // ===============================
  // API Timer State Updates
  // ===============================
  
  ipcRenderer.on('api-timer-state-update', (timerState) => {
    // Update canvas renderer with warning level and color information
    const canvasRenderer = getCanvasRenderer();
    if (canvasRenderer) {
      // Update canvas state with API-calculated values
      // NOTE: Do NOT update elapsed here - displayManager handles it with millisecond precision
      canvasRenderer.setState({
        countdown: timerState.formattedTime,
        progress: timerState.remainingPercentage, // Use remaining percentage
        // elapsed: timerState.formattedElapsed, // REMOVED - displayManager calculates this correctly
        endTime: timerState.endTimeFormatted,
        warningLevel: timerState.warningLevel,
        warningColor: timerState.warningColor
      });
      
      // Trigger color update if timer color matching is enabled
      const matchTimerColor = localStorage.getItem('matchTimerColor') === 'true';
      if (matchTimerColor) {
        // Force canvas to use the API-calculated warning color
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
    }
  });

  // ===============================
  // Initial State Requests
  // ===============================
  
  // Request initial display window state when app loads
  ipcRenderer.send('request-display-state');
}
