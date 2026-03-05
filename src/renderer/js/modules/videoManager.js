/**
 * Video Input Manager Module
 * Handles video input detection, device selection, and auto-start/stop based on layout
 */

/**
 * Automatically manage video input based on layout requirements
 * @param {Object} layout - Layout configuration object
 * @param {Object} deps - Dependencies
 * @param {Object} deps.canvasRenderer - Canvas renderer instance
 * @param {Object} deps.ipcRenderer - IPC renderer for display window sync
 */
export async function handleVideoInputForLayout(layout, { canvasRenderer, ipcRenderer }) {
  // Check if layout requires video input
  const needsVideo = layout.videoFrame && layout.videoFrame.enabled;
  
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
        const deviceExists = videoManager.devices.some(d => d.id === savedDeviceId);
        if (!deviceExists) {
          console.log('🔍 Saved device not in current list, reinitializing devices...');
          const devices = await videoManager.initialize();
          console.log(`🔁 Devices after reinit: ${devices.length}`);
        }

        await canvasRenderer.enableVideoInput(savedDeviceId);
        console.log('✅ Video input auto-started for layout');

        // Notify display window
        if (window.electron && ipcRenderer) {
          ipcRenderer.send('video-input-started', savedDeviceId);
        }
      } catch (error) {
        console.warn('Could not auto-start video input:', error.message);
      }
    } else if (!savedDeviceId) {
      console.log('⚠️ No video device selected (localStorage + settings fallback both empty)');
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

/**
 * Initialize video input controls in settings UI
 * @param {Object} deps - Dependencies
 * @param {Object} deps.canvasRenderer - Canvas renderer instance
 * @param {Object} deps.ipcRenderer - IPC renderer for display window sync
 * @param {Function} deps.getElementById - Function to get element by ID
 * @param {Function} deps.updateVideoStatus - Function to update status display
 */
export function initializeVideoInputControls({ canvasRenderer, ipcRenderer, getElementById, updateVideoStatus, statusBar }) {
  const detectDevicesBtn = getElementById('detectDevices');
  const videoDeviceSelector = getElementById('videoDeviceSelector');
  const startVideoBtn = getElementById('startVideo');
  const stopVideoBtn = getElementById('stopVideo');
  
  if (!detectDevicesBtn || !videoDeviceSelector || !startVideoBtn || !stopVideoBtn) {
    console.warn('Video input controls not found in DOM');
    return;
  }
  
  // Detect video devices
  detectDevicesBtn.addEventListener('click', async () => {
    try {
      detectDevicesBtn.disabled = true;
      detectDevicesBtn.classList.add('is-loading');
      
      // First, request camera permission
      statusBar.info('Requesting camera permission...', 3000);
      
      try {
        // Request a temporary stream to trigger permission dialog
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Stop the temporary stream immediately
        tempStream.getTracks().forEach(track => track.stop());
        
        statusBar.info('Permission granted. Detecting devices...', 3000);
        
      } catch (permissionError) {
        console.error('Camera permission denied:', permissionError);
        
        if (permissionError.name === 'NotAllowedError') {
          statusBar.error('Camera permission denied. Please allow camera access and try again.');
        } else if (permissionError.name === 'NotFoundError') {
          statusBar.error('No camera devices found on this system.');
        } else {
          statusBar.error('Error accessing camera: ' + permissionError.message);
        }
        
        updateVideoStatus('Permission Denied', 'is-danger');
        detectDevicesBtn.disabled = false;
        detectDevicesBtn.classList.remove('is-loading');
        return;
      }
      
      // Initialize video input manager if needed
      if (canvasRenderer && !canvasRenderer.getVideoInputManager()) {
        canvasRenderer.initializeVideoInput();
      }
      
      const videoManager = canvasRenderer.getVideoInputManager();
      const devices = await videoManager.initialize();
      
      // Populate dropdown
      videoDeviceSelector.innerHTML = '';
      
      if (devices.length === 0) {
        videoDeviceSelector.innerHTML = '<option value="">No video devices found</option>';
        videoDeviceSelector.disabled = true;
        startVideoBtn.disabled = true;
        updateVideoStatus('No Devices', 'is-light');
        statusBar.warning('No video devices detected. Make sure cameras are connected.', 5000);
      } else {
        devices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.id;
          option.textContent = device.label || `Camera ${device.id.substring(0, 8)}...`;
          videoDeviceSelector.appendChild(option);
        });
        
        // Restore previously selected device if available
        const savedDeviceId = localStorage.getItem('selectedVideoDevice');
        if (savedDeviceId) {
          videoDeviceSelector.value = savedDeviceId;
        }
        
        videoDeviceSelector.disabled = false;
        startVideoBtn.disabled = false;
        updateVideoStatus(`${devices.length} Device${devices.length > 1 ? 's' : ''} Found`, 'is-info');
        statusBar.success(`Found ${devices.length} video device(s). Ready to start video input.`, 5000);
      }
      
      console.log(`📹 Found ${devices.length} video device(s)`);
      
    } catch (error) {
      console.error('Error detecting video devices:', error);
      statusBar.error('Unexpected error detecting video devices: ' + error.message);
      updateVideoStatus('Error', 'is-danger');
    } finally {
      detectDevicesBtn.disabled = false;
      detectDevicesBtn.classList.remove('is-loading');
    }
  });
  
  // Start video input
  startVideoBtn.addEventListener('click', async () => {
    try {
      const deviceId = videoDeviceSelector.value;
      if (!deviceId) {
        statusBar.warning('Please select a video device first', 5000);
        return;
      }
      
      startVideoBtn.disabled = true;
      startVideoBtn.classList.add('is-loading');
      
      const videoInfo = await canvasRenderer.enableVideoInput(deviceId);
      
      console.log('✅ Video input started:', videoInfo);
      
      // Save selected device for auto-start
      localStorage.setItem('selectedVideoDevice', deviceId);
      
      // Sync with display window
      if (window.electron && ipcRenderer) {
        ipcRenderer.send('video-input-started', deviceId);
      }
      
      // Update UI
      updateVideoStatus('Active', 'is-success');
      statusBar.success('Video input started successfully', 5000);
      stopVideoBtn.disabled = false;
      videoDeviceSelector.disabled = true;
      detectDevicesBtn.disabled = true;
      
    } catch (error) {
      console.error('Error starting video input:', error);
      
      if (error.name === 'NotAllowedError') {
        statusBar.error('Camera permission denied. Please allow camera access in your system settings.');
      } else if (error.name === 'NotFoundError') {
        statusBar.error('Selected camera device not found. Try detecting devices again.');
      } else if (error.name === 'NotReadableError') {
        statusBar.error('Camera is already in use by another application.');
      } else {
        statusBar.error('Error starting video: ' + error.message);
      }
      
      updateVideoStatus('Error', 'is-danger');
    } finally {
      startVideoBtn.disabled = false;
      startVideoBtn.classList.remove('is-loading');
    }
  });
  
  // Stop video input
  stopVideoBtn.addEventListener('click', () => {
    canvasRenderer.disableVideoInput();
    
    // Sync with display window
    if (window.electron && ipcRenderer) {
      ipcRenderer.send('video-input-stopped');
    }
    
    // Update UI
    updateVideoStatus('Inactive', 'is-light');
    stopVideoBtn.disabled = true;
    startVideoBtn.disabled = false;
    videoDeviceSelector.disabled = false;
    detectDevicesBtn.disabled = false;
    
    console.log('⏹️ Video input stopped');
  });
  
  // Save device selection when changed
  videoDeviceSelector.addEventListener('change', (e) => {
    const deviceId = e.target.value;
    if (deviceId) {
      localStorage.setItem('selectedVideoDevice', deviceId);
      console.log('📹 Video device selected:', deviceId);
    }
  });
}

/**
 * Update video status display
 * @param {string} text - Status text to display
 * @param {string} colorClass - Bulma color class (is-light, is-info, is-success, etc.)
 * @param {Function} getElementById - Function to get element by ID
 */
export function updateVideoStatus(text, colorClass, { getElementById }) {
  const videoStatus = getElementById('videoStatus');
  if (videoStatus) {
    // Remove existing color classes
    videoStatus.classList.remove('is-light', 'is-info', 'is-success', 'is-warning', 'is-danger');
    
    // Add new color class
    if (colorClass) {
      videoStatus.classList.add(colorClass);
    }
    
    // Update text
    const textSpan = videoStatus.querySelector('span:last-child');
    if (textSpan) {
      textSpan.textContent = text;
    }
  }
}
