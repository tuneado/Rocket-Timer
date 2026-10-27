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
 * - Application menu actions (run through mainActions.js)
 * - Companion API commands (start, stop, reset, setTime, loadPreset, changeLayout, setMessage)
 * - Video device changes
 * - Settings application
 * /
 */
import appState from './appState.js';
import logger from '../utils/logger.js';

/**
 * Initialize all IPC event handlers
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.ipcRenderer - Electron IPC renderer
 * @param {Object} deps.statusBar - Status bar module
 * @param {Object} deps.timerState - Timer state object with getters/setters
 * @param {Function} deps.getCanvasRenderer - Function that returns current canvas renderer
 * @param {Object} deps.actions - Main window actions (see mainActions.js)
 */
export function initializeIPCHandlers(deps) {
  const {
    ipcRenderer,
    statusBar,
    timerState,
    getCanvasRenderer,
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

    if (settings.appearanceTheme) {
      actions.applyTheme(settings.appearanceTheme);
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


  // Application menu items (src/main/menu.js)
  ipcRenderer.on('menu-action', ({ action, args = [] } = {}) => {
    if (typeof actions[action] === 'function') {
      actions[action](...args);
    } else {
      console.warn('Unknown menu action:', action);
    }
  });

  // ===============================
  // Companion Server Status
  // ===============================

  ipcRenderer.on('companion-server-status', (status) => {
    // The status footer follows appState (and reports errors)
    appState.update({
      'server.running': status.running,
      'server.port': status.port,
      'server.error': status.error || null
    });

    logger.info('IPC', `Companion server status: ${status.running ? 'running on port ' + status.port : 'inactive'}`);
  });

  // ===============================
  // Unified API Commands (New)
  // ===============================

  ipcRenderer.on('api-command', (command) => {
    console.log('🌐 Received unified API command:', command);
    const { action, data } = command;

    switch (action) {
      case 'create-preset':
      case 'update-settings':
        // Handled in the main process; nothing to do here
        break;

      case 'trigger-flash':
        if (data) {
          console.log(`⚡ API: Triggering flash - ${data.cycles || 3} cycles`);
          actions.flash();
        }
        break;

      case 'mute-sound':
        actions.setMuted(true);
        break;

      case 'unmute-sound':
        actions.setMuted(false);
        break;

      case 'toggle-sound':
        actions.toggleMute();
        break;

      case 'toggle-feature-image':
        actions.toggleCoverImage();
        break;

      case 'set-feature-image':
        if (data && typeof data.enabled === 'boolean') {
          actions.setCoverImage(data.enabled);
        }
        break;

      case 'change-layout':
        if (data && data.layout) {
          console.log(`🎨 API: Changing layout to ${data.layout}`);
          actions.changeLayout(data.layout);
        }
        break;

      case 'set-message':
        // Show the text (or refresh it if a message is already shown)
        if (data && data.message) {
          actions.setMessageDraft(data.message);
          actions.showMessage(data.message);
        }
        break;

      case 'set-message-text':
        if (data && typeof data.message === 'string') {
          actions.setMessageDraft(data.message);
        }
        break;

      case 'hide-message':
        if (appState.get('message.visible')) actions.hideMessage();
        break;

      case 'toggle-message':
        actions.toggleMessage();
        break;

      default:
        console.warn('Unknown API command:', action);
    }
  });

  // ===============================
  // API Timer State Updates
  // ===============================

  let lastWarningLevel = 'normal';
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

    // Note entering a new warning level (this event arrives on every tick)
    const levelChanged = timerState.warningLevel !== lastWarningLevel;
    lastWarningLevel = timerState.warningLevel;
    if (statusBar && levelChanged && timerState.warningLevel !== 'normal') {
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

  // (The external display mirrors the preview: modules/displaySync.js)

  ipcRenderer.on('display-window-closed', () => {
    console.log('Display window was closed');
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
