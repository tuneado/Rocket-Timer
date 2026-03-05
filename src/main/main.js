const { app, screen } = require('electron');
const { createMainWindow, showFullscreenOnDisplay } = require('./windows');
const { setupMenu } = require('./menu');
const { setupIpcHandlers } = require('./ipcHandlers');
const SettingsManager = require('./settingsManager');
const { UnifiedTimerAPIServer } = require('./unifiedApiServer');

let mainWindow;
let apiServer;

// Load settings before app is ready to apply hardware acceleration
const settingsManager = new SettingsManager();
const getSettings = () => settingsManager.getSettings();
const settings = getSettings();

// Apply hardware acceleration setting
if (settings.hardwareAcceleration === false) {
  console.log('Hardware acceleration disabled by user settings');
  app.disableHardwareAcceleration();
}

// Launch
app.on('ready', () => {
  mainWindow = createMainWindow();
  setupMenu(mainWindow);
  setupIpcHandlers(mainWindow);
  
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
    colors: settings.colors || {}
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow();
    setupMenu(mainWindow);
    setupIpcHandlers(mainWindow);
  }
});

// Export apiServer for access from other modules
module.exports = { getApiServer: () => apiServer };
