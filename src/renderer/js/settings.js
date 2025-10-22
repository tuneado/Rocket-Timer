/**
 * Settings Window JavaScript
 * Handles navigation, UI interactions, and settings persistence
 */

let currentSettings = {};

// Navigation
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Settings window loaded');

  // Load settings
  await loadSettings();

  // Setup navigation
  setupNavigation();

  // Setup form handlers
  setupFormHandlers();

  // Setup preset management
  setupPresetManagement();

  // Setup video input controls
  setupVideoInputControls();

  // Listen for video input live status from main window
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('video-input-live', (data) => {
      const statusTag = document.getElementById('videoStatus');
      const deviceSelector = document.getElementById('videoDeviceSelector');
      
      if (statusTag) {
        statusTag.classList.remove('is-light', 'is-info', 'is-success', 'is-danger');
        const statusText = statusTag.querySelector('span:last-child');
        
        // data can be: true (live), false (stopped), or an object with deviceId
        const isLive = typeof data === 'object' ? data.isLive : data;
        const liveDeviceId = typeof data === 'object' ? data.deviceId : null;
        const selectedDeviceId = deviceSelector?.value || localStorage.getItem('selectedVideoDevice');
        
        // Check if the live device matches the selected device
        const isMatchingDevice = !liveDeviceId || liveDeviceId === selectedDeviceId;
        
        if (isLive && isMatchingDevice) {
          statusTag.classList.add('is-danger'); // Red for live/active
          if (statusText) statusText.textContent = 'Live';
        } else if (isLive && !isMatchingDevice) {
          statusTag.classList.add('is-warning'); // Yellow for different device live
          if (statusText) statusText.textContent = 'Live (Other Device)';
        } else {
          const deviceCount = deviceSelector?.options.length || 0;
          if (deviceCount > 0) {
            statusTag.classList.add('is-info');
            if (statusText) statusText.textContent = `${deviceCount} Found`;
          } else {
            statusTag.classList.add('is-light');
            if (statusText) statusText.textContent = 'Inactive';
          }
        }
      }
    });
  }

  // Apply theme
  applyTheme();
});

/**
 * Setup sidebar navigation
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.settings-nav-item');
  const sections = document.querySelectorAll('.settings-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      
      // Update nav active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Update section visibility
      sections.forEach(section => section.classList.remove('active'));
      const targetSection = document.getElementById(`section-${sectionId}`);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    currentSettings = await window.electron.settings.getAll();
    console.log('Loaded settings:', currentSettings);
    
    // Populate form fields
    populateFormFields();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Populate form fields with current settings
 */
function populateFormFields() {
  // Display
  setValue('defaultLayout', currentSettings.defaultLayout);
  setValue('defaultTheme', currentSettings.defaultTheme);

  // Timer
  setValue('defaultHours', currentSettings.defaultTime?.hours || 0);
  setValue('defaultMinutes', currentSettings.defaultTime?.minutes || 45);
  setValue('defaultSeconds', currentSettings.defaultTime?.seconds || 0);
  setChecked('autoStopAtZero', currentSettings.autoStopAtZero !== false); // Default true
  setChecked('autoReset', currentSettings.autoReset);
  setChecked('soundNotification', currentSettings.soundNotification);
  setChecked('flashAtZero', currentSettings.flashAtZero);

  // Canvas
  setValue('canvasResolution', currentSettings.canvasResolution);
  setValue('canvasQuality', currentSettings.canvasQuality);
  setValue('frameRate', currentSettings.frameRate);

  // External Display
  setChecked('autoOpenDisplay', currentSettings.autoOpenDisplay);
  setValue('displayMonitor', currentSettings.displayMonitor);

  // Performance
  setChecked('hardwareAcceleration', currentSettings.hardwareAcceleration);
  setChecked('reduceMotion', currentSettings.reduceMotion);
  setChecked('lowPowerMode', currentSettings.lowPowerMode);

  // Video Input
  setValue('defaultVideoDevice', currentSettings.defaultVideoDevice);
  setChecked('autoStartVideoLaunch', currentSettings.autoStartVideoLaunch);
  setChecked('releaseCameraIdle', currentSettings.releaseCameraIdle);
  setValue('videoResolution', currentSettings.videoResolution);

  // Appearance
  setValue('appearanceTheme', currentSettings.appearanceTheme);

  // Colors
  if (currentSettings.colors) {
    setValue('countdownColor', currentSettings.colors.countdown);
    setValue('clockColor', currentSettings.colors.clock);
    setValue('elapsedColor', currentSettings.colors.elapsed);
    setValue('messageColor', currentSettings.colors.message);
    setValue('messageBackgroundColor', currentSettings.colors.messageBackground);
    setValue('separatorColor', currentSettings.colors.separator);
    setValue('backgroundColor', currentSettings.colors.background);
    setValue('progressSuccess', currentSettings.colors.progressSuccess);
    setValue('progressWarning', currentSettings.colors.progressWarning);
    setValue('progressDanger', currentSettings.colors.progressDanger);
  }

  // Presets
  if (currentSettings.presets) {
    renderPresets();
  }
}

/**
 * Setup form change handlers
 */
function setupFormHandlers() {
  // Display settings
  onChange('defaultLayout', (value) => saveSetting('defaultLayout', value));
  onChange('defaultTheme', (value) => saveSetting('defaultTheme', value));

  // Timer settings
  onChange('defaultHours', () => saveDefaultTime());
  onChange('defaultMinutes', () => saveDefaultTime());
  onChange('defaultSeconds', () => saveDefaultTime());
  onChange('autoStopAtZero', (checked) => saveSetting('autoStopAtZero', checked));
  onChange('autoReset', (checked) => saveSetting('autoReset', checked));
  onChange('soundNotification', (checked) => saveSetting('soundNotification', checked));
  onChange('flashAtZero', (checked) => saveSetting('flashAtZero', checked));

  // Canvas settings
  onChange('canvasResolution', (value) => saveSetting('canvasResolution', value));
  onChange('canvasQuality', (value) => saveSetting('canvasQuality', value));
  onChange('frameRate', (value) => saveSetting('frameRate', parseInt(value)));

  // External Display
  onChange('autoOpenDisplay', (checked) => saveSetting('autoOpenDisplay', checked));
  onChange('displayMonitor', (value) => saveSetting('displayMonitor', parseInt(value)));

  // Performance
  onChange('hardwareAcceleration', (checked) => {
    saveSetting('hardwareAcceleration', checked);
    // Show notification that restart is required
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('show-restart-notification');
    }
  });
  onChange('reduceMotion', (checked) => saveSetting('reduceMotion', checked));
  onChange('lowPowerMode', (checked) => saveSetting('lowPowerMode', checked));

  // Video Input
  onChange('defaultVideoDevice', (value) => saveSetting('defaultVideoDevice', value));
  onChange('autoStartVideoLaunch', (checked) => saveSetting('autoStartVideoLaunch', checked));
  onChange('releaseCameraIdle', (checked) => saveSetting('releaseCameraIdle', checked));
  onChange('videoResolution', (value) => saveSetting('videoResolution', value));

  // Appearance
  onChange('appearanceTheme', (value) => {
    saveSetting('appearanceTheme', value);
    applyTheme();
  });

  // Colors
  onChange('countdownColor', (value) => saveColor('countdown', value));
  onChange('clockColor', (value) => saveColor('clock', value));
  onChange('elapsedColor', (value) => saveColor('elapsed', value));
  onChange('messageColor', (value) => saveColor('message', value));
  onChange('messageBackgroundColor', (value) => saveColor('messageBackground', value));
  onChange('separatorColor', (value) => saveColor('separator', value));
  onChange('backgroundColor', (value) => saveColor('background', value));
  onChange('progressSuccess', (value) => saveColor('progressSuccess', value));
  onChange('progressWarning', (value) => saveColor('progressWarning', value));
  onChange('progressDanger', (value) => saveColor('progressDanger', value));

  // Feature Image
  setupFeatureImage();
}

/**
 * Setup feature image controls
 */
function setupFeatureImage() {
  const selectBtn = document.getElementById('selectFeatureImage');
  const clearBtn = document.getElementById('clearFeatureImage');
  const preview = document.getElementById('featureImagePreview');

  // Load current feature image if exists
  if (currentSettings.featureImage && currentSettings.featureImage.path) {
    displayFeatureImage(currentSettings.featureImage.path);
    clearBtn.disabled = false;
  }

  // Select image button
  selectBtn.addEventListener('click', async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-feature-image');
      if (result && !result.canceled && result.filePaths.length > 0) {
        const imagePath = result.filePaths[0];
        displayFeatureImage(imagePath);
        clearBtn.disabled = false;
        
        // Save to settings
        const featureImage = {
          ...currentSettings.featureImage,
          path: imagePath,
          enabled: false // Don't auto-enable, user controls via button
        };
        await saveSetting('featureImage', featureImage);
      }
    } catch (error) {
      console.error('Error selecting feature image:', error);
    }
  });

  // Clear image button
  clearBtn.addEventListener('click', async () => {
    preview.innerHTML = `
      <div class="feature-image-placeholder">
        <i class="bi bi-image" style="font-size: 3rem; color: var(--border);"></i>
        <p style="margin-top: 1rem; color: var(--text-secondary);">No image selected</p>
      </div>
    `;
    clearBtn.disabled = true;
    
    // Save to settings
    const featureImage = {
      enabled: false,
      path: ''
    };
    await saveSetting('featureImage', featureImage);
  });
}

/**
 * Display feature image in preview
 */
function displayFeatureImage(imagePath) {
  const preview = document.getElementById('featureImagePreview');
  preview.innerHTML = `<img src="file://${imagePath}" alt="Feature Image">`;
}

/**
 * Save default time setting
 */
function saveDefaultTime() {
  const hours = parseInt(getValue('defaultHours')) || 0;
  const minutes = parseInt(getValue('defaultMinutes')) || 0;
  const seconds = parseInt(getValue('defaultSeconds')) || 0;
  
  saveSetting('defaultTime', { hours, minutes, seconds });
}

/**
 * Save color setting
 */
function saveColor(colorKey, value) {
  const colors = { ...currentSettings.colors, [colorKey]: value };
  saveSetting('colors', colors);
}

/**
 * Save a single setting
 */
async function saveSetting(key, value) {
  try {
    currentSettings[key] = value;
    await window.electron.settings.save(key, value);
    console.log(`Saved setting: ${key} =`, value);
  } catch (error) {
    console.error('Error saving setting:', error);
  }
}

/**
 * Apply theme to settings window
 */
function applyTheme() {
  const theme = currentSettings.appearanceTheme || 'dark';
  
  if (theme === 'auto') {
    // Check system preference
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', systemTheme);
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

/**
 * Setup preset management
 */
function setupPresetManagement() {
  // Render existing presets
  renderPresets();
}

/**
 * Render presets list
 */
function renderPresets() {
  const presetList = document.getElementById('presetList');
  if (!presetList || !currentSettings.presets) return;

  presetList.innerHTML = currentSettings.presets.map(preset => `
    <div class="preset-item" data-id="${preset.id}">
      <i class="bi bi-grip-vertical preset-drag-handle"></i>
      <div class="preset-time">${preset.time}</div>
      <div class="preset-actions">
        <button onclick="editPreset(${preset.id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button onclick="deletePreset(${preset.id})" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Delete preset
 */
window.deletePreset = async function(id) {
  const presets = currentSettings.presets.filter(p => p.id !== id);
  await saveSetting('presets', presets);
  renderPresets();
};

/**
 * Edit preset (placeholder)
 */
window.editPreset = function(id) {
  // TODO: Implement preset editing
  console.log('Edit preset:', id);
};

/**
 * Setup video input controls
 */
function setupVideoInputControls() {
  const detectBtn = document.getElementById('detectDevices');
  const togglePreviewBtn = document.getElementById('togglePreview');
  const deviceSelector = document.getElementById('videoDeviceSelector');
  const statusTag = document.getElementById('videoStatus');
  const previewContainer = document.getElementById('videoPreview');
  const previewSection = document.getElementById('videoPreviewSection');

  // Create a temporary video manager for device detection (without canvas)
  let videoManager = null;
  let previewVideo = null;
  let previewStream = null;
  let isPreviewActive = false;

  // Function to update toggle button state
  function updateToggleButton(isActive) {
    if (!togglePreviewBtn) return;
    
    const icon = togglePreviewBtn.querySelector('i');
    const text = togglePreviewBtn.querySelector('span:last-child');
    
    if (isActive) {
      togglePreviewBtn.classList.remove('is-success');
      togglePreviewBtn.classList.add('is-danger');
      if (icon) {
        icon.className = 'bi bi-stop-circle-fill';
      }
      if (text) text.textContent = 'Stop Preview';
    } else {
      togglePreviewBtn.classList.remove('is-danger');
      togglePreviewBtn.classList.add('is-success');
      if (icon) {
        icon.className = 'bi bi-play-circle-fill';
      }
      if (text) text.textContent = 'Start Preview';
    }
  }

  // Function to start preview
  async function startPreview(deviceId) {
    try {
      // Stop existing preview
      await stopPreview(false);

      // Show preview section
      if (previewSection) {
        previewSection.style.display = 'block';
      }

      // Show loading state
      if (previewContainer) {
        previewContainer.innerHTML = '<span>Loading preview...</span>';
      }

      // Create video element for preview
      previewVideo = document.createElement('video');
      previewVideo.autoplay = true;
      previewVideo.playsInline = true;
      previewVideo.muted = true;

      // Request video stream
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      previewStream = await navigator.mediaDevices.getUserMedia(constraints);
      previewVideo.srcObject = previewStream;

      // Clear container and add video
      previewContainer.innerHTML = '';
      previewContainer.appendChild(previewVideo);

      isPreviewActive = true;
      updateToggleButton(true);

      console.log('✅ Preview started for device:', deviceId);

      // Update status
      if (statusTag) {
        statusTag.classList.remove('is-light', 'is-info', 'is-danger');
        statusTag.classList.add('is-success');
        const statusText = statusTag.querySelector('span:last-child');
        if (statusText) statusText.textContent = 'Preview Active';
      }

    } catch (error) {
      console.error('Error starting preview:', error);
      if (previewContainer) {
        previewContainer.innerHTML = '<span>Error starting preview</span>';
      }
      
      if (statusTag) {
        statusTag.classList.remove('is-light', 'is-info', 'is-success');
        statusTag.classList.add('is-danger');
        const statusText = statusTag.querySelector('span:last-child');
        if (statusText) statusText.textContent = 'Preview Error';
      }
      
      isPreviewActive = false;
      updateToggleButton(false);
    }
  }

  // Function to stop preview
  async function stopPreview(hideSection = true) {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      previewStream = null;
    }
    
    if (previewVideo) {
      previewVideo.srcObject = null;
      previewVideo = null;
    }
    
    // Optionally hide preview section
    if (hideSection && previewSection) {
      previewSection.style.display = 'none';
    }
    
    if (previewContainer) {
      previewContainer.innerHTML = '<span>Click "Start Preview" to view device</span>';
    }

    isPreviewActive = false;
    updateToggleButton(false);

    // Update status
    if (statusTag) {
      statusTag.classList.remove('is-success', 'is-danger');
      const deviceCount = deviceSelector?.options.length || 0;
      if (deviceCount > 0) {
        statusTag.classList.add('is-info');
        const statusText = statusTag.querySelector('span:last-child');
        if (statusText) statusText.textContent = `${deviceCount} Found`;
      } else {
        statusTag.classList.add('is-light');
        const statusText = statusTag.querySelector('span:last-child');
        if (statusText) statusText.textContent = 'Inactive';
      }
    }

    console.log('⏹️ Preview stopped');
  }

  // Detect devices button
  if (detectBtn) {
    detectBtn.addEventListener('click', async () => {
      try {
        detectBtn.disabled = true;
        detectBtn.classList.add('is-loading');
        
        // Initialize video manager for detection only
        if (!videoManager) {
          videoManager = new VideoInputManager(null); // No canvas needed for detection
        }
        
        const devices = await videoManager.initialize();
        
        // Update selector
        if (deviceSelector) {
          deviceSelector.innerHTML = '';
          
          if (devices.length === 0) {
            deviceSelector.innerHTML = '<option value="">No devices detected</option>';
            deviceSelector.disabled = true;
            
            // Update status
            if (statusTag) {
              statusTag.classList.remove('is-success', 'is-info');
              statusTag.classList.add('is-light');
              const statusText = statusTag.querySelector('span:last-child');
              if (statusText) statusText.textContent = 'No Devices';
            }
            
            await stopPreview();
          } else {
            devices.forEach(device => {
              const option = document.createElement('option');
              option.value = device.id;
              option.textContent = device.label;
              deviceSelector.appendChild(option);
            });
            
            // Save detected devices to localStorage for persistence
            localStorage.setItem('detectedVideoDevices', JSON.stringify(devices));
            
            // Restore previously selected device if available
            const savedDeviceId = localStorage.getItem('selectedVideoDevice');
            if (savedDeviceId) {
              // Check if saved device is in the list
              const deviceExists = devices.some(d => d.id === savedDeviceId);
              if (deviceExists) {
                deviceSelector.value = savedDeviceId;
                console.log('Restored saved device selection:', savedDeviceId);
              }
            }
            
            deviceSelector.disabled = false;
            
            // Update status
            if (statusTag) {
              statusTag.classList.remove('is-success', 'is-light');
              statusTag.classList.add('is-info');
              const statusText = statusTag.querySelector('span:last-child');
              if (statusText) statusText.textContent = `${devices.length} Found`;
            }
            
            // Show preview section but don't auto-start
            if (previewSection) {
              previewSection.style.display = 'block';
            }
          }
        }
        
        console.log(`📹 Detected ${devices.length} video devices`);
      } catch (error) {
        console.error('Error detecting devices:', error);
        
        // Update status on error
        if (statusTag) {
          statusTag.classList.remove('is-success', 'is-info', 'is-light');
          statusTag.classList.add('is-danger');
          const statusText = statusTag.querySelector('span:last-child');
          if (statusText) statusText.textContent = 'Error';
        }
        
        alert('Error detecting video devices. Please ensure camera permissions are granted.');
      } finally {
        detectBtn.disabled = false;
        detectBtn.classList.remove('is-loading');
      }
    });
  }

  // Device selector change - stop preview when switching devices and save selection
  if (deviceSelector) {
    deviceSelector.addEventListener('change', async (e) => {
      const deviceId = e.target.value;
      
      if (isPreviewActive) {
        await stopPreview(false); // Stop but keep section visible
      }
      
      // Save selected device to localStorage for main window to use
      if (deviceId) {
        localStorage.setItem('selectedVideoDevice', deviceId);
        console.log('Saved video device selection:', deviceId);
        
        // Notify main window about device change
        if (window.electron && window.electron.ipcRenderer) {
          window.electron.ipcRenderer.send('video-device-selected', deviceId);
        }
      }
    });
  }

  // Toggle preview button
  if (togglePreviewBtn) {
    togglePreviewBtn.addEventListener('click', async () => {
      const deviceId = deviceSelector?.value;
      
      if (!deviceId) {
        alert('Please select a device first');
        return;
      }

      if (isPreviewActive) {
        await stopPreview(false);
      } else {
        await startPreview(deviceId);
      }
    });
  }

  // Restore previously detected devices on load
  const savedDevices = localStorage.getItem('detectedVideoDevices');
  if (savedDevices && deviceSelector) {
    try {
      const devices = JSON.parse(savedDevices);
      
      if (devices && devices.length > 0) {
        deviceSelector.innerHTML = '';
        
        devices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.id;
          option.textContent = device.label;
          deviceSelector.appendChild(option);
        });
        
        // Restore selected device
        const savedDeviceId = localStorage.getItem('selectedVideoDevice');
        if (savedDeviceId) {
          const deviceExists = devices.some(d => d.id === savedDeviceId);
          if (deviceExists) {
            deviceSelector.value = savedDeviceId;
          }
        }
        
        deviceSelector.disabled = false;
        
        // Update status
        if (statusTag) {
          statusTag.classList.remove('is-light');
          statusTag.classList.add('is-info');
          const statusText = statusTag.querySelector('span:last-child');
          if (statusText) statusText.textContent = `${devices.length} Found`;
        }
        
        // Show preview section
        if (previewSection) {
          previewSection.style.display = 'block';
        }
        
        console.log(`📹 Restored ${devices.length} video devices from cache`);
      }
    } catch (error) {
      console.error('Error restoring saved devices:', error);
    }
  }

  // Cleanup preview when window closes
  window.addEventListener('beforeunload', () => {
    stopPreview();
  });
}

/**
 * Notify main window to apply settings when closing
 */
window.addEventListener('beforeunload', () => {
  console.log('Settings window closing, notifying main window to apply settings');
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('apply-settings', currentSettings);
  }
});

// Helper functions
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function getChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function setChecked(id, checked) {
  const el = document.getElementById(id);
  if (el) el.checked = checked;
}

function onChange(id, callback) {
  const el = document.getElementById(id);
  if (!el) return;

  if (el.type === 'checkbox') {
    el.addEventListener('change', (e) => callback(e.target.checked));
  } else {
    el.addEventListener('change', (e) => callback(e.target.value));
  }
}
