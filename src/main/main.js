const { app } = require('electron');
const { createMainWindow } = require('./windows');
const { setupMenu } = require('./menu');
const { setupIpcHandlers } = require('./ipcHandlers');

let mainWindow;

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
