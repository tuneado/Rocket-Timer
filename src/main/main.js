const { app } = require('electron');
const { createMainWindow, getDisplayWindow, getSettingsWindow } = require('./windows');
const { setupMenu } = require('./menu');
const { setupIpcHandlers } = require('./ipcHandlers');
const SettingsManager = require('./settingsManager');
const ApiManager = require('./api/apiManager');

let mainWindow;
let apiManager;

// Load settings before app is ready to apply hardware acceleration
const settingsManager = new SettingsManager();
const settings = settingsManager.getSettings();

// Apply hardware acceleration setting
if (settings.hardwareAcceleration === false) {
  console.log('Hardware acceleration disabled by user settings');
  app.disableHardwareAcceleration();
}

// Launch
app.on('ready', async () => {
  mainWindow = createMainWindow();
  setupMenu(mainWindow);
  setupIpcHandlers(mainWindow);
  
  // Initialize and start API servers
  try {
    apiManager = new ApiManager(
      mainWindow,
      getDisplayWindow,
      getSettingsWindow,
      settingsManager
    );
    await apiManager.startAll();
  } catch (err) {
    console.error('Failed to start API servers:', err);
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

// Cleanup on quit
app.on('before-quit', async () => {
  if (apiManager) {
    await apiManager.stopAll();
  }
});
