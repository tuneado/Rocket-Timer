/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
const { ipcMain, clipboard, dialog, app } = require('electron');
const path = require('path');
const { createMainWindow, createDisplayWindow, toggleDisplayWindow, getDisplayWindow, isDisplayWindowVisible, getSettingsWindow, createLayoutCreatorWindow, getLayoutCreatorWindow } = require('./windows');
const { updateDisplayMenuItems, updateProjectsMenu } = require('./menu');
const SettingsManager = require('./settingsManager');

let settingsManager;

/**
 * Safely send IPC message to a window, guarding against disposed frames.
 * Checks webContents.mainFrame to avoid Electron's internal error logging
 * that occurs when send() is called on a disposed render frame.
 */
function safeSend(win, channel, ...args) {
  try {
    if (!win || win.isDestroyed()) return;
    const wc = win.webContents;
    if (!wc || wc.isDestroyed()) return;
    // mainFrame is null when the render frame is disposed — checking this
    // prevents Electron from logging the error internally before throwing
    if (!wc.mainFrame) return;
    wc.send(channel, ...args);
  } catch (_) {
    // Frame was disposed between checks — silently ignore
  }
}

function setupIpcHandlers(mainWindow, sharedSettingsManager) {
  // Initialize managers
  settingsManager = sharedSettingsManager || new SettingsManager();
  // ProjectManager is initialized in main.js and available as global.projectManager

  // App info
  ipcMain.handle('get-app-version', async () => {
    return require('../../package.json').version;
  });

  // Get resource path (for loading assets in packaged app)
  ipcMain.handle('get-resource-path', (event, resourcePath) => {
    // In development, use current directory
    // In production, use app resources directory  
    const basePath = app.isPackaged 
      ? path.join(process.resourcesPath, 'app.asar', 'src')
      : path.join(__dirname, '..');
    return path.join(basePath, resourcePath);
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
    
    // Mark project as having unsaved changes
    if (success && global.projectManager) {
      global.projectManager.markAsChanged();
    }
    
    // Notify all windows of settings change
    if (success) {
      const updatedSettings = settingsManager.getSettings();
      
      safeSend(mainWindow, 'settings-updated', updatedSettings);
      
      const displayWindow = getDisplayWindow();
      safeSend(displayWindow, 'settings-updated', updatedSettings);
      
      const settingsWindow = getSettingsWindow();
      safeSend(settingsWindow, 'settings-updated', updatedSettings);

      // Notify API server about preset changes
      if (updatedSettings.presets) {
        ipcMain.emit('settings-presets-updated', null, updatedSettings.presets);
      }
    }
    
    return success;
  });

  ipcMain.handle('save-setting', async (event, key, value) => {
    const success = settingsManager.setSetting(key, value);
    
    // Mark project as having unsaved changes
    if (success && global.projectManager) {
      global.projectManager.markAsChanged();
    }
    
    // Notify all windows of settings change
    if (success) {
      const updatedSettings = settingsManager.getSettings();
      
      safeSend(mainWindow, 'settings-updated', updatedSettings);
      
      const displayWindow = getDisplayWindow();
      safeSend(displayWindow, 'settings-updated', updatedSettings);
      
      const settingsWindow = getSettingsWindow();
      safeSend(settingsWindow, 'settings-updated', updatedSettings);

      // Notify API server about preset changes
      if (key === 'presets') {
        ipcMain.emit('settings-presets-updated', null, value);
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
    safeSend(mainWindow, 'apply-settings', settings);
    
    // Notify display window if open
    const displayWindow = getDisplayWindow();
    safeSend(displayWindow, 'apply-settings', settings);
  });

  // Handle display window toggle
  ipcMain.on('toggle-display-window', (event) => {
    try {
      console.log('toggle-display-window event received');
      const isVisible = toggleDisplayWindow();
      console.log('Display window toggled. Now visible:', isVisible);
      
      // Send the new state back to the main window
      safeSend(mainWindow, 'display-window-state-changed', isVisible);
      
      // If window is now visible, request current state sync
      if (isVisible) {
        safeSend(mainWindow, 'request-current-state-for-display');
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
      safeSend(displayWindow, 'update-clock', data);
    }
  });
  
  // Handle clock visibility toggle
  ipcMain.on('toggle-clock-visibility', (event, visible) => {
    console.log('Received toggle-clock-visibility:', visible);
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'toggle-clock-display', visible);
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
      safeSend(displayWindow, 'update-display', data);
    }
  });

  ipcMain.on('update-theme', (event, theme) => {
    safeSend(mainWindow, 'theme-updated', theme);
    
    // Also send theme to display window if it's visible
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'theme-updated', theme);
    }
  });

  // Handle theme requests from display window
  ipcMain.on('request-current-theme', (event) => {
    // Request current theme from main window
    safeSend(mainWindow, 'request-current-theme-for-display');
  });

  // Forward theme response to display window
  ipcMain.on('current-theme-response', (event, theme) => {
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'theme-updated', theme);
    }
  });

  // Handle clock state requests
  ipcMain.on('request-clock-state', (event) => {
    safeSend(mainWindow, 'request-clock-state');
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
      safeSend(displayWindow, 'update-clock', data);
    }
  });

  // Handle display window state requests
  ipcMain.on('request-display-state', (event) => {
    const isVisible = isDisplayWindowVisible();
    console.log('Display window state requested, visible:', isVisible);
    
    safeSend(mainWindow, 'display-window-state-changed', isVisible);
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
        safeSend(displayWindow, 'update-display', data.timer);
      }
      // Send current clock state
      if (data.clock) {
        safeSend(displayWindow, 'update-clock', data.clock);
      }
      // Send clock visibility state
      if (data.clockVisible !== undefined) {
        safeSend(displayWindow, 'toggle-clock-display', data.clockVisible);
      }
      // Send current message state
      if (data.message) {
        if (data.message.visible && data.message.text) {
          safeSend(displayWindow, 'show-message', data.message.text);
        } else {
          safeSend(displayWindow, 'clear-message');
        }
      }
      // Send current video input state
      if (data.video && data.video.enabled) {
        console.log('Syncing video input to display window:', data.video);
        safeSend(displayWindow, 'video-input-start', data.video.deviceId);
        if (data.video.opacity !== undefined) {
          safeSend(displayWindow, 'video-opacity-change', data.video.opacity);
        }
      }
      // Send current cover image state
      if (data.coverImage && data.coverImage.enabled) {
        console.log('Syncing cover image to display window:', data.coverImage);
        safeSend(displayWindow, 'sync-cover-image', data.coverImage);
      }
      // Send current background image state
      if (data.backgroundImage && data.backgroundImage.enabled) {
        console.log('Syncing background image to display window:', data.backgroundImage);
        safeSend(displayWindow, 'sync-background-image', data.backgroundImage);
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
      safeSend(displayWindow, 'show-message', message);
    }
  });

  // Handle clear message
  ipcMain.on('clear-message', (event) => {
    console.log('Clearing message from display window');
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'clear-message');
    }
  });

  // Handle flash at zero
  ipcMain.on('flash-at-zero', (event) => {
    console.log('Flash at zero triggered');
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'flash-at-zero');
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
      safeSend(displayWindow, 'layout-changed', layoutId);
    }
  });

  // Handle video input start
  ipcMain.on('video-input-started', (event, deviceId) => {
    console.log('Video input started with device:', deviceId);
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'video-input-start', deviceId);
    }
    
    // Notify settings window with device info
    const settingsWindow = getSettingsWindow();
    safeSend(settingsWindow, 'video-input-live', {
      isLive: true,
      deviceId: deviceId
    });
  });

  // Handle video input stop
  ipcMain.on('video-input-stopped', (event) => {
    console.log('Video input stopped');
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'video-input-stop');
    }
    
    // Notify settings window
    const settingsWindow = getSettingsWindow();
    safeSend(settingsWindow, 'video-input-live', {
      isLive: false,
      deviceId: null
    });
  });

  // Handle video mirror setting change
  ipcMain.on('video-mirror-changed', (event, enabled) => {
    console.log('Video mirror changed:', enabled);
    
    // Forward to main window
    safeSend(mainWindow, 'video-mirror-changed', enabled);
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed()) {
      safeSend(displayWindow, 'video-mirror-changed', enabled);
    }
  });

  // Handle video scaling setting change
  ipcMain.on('video-scaling-changed', (event, mode) => {
    console.log('Video scaling changed:', mode);
    
    // Forward to main window
    safeSend(mainWindow, 'video-scaling-changed', mode);
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed()) {
      safeSend(displayWindow, 'video-scaling-changed', mode);
    }
  });

  // Handle video device selection from settings window
  ipcMain.on('video-device-selected', (event, deviceId) => {
    console.log('Video device selected in settings:', deviceId);
    
    // Forward to main window so it knows which device to use
    safeSend(mainWindow, 'video-device-changed', deviceId);
    
    // Also forward to display window if it exists
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'video-device-changed', deviceId);
    }
  });

  // Handle video opacity change
  ipcMain.on('video-opacity-changed', (event, opacity) => {
    console.log('Video opacity changed to:', opacity);
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'video-opacity-change', opacity);
    }
  });

  // Handle performance stats updates from main window
  ipcMain.on('performance-stats-update', (event, stats) => {
    // Forward to settings window for display
    const settingsWindow = getSettingsWindow();
    safeSend(settingsWindow, 'performance-stats-update', stats);
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
      safeSend(displayWindow, 'toggle-cover-image', enabled);
    }
  });
  
  // Handle background image updates
  ipcMain.on('sync-background-image-update', (event, data) => {
    console.log('Background image updated:', data);
    
    // Forward to display window
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      safeSend(displayWindow, 'sync-background-image', data);
    }
    
    // Forward to main window (for preview canvas)
    safeSend(mainWindow, 'sync-background-image', data);
  });
  
  // Handle display window initialization sync (consolidated handler)
  ipcMain.on('request-display-sync', async (event) => {
    console.log('Display window requesting sync');
    const displayWindow = getDisplayWindow();
    
    // Request timer state sync from main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.mainWindowReady) {
        console.log('Main window is ready, requesting timer state sync');
        safeSend(mainWindow, 'request-current-state-for-display');
      } else {
        console.log('Main window not ready yet, waiting...');
        // Wait for main window to be ready
        const checkReady = () => {
          if (mainWindow.mainWindowReady) {
            console.log('Main window now ready, requesting timer state sync');
            safeSend(mainWindow, 'request-current-state-for-display');
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
        safeSend(displayWindow, 'sync-cover-image', {
          enabled: true,
          path: settings.coverImage.path
        });
      }
      
      // Sync background image
      if (settings.backgroundImage && settings.backgroundImage.enabled && settings.backgroundImage.path) {
        safeSend(displayWindow, 'sync-background-image', {
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
    
    // Try to open API_DOCUMENTATION.md
    const docsPath = path.join(__dirname, '../../docs/API_DOCUMENTATION.md');
    
    if (fs.existsSync(docsPath)) {
      shell.openPath(docsPath);
    } else {
      console.error('API documentation file not found:', docsPath);
      // Fallback: show dialog
      dialog.showMessageBox({
        type: 'info',
        title: 'API Documentation',
        message: 'API documentation not found',
        detail: 'The API_DOCUMENTATION.md file could not be found in the docs directory.',
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
    safeSend(mainWindow, 'layout-list-updated');
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
      safeSend(mainWindow, 'request-current-state-for-display');
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
    safeSend(mainWindow, 'layout-list-updated');
    // Notify settings window if open
    const settingsWin = getSettingsWindow();
    safeSend(settingsWin, 'layout-list-updated');
  });

  // ========================================================================
  // Project handlers
  // ========================================================================

  ipcMain.handle('get-projects', async () => {
    const projectManager = global.projectManager;
    if (!projectManager) throw new Error('ProjectManager not initialized');
    return projectManager.getAllProjects();
  });

  ipcMain.handle('create-project', async (event, name, setAsDefault = false) => {
    const projectManager = global.projectManager;
    if (!projectManager) throw new Error('ProjectManager not initialized');
    const project = await projectManager.createProject(name, setAsDefault);
    await projectManager.loadProject(project.id);
    updateProjectsMenu();
    return project;
  });

  ipcMain.handle('rename-project', async (event, id, newName) => {
    const projectManager = global.projectManager;
    if (!projectManager) throw new Error('ProjectManager not initialized');
    const result = await projectManager.renameProject(id, newName);
    updateProjectsMenu();
    return result;
  });

  ipcMain.handle('load-project', async (event, id) => {
    const projectManager = global.projectManager;
    if (!projectManager) throw new Error('ProjectManager not initialized');
    const project = await projectManager.loadProject(id);
    if (!project) return { success: false, error: 'Project not found' };
    updateProjectsMenu();
    return { success: true, project };
  });

  ipcMain.handle('save-project', async () => {
    const projectManager = global.projectManager;
    if (!projectManager) throw new Error('ProjectManager not initialized');
    return projectManager.saveProject();
  });

  ipcMain.handle('delete-project', async (event, id) => {
    const projectManager = global.projectManager;
    if (!projectManager) throw new Error('ProjectManager not initialized');
    const result = await projectManager.deleteProject(id);
    updateProjectsMenu();
    return result;
  });

  ipcMain.handle('duplicate-project', async (event, id, newName = null) => {
    const projectManager = global.projectManager;
    if (!projectManager) throw new Error('ProjectManager not initialized');
    const result = await projectManager.duplicateProject(id, newName);
    updateProjectsMenu();
    return result;
  });

  ipcMain.handle('get-current-project', async () => {
    const projectManager = global.projectManager;
    if (!projectManager) throw new Error('ProjectManager not initialized');
    return projectManager.getCurrentProject();
  });

  // ========================================================================
  // Save-on-close prompt
  // ========================================================================

  mainWindow.on('close', async (e) => {
    // Always prevent close first so the window stays visible while we check/prompt
    e.preventDefault();

    // Read project dirty state from renderer
    let state = null;
    try {
      state = await mainWindow.webContents.executeJavaScript('window._projectState || null');
    } catch (_) {
      // If renderer is gone, allow close
      mainWindow.destroy();
      return;
    }

    if (!state || !state.activeProjectId || !state.isDirty) {
      mainWindow.destroy();
      return;
    }

    const projectName = state.activeProjectName || 'current project';
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: 'Unsaved Changes',
      message: `Save changes to "${projectName}"?`,
      detail: 'Your project has unsaved changes.',
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 0,
      cancelId: 2,
    });

    if (response === 2) {
      // Cancel — do nothing
      return;
    }

    if (response === 0) {
      // Save — tell renderer to save, then quit
      safeSend(mainWindow, 'project-save-request');
      // Give renderer a moment to save, then force close
      setTimeout(() => {
        mainWindow.destroy();
      }, 500);
      return;
    }

    // Don't Save — just close
    mainWindow.destroy();
  });
}

module.exports = { setupIpcHandlers };
