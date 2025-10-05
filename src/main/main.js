const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createMainWindow, createDisplayWindow } = require('./windows');
const { setupMenu } = require('./menu');
const { setupIpcHandlers } = require('./ipcHandlers');
const { start } = require('repl');

// Rest of your code...

let mainWindow;
let displayWindow;

// App state
let isDisplayVisible = false;
let isClockVisible = false;




// Sync menu state with renderer process
ipcMain.on('update-menu-state', (_, { clockVisible, displayVisible }) => {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  const displayItem = menu.getMenuItemById('toggleDisplay');
  const clockItem = menu.getMenuItemById('toggleClock');

  if (displayItem) displayItem.checked = displayVisible;
  if (clockItem) clockItem.checked = clockVisible;
});

// Respond to renderer process with the current display window state
ipcMain.on('request-display-state', (event) => {
  const displayWindow = createDisplayWindow(); // Ensure display window is created or retrieved
  event.sender.send('display-state', displayWindow.isVisible());
});

// Launch
app.on('ready', () => {
  mainWindow = createMainWindow();
  setupIpcHandlers(mainWindow); // Ensure this is called
  setupMenu(mainWindow);
});
