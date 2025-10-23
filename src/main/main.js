const { app, screen } = require('electron');
const { createMainWindow, showFullscreenOnDisplay } = require('./windows');
const { setupMenu } = require('./menu');
const { setupIpcHandlers } = require('./ipcHandlers');
const SettingsManager = require('./settingsManager');

let mainWindow;

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
  
  // Check if should auto-open external display
  const settings = getSettings();
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
