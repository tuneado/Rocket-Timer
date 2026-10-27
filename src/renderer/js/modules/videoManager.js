/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Video Input Manager Module
 * Handles video input detection, device selection, and auto-start/stop based on layout
 * /
 */
/**
 * Automatically manage video input based on layout requirements
 * @param {Object} layout - Layout configuration object
 * @param {Object} deps - Dependencies
 * @param {Object} deps.canvasRenderer - Canvas renderer instance
 * @param {Object} deps.ipcRenderer - IPC renderer for display window sync
 */
export async function handleVideoInputForLayout(layout, { canvasRenderer, ipcRenderer }) {
  // Check if layout requires video input (either videoFrame or video element)
  const needsVideo = (layout.videoFrame && layout.videoFrame.enabled) || 
                     (layout.video && layout.video.enabled);
  
  if (!canvasRenderer) {
    console.warn('Canvas renderer not available');
    return;
  }
  
  // Initialize video manager if needed
  if (!canvasRenderer.getVideoInputManager()) {
    canvasRenderer.initializeVideoInput();
  }
  
  const videoManager = canvasRenderer.getVideoInputManager();
  
  if (needsVideo) {
    // Layout needs video - try to start it
    console.log('📹 Layout requires video input, attempting to start...');

    // Attempt to get device from localStorage (main window scope) first
    let savedDeviceId = localStorage.getItem('selectedVideoDevice');

    // FALLBACK: Settings window uses its own storage; fetch persisted settings if localStorage empty
    if (!savedDeviceId && window.electron && window.electron.settings) {
      try {
        const settings = await window.electron.settings.getAll();
        if (settings && settings.defaultVideoDevice) {
          savedDeviceId = settings.defaultVideoDevice;
          if (savedDeviceId) {
            localStorage.setItem('selectedVideoDevice', savedDeviceId);
            console.log('🔄 Fallback to settings.defaultVideoDevice:', savedDeviceId);
          }
        }
        // Respect auto-start flags (default true for layout auto-start)
        const autoStartFromLayout = settings.autoStartVideoLayout !== false; // default true
        const autoStartOnLaunch = settings.autoStartVideoLaunch === true; // explicit launch flag
        const allowAutoStart = autoStartFromLayout || autoStartOnLaunch;

        if (!allowAutoStart) {
          console.log('⏹️ Auto-start disabled by settings (autoStartVideoLayout/autoStartVideoLaunch).');
          return; // Do not attempt auto-start
        }
      } catch (err) {
        console.warn('Settings fallback failed for video input:', err.message);
      }
    }

    if (savedDeviceId && !videoManager.isEnabled()) {
      try {
        // Auto-detect devices first if not already detected
        if (videoManager.devices.length === 0) {
          await videoManager.initialize();
        }

        // Validate device ID exists among detected devices; if not, try initialize again
        const deviceExists = videoManager.devices.some(d => d.deviceId === savedDeviceId);
        if (!deviceExists) {
          console.log('🔍 Saved device not in current list, reinitializing devices...');
          const devices = await videoManager.initialize();
          console.log(`🔁 Devices after reinit: ${devices.length}`);
        }

        try {
          await canvasRenderer.enableVideoInput(savedDeviceId);
          console.log('✅ Video input auto-started for layout');
        } catch (error) {
          console.error('❌ Failed to start video input:', error);
          
          // Update camera status to error via appState (status bar subscribes automatically)
          const { default: appState } = await import('./appState.js');
          appState.set('camera.active', 'error');
          
          const errorMsg = error.name === 'NotAllowedError' 
            ? 'Camera access denied - check permissions'
            : error.name === 'NotFoundError'
            ? 'Camera device not found'
            : 'Camera access failed';
          console.warn('⚠️', errorMsg);
          
          return; // Don't continue if video failed
        }

        // Apply mirror and scaling settings from stored settings
        try {
          if (window.electron && window.electron.settings) {
            const allSettings = await window.electron.settings.getAll();
            if (allSettings) {
              if (allSettings.mirrorVideo !== undefined) {
                canvasRenderer.setVideoMirror(allSettings.mirrorVideo);
              }
              if (allSettings.videoScaling !== undefined) {
                canvasRenderer.setVideoScaling(allSettings.videoScaling);
              }
            }
          }
        } catch (err) {
          console.warn('Could not apply video settings:', err.message);
        }

        // Notify display window
        if (window.electron && ipcRenderer) {
          ipcRenderer.send('video-input-started', savedDeviceId);
        }
      } catch (error) {
        console.warn('Could not auto-start video input:', error.message);
      }
    } else if (!savedDeviceId) {
      console.log('⚠️ No video device selected (localStorage + settings fallback both empty)');
      
      // Only show warning if layout explicitly requires video AND user is trying to use it
      // Don't show error during normal operation - device selection happens in Settings
      if (layout.video && layout.video.enabled) {
        console.log('⚠️ No video device selected — configure in Settings > Video Input');
      }
    } else if (videoManager.isEnabled()) {
      console.log('✅ Video already active');
    }
  } else {
    // Layout doesn't need video - check if we should stop it
    
    // Get the releaseCameraIdle setting (default: true)
    let releaseCameraIdle = true;
    if (window.electron && window.electron.settings) {
      try {
        const settings = await window.electron.settings.getAll();
        releaseCameraIdle = settings.releaseCameraIdle !== false; // Default to true if not set
      } catch (error) {
        console.warn('Could not read releaseCameraIdle setting:', error);
      }
    }
    
    if (releaseCameraIdle && videoManager.isEnabled()) {
      console.log('⏹️ Layout doesn\'t use video, stopping to save resources (releaseCameraIdle enabled)...');
      
      canvasRenderer.disableVideoInput();
      
      // Notify display window
      if (window.electron && ipcRenderer) {
        ipcRenderer.send('video-input-stopped');
      }
      
      console.log('✅ Video input auto-stopped to save resources');
    } else if (!releaseCameraIdle && videoManager.isEnabled()) {
      console.log('📹 Video input kept active (releaseCameraIdle disabled)');
    }
  }
}
