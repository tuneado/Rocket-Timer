/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
const { ipcMain, clipboard, dialog, app, BrowserWindow } = require('electron');
const path = require('path');
const { toggleDisplayWindow, getDisplayWindow, isDisplayWindowVisible, getSettingsWindow, createLayoutCreatorWindow } = require('./windows');
const { updateDisplayMenuItems, updateProjectsMenu, setMenuState } = require('./menu');
const SettingsManager = require('./settingsManager');

let settingsManager;

// Latest external display state from the main window (see 'display-state')
const displayState = {};

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

/**
 * Save one setting and send the new settings to every window (used by the menu)
 */
function saveSetting(key, value) {
  const success = settingsManager.setSetting(key, value);
  if (success) {
    global.projectManager?.markAsChanged();
    const updatedSettings = settingsManager.getSettings();
    BrowserWindow.getAllWindows().forEach(win => safeSend(win, 'settings-updated', updatedSettings));
    updateProjectsMenu();
  }
  return success;
}

/**
 * Open the API documentation: the bundled file, or the online copy
 */
function openApiDocs() {
  const { shell } = require('electron');
  const fs = require('fs');
  const docsPath = path.join(__dirname, '../../docs/API_DOCUMENTATION.md');
  if (fs.existsSync(docsPath)) {
    shell.openPath(docsPath);
  } else {
    const homepage = require('../../package.json').homepage;
    shell.openExternal(`${homepage}/blob/main/docs/API_DOCUMENTATION.md`);
  }
}

function setupIpcHandlers(mainWindow, sharedSettingsManager) {
  // Initialize managers
  settingsManager = sharedSettingsManager || new SettingsManager();
  // ProjectManager is initialized in main.js and available as global.projectManager

  // Cached current layout id, updated by the renderer's 'layout-changed'
  // event and read by the 'get-current-layout' IPC handler. Avoids racing
  // executeJavaScript calls against the renderer.
  let lastKnownLayoutId = 'classic';

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

      
      const settingsWindow = getSettingsWindow();
      safeSend(settingsWindow, 'settings-updated', updatedSettings);

      // Notify API server about preset changes
      if (updatedSettings.presets) {
        ipcMain.emit('settings-presets-updated', null, updatedSettings.presets);
      }
      // The menu shows the theme
      updateProjectsMenu();
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

      
      const settingsWindow = getSettingsWindow();
      safeSend(settingsWindow, 'settings-updated', updatedSettings);

      // Notify API server about preset changes
      if (key === 'presets') {
        ipcMain.emit('settings-presets-updated', null, value);
      }
      // The menu shows the theme
      if (key === 'appearanceTheme') updateProjectsMenu();
    }
    
    return success;
  });

  ipcMain.handle('reset-settings', async () => {
    return settingsManager.resetSettings();
  });

  // Handle apply-settings (when settings window closes)
  ipcMain.on('apply-settings', (event, settings) => {
    console.log('Applying settings from settings window');
    
    // The external display mirrors the main window, which applies them
    safeSend(mainWindow, 'apply-settings', settings);
  });

  // Handle display window toggle
  ipcMain.on('toggle-display-window', (event) => {
    try {
      console.log('toggle-display-window event received');
      const isVisible = toggleDisplayWindow();
      console.log('Display window toggled. Now visible:', isVisible);
      
      // Send the new state back to the main window
      safeSend(mainWindow, 'display-window-state-changed', isVisible);
      
      // Update menu items
      updateDisplayMenuItems();
    } catch (error) {
      console.error('Error while toggling display window:', error);
    }
  });

  // Main window state shown in the menu (checkmarks, labels, layouts, presets)
  ipcMain.on('menu-state', (event, state) => {
    if (state && typeof state === 'object') setMenuState(state);
  });

  // Handle display window state requests
  ipcMain.on('request-display-state', (event) => {
    const isVisible = isDisplayWindowVisible();
    console.log('Display window state requested, visible:', isVisible);
    
    safeSend(mainWindow, 'display-window-state-changed', isVisible);
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

  // Handle layout changes
  ipcMain.on('layout-changed', (event, layoutId) => {
    console.log('Layout changed to:', layoutId);

    // Cache for `get-current-layout` so we don't need to poll the renderer
    // via executeJavaScript (which races during window close / reload).
    lastKnownLayoutId = layoutId || lastKnownLayoutId;
  });

  // Handle video input start
  ipcMain.on('video-input-started', (event, deviceId) => {
    console.log('Video input started with device:', deviceId);
    
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
  });

  // Handle video scaling setting change
  ipcMain.on('video-scaling-changed', (event, mode) => {
    console.log('Video scaling changed:', mode);
    
    // Forward to main window
    safeSend(mainWindow, 'video-scaling-changed', mode);
  });

  // Handle video device selection from settings window
  ipcMain.on('video-device-selected', (event, deviceId) => {
    console.log('Video device selected in settings:', deviceId);
    
    // The preview switches device; the external display follows its state
    safeSend(mainWindow, 'video-device-changed', deviceId);
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

  
  // Handle background image updates
  ipcMain.on('sync-background-image-update', (event, data) => {
    console.log('Background image updated:', data);

    // The preview loads it; the external display follows its state
    safeSend(mainWindow, 'sync-background-image', data);
  });
  
  // External display mirror: the main window's preview is the source ('display-state'
  // patches, see renderer/js/modules/displaySync.js). The merged state is kept here
  // so a display that opens or reloads gets everything at once.
  ipcMain.on('display-state', (event, patch) => {
    if (!patch || typeof patch !== 'object') return;
    Object.assign(displayState, patch);
    safeSend(getDisplayWindow(), 'display-state', patch);
  });

  ipcMain.on('request-display-sync', (event) => {
    event.sender.send('display-state', displayState);
  });

  
  ipcMain.on('open-api-docs', () => openApiDocs());

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
    // Return the cached value set by the renderer's 'layout-changed' event.
    // Avoids executeJavaScript against the renderer, which can race when the
    // window is closing or still initialising on Windows.
    return lastKnownLayoutId || 'classic';
  });
  
  // Handle main window ready notification
  ipcMain.on('main-window-ready', (event) => {
    console.log('Main window renderer is ready');
    mainWindow.mainWindowReady = true;
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

  // Track whether the user already confirmed it's safe to close, so the
  // second synthetic `close` (after we destroy/quit) doesn't re-prompt.
  let confirmedCloseSafe = false;

  mainWindow.on('close', async (e) => {
    if (confirmedCloseSafe) return; // allow the close to proceed
    // macOS only hides the window unless quitting (main.js); nothing to save yet
    if (process.platform === 'darwin' && !app.isQuitting) return;

    const projectManager = global.projectManager;
    // No project manager or nothing dirty → let the window close normally.
    if (!projectManager || !projectManager.hasUnsaved || !projectManager.hasUnsaved()) {
      return;
    }

    // Dirty: prevent the close synchronously, then prompt with mainWindow
    // still visible as the dialog parent.
    e.preventDefault();

    try {
      const safe = await projectManager.promptSaveIfNeeded(mainWindow);
      if (!safe) {
        // User cancelled — keep the window open, do nothing.
        return;
      }
      // Safe to quit. Mark and re-issue close so the window can actually close.
      confirmedCloseSafe = true;
      // Also clear the flag on projectManager so `before-quit` doesn't re-prompt.
      projectManager.hasUnsavedChanges = false;
      // Close on next tick to let the dialog fully dismiss on Windows.
      setTimeout(() => {
        if (!mainWindow.isDestroyed()) mainWindow.close();
      }, 0);
    } catch (err) {
      console.error('Error during save-on-close prompt:', err);
      // On error, don't silently destroy — keep the window open so the user
      // can try again or quit manually.
    }
  });
}

/**
 * Custom layout storage handlers. Registered once at startup, before any window loads,
 * because LayoutRegistry reads the layouts synchronously when its script runs.
 * Sync IPC keeps LayoutRegistry's existing synchronous API.
 */
function setupLayoutStoreHandlers(layoutStore) {
  // Keep every window's cached copy current
  const broadcast = () => {
    const layouts = layoutStore.getAll();
    for (const win of BrowserWindow.getAllWindows()) {
      safeSend(win, 'layouts:changed', layouts);
    }
  };

  ipcMain.on('layouts:get-all', (event) => {
    event.returnValue = layoutStore.getAll();
  });

  // event.returnValue is write-only (setting it sends the reply), so keep the result locally
  const reply = (event, ok) => {
    event.returnValue = ok;
    if (ok) broadcast();
  };

  ipcMain.on('layouts:save', (event, id, layoutData) => reply(event, layoutStore.save(id, layoutData)));
  ipcMain.on('layouts:remove', (event, id) => reply(event, layoutStore.remove(id)));
  ipcMain.on('layouts:clear', (event) => reply(event, layoutStore.clear()));
  ipcMain.on('layouts:import-legacy', (event, legacyLayouts) => reply(event, layoutStore.importLegacy(legacyLayouts)));
}

/**
 * Timer engine bridge: windows send commands and receive every state change.
 * Registered once at startup.
 */
function setupTimerHandlers(timerEngine) {
  const broadcast = (channel, state) => {
    for (const win of BrowserWindow.getAllWindows()) {
      safeSend(win, channel, state);
    }
  };
  timerEngine.on('change', (state) => broadcast('timer:state', state));
  timerEngine.on('complete', (state) => broadcast('timer:complete', state));

  ipcMain.handle('timer:get-state', () => timerEngine.getState());
  ipcMain.handle('timer:command', (event, command) => timerEngine.command(command));
}

module.exports = { setupIpcHandlers, setupLayoutStoreHandlers, setupTimerHandlers, saveSetting, openApiDocs };
