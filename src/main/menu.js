/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
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
      label: 'Projects',
      submenu: [
        {
          label: 'New Project...',
          accelerator: 'CmdOrCtrl+N',
          click: async () => {
            const { dialog } = require('electron');
            const { showPrompt } = require('./utils/promptDialog');
            const projectManager = global.projectManager;
            
            if (!projectManager) {
              console.error('ProjectManager not initialized');
              return;
            }
            
            // Check if at limit
            const manifest = await projectManager.storage.readManifest();
            if (manifest.projects.length >= 10) {
              dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: 'Project Limit Reached',
                message: 'Maximum of 10 projects allowed',
                detail: 'Delete unused projects to create new ones.'
              });
              return;
            }
            
            // Check for unsaved changes before switching
            const safeToSwitch = await projectManager.promptSaveIfNeeded(mainWindow);
            if (!safeToSwitch) return;
            
            // Prompt for project name
            const name = await showPrompt(mainWindow, {
              title: 'New Project',
              label: 'Project name:',
              placeholder: 'My Project',
              confirmText: 'Create',
            });
            
            if (name) {
              try {
                const project = await projectManager.createProject(name);
                await projectManager.loadProject(project.id);
                await updateProjectsMenu();
                console.log('✅ Created and loaded project:', name);
              } catch (error) {
                dialog.showErrorBox('Error', `Failed to create project: ${error.message}`);
              }
            }
          }
        },
        {
          label: 'Open Project',
          submenu: getOpenProjectSubmenu()
        },
        { type: 'separator' },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            const projectManager = global.projectManager;
            if (!projectManager) return;
            
            try {
              await projectManager.saveProject();
              const { dialog } = require('electron');
              // Brief confirmation — auto-dismiss via a small notification feel
              console.log('💾 Project saved:', projectManager.currentProject.name);
            } catch (error) {
              const { dialog } = require('electron');
              dialog.showErrorBox('Error', `Failed to save project: ${error.message}`);
            }
          }
        },
        {
          label: 'Rename Project...',
          click: async () => {
            const { dialog } = require('electron');
            const { showPrompt } = require('./utils/promptDialog');
            const projectManager = global.projectManager;
            
            if (!projectManager || !projectManager.currentProject) return;
            
            const newName = await showPrompt(mainWindow, {
              title: 'Rename Project',
              label: 'New name:',
              value: projectManager.currentProject.name,
              confirmText: 'Rename',
            });
            
            if (newName && newName !== projectManager.currentProject.name) {
              try {
                await projectManager.renameProject(projectManager.currentProject.id, newName);
                await updateProjectsMenu();
                console.log('✏️  Renamed project to:', newName);
              } catch (error) {
                dialog.showErrorBox('Error', `Failed to rename project: ${error.message}`);
              }
            }
          }
        },
        {
          label: 'Duplicate Project...',
          click: async () => {
            const { dialog } = require('electron');
            const { showPrompt } = require('./utils/promptDialog');
            const projectManager = global.projectManager;
            
            if (!projectManager || !projectManager.currentProject) return;
            
            const defaultName = `${projectManager.currentProject.name} (Copy)`;
            const name = await showPrompt(mainWindow, {
              title: 'Duplicate Project',
              label: 'Name for the copy:',
              value: defaultName,
              confirmText: 'Duplicate',
            });
            
            if (name) {
              try {
                const duplicated = await projectManager.duplicateProject(projectManager.currentProject.id, name);
                await updateProjectsMenu();
                console.log('📑 Project duplicated:', duplicated.name);
              } catch (error) {
                dialog.showErrorBox('Error', `Failed to duplicate project: ${error.message}`);
              }
            }
          }
        },
        {
          label: 'Delete Project...',
          click: async () => {
            const { dialog } = require('electron');
            const projectManager = global.projectManager;
            
            if (!projectManager || !projectManager.currentProject) return;
            
            const result = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              title: 'Delete Project',
              message: `Delete "${projectManager.currentProject.name}"?`,
              detail: 'This action cannot be undone. A backup will be created.',
              buttons: ['Cancel', 'Delete'],
              defaultId: 0,
              cancelId: 0
            });
            
            if (result.response === 1) {
              try {
                const projectId = projectManager.currentProject.id;
                await projectManager.deleteProject(projectId);
                
                // Load first available project or create default
                const manifest = await projectManager.storage.readManifest();
                if (manifest.projects.length > 0) {
                  await projectManager.loadProject(manifest.projects[0].id);
                } else {
                  const defaultProject = await projectManager.createProject('Default', true);
                  await projectManager.loadProject(defaultProject.id);
                }
                
                await updateProjectsMenu();
                console.log('🗑️  Project deleted');
              } catch (error) {
                dialog.showErrorBox('Error', `Failed to delete project: ${error.message}`);
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Set as Default',
          click: async () => {
            const projectManager = global.projectManager;
            if (!projectManager || !projectManager.currentProject) return;
            
            try {
              await projectManager.setDefaultProject(projectManager.currentProject.id);
              const { dialog } = require('electron');
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Default Project Set',
                message: `"${projectManager.currentProject.name}" will load on startup.`
              });
              console.log('⭐ Set as default project');
            } catch (error) {
              const { dialog } = require('electron');
              dialog.showErrorBox('Error', `Failed to set default: ${error.message}`);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Import Project...',
          click: async () => {
            const { dialog } = require('electron');
            const projectManager = global.projectManager;
            
            if (!projectManager) return;
            
            const result = await dialog.showOpenDialog(mainWindow, {
              title: 'Import Project',
              filters: [
                { name: 'Rocket Timer Project', extensions: ['rctimer'] },
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ],
              properties: ['openFile']
            });
            
            if (result.canceled || result.filePaths.length === 0) return;
            
            try {
              const project = await projectManager.importProject(result.filePaths[0]);
              await projectManager.loadProject(project.id);
              await updateProjectsMenu();
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Project Imported',
                message: `"${project.name}" was imported successfully.`
              });
            } catch (error) {
              dialog.showErrorBox('Import Failed', error.message);
            }
          }
        },
        {
          label: 'Export Project...',
          click: async () => {
            const { dialog } = require('electron');
            const projectManager = global.projectManager;
            
            if (!projectManager || !projectManager.currentProject) return;
            
            const safeName = projectManager.currentProject.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            
            const result = await dialog.showSaveDialog(mainWindow, {
              title: 'Export Project',
              defaultPath: `${safeName}.rctimer`,
              filters: [
                { name: 'Rocket Timer Project', extensions: ['rctimer'] }
              ]
            });
            
            if (result.canceled || !result.filePath) return;
            
            try {
              await projectManager.exportProject(projectManager.currentProject.id, result.filePath);
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Project Exported',
                message: `"${projectManager.currentProject.name}" was exported successfully.`
              });
            } catch (error) {
              dialog.showErrorBox('Export Failed', error.message);
            }
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

/**
 * Build the "Open Project" submenu items from the current manifest.
 * Called synchronously during menu build — reads cached manifest data.
 */
function getOpenProjectSubmenu() {
  const projectManager = global.projectManager;
  if (!projectManager || !projectManager.initialized) {
    return [{ label: 'Loading...', enabled: false }];
  }
  
  // Read manifest synchronously from the in-memory cache
  const fsSync = require('fs');
  const path = require('path');
  const manifestPath = projectManager.storage.manifestPath;
  
  let manifest;
  try {
    manifest = JSON.parse(fsSync.readFileSync(manifestPath, 'utf8'));
  } catch {
    return [{ label: 'No projects available', enabled: false }];
  }
  
  const currentProjectId = projectManager.currentProject?.id;
  
  if (manifest.projects.length === 0) {
    return [{ label: 'No projects available', enabled: false }];
  }
  
  return manifest.projects.map(project => ({
    label: project.name,
    type: 'checkbox',
    checked: project.id === currentProjectId,
    click: async () => {
      try {
        // Skip if already the current project
        if (project.id === global.projectManager.currentProject?.id) return;
        
        // Check for unsaved changes before switching
        const safeToSwitch = await global.projectManager.promptSaveIfNeeded(_mainWindow);
        if (!safeToSwitch) return;
        
        await global.projectManager.loadProject(project.id);
        console.log(`📂 Loaded project: ${project.name}`);
        updateProjectsMenu();
      } catch (error) {
        const { dialog } = require('electron');
        dialog.showErrorBox('Error', `Failed to load project: ${error.message}`);
      }
    }
  }));
}

/**
 * Rebuild the entire menu to reflect project changes.
 * Electron native menus on macOS cannot be patched in-place.
 */
function updateProjectsMenu() {
  if (!_mainWindow) return;
  buildMenu(_mainWindow);
  console.log('✅ Projects menu rebuilt');
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

module.exports = { setupMenu, updateDisplayMenuItems, updateMenuStates, updateProjectsMenu };