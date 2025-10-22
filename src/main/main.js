const { app } = require('electron');
const { createMainWindow } = require('./windows');
const { setupMenu } = require('./menu');
const { setupIpcHandlers } = require('./ipcHandlers');
const SettingsManager = require('./settingsManager');

let mainWindow;

// Load settings before app is ready to apply hardware acceleration
const settingsManager = new SettingsManager();
const settings = settingsManager.getSettings();

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
