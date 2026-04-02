/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Settings Window JavaScript
 * Handles navigation, UI interactions, and settings persistence
 * /
 */
let currentSettings = {};

/**
 * Show a notification message in the settings window
 * @param {string} message - The message to show
 * @param {string} type - The type: 'info', 'warning', 'error', 'success'
 */
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('settings-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'settings-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      max-width: 400px;
      opacity: 0;
      transform: translateX(20px);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(notification);
  }

  // Set color based on type
  const colors = {
    info: '#3273dc',
    warning: '#ffdd57',
    error: '#f14668',
    success: '#48c774'
  };
  
  notification.style.backgroundColor = colors[type] || colors.info;
  notification.style.color = type === 'warning' ? '#333' : 'white';
  notification.textContent = message;
  
  // Show notification
  notification.style.opacity = '1';
  notification.style.transform = 'translateX(0)';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(20px)';
  }, 5000);
}

// Wait for Preact to finish rendering before initializing
// This event is dispatched by settings.jsx after render completes
window.addEventListener('preact-settings-ready', async () => {

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
  
  // Setup API settings
  setupApiSettings();
  
  // Update state preview colors to match current progress colors
  updateStatePreviewColors();

  // Listen for video input live status from main window
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('video-input-live', (data) => {
      const statusTag = document.getElementById('videoStatus');
      const deviceSelector = document.getElementById('videoDeviceSelector');
      
      if (statusTag) {
        // Remove all status classes (Tailwind)
        statusTag.classList.remove(
          'bg-gray-500/10', 'text-gray-500',
          'bg-blue-500/10', 'text-blue-500',
          'bg-green-500/10', 'text-green-500',
          'bg-red-500/10', 'text-red-500',
          'bg-amber-500/10', 'text-amber-500'
        );
        const statusText = statusTag.querySelector('span:last-child');
        
        // data can be: true (live), false (stopped), or an object with deviceId
        const isLive = typeof data === 'object' ? data.isLive : data;
        const liveDeviceId = typeof data === 'object' ? data.deviceId : null;
        const selectedDeviceId = deviceSelector?.value || localStorage.getItem('selectedVideoDevice');
        
        // Check if the live device matches the selected device
        const isMatchingDevice = !liveDeviceId || liveDeviceId === selectedDeviceId;
        
        if (isLive && isMatchingDevice) {
          statusTag.classList.add('bg-red-500/10', 'text-red-500'); // Red for live/active
          if (statusText) statusText.textContent = 'Live';
        } else if (isLive && !isMatchingDevice) {
          statusTag.classList.add('bg-amber-500/10', 'text-amber-500'); // Yellow for different device live
          if (statusText) statusText.textContent = 'Live (Other Device)';
        } else {
          const deviceCount = deviceSelector?.options.length || 0;
          if (deviceCount > 0) {
            statusTag.classList.add('bg-blue-500/10', 'text-blue-500');
            if (statusText) statusText.textContent = `${deviceCount} Found`;
          } else {
            statusTag.classList.add('bg-gray-500/10', 'text-gray-500');
            if (statusText) statusText.textContent = 'Inactive';
          }
        }
      }
    });
  }

  // Setup layout management
  initializeLayoutManagement();
  
  // Setup performance monitoring stats display
  setupPerformanceMonitoring();
  
  // FIX: Set default layout dropdown after layout options are populated
  setTimeout(() => {
    const defaultLayoutSelect = document.getElementById('defaultLayout');
    if (defaultLayoutSelect && currentSettings && currentSettings.defaultLayout) {
      defaultLayoutSelect.value = currentSettings.defaultLayout;
      const targetOption = defaultLayoutSelect.querySelector(`option[value="${currentSettings.defaultLayout}"]`);
      if (targetOption) {
        targetOption.selected = true;
      }
    }
  }, 500);
  
  // Listen for layout list updates (in case updated from main window)
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('layout-list-updated', () => {
      populateLayoutLists();
    });

    // Open Layout Creator button
    const openCreatorBtn = document.getElementById('openLayoutCreatorBtn');
    if (openCreatorBtn) {
      openCreatorBtn.addEventListener('click', () => {
        window.electron.ipcRenderer.send('open-layout-creator');
      });
    }
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
  
  // Store autoStopAtZero in localStorage for cross-window access
  localStorage.setItem('autoStopAtZero', (currentSettings.autoStopAtZero !== false).toString());
  
  // Store hiddenBuiltinLayouts in localStorage for main window to filter layout dropdown
  localStorage.setItem('hiddenBuiltinLayouts', JSON.stringify(currentSettings.hiddenBuiltinLayouts || []));
  
  setChecked('autoReset', currentSettings.autoReset);
  setChecked('soundNotification', currentSettings.soundNotification);
  setChecked('flashAtZero', currentSettings.flashAtZero);
  setValue('clockFormat', currentSettings.clockFormat || '24h');
  
  // Custom sound file
  const customSoundFileName = document.getElementById('customSoundFileName');
  const clearCustomSound = document.getElementById('clearCustomSound');
  if (customSoundFileName && currentSettings.customSoundFileName) {
    customSoundFileName.textContent = currentSettings.customSoundFileName;
    clearCustomSound.style.display = 'block';
  } else if (customSoundFileName) {
    customSoundFileName.textContent = 'No file selected';
    clearCustomSound.style.display = 'none';
  }

  // Timer State Thresholds
  setValue('timerThresholdType', currentSettings.timerThresholdType || 'percentage');
  setValue('warningPercentage', currentSettings.warningPercentage || 30);
  setValue('criticalPercentage', currentSettings.criticalPercentage || 5);
  setValue('warningMinutes', currentSettings.warningTimeMinutes || 2);
  setValue('warningSeconds', currentSettings.warningTimeSeconds || 0);
  setValue('criticalMinutes', currentSettings.criticalTimeMinutes || 0);
  setValue('criticalSeconds', currentSettings.criticalTimeSeconds || 30);

  // Canvas
  setValue('canvasResolution', currentSettings.canvasResolution);
  setValue('canvasQuality', currentSettings.canvasQuality);
  setValue('frameRate', currentSettings.frameRate);

  // Watermark
  setChecked('showWatermark', currentSettings.showWatermark !== false); // Default true

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
  setChecked('mirrorVideo', currentSettings.mirrorVideo);
  setValue('videoResolution', currentSettings.videoResolution);
  setValue('videoScaling', currentSettings.videoScaling);

  // Appearance
  setValue('appearanceTheme', currentSettings.appearanceTheme);
  setChecked('matchTimerColor', currentSettings.matchTimerColor);

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
    setValue('progressOvertime', currentSettings.colors.progressOvertime);
  }

  // Presets
  if (currentSettings.presets) {
    renderPresets();
  }
  
  // API & Integration
  setChecked('companionServerEnabled', currentSettings.companionServerEnabled !== false); // Default true
  setValue('companionServerPort', currentSettings.companionServerPort || 9999);
  setChecked('companionAutoStart', currentSettings.companionAutoStart !== false); // Default true
  setChecked('companionAllowExternal', currentSettings.companionAllowExternal || false);
  
  // Apply timer color matching on load
  if (currentSettings.matchTimerColor) {
    handleTimerColorMatch(true);
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
  onChange('clockFormat', (value) => {
    saveSetting('clockFormat', value);
    // Store in localStorage for fast access from clock manager
    localStorage.setItem('clockFormat', value);
  });

  // Custom sound file upload
  const customSoundFile = document.getElementById('customSoundFile');
  const customSoundFileName = document.getElementById('customSoundFileName');
  const clearCustomSound = document.getElementById('clearCustomSound');
  
  if (customSoundFile) {
    customSoundFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Read file as data URL
          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target.result;
            await saveSetting('customSoundFile', dataUrl);
            await saveSetting('customSoundFileName', file.name);
            customSoundFileName.textContent = file.name;
            clearCustomSound.style.display = 'block';
            showNotification('Custom sound uploaded successfully', 'success');
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error uploading sound file:', error);
          showNotification('Failed to upload sound file', 'error');
        }
      }
    });
  }
  
  if (clearCustomSound) {
    clearCustomSound.addEventListener('click', async () => {
      await saveSetting('customSoundFile', null);
      await saveSetting('customSoundFileName', null);
      customSoundFileName.textContent = 'No file selected';
      customSoundFile.value = '';
      clearCustomSound.style.display = 'none';
      showNotification('Custom sound cleared', 'info');
    });
  }

  // Timer State Thresholds
  onChange('timerThresholdType', (value) => {
    saveSetting('timerThresholdType', value);
    updateThresholdUI(value);
    updateTimerStatePreview();
  });
  onChange('warningPercentage', (value) => {
    saveSetting('warningPercentage', parseInt(value));
    updateTimerStatePreview();
  });
  onChange('criticalPercentage', (value) => {
    saveSetting('criticalPercentage', parseInt(value));
    updateTimerStatePreview();
  });
  onChange('warningMinutes', (value) => {
    saveSetting('warningTimeMinutes', parseInt(value));
    updateTimerStatePreview();
  });
  onChange('warningSeconds', (value) => {
    saveSetting('warningTimeSeconds', parseInt(value));
    updateTimerStatePreview();
  });
  onChange('criticalMinutes', (value) => {
    saveSetting('criticalTimeMinutes', parseInt(value));
    updateTimerStatePreview();
  });
  onChange('criticalSeconds', (value) => {
    saveSetting('criticalTimeSeconds', parseInt(value));
    updateTimerStatePreview();
  });

  // Setup timer threshold UI
  setupTimerThresholds();

  // Canvas settings
  onChange('canvasResolution', (value) => saveSetting('canvasResolution', value));
  onChange('canvasQuality', (value) => saveSetting('canvasQuality', value));
  onChange('frameRate', (value) => saveSetting('frameRate', parseInt(value)));

  // Watermark
  onChange('showWatermark', (checked) => saveSetting('showWatermark', checked));

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
  onChange('mirrorVideo', (checked) => {
    saveSetting('mirrorVideo', checked);
    // Notify main window to update video mirror setting
    ipcRenderer.send('video-mirror-changed', checked);
    // Update preview if active
    const previewVideo = document.querySelector('#videoPreview video');
    if (previewVideo) {
      previewVideo.classList.toggle('mirrored', checked);
    }
  });
  onChange('videoResolution', (value) => saveSetting('videoResolution', value));
  onChange('videoScaling', (value) => {
    saveSetting('videoScaling', value);
    // Notify main window to update video scaling
    ipcRenderer.send('video-scaling-changed', value);
  });

  // Appearance
  onChange('appearanceTheme', (value) => {
    saveSetting('appearanceTheme', value);
    applyTheme();
  });
  
  onChange('matchTimerColor', (checked) => {
    console.log('Match timer color toggle changed to:', checked);
    saveSetting('matchTimerColor', checked);
    handleTimerColorMatch(checked);
  });

  // Colors
  onChange('countdownColor', (value) => saveColor('countdown', value));
  onChange('clockColor', (value) => saveColor('clock', value));
  onChange('elapsedColor', (value) => saveColor('elapsed', value));
  onChange('messageColor', (value) => saveColor('message', value));
  onChange('messageBackgroundColor', (value) => saveColor('messageBackground', value));
  onChange('separatorColor', (value) => saveColor('separator', value));
  onChange('backgroundColor', (value) => saveColor('background', value));
  onChange('progressSuccess', (value) => {
    saveColor('progressSuccess', value);
    updateStatePreviewColors();
  });
  onChange('progressWarning', (value) => {
    saveColor('progressWarning', value);
    updateStatePreviewColors();
  });
  onChange('progressDanger', (value) => {
    saveColor('progressDanger', value);
    updateStatePreviewColors();
  });
  onChange('progressOvertime', (value) => {
    saveColor('progressOvertime', value);
    updateStatePreviewColors();
  });

  // Reset color buttons
  setupColorResetButtons();

  // Feature Image
  setupFeatureImage();
}

/**
 * Setup timer thresholds UI
 */
function setupTimerThresholds() {
  // Initialize threshold UI based on current setting
  const thresholdType = currentSettings.timerThresholdType || 'percentage';
  updateThresholdUI(thresholdType);
  updateTimerStatePreview();
}

/**
 * Update threshold UI visibility based on type
 */
function updateThresholdUI(type) {
  const percentageElements = document.querySelectorAll('.threshold-percentage');
  const timeElements = document.querySelectorAll('.threshold-time');
  
  if (type === 'percentage') {
    percentageElements.forEach(el => el.style.display = 'block');
    timeElements.forEach(el => el.style.display = 'none');
  } else {
    percentageElements.forEach(el => el.style.display = 'none');
    timeElements.forEach(el => el.style.display = 'block');
  }
}

/**
 * Update timer state preview ranges
 */
function updateTimerStatePreview() {
  const thresholdType = getValue('timerThresholdType') || 'percentage';
  const normalRange = document.getElementById('normalRange');
  const warningRange = document.getElementById('warningRange');
  const criticalRange = document.getElementById('criticalRange');
  
  if (!normalRange || !warningRange || !criticalRange) return;
  
  if (thresholdType === 'percentage') {
    const warningPercent = parseInt(getValue('warningPercentage')) || 30;
    const criticalPercent = parseInt(getValue('criticalPercentage')) || 5;
    
    // Ensure critical is less than warning
    if (criticalPercent >= warningPercent) {
      setValue('criticalPercentage', Math.max(1, warningPercent - 1));
      return updateTimerStatePreview(); // Recalculate with corrected values
    }
    
    normalRange.textContent = `Above ${warningPercent}%`;
    warningRange.textContent = `${criticalPercent}% - ${warningPercent}%`;
    criticalRange.textContent = `0% - ${criticalPercent}%`;
  } else {
    const warningMinutes = parseInt(getValue('warningMinutes')) || 2;
    const warningSeconds = parseInt(getValue('warningSeconds')) || 0;
    const criticalMinutes = parseInt(getValue('criticalMinutes')) || 0;
    const criticalSeconds = parseInt(getValue('criticalSeconds')) || 30;
    
    const warningTime = warningMinutes * 60 + warningSeconds;
    const criticalTime = criticalMinutes * 60 + criticalSeconds;
    
    // Ensure critical is less than warning
    if (criticalTime >= warningTime) {
      setValue('criticalMinutes', 0);
      setValue('criticalSeconds', Math.max(1, warningTime - 1));
      return updateTimerStatePreview(); // Recalculate with corrected values
    }
    
    const formatTime = (minutes, seconds) => {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    normalRange.textContent = `Above ${formatTime(warningMinutes, warningSeconds)}`;
    warningRange.textContent = `${formatTime(criticalMinutes, criticalSeconds)} - ${formatTime(warningMinutes, warningSeconds)}`;
    criticalRange.textContent = `00:00 - ${formatTime(criticalMinutes, criticalSeconds)}`;
  }
}

/**
 * Update state preview colors to match progress colors
 */
function updateStatePreviewColors() {
  const colors = currentSettings.colors || {};
  const root = document.documentElement;
  
  // Map progress colors to preview colors
  root.style.setProperty('--preview-normal-color', colors.progressSuccess || '#4ade80');
  root.style.setProperty('--preview-warning-color', colors.progressWarning || '#f59e0b');
  root.style.setProperty('--preview-critical-color', colors.progressDanger || '#ef4444');
  root.style.setProperty('--preview-overtime-color', colors.progressOvertime || '#991b1b');
}

/**
 * Setup color reset buttons
 */
function setupColorResetButtons() {
  const resetDisplayBtn = document.getElementById('resetDisplayColors');
  const resetProgressBtn = document.getElementById('resetProgressColors');

  // Default display colors
  const defaultDisplayColors = {
    countdown: '#ffffff',
    clock: '#808080',
    elapsed: '#808080',
    message: '#ffffff',
    messageBackground: '#000000',
    separator: '#333333',
    background: '#000000'
  };

  // Default progress colors
  const defaultProgressColors = {
    progressSuccess: '#4ade80',
    progressWarning: '#f59e0b',
    progressDanger: '#ef4444',
    progressOvertime: '#991b1b'
  };

  if (resetDisplayBtn) {
    resetDisplayBtn.addEventListener('click', () => {
      // Reset display colors to defaults
      Object.entries(defaultDisplayColors).forEach(([key, value]) => {
        const input = document.getElementById(key + 'Color');
        if (input) {
          input.value = value;
          saveColor(key, value);
        }
      });
      showNotification('Display colors reset to default', 'success');
    });
  }

  if (resetProgressBtn) {
    resetProgressBtn.addEventListener('click', () => {
      // Reset progress colors to defaults
      Object.entries(defaultProgressColors).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) {
          input.value = value;
          saveColor(key, value);
        }
      });
      updateStatePreviewColors(); // Update preview after reset
      showNotification('Progress colors reset to default', 'success');
    });
  }
}

/**
 * Setup cover image controls
 */
function setupFeatureImage() {
  const selectBtn = document.getElementById('selectCoverImage');
  const clearBtn = document.getElementById('clearCoverImage');
  const preview = document.getElementById('coverImagePreview');

  // Load current cover image if exists
  if (currentSettings.coverImage && currentSettings.coverImage.path) {
    displayCoverImage(currentSettings.coverImage.path);
    clearBtn.disabled = false;
  }

  // Select image button
  selectBtn.addEventListener('click', async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-cover-image');
      if (result && !result.canceled && result.filePaths.length > 0) {
        const imagePath = result.filePaths[0];
        displayCoverImage(imagePath);
        clearBtn.disabled = false;
        
        // Save to settings
        const coverImage = {
          ...currentSettings.coverImage,
          path: imagePath,
          enabled: false // Don't auto-enable, user controls via button
        };
        await saveSetting('coverImage', coverImage);
      }
    } catch (error) {
      console.error('Error selecting cover image:', error);
    }
  });

  // Clear image button
  clearBtn.addEventListener('click', async () => {
    preview.innerHTML = `
      <div class="placeholder">
        <i class="bi bi-image"></i>
        <span>No image selected</span>
      </div>
    `;
    clearBtn.disabled = true;
    
    // Save to settings
    const coverImage = {
      enabled: false,
      path: ''
    };
    await saveSetting('coverImage', coverImage);
  });
  
  // Setup background image controls
  setupBackgroundImage();
}

/**
 * Setup background image controls
 */
function setupBackgroundImage() {
  const selectBtn = document.getElementById('selectBackgroundImage');
  const clearBtn = document.getElementById('clearBackgroundImage');
  const preview = document.getElementById('backgroundImagePreview');

  // Load current background image if exists
  if (currentSettings.backgroundImage && currentSettings.backgroundImage.path) {
    displayBackgroundImage(currentSettings.backgroundImage.path);
    clearBtn.disabled = false;
  }

  // Select image button
  selectBtn.addEventListener('click', async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-background-image');
      if (result && !result.canceled && result.filePaths.length > 0) {
        const imagePath = result.filePaths[0];
        displayBackgroundImage(imagePath);
        clearBtn.disabled = false;
        
        // Save to settings
        const backgroundImage = {
          ...currentSettings.backgroundImage,
          path: imagePath,
          enabled: true, // Auto-enable background image
          opacity: 1.0
        };
        await saveSetting('backgroundImage', backgroundImage);
        
        // Notify display window
        window.electron.ipcRenderer.send('sync-background-image-update', {
          enabled: true,
          path: imagePath,
          opacity: 1.0
        });
      }
    } catch (error) {
      console.error('Error selecting background image:', error);
    }
  });

  // Clear image button
  clearBtn.addEventListener('click', async () => {
    preview.innerHTML = `
      <div class="placeholder">
        <i class="bi bi-image"></i>
        <span>No image selected</span>
      </div>
    `;
    clearBtn.disabled = true;
    
    // Save to settings
    const backgroundImage = {
      enabled: false,
      path: '',
      opacity: 1.0
    };
    await saveSetting('backgroundImage', backgroundImage);
    
    // Notify display window to clear background
    window.electron.ipcRenderer.send('sync-background-image-update', {
      enabled: false,
      path: '',
      opacity: 1.0
    });
  });
}

/**
 * Display cover image in preview
 */
function displayCoverImage(imagePath) {
  const preview = document.getElementById('coverImagePreview');
  preview.innerHTML = `<img src="file://${imagePath}" alt="Cover Image">`;
}

/**
 * Display background image in preview
 */
function displayBackgroundImage(imagePath) {
  const preview = document.getElementById('backgroundImagePreview');
  preview.innerHTML = `<img src="file://${imagePath}" alt="Background Image">`;
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
 * Handle timer color matching with progress bar
 */
function handleTimerColorMatch(enabled) {
  const countdownColorInput = document.getElementById('countdownColor');
  const otherColorPickers = document.getElementById('otherColorPickers');
  
  if (enabled) {
    // Disable countdown color picker and match with progress bar
    countdownColorInput.disabled = true;
    countdownColorInput.style.opacity = '0.5';
    
    console.log('🎨 Timer color will dynamically match progress bar based on warning level');
    console.log('🎨 Normal (30-100%): progressSuccess, Warning (5-30%): progressWarning, Critical (0-5%): progressDanger, Overtime: progressOvertime');
    
    // Don't set a fixed countdown color - let the renderer choose dynamically
    // The UnifiedCanvasRenderer will automatically use the appropriate progress color based on warning level
    
    // Apply immediately via IPC (main window will receive settings-updated event)
    // No need to call applyCanvasColors directly since it will be handled by IPC
    
    // Add visual indicator
    const colorWrapper = countdownColorInput.closest('.color-input-wrapper');
    if (colorWrapper && !colorWrapper.querySelector('.match-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = 'match-indicator';
      indicator.innerHTML = '<i class="bi bi-lock-fill"></i>';
      indicator.title = 'Locked to progress bar color';
      indicator.style.cssText = 'position: absolute; top: -5px; right: -5px; background: var(--progress-bg); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; z-index: 1;';
      colorWrapper.style.position = 'relative';
      colorWrapper.appendChild(indicator);
    }
  } else {
    // Re-enable countdown color picker
    countdownColorInput.disabled = false;
    countdownColorInput.style.opacity = '1';
    
    // Remove visual indicator
    const indicator = countdownColorInput.closest('.color-input-wrapper')?.querySelector('.match-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

/**
 * Save color setting
 */
function saveColor(colorKey, value) {
  const colors = { ...currentSettings.colors, [colorKey]: value };
  
  // If timer color matching is enabled and we're changing progress colors, update countdown dynamically
  if (currentSettings.matchTimerColor && ['progressSuccess', 'progressWarning', 'progressDanger', 'progressOvertime'].includes(colorKey)) {
    console.log('🔄 Progress color changed, will update countdown dynamically based on warning level');
    // Don't set a fixed countdown color - let the renderer choose based on current warning level
    // The UnifiedCanvasRenderer will automatically use the appropriate progress color
  }
  
  saveSetting('colors', colors);
  
  // Apply colors immediately to settings window
  if (window.applyCanvasColors) {
    window.applyCanvasColors(colors);
  }
  
  // Send color updates to API server for warning level colors
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('settings-colors-updated', colors);
  }
  
  // Colors will also be applied to main window via IPC settings-updated event
}

/**
 * Save a single setting
 */
async function saveSetting(key, value) {
  try {
    currentSettings[key] = value;
    await window.electron.settings.save(key, value);
    
    // Store certain settings in localStorage for access from other windows
    if (key === 'defaultLayout') {
      localStorage.setItem('canvasLayout', value);
    }
    if (key === 'matchTimerColor') {
      localStorage.setItem('matchTimerColor', value.toString());
    }
    if (key === 'autoStopAtZero') {
      localStorage.setItem('autoStopAtZero', value.toString());
    }
    
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
  let resolved = theme;

  if (theme === 'auto') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.documentElement.setAttribute('data-theme', resolved);
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

  presetList.innerHTML = currentSettings.presets.map(preset => {
    const totalSec = typeof preset.time === 'number' ? preset.time : 0;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const display = h > 0
      ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const label = preset.name ? `${preset.name} — ${display}` : display;
    return `
    <div class="preset-item" data-id="${preset.id}">
      <i class="bi bi-grip-vertical preset-drag-handle"></i>
      <div class="preset-time">${label}</div>
      <div class="preset-actions">
        <button onclick="editPreset(${preset.id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button onclick="deletePreset(${preset.id})" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');
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
      togglePreviewBtn.classList.remove('bg-green-500/10', 'text-green-500');
      togglePreviewBtn.classList.add('bg-red-500/10', 'text-red-500');
      if (icon) {
        icon.className = 'bi bi-stop-circle-fill';
      }
      if (text) text.textContent = 'Stop Preview';
    } else {
      togglePreviewBtn.classList.remove('bg-red-500/10', 'text-red-500');
      togglePreviewBtn.classList.add('bg-green-500/10', 'text-green-500');
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
        previewSection.classList.remove('hidden');
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

      // Apply mirror setting to preview
      const mirrorSwitch = document.getElementById('mirrorVideo');
      if (mirrorSwitch && mirrorSwitch.checked) {
        previewVideo.classList.add('mirrored');
      }

      // Clear container and add video
      previewContainer.innerHTML = '';
      previewContainer.appendChild(previewVideo);

      isPreviewActive = true;
      updateToggleButton(true);

      console.log('✅ Preview started for device:', deviceId);

      // Update status
      if (statusTag) {
        statusTag.classList.remove('bg-gray-500/10', 'text-gray-500', 'bg-blue-500/10', 'text-blue-500', 'bg-red-500/10', 'text-red-500');
        statusTag.classList.add('bg-green-500/10', 'text-green-500');
        const statusText = statusTag.querySelector('span:last-child');
        if (statusText) statusText.textContent = 'Preview Active';
      }

    } catch (error) {
      console.error('Error starting preview:', error);
      if (previewContainer) {
        previewContainer.innerHTML = '<span>Error starting preview</span>';
      }
      
      if (statusTag) {
        statusTag.classList.remove('bg-gray-500/10', 'text-gray-500', 'bg-blue-500/10', 'text-blue-500', 'bg-green-500/10', 'text-green-500');
        statusTag.classList.add('bg-red-500/10', 'text-red-500');
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
      previewSection.classList.add('hidden');
    }
    
    if (previewContainer) {
      previewContainer.innerHTML = '<span>Click "Start Preview" to view device</span>';
    }

    isPreviewActive = false;
    updateToggleButton(false);

    // Update status
    if (statusTag) {
      statusTag.classList.remove('bg-green-500/10', 'text-green-500', 'bg-red-500/10', 'text-red-500');
      const deviceCount = deviceSelector?.options.length || 0;
      if (deviceCount > 0) {
        statusTag.classList.add('bg-blue-500/10', 'text-blue-500');
        const statusText = statusTag.querySelector('span:last-child');
        if (statusText) statusText.textContent = `${deviceCount} Found`;
      } else {
        statusTag.classList.add('bg-gray-500/10', 'text-gray-500');
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
        detectBtn.classList.add('opacity-50', 'cursor-wait');
        
        // Request camera permission first
        showNotification('Requesting camera permission...', 'info');
        
        try {
          // Request a temporary stream to trigger permission dialog
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          
          // Stop the temporary stream immediately
          tempStream.getTracks().forEach(track => track.stop());
          
          showNotification('Permission granted. Detecting devices...', 'info');
          
        } catch (permissionError) {
          console.error('Camera permission denied:', permissionError);
          
          if (permissionError.name === 'NotAllowedError') {
            showNotification('Camera permission denied. Please allow camera access and try again.', 'error');
          } else if (permissionError.name === 'NotFoundError') {
            showNotification('No camera devices found on this system.', 'warning');
          } else {
            showNotification('Error accessing camera: ' + permissionError.message, 'error');
          }
          
          detectBtn.disabled = false;
          detectBtn.classList.remove('opacity-50', 'cursor-wait');
          return;
        }
        
        // Now enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Update selector
        if (deviceSelector) {
          deviceSelector.innerHTML = '';
          
          if (videoDevices.length === 0) {
            deviceSelector.innerHTML = '<option value="">No devices detected</option>';
            deviceSelector.disabled = true;
            
            // Update status
            if (statusTag) {
              statusTag.classList.remove('bg-green-500/10', 'text-green-500', 'bg-blue-500/10', 'text-blue-500');
              statusTag.classList.add('bg-gray-500/10', 'text-gray-500');
              const statusText = statusTag.querySelector('span:last-child');
              if (statusText) statusText.textContent = 'No Devices';
            }
            
            showNotification('No video devices detected. Make sure cameras are connected.', 'warning');
            await stopPreview();
          } else {
            videoDevices.forEach(device => {
              const option = document.createElement('option');
              option.value = device.deviceId;
              option.textContent = device.label || `Camera ${device.deviceId.substring(0, 8)}...`;
              deviceSelector.appendChild(option);
            });
            
            // Save detected devices to localStorage for persistence
            const devicesData = videoDevices.map(d => ({ id: d.deviceId, label: d.label }));
            localStorage.setItem('detectedVideoDevices', JSON.stringify(devicesData));
            
            // Restore previously selected device if available
            const savedDeviceId = localStorage.getItem('selectedVideoDevice');
            if (savedDeviceId) {
              // Check if saved device is in the list
              const deviceExists = videoDevices.some(d => d.deviceId === savedDeviceId);
              if (deviceExists) {
                deviceSelector.value = savedDeviceId;
                console.log('Restored saved device selection:', savedDeviceId);
                
                // Migrate to persistent settings if not already there
                if (window.electron && window.electron.settings) {
                  window.electron.settings.get('defaultVideoDevice').then(persistentDevice => {
                    if (!persistentDevice || persistentDevice !== savedDeviceId) {
                      window.electron.settings.save('defaultVideoDevice', savedDeviceId);
                      console.log('Migrated video device to persistent settings:', savedDeviceId);
                      
                      // Also notify main window
                      if (window.electron.ipcRenderer) {
                        window.electron.ipcRenderer.send('video-device-selected', savedDeviceId);
                      }
                    }
                  });
                }
              }
            }
            
            deviceSelector.disabled = false;
            
            // Update status
            if (statusTag) {
              statusTag.classList.remove('bg-green-500/10', 'text-green-500', 'bg-gray-500/10', 'text-gray-500');
              statusTag.classList.add('bg-blue-500/10', 'text-blue-500');
              const statusText = statusTag.querySelector('span:last-child');
              if (statusText) statusText.textContent = `${videoDevices.length} Found`;
            }
            
            showNotification(`Found ${videoDevices.length} video device(s). Ready to start video input.`, 'success');
            
            // Show preview section but don't auto-start
            if (previewSection) {
              previewSection.classList.remove('hidden');
            }
          }
        }
        
        console.log(`📹 Detected ${videoDevices.length} video devices`);
      } catch (error) {
        console.error('Error detecting devices:', error);
        
        // Update status on error
        if (statusTag) {
          statusTag.classList.remove('bg-green-500/10', 'text-green-500', 'bg-blue-500/10', 'text-blue-500', 'bg-gray-500/10', 'text-gray-500');
          statusTag.classList.add('bg-red-500/10', 'text-red-500');
          const statusText = statusTag.querySelector('span:last-child');
          if (statusText) statusText.textContent = 'Error';
        }
        
        showNotification('Unexpected error detecting video devices: ' + error.message, 'error');
      } finally {
        detectBtn.disabled = false;
        detectBtn.classList.remove('opacity-50', 'cursor-wait');
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
      
      // Save selected device to both localStorage AND persistent settings
      if (deviceId) {
        localStorage.setItem('selectedVideoDevice', deviceId);
        
        // Save to persistent settings so main window can read it
        if (window.electron && window.electron.settings) {
          await window.electron.settings.save('defaultVideoDevice', deviceId);
          console.log('Saved video device to persistent settings:', deviceId);
        }
        
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
        showNotification('Please select a device first', 'warning');
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
          statusTag.classList.remove('bg-gray-500/10', 'text-gray-500');
          statusTag.classList.add('bg-blue-500/10', 'text-blue-500');
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

// ===================================
// API & INTEGRATION HANDLERS
// ===================================
// API & INTEGRATION HANDLERS
// ===================================

/**
 * Setup API settings (called on DOMContentLoaded)
 */
function setupApiSettings() {
  // Initialize immediately
  initializeApiSettings();
  
  // Listen for server status updates from main process
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('companion-server-status', (status) => {
      updateServerStatusFromIPC(status);
    });
    
    // Request initial server status
    window.electron.ipcRenderer.send('request-server-status');
  }
  
  // Also initialize when API section is clicked
  const apiNavItem = document.querySelector('[data-section="api"]');
  if (apiNavItem) {
    apiNavItem.addEventListener('click', () => {
      setTimeout(() => {
        initializeApiSettings();
        // Request fresh status when opening the section
        if (window.electron && window.electron.ipcRenderer) {
          window.electron.ipcRenderer.send('request-server-status');
        }
      }, 100);
    });
  }
}

/**
 * Update server status from IPC event (reusing main window logic)
 */
function updateServerStatusFromIPC(status) {
  const statusDot = document.getElementById('apiStatusDot');
  const statusText = document.getElementById('apiStatusText');
  const endpointsDiv = document.getElementById('apiEndpoints');
  
  if (!statusDot || !statusText) return;

  // Check if server is enabled in settings
  const enabled = getChecked('companionServerEnabled');
  
  if (!enabled) {
    statusDot.className = 'status-dot inactive';
    statusText.textContent = 'Disabled';
    if (endpointsDiv) endpointsDiv.style.display = 'none';
    return;
  }

  // Update status based on IPC data
  if (status.running) {
    statusDot.className = 'status-dot active';
    statusText.textContent = 'Running (REST, WebSocket, OSC)';
    if (endpointsDiv) endpointsDiv.style.display = 'block';
    
    // Update endpoints with actual port
    if (status.port) {
      updateApiEndpoints(status.port);
    }
  } else if (status.error) {
    statusDot.className = 'status-dot error';
    statusText.textContent = `Error: ${status.error}`;
    if (endpointsDiv) endpointsDiv.style.display = 'none';
  } else {
    statusDot.className = 'status-dot inactive';
    statusText.textContent = 'Offline (Restart required)';
    if (endpointsDiv) endpointsDiv.style.display = 'none';
  }
}


/**
 * Initialize API settings UI
 */
function initializeApiSettings() {
  // Load REST API server settings
  const companionEnabled = getChecked('companionServerEnabled');
  const companionPort = getValue('companionServerPort') || '9999';
  const companionAllowExternal = getChecked('companionAllowExternal');

  // Setup change handlers
  onChange('companionServerEnabled', async (enabled) => {
    await window.electron.settings.save('companionServerEnabled', enabled);
    currentSettings.companionServerEnabled = enabled;
    showNotification('Unified API Server (REST, WebSocket, OSC) will ' + (enabled ? 'start' : 'stop') + ' on next launch. Restart required.', 'info');
    // Request updated status
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('request-server-status');
    }
  });

  onChange('companionServerPort', async (port) => {
    const portNum = parseInt(port);
    if (portNum < 1024 || portNum > 65535) {
      showNotification('Port must be between 1024 and 65535', 'error');
      return;
    }
    await window.electron.settings.save('companionServerPort', portNum);
    currentSettings.companionServerPort = portNum;
    showNotification('Port setting saved. Restart required.', 'info');
    updateApiEndpoints(portNum);
  });

  onChange('companionAllowExternal', async (enabled) => {
    await window.electron.settings.save('companionAllowExternal', enabled);
    currentSettings.companionAllowExternal = enabled;
    showNotification('External access setting saved. Restart required.', 'info');
    if (enabled) {
      loadNetworkAddresses();
    } else {
      document.getElementById('networkAddresses').innerHTML = `
        <div class="p-4 rounded-lg bg-[var(--bg-surface-raised)] text-sm text-[var(--text-secondary)] flex items-center gap-2">
          <i class="bi bi-info-circle"></i>
          Enable external access to see available network addresses
        </div>
      `;
    }
  });

  // Test connection button
  const testBtn = document.getElementById('testApiConnection');
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      testBtn.classList.add('opacity-50', 'cursor-wait');
      
      // Request fresh server status
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('request-server-status');
      }
      
      // Wait a bit for response
      await new Promise(resolve => setTimeout(resolve, 500));
      testBtn.classList.remove('opacity-50', 'cursor-wait');
      
      // Show notification based on current status
      const statusText = document.getElementById('apiStatusText');
      if (statusText && statusText.textContent.includes('Running')) {
        showNotification('✅ Connection successful! Unified API Server is responding on all protocols.', 'success');
      } else {
        showNotification('❌ Cannot connect to Unified API Server. Make sure it\'s running.', 'error');
      }
    });
  }

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        navigator.clipboard.writeText(targetEl.textContent);
        showNotification('Copied to clipboard!', 'success');
      }
    });
  });

  // Open API docs button
  const docsBtn = document.getElementById('openApiDocs');
  if (docsBtn) {
    docsBtn.addEventListener('click', () => {
      // Open COMPANION_API.md
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('open-api-docs');
      }
    });
  }

  // Request initial server status via IPC
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('request-server-status');
  }
  
  // Update endpoints with current port
  const port = getValue('companionServerPort') || '9999';
  updateApiEndpoints(parseInt(port));
  
  // Load network addresses if external access is enabled
  if (companionAllowExternal) {
    loadNetworkAddresses();
  }
}

/**
 * Update API endpoint displays
 */
function updateApiEndpoints(port) {
  const httpEndpoint = document.getElementById('apiHttpEndpoint');
  const wsEndpoint = document.getElementById('apiWsEndpoint');
  const oscEndpoint = document.getElementById('apiOscEndpoint');
  
  if (httpEndpoint) {
    httpEndpoint.textContent = `http://localhost:${port}/api`;
  }
  if (wsEndpoint) {
    wsEndpoint.textContent = `ws://localhost:8080`;
  }
  if (oscEndpoint) {
    oscEndpoint.textContent = `osc://localhost:7000`;
  }
}

/**
 * Load network addresses for external access
 */
async function loadNetworkAddresses() {
  const container = document.getElementById('networkAddresses');
  if (!container) return;

  try {
    // Get network addresses from main process via IPC
    const addresses = await window.electron.ipcRenderer.invoke('get-network-addresses');

    if (addresses.length === 0) {
      container.innerHTML = `
        <div class="p-4 rounded-lg bg-amber-500/10 text-sm text-amber-500 flex items-center gap-2">
          <i class="bi bi-exclamation-triangle"></i>
          No external network interfaces found
        </div>
      `;
      return;
    }

    const port = getValue('companionServerPort') || '9999';
    let html = '';
    
    addresses.forEach(({ name, address }) => {
      html += `
        <div class="network-address-item">
          <div>
            <strong>${name}</strong>
            <code id="addr-${address.replace(/\./g, '-')}"}>http://${address}:${port}/api</code>
          </div>
          <button class="px-2 py-1 text-xs rounded bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-hover)] copy-btn" data-copy-target="addr-${address.replace(/\./g, '-')}">
            <i class="bi bi-clipboard"></i>
          </button>
        </div>
      `;
    });

    container.innerHTML = html;
    
    // Re-attach copy handlers
    container.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-copy-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          navigator.clipboard.writeText(targetEl.textContent);
          showNotification('Address copied to clipboard!', 'success');
        }
      });
    });

  } catch (error) {
    console.error('Error loading network addresses:', error);
    container.innerHTML = `
      <div class="p-4 rounded-lg bg-amber-500/10 text-sm text-amber-500 flex items-center gap-2">
        <i class="bi bi-exclamation-triangle"></i>
        Could not load network addresses: ${error.message}
      </div>
    `;
  }
}

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

// Layout Management Functions
function initializeLayoutManagement() {
  // Populate built-in and custom layouts
  populateLayoutLists();
  
  // Populate default layout dropdown
  populateDefaultLayoutDropdown();
  
  // File input handling
  const fileInput = document.getElementById('layoutFileInput');
  const fileNameDiv = document.getElementById('layoutFileName');
  const fileNameSpan = fileNameDiv?.querySelector('span');
  const uploadBtn = document.getElementById('uploadLayoutBtn');
  const validateBtn = document.getElementById('validateLayoutBtn');
  
  let selectedLayoutData = null;
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
      if (fileNameSpan) fileNameSpan.textContent = 'No file selected';
      if (fileNameDiv) fileNameDiv.classList.add('hidden');
      uploadBtn.disabled = true;
      validateBtn.disabled = true;
      selectedLayoutData = null;
      clearValidationResult();
      return;
    }
    
    if (fileNameSpan) fileNameSpan.textContent = file.name;
    if (fileNameDiv) fileNameDiv.classList.remove('hidden');
    
    try {
      const text = await file.text();
      selectedLayoutData = JSON.parse(text);
      uploadBtn.disabled = false;
      validateBtn.disabled = false;
      clearValidationResult();
    } catch (error) {
      showNotification(`Invalid JSON file: ${error.message}`, 'error');
      uploadBtn.disabled = true;
      validateBtn.disabled = false; // Allow validation to show error
      selectedLayoutData = null;
    }
  });
  
  // Validate button
  validateBtn.addEventListener('click', () => {
    if (!selectedLayoutData) {
      showValidationResult(false, ['No layout data to validate']);
      return;
    }
    
    const validation = LayoutRegistry.validateLayout(selectedLayoutData);
    showValidationResult(validation.isValid, validation.errors);
  });
  
  // Upload button
  uploadBtn.addEventListener('click', () => {
    if (!selectedLayoutData) return;
    
    const validation = LayoutRegistry.validateLayout(selectedLayoutData);
    if (!validation.isValid) {
      showNotification('Please fix validation errors before uploading', 'error');
      showValidationResult(validation.isValid, validation.errors);
      return;
    }
    
    // Generate unique ID from filename
    const fileName = fileInput.files[0].name.replace(/\.[^/.]+$/, ""); // Remove extension
    const layoutId = fileName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if ID already exists
    if (LayoutRegistry.hasLayout(layoutId)) {
      if (!confirm(`A layout with ID "${layoutId}" already exists. Replace it?`)) {
        return;
      }
    }
    
    if (LayoutRegistry.addCustomLayout(layoutId, selectedLayoutData)) {
      showNotification(`Layout "${selectedLayoutData.name}" uploaded successfully!`, 'success');
      populateLayoutLists();
      
      // Reset form
      fileInput.value = '';
      if (fileNameSpan) fileNameSpan.textContent = 'No file selected';
      if (fileNameDiv) fileNameDiv.classList.add('hidden');
      uploadBtn.disabled = true;
      validateBtn.disabled = true;
      selectedLayoutData = null;
      clearValidationResult();
      
      // Update main window layout selector
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('layout-list-updated');
      }
    } else {
      showNotification('Failed to upload layout', 'error');
    }
  });
  
  // Download sample button
  document.getElementById('downloadSampleBtn').addEventListener('click', () => {
    const sampleLayout = LayoutRegistry.getLayout('classic');
    const blob = new Blob([JSON.stringify(sampleLayout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-layout.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  
  // Clear all custom layouts button
  document.getElementById('clearAllCustomLayouts').addEventListener('click', () => {
    const customLayouts = LayoutRegistry.getCustomLayouts();
    if (customLayouts.length === 0) {
      showNotification('No custom layouts to clear', 'info');
      return;
    }
    
    if (confirm(`Delete all ${customLayouts.length} custom layouts? This action cannot be undone.`)) {
      if (LayoutRegistry.clearAllCustomLayouts()) {
        showNotification('All custom layouts cleared successfully', 'success');
        populateLayoutLists();
        
        // Update main window layout selector
        if (window.electron && window.electron.ipcRenderer) {
          window.electron.ipcRenderer.send('layout-list-updated');
        }
      } else {
        showNotification('Failed to clear custom layouts', 'error');
      }
    }
  });
}

function populateLayoutLists() {
  const builtinList = document.getElementById('builtinLayoutsList');
  const customList = document.getElementById('customLayoutsList');
  
  // Populate built-in layouts
  const builtinLayouts = LayoutRegistry.getBuiltinLayouts();
  builtinList.innerHTML = builtinLayouts.map(layout => createLayoutItem(layout)).join('');
  
  // Add hide toggle handlers for built-in layouts
  builtinList.querySelectorAll('.hide-layout-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const layoutId = e.target.dataset.layoutId;
      const isHidden = e.target.checked;
      const layoutItem = e.target.closest('.layout-item');
      
      // Update hidden layouts array
      let hiddenLayouts = currentSettings.hiddenBuiltinLayouts || [];
      if (isHidden) {
        if (!hiddenLayouts.includes(layoutId)) {
          hiddenLayouts.push(layoutId);
        }
        layoutItem.classList.add('layout-hidden');
      } else {
        hiddenLayouts = hiddenLayouts.filter(id => id !== layoutId);
        layoutItem.classList.remove('layout-hidden');
      }
      
      // Save setting
      await saveSetting('hiddenBuiltinLayouts', hiddenLayouts);
      currentSettings.hiddenBuiltinLayouts = hiddenLayouts;
      
      // Store in localStorage for main window access
      localStorage.setItem('hiddenBuiltinLayouts', JSON.stringify(hiddenLayouts));
      
      // Update main window layout selector
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('layout-list-updated');
      }
      
      populateDefaultLayoutDropdown();
    });
  });
  
  // Also update the default layout dropdown when layouts change
  populateDefaultLayoutDropdown();
  
  // Populate custom layouts
  const customLayouts = LayoutRegistry.getCustomLayouts();
  const customActionsDiv = document.getElementById('customLayoutsActions');
  
  if (customLayouts.length === 0) {
    customList.innerHTML = `
      <div class="p-4 rounded-lg bg-[var(--bg-surface-raised)] text-sm text-[var(--text-secondary)] flex items-center gap-2">
        <i class="bi bi-info-circle"></i>
        No custom layouts uploaded yet
      </div>
    `;
    if (customActionsDiv) customActionsDiv.style.display = 'none';
  } else {
    customList.innerHTML = customLayouts.map(layout => createLayoutItem(layout)).join('');
    if (customActionsDiv) customActionsDiv.style.display = 'flex';
  }
  
  // Add delete handlers for custom layouts
  customList.querySelectorAll('.delete-layout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const layoutId = e.target.closest('.layout-item').dataset.layoutId;
      const layoutName = e.target.closest('.layout-item').querySelector('.layout-item-name').textContent;
      
      if (confirm(`Delete custom layout "${layoutName}"?`)) {
        if (LayoutRegistry.removeCustomLayout(layoutId)) {
          showNotification(`Layout "${layoutName}" deleted successfully`, 'success');
          populateLayoutLists();
          
          // Update main window layout selector
          if (window.electron && window.electron.ipcRenderer) {
            window.electron.ipcRenderer.send('layout-list-updated');
          }
        } else {
          showNotification('Failed to delete layout', 'error');
        }
      }
    });
  });
}

function createLayoutItem(layout) {
  const resolution = layout.resolution ? `${layout.resolution.width}×${layout.resolution.height}` : 'Unknown';
  const isBuiltin = layout.type === 'builtin';
  
  // Get hidden layouts from settings
  const hiddenLayouts = currentSettings.hiddenBuiltinLayouts || [];
  const isHidden = hiddenLayouts.includes(layout.id);
  
  const deleteButton = layout.type === 'custom' ? `
    <button class="px-2 py-1 text-xs rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 delete-layout-btn" title="Delete Layout">
      <i class="bi bi-trash"></i>
    </button>
  ` : '';
  
  // Hide toggle for built-in layouts
  const hideToggle = isBuiltin ? `
    <label class="hide-layout-toggle flex items-center gap-1.5 cursor-pointer text-xs text-[var(--text-secondary)]" title="Hide from layout selector">
      <input type="checkbox" class="hide-layout-checkbox" data-layout-id="${layout.id}" ${isHidden ? 'checked' : ''} />
      <span>Hide</span>
    </label>
  ` : '';
  
  // Compact style for built-in, fuller for custom
  if (isBuiltin) {
    return `
      <div class="layout-item layout-item-compact ${isHidden ? 'layout-hidden' : ''}" data-layout-id="${layout.id}">
        <div class="layout-item-info">
          <div class="layout-item-name text-sm">${layout.name} <span class="inline-block ml-1.5 px-1.5 py-px text-[9px] font-mono rounded bg-white/5 text-[var(--text-muted)] opacity-70">ID: ${layout.id}</span></div>
          <div class="layout-item-description text-xs">${layout.description}</div>
        </div>
        <div class="layout-item-actions">
          <span class="layout-item-resolution text-xs">${resolution}</span>
          ${hideToggle}
        </div>
      </div>
    `;
  }
  
  return `
    <div class="layout-item" data-layout-id="${layout.id}">
      <div class="layout-item-info">
        <div class="layout-item-name">${layout.name} <span class="inline-block ml-1.5 px-1.5 py-px text-[9px] font-mono rounded bg-white/5 text-[var(--text-muted)] opacity-70">ID: ${layout.id}</span></div>
        <div class="layout-item-description">${layout.description}</div>
        <div class="layout-item-resolution">${resolution}</div>
      </div>
      <div class="layout-item-actions">
        <span class="layout-item-type ${layout.type}">${layout.type}</span>
        ${deleteButton}
      </div>
    </div>
  `;
}

function showValidationResult(isValid, errors) {
  const existingValidation = document.querySelector('.layout-validation');
  if (existingValidation) {
    existingValidation.remove();
  }
  
  const uploadControls = document.querySelector('.layout-upload-controls');
  const validationDiv = document.createElement('div');
  validationDiv.className = `layout-validation ${isValid ? 'valid' : 'invalid'}`;
  
  if (isValid) {
    validationDiv.innerHTML = `
      <div class="layout-validation-title">
        <i class="bi bi-check-circle"></i>
        Layout validation passed
      </div>
      <p>The layout file is valid and ready to upload.</p>
    `;
  } else {
    validationDiv.innerHTML = `
      <div class="layout-validation-title">
        <i class="bi bi-x-circle"></i>
        Layout validation failed
      </div>
      <ul class="layout-validation-errors">
        ${errors.map(error => `<li>${error}</li>`).join('')}
      </ul>
    `;
  }
  
  uploadControls.appendChild(validationDiv);
}

function clearValidationResult() {
  const existingValidation = document.querySelector('.layout-validation');
  if (existingValidation) {
    existingValidation.remove();
  }
}

/**
 * Populate the default layout dropdown in Display settings
 */
function populateDefaultLayoutDropdown() {
  const defaultLayoutSelect = document.getElementById('defaultLayout');
  if (!defaultLayoutSelect) return;
  
  const currentValue = defaultLayoutSelect.value;
  const availableLayouts = LayoutRegistry.getAllLayouts();
  
  // Clear existing options
  defaultLayoutSelect.innerHTML = '';
  
  // Add all available layouts
  availableLayouts.forEach(layout => {
    const option = document.createElement('option');
    option.value = layout.id;
    option.textContent = `${layout.name} - ${layout.description}`;
    defaultLayoutSelect.appendChild(option);
  });
  
  // Restore previous selection if it still exists
  if (LayoutRegistry.hasLayout(currentValue)) {
    defaultLayoutSelect.value = currentValue;
  } else {
    // Fallback to registry default if current selection no longer exists
    defaultLayoutSelect.value = LayoutRegistry.getDefaultLayout();
  }
}

/**
 * Setup performance monitoring stats display
 */
function setupPerformanceMonitoring() {
  const performanceSection = document.getElementById('section-performance');
  if (performanceSection) {
    // Listen for performance stats from main window via IPC
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.on('performance-stats-update', (stats) => {
        updatePerformanceStats(stats);
      });
    }
    
    // Initial update with placeholder
    setTimeout(updatePerformanceStats, 500);
  }
}

/**
 * Update performance statistics display
 * @param {object} stats - Performance stats object from canvasRenderer
 */
function updatePerformanceStats(stats = null) {
  const statFPS = document.getElementById('statFPS');
  const statRenderTime = document.getElementById('statRenderTime');
  const statDroppedFrames = document.getElementById('statDroppedFrames');
  const statCacheSize = document.getElementById('statCacheSize');
  
  if (!stats) {
    // No stats available yet
    if (statFPS) statFPS.textContent = '--';
    if (statRenderTime) statRenderTime.textContent = '--';
    if (statDroppedFrames) statDroppedFrames.textContent = '--';
    if (statCacheSize) statCacheSize.textContent = '--';
    return;
  }
  
  if (statFPS) {
    // Smart color logic: compare against effective target (display-limited)
    const currentFPS = parseFloat(stats.currentFPS);
    const effectiveTarget = stats.effectiveTargetFPS || stats.targetFPS;
    
    let fpsColor = 'text-green-500';
    let fpsNote = '';
    
    if (stats.isDisplayLimited) {
      // Target exceeds display refresh rate
      if (currentFPS >= stats.displayRefreshRate * 0.9) {
        fpsColor = 'text-green-500';
        fpsNote = `<span class="text-blue-400 text-[10px]">⚡ Display limited (${stats.displayRefreshRate}Hz)</span>`;
      } else {
        fpsColor = 'text-yellow-500';
        fpsNote = `<span class="text-yellow-400 text-[10px]">(${stats.displayRefreshRate}Hz max)</span>`;
      }
    } else {
      // Target is within display capabilities
      if (currentFPS >= stats.targetFPS * 0.9) {
        fpsColor = 'text-green-500';
      } else if (currentFPS >= stats.targetFPS * 0.7) {
        fpsColor = 'text-yellow-500';
      } else {
        fpsColor = 'text-red-500';
      }
    }
    
    statFPS.innerHTML = `<span class="${fpsColor}">${stats.currentFPS} / ${stats.targetFPS}</span> ${fpsNote}`;
  }
  if (statRenderTime) {
    statRenderTime.textContent = `${stats.averageRenderTime}ms (${stats.minRenderTime}-${stats.maxRenderTime}ms)`;
  }
  if (statDroppedFrames) {
    const droppedColor = stats.droppedFrames > 100 ? 'text-red-500' : stats.droppedFrames > 10 ? 'text-yellow-500' : 'text-green-500';
    statDroppedFrames.innerHTML = `<span class="${droppedColor}">${stats.droppedFrames}</span> / ${stats.frameCount} frames`;
  }
  if (statCacheSize) {
    statCacheSize.textContent = `Text: ${stats.cacheSize.textMetrics}, Images: ${stats.cacheSize.images}`;
  }
}

