const { Menu, screen, app } = require('electron');
const { getDisplayWindowState, toggleDisplayWindow, showFullscreenOnDisplay, getCurrentDisplayIndex } = require('./windows');

const isDev = !app.isPackaged;

// Store reference to mainWindow for rebuilds
let _mainWindow = null;

function setupMenu(mainWindow) {
  _mainWindow = mainWindow;

  // Register IPC handlers for menu actions (once only)
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
  
  // Build and set the menu
  buildMenu(mainWindow);

  // Rebuild menu when displays change
  screen.on('display-added', () => {
    console.log('Display added — rebuilding menu');
    buildMenu(mainWindow);
  });
  screen.on('display-removed', () => {
    console.log('Display removed — rebuilding menu');
    buildMenu(mainWindow);
  });
}

function buildMenu(mainWindow) {
  // Preserve current menu state before rebuilding
  let darkThemeChecked = true; // default
  if (global.appMenu) {
    const themeItem = global.appMenu.getMenuItemById('dark-theme');
    if (themeItem) darkThemeChecked = themeItem.checked;
  }

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

  const isMac = process.platform === 'darwin';

  // Dev-only view items
  const devViewItems = isDev ? [
    { type: 'separator' },
    { role: 'reload', label: 'Reload' },
    { role: 'forceReload', label: 'Force Reload' },
    { role: 'toggleDevTools', label: 'Developer Tools' },
  ] : [];

  const template = [
    // macOS App Menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          click: () => {
            const { dialog } = require('electron');
            const version = require('../../package.json').version;
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: `About ${app.name}`,
              message: app.name,
              detail: `Version ${version}\n\nThe ultimate timer app for events.\n\n© 2026 50hz Event Solutions`
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            const { createSettingsWindow } = require('./windows');
            createSettingsWindow();
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // File menu (non-macOS) / app-specific menu
    {
      label: isMac ? 'File' : 'Rocket Timer',
      submenu: [
        ...(!isMac ? [
          {
            label: 'Preferences...',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              const { createSettingsWindow } = require('./windows');
              createSettingsWindow();
            }
          },
          { type: 'separator' },
        ] : []),
        {
          label: 'Layout Creator',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            const { createLayoutCreatorWindow } = require('./windows');
            createLayoutCreatorWindow();
          }
        },
        ...(!isMac ? [
          { type: 'separator' },
          { role: 'quit' }
        ] : []),
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ]
    },
    {
      label: 'Timer',
      submenu: [
        {
          label: 'Start/Stop Timer',
          click: () => {
            mainWindow.webContents.send('menu-start-stop');
          }
        },
        {
          label: 'Reset Timer',
          click: () => {
            mainWindow.webContents.send('menu-reset');
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
          checked: darkThemeChecked,
          click: (menuItem) => {
            const theme = menuItem.checked ? 'dark' : 'light';
            mainWindow.webContents.send('menu-theme-change', theme);
          }
        },
        ...devViewItems,
      ],
    },
    {
      label: 'Window',
      role: 'windowMenu',
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: () => {
            const { getUpdateManager } = require('./main');
            const updateManager = getUpdateManager();
            if (updateManager) {
              updateManager.checkForUpdatesManual();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Troubleshooting',
          submenu: [
            {
              label: 'View Logs...',
              click: () => {
                const { shell } = require('electron');
                const log = require('electron-log');
                const logPath = log.transports.file.getFile().path;
                shell.showItemInFolder(logPath);
              }
            },
          ]
        },
        ...(!isMac ? [
          { type: 'separator' },
          {
            label: 'About',
            click: () => {
              const { dialog } = require('electron');
              const version = require('../../package.json').version;
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'About Rocket Timer',
                message: 'Rocket Timer',
                detail: `Version ${version}\n\nThe ultimate timer app for events.\n\n© 2026 50hz Event Solutions`
              });
            }
          }
        ] : []),
      ]
    }
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
function updateMenuStates(themeState) {
  if (!global.appMenu) return;
  
  const themeItem = global.appMenu.getMenuItemById('dark-theme');
  
  if (themeItem && themeState !== undefined) {
    themeItem.checked = themeState === 'dark';
    console.log(`Updated menu theme state: ${themeState} (checked: ${themeItem.checked})`);
  }
}

module.exports = { setupMenu, updateDisplayMenuItems, updateMenuStates };