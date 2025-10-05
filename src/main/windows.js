const { BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;    // Declare mainWindow globally
let displayWindow; // Declare displayWindow globally
let displayWindowVisible = false; // Track if display window should be visible

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true, // Add for security
      nodeIntegration: false, // Add for security
    },
  });
  mainWindow.loadFile(path.join(__dirname, '../renderer/html/index.html'));
  return mainWindow;
}

function createDisplayWindow() {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.focus();
    return displayWindow;
  }

  displayWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    alwaysOnTop: true, // Optional: Keep the window on top
    frame: true,       // Optional: Frameless window
  });

  displayWindow.loadFile(path.join(__dirname, '../renderer/html/display.html'));

  // When display window finishes loading, sync current state
  displayWindow.webContents.once('did-finish-load', () => {
    // Request current state from main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-current-state-for-display');
    }
  });

  // Handle the 'closed' event to clean up the reference
  displayWindow.on('closed', () => {
    displayWindow = null;
    displayWindowVisible = false;
    // Notify main window that display was closed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('display-window-closed');
    }
  });

  displayWindowVisible = true;
  return displayWindow;
}

function getMainWindow() {
  return mainWindow;
}

function toggleDisplayWindow() {
  if (displayWindow && !displayWindow.isDestroyed()) {
    if (displayWindow.isVisible()) {
      displayWindow.hide();
      displayWindowVisible = false;
    } else {
      displayWindow.show();
      displayWindowVisible = true;
    }
  } else {
    createDisplayWindow();
    displayWindowVisible = true;
  }
  return displayWindowVisible;
}

function getDisplayWindow() {
  return displayWindow;
}

function isDisplayWindowVisible() {
  return displayWindowVisible && displayWindow && !displayWindow.isDestroyed() && displayWindow.isVisible();
}

module.exports = { createMainWindow, createDisplayWindow, toggleDisplayWindow, getDisplayWindow, isDisplayWindowVisible };