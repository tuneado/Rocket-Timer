const { BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;    // Declare mainWindow globally
let displayWindow; // Declare displayWindow globally
let displayWindowVisible = false; // Track if display window should be visible
let currentDisplayIndex = 0; // Track which display is currently selected

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
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    alwaysOnTop: true,
    frame: true,
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
        if (mainWin && !mainWin.isDestroyed()) {
          mainWin.webContents.send('display-window-state-changed', true);
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

module.exports = { 
  createMainWindow, 
  createDisplayWindow, 
  toggleDisplayWindow, 
  getDisplayWindow,
  getMainWindow,
  isDisplayWindowVisible,
  getDisplayWindowState,
  showFullscreenOnDisplay,
  getCurrentDisplayIndex
};