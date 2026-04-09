/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
const { BrowserWindow, nativeImage } = require('electron');
const path = require('path');

const appIcon = nativeImage.createFromPath(path.join(__dirname, '../../build/icon.png'));

let mainWindow;    // Declare mainWindow globally
let displayWindow; // Declare displayWindow globally
let settingsWindow; // Declare settingsWindow globally
let layoutCreatorWindow; // Declare layoutCreatorWindow globally
let displayWindowVisible = false; // Track if display window should be visible
let currentDisplayIndex = 0; // Track which display is currently selected

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 700,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true, // Add for security
      nodeIntegration: false, // Add for security
      backgroundThrottling: false, // Keep timer accurate when window is unfocused
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
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: appIcon,
    alwaysOnTop: true,
    frame: true,
  });

  displayWindow.loadFile(path.join(__dirname, '../renderer/html/display.html'));

  // When display window finishes loading, sync current state
  displayWindow.webContents.once('did-finish-load', () => {
    // Request current state from main window
    try {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed() && mainWindow.webContents.mainFrame) {
        mainWindow.webContents.send('request-current-state-for-display');
      }
    } catch (_) {
      // Silently ignore if frame was disposed
    }
  });

  // Handle the 'closed' event to clean up the reference
  displayWindow.on('closed', () => {
    displayWindow = null;
    displayWindowVisible = false;
    // Notify main window that display was closed
    try {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed() && mainWindow.webContents.mainFrame) {
        mainWindow.webContents.send('display-window-closed');
      }
    } catch (_) {
      // Silently ignore if frame was disposed
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
      // If window is in fullscreen, close it instead of hiding
      if (displayWindow.isFullScreen()) {
        console.log('Closing fullscreen display window');
        displayWindow.close();
        displayWindow = null;
        displayWindowVisible = false;
      } else {
        displayWindow.hide();
        displayWindowVisible = false;
      }
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

function getDisplayWindowState() {
  return {
    visible: isDisplayWindowVisible(),
    fullscreen: displayWindow && !displayWindow.isDestroyed() ? displayWindow.isFullScreen() : false
  };
}

function setDisplayFullscreen() {
  // If display window doesn't exist, create it in fullscreen mode
  if (!displayWindow || displayWindow.isDestroyed()) {
    console.log('Creating display window in fullscreen mode');
    createDisplayWindow();
    
    // Wait for window to be ready, then set fullscreen
    if (displayWindow && !displayWindow.isDestroyed()) {
      displayWindow.once('ready-to-show', () => {
        displayWindow.setFullScreen(true);
        displayWindowVisible = true;
        
        // Notify main window of state change
        const mainWin = getMainWindow();
        try {
          if (mainWin && !mainWin.isDestroyed() && mainWin.webContents && !mainWin.webContents.isDestroyed() && mainWin.webContents.mainFrame) {
            mainWin.webContents.send('display-window-state-changed', true);
          }
        } catch (_) {
          // Silently ignore if frame was disposed
        }
        
        // Update menu
        setTimeout(() => {
          try {
            const { updateDisplayMenuItems } = require('./menu');
            updateDisplayMenuItems();
            console.log('Menu updated after creating fullscreen window');
          } catch (error) {
            console.error('Error updating menu:', error);
          }
        }, 200);
      });
    }
  } else {
    // Window exists, toggle fullscreen state
    const isCurrentlyFullscreen = displayWindow.isFullScreen();
    console.log(`Toggling fullscreen from ${isCurrentlyFullscreen} to ${!isCurrentlyFullscreen}`);
    
    displayWindow.setFullScreen(!isCurrentlyFullscreen);
    
    // Update menu after fullscreen change
    setTimeout(() => {
      try {
        const { updateDisplayMenuItems } = require('./menu');
        updateDisplayMenuItems();
        console.log('Menu updated after fullscreen toggle');
      } catch (error) {
        console.error('Error updating menu:', error);
      }
    }, 200);
  }
}

function showFullscreenOnDisplay(targetDisplay) {
  console.log(`showFullscreenOnDisplay called for display: ${targetDisplay.bounds.width}x${targetDisplay.bounds.height} at (${targetDisplay.bounds.x}, ${targetDisplay.bounds.y})`);
  
  // Find which display index this is
  const { screen } = require('electron');
  const allDisplays = screen.getAllDisplays();
  currentDisplayIndex = allDisplays.findIndex(display => 
    display.bounds.x === targetDisplay.bounds.x && 
    display.bounds.y === targetDisplay.bounds.y
  );
  
  console.log(`Selected display index: ${currentDisplayIndex}`);
  
  // Create display window if it doesn't exist
  if (!displayWindow || displayWindow.isDestroyed()) {
    console.log('Creating new display window');
    createDisplayWindow();
  }
  
  if (displayWindow && !displayWindow.isDestroyed()) {
    const { x, y, width, height } = targetDisplay.bounds;
    
    console.log(`Moving window to bounds: x=${x}, y=${y}, width=${width}, height=${height}`);
    
    // If window is currently in fullscreen, exit fullscreen first
    if (displayWindow.isFullScreen()) {
      console.log('Exiting fullscreen to move display');
      displayWindow.setFullScreen(false);
    }
    
    // Wait a bit for fullscreen exit, then move and re-enter fullscreen
    setTimeout(() => {
      // Move window to target display
      displayWindow.setBounds({
        x: x,
        y: y,
        width: width,
        height: height
      });
      
      // Set to fullscreen on new display
      setTimeout(() => {
        console.log('Setting fullscreen mode on new display');
        displayWindow.setFullScreen(true);
        
        // Make sure window is visible and focused
        displayWindow.show();
        displayWindow.focus();
      }, 200);
    }, 200);
    
    displayWindowVisible = true;
    
    console.log('Display window successfully moved to fullscreen');
    
    // Update menu after all operations complete
    setTimeout(() => {
      try {
        console.log('Updating menu after fullscreen display change');
        const { updateDisplayMenuItems } = require('./menu');
        updateDisplayMenuItems();
      } catch (error) {
        console.error('Error updating menu:', error);
      }
    }, 500); // Longer delay to ensure all operations complete
  } else {
    console.error('Failed to create or access display window');
  }
}

function getCurrentDisplayIndex() {
  return currentDisplayIndex;
}

function createSettingsWindow() {
  // If settings window already exists, focus it
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Preferences',
    resizable: true,
    minimizable: true,
    maximizable: true,
    show: false, // Don't show until ready
  });

  settingsWindow.loadFile(path.join(__dirname, '../renderer/html/settings.html'));

  // Show when ready
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  // Clean up reference when closed
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  return settingsWindow;
}

function getSettingsWindow() {
  return settingsWindow;
}

// ============================================================================
// Layout Creator Window
// ============================================================================

function createLayoutCreatorWindow(editLayoutId) {
  // If layout creator window already exists, focus it
  if (layoutCreatorWindow && !layoutCreatorWindow.isDestroyed()) {
    layoutCreatorWindow.focus();
    return layoutCreatorWindow;
  }

  layoutCreatorWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Layout Creator',
    resizable: true,
    minimizable: true,
    maximizable: true,
    show: false,
  });

  let url = path.join(__dirname, '../renderer/html/layoutCreator.html');
  if (editLayoutId) {
    layoutCreatorWindow.loadFile(url, { query: { edit: editLayoutId } });
  } else {
    layoutCreatorWindow.loadFile(url);
  }

  layoutCreatorWindow.once('ready-to-show', () => {
    layoutCreatorWindow.show();
  });

  layoutCreatorWindow.on('closed', () => {
    layoutCreatorWindow = null;
  });

  return layoutCreatorWindow;
}

function getLayoutCreatorWindow() {
  return layoutCreatorWindow;
}

module.exports = { 
  createMainWindow, 
  createDisplayWindow, 
  toggleDisplayWindow, 
  getDisplayWindow,
  getMainWindow,
  isDisplayWindowVisible,
  getDisplayWindowState,
  showFullscreenOnDisplay,
  getCurrentDisplayIndex,
  createSettingsWindow,
  getSettingsWindow,
  createLayoutCreatorWindow,
  getLayoutCreatorWindow
};