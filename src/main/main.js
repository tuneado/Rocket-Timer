/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
const { app, screen } = require('electron');
const { createMainWindow, showFullscreenOnDisplay } = require('./windows');
const { setupMenu, updateProjectsMenu } = require('./menu');
const { setupIpcHandlers } = require('./ipcHandlers');
const SettingsManager = require('./settingsManager');
const ProjectManager = require('./projectManager');
const { UnifiedTimerAPIServer } = require('./unifiedApiServer');
const UpdateManager = require('./updateManager');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'info';

let mainWindow;
let apiServer;
let updateManager;
let projectManager;

// Load settings before app is ready to apply hardware acceleration
const settingsManager = new SettingsManager();
const getSettings = () => settingsManager.getSettings();
const settings = getSettings();

// Apply hardware acceleration setting
if (settings.hardwareAcceleration === false) {
  console.log('Hardware acceleration disabled by user settings');
  app.disableHardwareAcceleration();
}

// Linux: fix common sandbox/GPU issues (AppImage, Wayland, CI environments)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

// Launch
app.on('ready', async () => {
  mainWindow = createMainWindow();
  setupMenu(mainWindow);
  setupIpcHandlers(mainWindow, settingsManager);
  
  // Initialize update manager
  updateManager = new UpdateManager(mainWindow);
  
  // Initialize Project Manager
  try {
    projectManager = new ProjectManager(settingsManager);
    await projectManager.initialize();
    console.log('✅ ProjectManager initialized successfully');
    
    // Make it available globally for menu/IPC handlers
    global.projectManager = projectManager;
    
    // Rebuild menu with project list
    updateProjectsMenu();
  } catch (error) {
    console.error('🚨 Failed to initialize ProjectManager:', error);
  }
  
  // Initialize Unified API Server
  const settings = getSettings();
  apiServer = new UnifiedTimerAPIServer(mainWindow, {
    restPort: settings.companionServerPort || 9999,
    wsPort: settings.websocketPort || 8080,
    oscPort: settings.oscPort || 7000,
    oscRemotePort: settings.oscRemotePort || 7001,
    enableAuth: settings.apiAuth || false,
    enableRateLimit: settings.apiRateLimit !== false,
    allowExternal: settings.companionAllowExternal === true,
    colors: settings.colors || {},
    presets: settings.presets || []
  });
  
  // Wait for main window to be ready before starting API server
  mainWindow.webContents.once('did-finish-load', () => {
    const enabled = settings.companionServerEnabled !== false;
    
    if (enabled) {
      const result = apiServer.start();
      
      // Send server status to renderer
      mainWindow.webContents.send('companion-server-status', {
        running: result.running,
        port: result.port,
        error: result.error,
        websocketPort: settings.websocketPort || 8080,
        oscPort: settings.oscPort || 7000,
        protocols: ['REST', 'WebSocket', 'OSC']
      });
      
      if (result.running) {
        console.log('✅ Unified Timer API Server started successfully');
      } else {
        console.error('🚨 Failed to start Unified Timer API Server:', result.error);
      }
    } else {
      console.log('📴 API Server disabled in settings');
      mainWindow.webContents.send('companion-server-status', {
        running: false,
        port: null,
        error: 'Disabled in settings'
      });
    }
    
    // Check for updates after everything is loaded (only in production builds)
    if (process.env.NODE_ENV !== 'development' && app.isPackaged) {
      setTimeout(() => {
        updateManager.checkForUpdates();
      }, 3000);
    }
  });
  
  // Check if should auto-open external display
  const displays = screen.getAllDisplays();
  
  if (settings.autoOpenDisplay && displays.length > 1) {
    // Find secondary display (not primary)
    const secondaryDisplay = displays.find(display => !display.internal) || displays[1];
    
    // Wait for main window to be fully ready (renderer initialized)
    const checkMainWindowReady = () => {
      if (mainWindow.mainWindowReady) {
        console.log('Main window ready, auto-opening display on secondary monitor:', secondaryDisplay.bounds);
        showFullscreenOnDisplay(secondaryDisplay);
      } else {
        // Check again in 100ms
        setTimeout(checkMainWindowReady, 100);
      }
    };
    
    // Start checking after HTML loads
    mainWindow.webContents.once('did-finish-load', () => {
      checkMainWindowReady();
    });
  }
});

// Prompt to save before quitting
app.on('before-quit', async (e) => {
  if (projectManager && projectManager.hasUnsaved()) {
    e.preventDefault();
    const parentWin = (mainWindow && !mainWindow.isDestroyed()) ? mainWindow : null;
    const safeToQuit = await projectManager.promptSaveIfNeeded(parentWin);
    if (safeToQuit) {
      // Clear the flag so we don't loop, then quit
      projectManager.hasUnsavedChanges = false;
      app.quit();
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow();
    setupMenu(mainWindow);
    setupIpcHandlers(mainWindow, settingsManager);
  }
});

// Export for access from other modules
module.exports = { 
  getApiServer: () => apiServer,
  getUpdateManager: () => updateManager
};
