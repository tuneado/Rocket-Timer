const { ipcMain, clipboard, dialog } = require('electron');
const { createMainWindow, createDisplayWindow, toggleDisplayWindow, getDisplayWindow, isDisplayWindowVisible, getSettingsWindow, createLayoutCreatorWindow, getLayoutCreatorWindow } = require('./windows');
const { updateDisplayMenuItems } = require('./menu');
const SettingsManager = require('./settingsManager');

let settingsManager;

function setupIpcHandlers(mainWindow) {
  // Initialize settings manager
  settingsManager = new SettingsManager();

  // App info
  ipcMain.handle('get-app-version', async () => {
    return require('../../package.json').version;
  });

  // Settings handlers
  ipcMain.handle('get-settings', async () => {
    return settingsManager.getSettings();
  });

  ipcMain.handle('get-setting', async (event, key) => {
    return settingsManager.getSetting(key);
  });

  ipcMain.handle('save-settings', async (event, settings) => {
    const success = settingsManager.saveSettings(settings);
    
    // Notify all windows of settings change
    if (success) {
      const updatedSettings = settingsManager.getSettings();
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('settings-updated', updatedSettings);
      }
      
      const displayWindow = getDisplayWindow();
      if (displayWindow && !displayWindow.isDestroyed()) {
        displayWindow.webContents.send('settings-updated', updatedSettings);
      }
      
      const settingsWindow = getSettingsWindow();
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.webContents.send('settings-updated', updatedSettings);
      }
    }
    
    return success;
  });

  ipcMain.handle('save-setting', async (event, key, value) => {
    const success = settingsManager.setSetting(key, value);
    
    // Notify all windows of settings change
    if (success) {
      const updatedSettings = settingsManager.getSettings();
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('settings-updated', updatedSettings);
      }
      
      const displayWindow = getDisplayWindow();
      if (displayWindow && !displayWindow.isDestroyed()) {
        displayWindow.webContents.send('settings-updated', updatedSettings);
      }
      
      const settingsWindow = getSettingsWindow();
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.webContents.send('settings-updated', updatedSettings);
      }
    }
    
    return success;
  });

  ipcMain.handle('reset-settings', async () => {
    return settingsManager.resetSettings();
  });

  // Handle apply-settings (when settings window closes)
  ipcMain.on('apply-settings', (event, settings) => {
    console.log('Applying settings from settings window');
    
    // Notify main window to apply settings
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('apply-settings', settings);
    }
    
    // Notify display window if open
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed()) {
      displayWindow.webContents.send('apply-settings', settings);
    }
  });

  // Handle display window toggle
  ipcMain.on('toggle-display-window', (event) => {
    try {
      console.log('toggle-display-window event received');
      const isVisible = toggleDisplayWindow();
      console.log('Display window toggled. Now visible:', isVisible);
      
      // Send the new state back to the main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('display-window-state-changed', isVisible);
        
        // If window is now visible, request current state sync
        if (isVisible) {
          mainWindow.webContents.send('request-current-state-for-display');
        }
      }
      
      // Update menu items
      updateDisplayMenuItems();
    } catch (error) {
      console.error('Error while toggling display window:', error);
    }
  });

  // Handle clock updates
  ipcMain.on('clock-update', (event, data) => {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid clock-update data received:', data);
      return;
    }
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('update-clock', data);
    }
  });
  
  // Handle clock visibility toggle
  ipcMain.on('toggle-clock-visibility', (event, visible) => {
    console.log('Received toggle-clock-visibility:', visible);
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('toggle-clock-display', visible);
    }
  });

  // Handle timer updates
  ipcMain.on('timer-update', (event, data) => {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid timer-update data received:', data);
      return;
    }
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('update-display', data);
    }
  });

  ipcMain.on('update-theme', (event, theme) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('theme-updated', theme);
    }
    
    // Also send theme to display window if it's visible
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('theme-updated', theme);
    }
  });

  // Handle theme requests from display window
  ipcMain.on('request-current-theme', (event) => {
    // Request current theme from main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-current-theme-for-display');
    }
  });

  // Forward theme response to display window
  ipcMain.on('current-theme-response', (event, theme) => {
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('theme-updated', theme);
    }
  });

  // Handle clock state requests
  ipcMain.on('request-clock-state', (event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-clock-state');
    }
  });

  // Handle menu state updates
  ipcMain.on('update-menu-states', (event, themeState, clockState) => {
    const { updateMenuStates } = require('./menu');
    updateMenuStates(themeState, clockState);
  });

  // Add handler to respond with clock state
  ipcMain.on('clock-state-response', (event, data) => {
    console.log('Received clock-state-response:', data);
    
    if (!data || typeof data !== 'object') {
      console.warn('Invalid clock-state-response data received:', data);
      return;
    }
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('update-clock', data);
    }
  });

  // Handle display window state requests
  ipcMain.on('request-display-state', (event) => {
    const isVisible = isDisplayWindowVisible();
    console.log('Display window state requested, visible:', isVisible);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('display-window-state-changed', isVisible);
    }
  });

  // Handle syncing current state to display window
  ipcMain.on('sync-current-state', (event, data) => {
    console.log('📨 Main process received sync-current-state:', data);
    
    const displayWindow = getDisplayWindow();
    console.log('📺 Display window exists?', !!displayWindow, 'destroyed?', displayWindow?.isDestroyed(), 'visible?', isDisplayWindowVisible());
    
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      // Send current timer state
      if (data.timer) {
        console.log('📤 Main process sending update-display to display window:', data.timer);
        displayWindow.webContents.send('update-display', data.timer);
      }
      // Send current clock state
      if (data.clock) {
        displayWindow.webContents.send('update-clock', data.clock);
      }
      // Send clock visibility state
      if (data.clockVisible !== undefined) {
        displayWindow.webContents.send('toggle-clock-display', data.clockVisible);
      }
      // Send current message state
      if (data.message) {
        if (data.message.visible && data.message.text) {
          displayWindow.webContents.send('show-message', data.message.text);
        } else {
          displayWindow.webContents.send('clear-message');
        }
      }
      // Send current video input state
      if (data.video && data.video.enabled) {
        console.log('Syncing video input to display window:', data.video);
        displayWindow.webContents.send('video-input-start', data.video.deviceId);
        if (data.video.opacity !== undefined) {
          displayWindow.webContents.send('video-opacity-change', data.video.opacity);
        }
      }
      // Send current cover image state
      if (data.coverImage && data.coverImage.enabled) {
        console.log('Syncing cover image to display window:', data.coverImage);
        displayWindow.webContents.send('sync-cover-image', data.coverImage);
      }
      // Send current background image state
      if (data.backgroundImage && data.backgroundImage.enabled) {
        console.log('Syncing background image to display window:', data.backgroundImage);
        displayWindow.webContents.send('sync-background-image', data.backgroundImage);
      }
    }
  });

  // Handle display message
  ipcMain.on('display-message', (event, message) => {
    if (!message || typeof message !== 'string') {
      console.warn('Invalid display-message data received:', message);
      return;
    }
    
    console.log('Displaying message on display window:', message);
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('show-message', message);
    }
  });

  // Handle clear message
  ipcMain.on('clear-message', (event) => {
    console.log('Clearing message from display window');
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('clear-message');
    }
  });

  // Handle flash at zero
  ipcMain.on('flash-at-zero', (event) => {
    console.log('Flash at zero triggered');
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('flash-at-zero');
    }
  });

  // Handle clipboard read requests
  ipcMain.handle('clipboard-read-text', async () => {
    try {
      return clipboard.readText();
    } catch (error) {
      console.error('Error reading clipboard:', error);
      return '';
    }
  });

  // Handle display sync request (when external display opens) - REMOVED - See consolidated handler below

  // Handle layout changes
  ipcMain.on('layout-changed', (event, layoutId) => {
    console.log('Layout changed to:', layoutId);
    
    // Forward layout change to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('layout-changed', layoutId);
    }
  });

  // Handle video input start
  ipcMain.on('video-input-started', (event, deviceId) => {
    console.log('Video input started with device:', deviceId);
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('video-input-start', deviceId);
    }
    
    // Notify settings window with device info
    const settingsWindow = getSettingsWindow();
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('video-input-live', {
        isLive: true,
        deviceId: deviceId
      });
    }
  });

  // Handle video input stop
  ipcMain.on('video-input-stopped', (event) => {
    console.log('Video input stopped');
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('video-input-stop');
    }
    
    // Notify settings window
    const settingsWindow = getSettingsWindow();
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('video-input-live', {
        isLive: false,
        deviceId: null
      });
    }
  });

  // Handle video mirror setting change
  ipcMain.on('video-mirror-changed', (event, enabled) => {
    console.log('Video mirror changed:', enabled);
    
    // Forward to main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('video-mirror-changed', enabled);
    }
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed()) {
      displayWindow.webContents.send('video-mirror-changed', enabled);
    }
  });

  // Handle video scaling setting change
  ipcMain.on('video-scaling-changed', (event, mode) => {
    console.log('Video scaling changed:', mode);
    
    // Forward to main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('video-scaling-changed', mode);
    }
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed()) {
      displayWindow.webContents.send('video-scaling-changed', mode);
    }
  });

  // Handle video device selection from settings window
  ipcMain.on('video-device-selected', (event, deviceId) => {
    console.log('Video device selected in settings:', deviceId);
    
    // Forward to main window so it knows which device to use
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('video-device-changed', deviceId);
    }
    
    // Also forward to display window if it exists
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('video-device-changed', deviceId);
    }
  });

  // Handle video opacity change
  ipcMain.on('video-opacity-changed', (event, opacity) => {
    console.log('Video opacity changed to:', opacity);
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('video-opacity-change', opacity);
    }
  });

  // Handle performance stats updates from main window
  ipcMain.on('performance-stats-update', (event, stats) => {
    // Forward to settings window for display
    const settingsWindow = getSettingsWindow();
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('performance-stats-update', stats);
    }
  });

  // Handle restart notification for hardware acceleration changes
  ipcMain.on('show-restart-notification', (event) => {
    const { dialog } = require('electron');
    const settingsWindow = getSettingsWindow();
    
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      dialog.showMessageBox(settingsWindow, {
        type: 'info',
        title: 'Restart Required',
        message: 'Hardware Acceleration Setting Changed',
        detail: 'Please restart the application for the hardware acceleration changes to take effect.',
        buttons: ['OK']
      });
    }
  });

  // Handle cover image selection
  ipcMain.handle('select-cover-image', async (event) => {
    const settingsWindow = getSettingsWindow();
    
    const result = await dialog.showOpenDialog(settingsWindow || mainWindow, {
      title: 'Select Cover Image',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    return result;
  });

  // Handle background image selection
  ipcMain.handle('select-background-image', async (event) => {
    const settingsWindow = getSettingsWindow();
    
    const result = await dialog.showOpenDialog(settingsWindow || mainWindow, {
      title: 'Select Background Image',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    return result;
  });

  // Handle cover image toggle
  ipcMain.on('toggle-cover-image', (event, enabled) => {
    console.log('Cover image toggled:', enabled);
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('toggle-cover-image', enabled);
    }
  });
  
  // Handle background image updates
  ipcMain.on('sync-background-image-update', (event, data) => {
    console.log('Background image updated:', data);
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('sync-background-image', data);
    }
    
    // Forward to main window (for preview canvas)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync-background-image', data);
    }
  });
  
  // Handle display window initialization sync (consolidated handler)
  ipcMain.on('request-display-sync', async (event) => {
    console.log('Display window requesting sync');
    const displayWindow = getDisplayWindow();
    
    // Request timer state sync from main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.mainWindowReady) {
        console.log('Main window is ready, requesting timer state sync');
        mainWindow.webContents.send('request-current-state-for-display');
      } else {
        console.log('Main window not ready yet, waiting...');
        // Wait for main window to be ready
        const checkReady = () => {
          if (mainWindow.mainWindowReady) {
            console.log('Main window now ready, requesting timer state sync');
            mainWindow.webContents.send('request-current-state-for-display');
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      }
    }
    
    // Sync images to display window
    if (displayWindow && !displayWindow.isDestroyed()) {
      const settings = settingsManager.getSettings();
      
      // Sync cover image
      if (settings.coverImage && settings.coverImage.enabled && settings.coverImage.path) {
        displayWindow.webContents.send('sync-cover-image', {
          enabled: true,
          path: settings.coverImage.path
        });
      }
      
      // Sync background image
      if (settings.backgroundImage && settings.backgroundImage.enabled && settings.backgroundImage.path) {
        displayWindow.webContents.send('sync-background-image', {
          enabled: true,
          path: settings.backgroundImage.path,
          opacity: settings.backgroundImage.opacity || 1.0
        });
      }
    }
  });
  
  // Handle open API documentation request
  ipcMain.on('open-api-docs', (event) => {
    const { shell } = require('electron');
    const path = require('path');
    const fs = require('fs');
    
    // Try to open REST_API_SERVER_GUIDE.md
    const docsPath = path.join(__dirname, '../../REST_API_SERVER_GUIDE.md');
    
    if (fs.existsSync(docsPath)) {
      shell.openPath(docsPath);
    } else {
      console.error('API documentation file not found:', docsPath);
      // Fallback: show dialog
      dialog.showMessageBox({
        type: 'info',
        title: 'API Documentation',
        message: 'API documentation not found',
        detail: 'The REST_API_SERVER_GUIDE.md file could not be found in the project directory.',
        buttons: ['OK']
      });
    }
  });
  
  // Handle request for current server status
  ipcMain.on('request-server-status', (event) => {
    const { getApiServer } = require('./main');
    const apiServer = getApiServer();
    
    // Check if server is enabled in settings
    const settings = settingsManager.getSettings();
    const serverEnabled = settings.companionServerEnabled !== false;
    
    if (apiServer && serverEnabled) {
      const status = apiServer.getStatus();
      
      // Send to requesting window
      event.sender.send('companion-server-status', status);
      
      console.log('Server status requested (enabled):', status);
    } else {
      // Server not initialized or disabled in settings
      const reason = !apiServer ? 'not initialized' : 'disabled in settings';
      const statusResponse = {
        running: false,
        port: null,
        error: serverEnabled ? null : 'Disabled in settings'
      };
      
      event.sender.send('companion-server-status', statusResponse);
      
      console.log(`Server status requested (${reason}):`, statusResponse);
    }
  });
  
  // Handle request for network addresses
  ipcMain.handle('get-network-addresses', async () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const addresses = [];

    Object.keys(interfaces).forEach((ifname) => {
      interfaces[ifname].forEach((iface) => {
        // Skip internal and non-IPv4 addresses
        if (iface.family !== 'IPv4' || iface.internal !== false) {
          return;
        }
        addresses.push({ name: ifname, address: iface.address });
      });
    });

    return addresses;
  });
  
  // Layout management handlers
  ipcMain.on('layout-list-updated', () => {
    // Notify main window that layout list was updated
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('layout-list-updated');
    }
  });
  
  ipcMain.handle('get-current-layout', async () => {
    // Request current layout from main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        return await mainWindow.webContents.executeJavaScript(`
          (() => {
            const layoutSelector = document.getElementById('layoutSelector');
            return layoutSelector ? layoutSelector.value : (window.LayoutRegistry ? window.LayoutRegistry.getDefaultLayout() : 'classic');
          })()
        `);
      } catch (error) {
        console.error('Error getting current layout:', error);
        return 'classic';
      }
    }
    return 'classic'; // Default fallback
  });
  
  // Handle main window ready notification
  ipcMain.on('main-window-ready', (event) => {
    console.log('Main window renderer is ready');
    mainWindow.mainWindowReady = true;
    
    // If display window is already open and waiting, sync it now
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      mainWindow.webContents.send('request-current-state-for-display');
    }
  });

  // ========================================================================
  // Layout Creator handlers
  // ========================================================================

  ipcMain.on('open-layout-creator', (event, editLayoutId) => {
    createLayoutCreatorWindow(editLayoutId || null);
  });

  ipcMain.on('layout-creator:saved', (event, data) => {
    console.log('Layout Creator saved layout:', data?.id);
    // Notify main window to refresh layout list
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('layout-list-updated');
    }
    // Notify settings window if open
    const settingsWin = getSettingsWindow();
    if (settingsWin && !settingsWin.isDestroyed()) {
      settingsWin.webContents.send('layout-list-updated');
    }
  });
}

module.exports = { setupIpcHandlers };
