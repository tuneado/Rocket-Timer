const { ipcMain } = require('electron');
const { createMainWindow, createDisplayWindow, toggleDisplayWindow, getDisplayWindow, isDisplayWindowVisible } = require('./windows');
const { updateDisplayMenuItems } = require('./menu');

function setupIpcHandlers(mainWindow) {
  // Handle display window toggle
  ipcMain.on('toggle-display-window', (event) => {
    try {
      console.log('toggle-display-window event received');
      const isVisible = toggleDisplayWindow();
      console.log('Display window toggled. Now visible:', isVisible);
      
      // Send the new state back to the main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('display-window-state-changed', isVisible);
        
        // If window is now visible, request current state sync
        if (isVisible) {
          mainWindow.webContents.send('request-current-state-for-display');
        }
      }
      
      // Update menu items
      updateDisplayMenuItems();
    } catch (error) {
      console.error('Error while toggling display window:', error);
    }
  });

  // Handle clock updates
  ipcMain.on('clock-update', (event, data) => {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid clock-update data received:', data);
      return;
    }
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('update-clock', data);
    }
  });
  
  // Handle clock visibility toggle
  ipcMain.on('toggle-clock-visibility', (event, visible) => {
    console.log('Received toggle-clock-visibility:', visible);
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('toggle-clock-display', visible);
    }
  });

  // Handle timer updates
  ipcMain.on('timer-update', (event, data) => {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid timer-update data received:', data);
      return;
    }
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('update-display', data);
    }
  });

  ipcMain.on('update-theme', (event, theme) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('theme-updated', theme);
    }
    
    // Also send theme to display window if it's visible
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('theme-updated', theme);
    }
  });

  // Handle theme requests from display window
  ipcMain.on('request-current-theme', (event) => {
    // Request current theme from main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-current-theme-for-display');
    }
  });

  // Forward theme response to display window
  ipcMain.on('current-theme-response', (event, theme) => {
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('theme-updated', theme);
    }
  });

  // Handle clock state requests
  ipcMain.on('request-clock-state', (event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-clock-state');
    }
  });

  // Handle menu state updates
  ipcMain.on('update-menu-states', (event, themeState, clockState) => {
    const { updateMenuStates } = require('./menu');
    updateMenuStates(themeState, clockState);
  });

  // Add handler to respond with clock state
  ipcMain.on('clock-state-response', (event, data) => {
    console.log('Received clock-state-response:', data);
    
    if (!data || typeof data !== 'object') {
      console.warn('Invalid clock-state-response data received:', data);
      return;
    }
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('update-clock', data);
    }
  });

  // Handle display window state requests
  ipcMain.on('request-display-state', (event) => {
    const isVisible = isDisplayWindowVisible();
    console.log('Display window state requested, visible:', isVisible);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('display-window-state-changed', isVisible);
    }
  });

  // Handle syncing current state to display window
  ipcMain.on('sync-current-state', (event, data) => {
    console.log('Syncing current state to display window:', data);
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      // Send current timer state
      if (data.timer) {
        displayWindow.webContents.send('update-display', data.timer);
      }
      // Send current clock state
      if (data.clock) {
        displayWindow.webContents.send('update-clock', data.clock);
      }
      // Send clock visibility state
      if (data.clockVisible !== undefined) {
        displayWindow.webContents.send('toggle-clock-display', data.clockVisible);
      }
    }
  });

  // Handle display message
  ipcMain.on('display-message', (event, message) => {
    if (!message || typeof message !== 'string') {
      console.warn('Invalid display-message data received:', message);
      return;
    }
    
    console.log('Displaying message on display window:', message);
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('show-message', message);
    }
  });

  // Handle clear message
  ipcMain.on('clear-message', (event) => {
    console.log('Clearing message from display window');
    
    const displayWindow = getDisplayWindow();
    if (displayWindow && !displayWindow.isDestroyed() && isDisplayWindowVisible()) {
      displayWindow.webContents.send('clear-message');
    }
  });
}

module.exports = { setupIpcHandlers };