const { Menu, screen } = require('electron');
const { getDisplayWindowState, toggleDisplayWindow, showFullscreenOnDisplay, getCurrentDisplayIndex } = require('./windows');

function setupMenu(mainWindow) {
  // Register IPC handlers for menu actions
  const { ipcMain } = require('electron');
  
  // Theme toggle from menu
  ipcMain.removeAllListeners('menu-theme-toggle'); // Prevent duplicates
  ipcMain.on('menu-theme-toggle', (event) => {
    const menu = Menu.getApplicationMenu();
    const themeItem = menu.getMenuItemById('dark-theme');
    if (themeItem) {
      themeItem.checked = !themeItem.checked;
      const theme = themeItem.checked ? 'dark' : 'light';
      mainWindow.webContents.send('menu-theme-change', theme);
    }
  });
  
  // Clock toggle from menu
  ipcMain.removeAllListeners('menu-clock-toggle'); // Prevent duplicates
  ipcMain.on('menu-clock-toggle', (event) => {
    const menu = Menu.getApplicationMenu();
    const clockItem = menu.getMenuItemById('toggle-clock');
    if (clockItem) {
      clockItem.checked = !clockItem.checked;
      mainWindow.webContents.send('menu-toggle-clock', clockItem.checked);
    }
  });
  
  // Get available displays
  const displays = screen.getAllDisplays();
  
  // Create display selection submenu for fullscreen
  const displaySubmenu = displays.map((display, index) => ({
    id: `display-${index}`,
    label: `Display ${index + 1} (${display.bounds.width}x${display.bounds.height})`,
    type: 'checkbox',
    checked: false, // Will be updated dynamically
    click: () => {
      showFullscreenOnDisplay(display);
      // Update menu after selection
      setTimeout(() => {
        updateDisplayMenuItems();
      }, 100);
    }
  }));

  const template = [
    {
      label: 'Countdown Timer',
      submenu: [
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            const { createSettingsWindow } = require('./windows');
            createSettingsWindow();
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Timer',
      submenu: [
        {
          label: 'Start/Stop Timer',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.send('menu-start-stop');
          }
        },
        {
          label: 'Reset Timer',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-reset');
          }
        },
        { type: 'separator' },
        {
          id: 'toggle-clock',
          label: 'Show Clock',
          accelerator: 'CmdOrCtrl+T',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => {
            mainWindow.webContents.send('menu-toggle-clock', menuItem.checked);
          }
        },
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          id: 'toggle-display',
          label: 'Show Timer Window',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            toggleDisplayWindow();
            updateDisplayMenuItems();
          }
        },
        { type: 'separator' },
        {
          label: 'Show Fullscreen Timer On',
          submenu: displaySubmenu
        },
        { type: 'separator' },
        {
          id: 'dark-theme',
          label: 'Dark Mode',
          accelerator: 'CmdOrCtrl+Shift+D',
          type: 'checkbox',
          checked: true, // Default to dark
          click: (menuItem) => {
            const theme = menuItem.checked ? 'dark' : 'light';
            mainWindow.webContents.send('menu-theme-change', theme);
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggledevtools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  // Store reference for updates
  global.appMenu = menu;
  
  // Initial menu state update
  setTimeout(() => {
    updateDisplayMenuItems();
  }, 100);
}

function updateDisplayMenuItems() {
  if (!global.appMenu) return;
  
  const displayState = getDisplayWindowState();
  const toggleItem = global.appMenu.getMenuItemById('toggle-display');
  
  if (toggleItem) {
    toggleItem.label = displayState.visible ? 'Hide Timer Window' : 'Show Timer Window';
  }
  
  // Update display checkmarks - only show checkmark if window is in fullscreen
  const currentDisplay = getCurrentDisplayIndex();
  const isFullscreen = displayState.visible && displayState.fullscreen;
  
  console.log(`Menu update: visible=${displayState.visible}, fullscreen=${displayState.fullscreen}, currentDisplay=${currentDisplay}`);
  
  // Get all displays to update checkmarks
  const { screen } = require('electron');
  const displays = screen.getAllDisplays();
  
  displays.forEach((display, index) => {
    const displayItem = global.appMenu.getMenuItemById(`display-${index}`);
    if (displayItem) {
      const shouldCheck = isFullscreen && (index === currentDisplay);
      displayItem.checked = shouldCheck;
      console.log(`Display ${index}: checked=${shouldCheck} (current=${index === currentDisplay}, fullscreen=${isFullscreen})`);
    } else {
      console.log(`Display item display-${index} not found in menu`);
    }
  });
}

// Function to update menu states from renderer process
function updateMenuStates(themeState, clockState) {
  if (!global.appMenu) return;
  
  const themeItem = global.appMenu.getMenuItemById('dark-theme');
  const clockItem = global.appMenu.getMenuItemById('toggle-clock');
  
  if (themeItem && themeState !== undefined) {
    themeItem.checked = themeState === 'dark';
    console.log(`Updated menu theme state: ${themeState} (checked: ${themeItem.checked})`);
  }
  
  if (clockItem && clockState !== undefined) {
    clockItem.checked = clockState;
    console.log(`Updated menu clock state: ${clockState} (checked: ${clockItem.checked})`);
  }
}

module.exports = { setupMenu, updateDisplayMenuItems, updateMenuStates };