/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Application menu. Built from settings, the project list and the main window's
 * state ('menu-state'); rebuilt whenever one of them changes. Timer, layout and
 * clock items run main window actions through 'menu-action'.
 */
const { Menu, screen, app, dialog, shell } = require('electron');
const { getDisplayWindowState, toggleDisplayWindow, showFullscreenOnDisplay, getCurrentDisplayIndex } = require('./windows');

const isDev = !app.isPackaged;
const isMac = process.platform === 'darwin';
const HOMEPAGE = require('../../package.json').homepage;

let _mainWindow = null;
let _settingsManager = null;

// Main window state shown in the menu (see countdown.js sendMenuState)
let menuState = {
  running: false,
  stoppedAtZero: false,
  soundEnabled: true,
  coverEnabled: false,
  messageVisible: false,
  clockVisible: true,
  layoutHasClock: true,
  layout: null,
  layouts: [],
  presets: [],
  shortcuts: {}
};

function setupMenu(mainWindow, settingsManager) {
  _mainWindow = mainWindow;
  _settingsManager = settingsManager;
  buildMenu();

  // Rebuild menu when displays change
  screen.on('display-added', buildMenu);
  screen.on('display-removed', buildMenu);
}

/**
 * New main window state from the renderer; rebuilds the menu if it changed
 */
function setMenuState(state) {
  const next = { ...menuState, ...state };
  if (JSON.stringify(next) === JSON.stringify(menuState)) return;
  menuState = next;
  buildMenu();
}

/**
 * Run a main window action (see mainActions.js)
 */
function sendAction(action, ...args) {
  if (_mainWindow && !_mainWindow.isDestroyed()) {
    _mainWindow.webContents.send('menu-action', { action, args });
  }
}

const ACCELERATOR_KEYS = { space: 'Space', arrowup: 'Up', arrowdown: 'Down', ctrl: 'Ctrl', shift: 'Shift', alt: 'Alt', meta: 'Cmd' };

/**
 * Show an in-window keyboard shortcut next to a menu item, while it's enabled.
 * Display only: the main window handles the key, so Space still types in text fields.
 */
function shortcutHint(key) {
  if (!menuState.shortcuts[key]) return {};
  const accelerator = key.split('+').map(k => ACCELERATOR_KEYS[k] || k.toUpperCase()).join('+');
  return { accelerator, registerAccelerator: false };
}

function formatPresetTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function showAbout() {
  const version = require('../../package.json').version;
  dialog.showMessageBox(_mainWindow, {
    type: 'info',
    title: `About ${app.name}`,
    message: app.name,
    detail: `Version ${version}\n\nThe ultimate timer app for events.\n\n© 2026 50hz Event Solutions`
  });
}

function checkForUpdates() {
  const updateManager = require('./main').getUpdateManager();
  if (updateManager) updateManager.checkForUpdatesManual();
}

function openSettings(section) {
  require('./windows').createSettingsWindow(section);
}

function openLayoutCreator() {
  require('./windows').createLayoutCreatorWindow();
}

// ============================================================================
// MENUS
// ============================================================================

function appMenu() {
  return {
    label: app.name,
    submenu: [
      { label: `About ${app.name}`, click: showAbout },
      { label: 'Check for Updates...', click: checkForUpdates },
      { type: 'separator' },
      { label: 'Preferences...', accelerator: 'CmdOrCtrl+,', click: () => openSettings() },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  };
}

function fileMenu() {
  return {
    label: 'File',
    submenu: [
      { label: 'New Project...', accelerator: 'CmdOrCtrl+N', click: newProject },
      { label: 'Open Project', submenu: getOpenProjectSubmenu() },
      { type: 'separator' },
      { label: 'Save Project', accelerator: 'CmdOrCtrl+S', click: saveProject },
      { label: 'Rename Project...', click: renameProject },
      { label: 'Duplicate Project...', click: duplicateProject },
      { type: 'separator' },
      { label: 'Import Project...', click: importProject },
      { label: 'Export Project...', click: exportProject },
      { type: 'separator' },
      {
        label: 'Open at Startup',
        type: 'checkbox',
        checked: isCurrentProjectDefault(),
        enabled: Boolean(global.projectManager?.currentProject),
        click: setStartupProject
      },
      { label: 'Delete Project...', click: deleteProject },
      ...(!isMac ? [
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'CmdOrCtrl+,', click: () => openSettings() },
        { type: 'separator' },
        { role: 'quit' }
      ] : [])
    ]
  };
}

function editMenu() {
  return {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' }
    ]
  };
}

function timerMenu() {
  const { running, stoppedAtZero, soundEnabled, coverEnabled, messageVisible, presets } = menuState;
  const adjust = (minutes, key) => ({
    label: `${minutes > 0 ? 'Add' : 'Subtract'} ${Math.abs(minutes)} Minute${Math.abs(minutes) > 1 ? 's' : ''}`,
    enabled: !stoppedAtZero,
    ...shortcutHint(key),
    click: () => sendAction('adjust', minutes)
  });

  return {
    label: 'Timer',
    submenu: [
      { label: running ? 'Stop Timer' : 'Start Timer', ...shortcutHint('space'), click: () => sendAction('toggle') },
      { label: 'Reset Timer', ...shortcutHint('r'), click: () => sendAction('reset') },
      { type: 'separator' },
      adjust(1, 'arrowup'),
      adjust(5, 'shift+arrowup'),
      adjust(10, 'ctrl+arrowup'),
      adjust(-1, 'arrowdown'),
      adjust(-5, 'shift+arrowdown'),
      adjust(-10, 'ctrl+arrowdown'),
      { type: 'separator' },
      {
        label: 'Presets',
        submenu: presets.length ? presets.map((preset, i) => ({
          label: `Preset ${i + 1} — ${formatPresetTime(preset.time)}`,
          enabled: !running,
          ...shortcutHint(String(i + 1)),
          click: () => sendAction('loadPreset', i)
        })) : [{ label: 'Loading...', enabled: false }]
      },
      { type: 'separator' },
      { label: 'Flash Screen', ...shortcutHint('f'), click: () => sendAction('flash') },
      { label: messageVisible ? 'Hide Message' : 'Show Message', click: () => sendAction('toggleMessage') },
      { label: 'Mute Sounds', type: 'checkbox', checked: !soundEnabled, ...shortcutHint('m'), click: () => sendAction('toggleMute') },
      { label: 'Cover Image', type: 'checkbox', checked: coverEnabled, ...shortcutHint('i'), click: () => sendAction('toggleCoverImage') }
    ]
  };
}

function viewMenu() {
  const { layouts, layout, clockVisible, layoutHasClock } = menuState;
  const theme = _settingsManager?.getSetting('appearanceTheme') || 'dark';
  const setTheme = (value) => require('./ipcHandlers').saveSetting('appearanceTheme', value);

  // Checkboxes, not radios: none is checked while the timer isn't fullscreen
  const fullscreenOn = screen.getAllDisplays().map((display, index) => ({
    id: `display-${index}`,
    label: `Display ${index + 1} (${display.bounds.width}x${display.bounds.height})`,
    type: 'checkbox',
    checked: false, // set by updateDisplayMenuItems
    click: () => {
      showFullscreenOnDisplay(display);
      setTimeout(updateDisplayMenuItems, 100);
    }
  }));

  return {
    label: 'View',
    submenu: [
      {
        label: 'External Display',
        submenu: [
          {
            id: 'toggle-display',
            label: 'Show External Display',
            accelerator: 'CmdOrCtrl+D',
            click: () => {
              toggleDisplayWindow();
              updateDisplayMenuItems();
            }
          },
          { label: 'Fullscreen On', submenu: fullscreenOn }
        ]
      },
      { type: 'separator' },
      {
        label: 'Layout',
        submenu: layouts.length ? layouts.map(({ id, name }) => ({
          label: name,
          type: 'radio',
          checked: id === layout,
          click: () => sendAction('changeLayout', id)
        })) : [{ label: 'Loading...', enabled: false }]
      },
      {
        label: 'Show Clock',
        type: 'checkbox',
        checked: clockVisible,
        // Only layouts with a clock element can show it
        enabled: layoutHasClock,
        click: (item) => sendAction('setClockVisible', item.checked)
      },
      { type: 'separator' },
      {
        label: 'Appearance',
        submenu: [
          ...[['dark', 'Dark'], ['light', 'Light'], ['auto', 'System']].map(([value, label]) => ({
            label,
            type: 'radio',
            checked: theme === value,
            click: () => setTheme(value)
          })),
          { type: 'separator' },
          {
            label: 'Switch Light/Dark',
            accelerator: 'CmdOrCtrl+Shift+D',
            click: () => {
              const dark = theme === 'auto' ? require('electron').nativeTheme.shouldUseDarkColors : theme === 'dark';
              setTheme(dark ? 'light' : 'dark');
            }
          }
        ]
      },
      { type: 'separator' },
      { role: 'togglefullscreen' },
      ...(isDev ? [
        { type: 'separator' },
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Developer Tools' }
      ] : [])
    ]
  };
}

function windowMenu() {
  return {
    label: 'Window',
    role: 'windowMenu',
    submenu: [
      { role: 'minimize' },
      ...(isMac ? [{ role: 'zoom' }] : [{ role: 'close' }]),
      { type: 'separator' },
      { label: 'Layout Creator', accelerator: 'CmdOrCtrl+L', click: openLayoutCreator },
      { label: 'Settings', click: () => openSettings() },
      ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [])
    ]
  };
}

function helpMenu() {
  return {
    label: 'Help',
    role: 'help',
    submenu: [
      { label: 'Keyboard Shortcuts', click: () => openSettings('shortcuts') },
      { label: 'API Documentation', click: () => require('./ipcHandlers').openApiDocs() },
      { type: 'separator' },
      { label: 'Website', click: () => shell.openExternal(HOMEPAGE) },
      { label: 'Report an Issue...', click: () => shell.openExternal(`${HOMEPAGE}/issues`) },
      {
        label: 'View Logs...',
        click: () => {
          const log = require('electron-log');
          shell.showItemInFolder(log.transports.file.getFile().path);
        }
      },
      ...(!isMac ? [
        { type: 'separator' },
        { label: 'Check for Updates...', click: checkForUpdates },
        { label: 'About Rocket Timer', click: showAbout }
      ] : [])
    ]
  };
}

function buildMenu() {
  if (!_mainWindow) return;
  const template = [
    ...(isMac ? [appMenu()] : []),
    fileMenu(),
    editMenu(),
    timerMenu(),
    viewMenu(),
    windowMenu(),
    helpMenu()
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  global.appMenu = menu;
  updateDisplayMenuItems();
}

function updateDisplayMenuItems() {
  if (!global.appMenu) return;

  const displayState = getDisplayWindowState();
  const toggleItem = global.appMenu.getMenuItemById('toggle-display');
  if (toggleItem) {
    toggleItem.label = displayState.visible ? 'Hide External Display' : 'Show External Display';
  }

  // Check the display the timer is fullscreen on, if any
  const currentDisplay = getCurrentDisplayIndex();
  const isFullscreen = displayState.visible && displayState.fullscreen;
  screen.getAllDisplays().forEach((display, index) => {
    const item = global.appMenu.getMenuItemById(`display-${index}`);
    if (item) item.checked = isFullscreen && index === currentDisplay;
  });
}

// ============================================================================
// PROJECTS
// ============================================================================

function readManifest() {
  const projectManager = global.projectManager;
  if (!projectManager || !projectManager.initialized) return null;
  try {
    return JSON.parse(require('fs').readFileSync(projectManager.storage.manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

function isCurrentProjectDefault() {
  const manifest = readManifest();
  const currentId = global.projectManager?.currentProject?.id;
  return Boolean(manifest && currentId && manifest.defaultProjectId === currentId);
}

/**
 * "Open Project" items from the manifest (read synchronously while building)
 */
function getOpenProjectSubmenu() {
  if (!global.projectManager || !global.projectManager.initialized) {
    return [{ label: 'Loading...', enabled: false }];
  }
  const manifest = readManifest();
  if (!manifest || manifest.projects.length === 0) {
    return [{ label: 'No projects available', enabled: false }];
  }

  const currentProjectId = global.projectManager.currentProject?.id;
  return manifest.projects.map(project => ({
    label: project.name,
    type: 'radio',
    checked: project.id === currentProjectId,
    click: async () => {
      try {
        if (project.id === global.projectManager.currentProject?.id) return;
        if (await global.projectManager.promptSaveIfNeeded(_mainWindow)) {
          await global.projectManager.loadProject(project.id);
          console.log(`📂 Loaded project: ${project.name}`);
        }
      } catch (error) {
        dialog.showErrorBox('Error', `Failed to load project: ${error.message}`);
      }
      // Also restores the radio selection if the switch was cancelled
      updateProjectsMenu();
    }
  }));
}

async function newProject() {
  const { showPrompt } = require('./utils/promptDialog');
  const projectManager = global.projectManager;
  if (!projectManager) return;

  const manifest = await projectManager.storage.readManifest();
  if (manifest.projects.length >= 10) {
    dialog.showMessageBox(_mainWindow, {
      type: 'warning',
      title: 'Project Limit Reached',
      message: 'Maximum of 10 projects allowed',
      detail: 'Delete unused projects to create new ones.'
    });
    return;
  }

  if (!await projectManager.promptSaveIfNeeded(_mainWindow)) return;

  const name = await showPrompt(_mainWindow, {
    title: 'New Project',
    label: 'Project name:',
    placeholder: 'My Project',
    confirmText: 'Create'
  });
  if (!name) return;

  try {
    const project = await projectManager.createProject(name);
    await projectManager.loadProject(project.id);
    updateProjectsMenu();
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to create project: ${error.message}`);
  }
}

async function saveProject() {
  const projectManager = global.projectManager;
  if (!projectManager) return;
  try {
    await projectManager.saveProject();
    sendAction('notify', `Project "${projectManager.currentProject.name}" saved`, 'success');
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to save project: ${error.message}`);
  }
}

async function renameProject() {
  const { showPrompt } = require('./utils/promptDialog');
  const projectManager = global.projectManager;
  if (!projectManager || !projectManager.currentProject) return;

  const newName = await showPrompt(_mainWindow, {
    title: 'Rename Project',
    label: 'New name:',
    value: projectManager.currentProject.name,
    confirmText: 'Rename'
  });
  if (!newName || newName === projectManager.currentProject.name) return;

  try {
    await projectManager.renameProject(projectManager.currentProject.id, newName);
    updateProjectsMenu();
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to rename project: ${error.message}`);
  }
}

async function duplicateProject() {
  const { showPrompt } = require('./utils/promptDialog');
  const projectManager = global.projectManager;
  if (!projectManager || !projectManager.currentProject) return;

  const name = await showPrompt(_mainWindow, {
    title: 'Duplicate Project',
    label: 'Name for the copy:',
    value: `${projectManager.currentProject.name} (Copy)`,
    confirmText: 'Duplicate'
  });
  if (!name) return;

  try {
    await projectManager.duplicateProject(projectManager.currentProject.id, name);
    updateProjectsMenu();
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to duplicate project: ${error.message}`);
  }
}

async function deleteProject() {
  const projectManager = global.projectManager;
  if (!projectManager || !projectManager.currentProject) return;

  const result = await dialog.showMessageBox(_mainWindow, {
    type: 'warning',
    title: 'Delete Project',
    message: `Delete "${projectManager.currentProject.name}"?`,
    detail: 'This action cannot be undone. A backup will be created.',
    buttons: ['Cancel', 'Delete'],
    defaultId: 0,
    cancelId: 0
  });
  if (result.response !== 1) return;

  try {
    await projectManager.deleteProject(projectManager.currentProject.id);

    // Load first available project or create default
    const manifest = await projectManager.storage.readManifest();
    if (manifest.projects.length > 0) {
      await projectManager.loadProject(manifest.projects[0].id);
    } else {
      const defaultProject = await projectManager.createProject('Default', true);
      await projectManager.loadProject(defaultProject.id);
    }
    updateProjectsMenu();
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to delete project: ${error.message}`);
  }
}

/**
 * Open the current project at startup
 */
async function setStartupProject() {
  const projectManager = global.projectManager;
  if (!projectManager || !projectManager.currentProject) return;
  try {
    // Already the startup project: nothing to change (one project always opens)
    if (!isCurrentProjectDefault()) {
      await projectManager.setDefaultProject(projectManager.currentProject.id);
      sendAction('notify', `"${projectManager.currentProject.name}" will open at startup`, 'success');
    }
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to set the startup project: ${error.message}`);
  }
  updateProjectsMenu();
}

async function importProject() {
  const projectManager = global.projectManager;
  if (!projectManager) return;

  const result = await dialog.showOpenDialog(_mainWindow, {
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
    updateProjectsMenu();
    sendAction('notify', `"${project.name}" imported`, 'success');
  } catch (error) {
    dialog.showErrorBox('Import Failed', error.message);
  }
}

async function exportProject() {
  const projectManager = global.projectManager;
  if (!projectManager || !projectManager.currentProject) return;

  const safeName = projectManager.currentProject.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const result = await dialog.showSaveDialog(_mainWindow, {
    title: 'Export Project',
    defaultPath: `${safeName}.rctimer`,
    filters: [{ name: 'Rocket Timer Project', extensions: ['rctimer'] }]
  });
  if (result.canceled || !result.filePath) return;

  try {
    await projectManager.exportProject(projectManager.currentProject.id, result.filePath);
    sendAction('notify', `"${projectManager.currentProject.name}" exported`, 'success');
  } catch (error) {
    dialog.showErrorBox('Export Failed', error.message);
  }
}

/**
 * Rebuild the menu (projects, settings or display changes).
 * Electron native menus on macOS cannot be patched in-place.
 */
function updateProjectsMenu() {
  buildMenu();
}

module.exports = { setupMenu, setMenuState, updateDisplayMenuItems, updateProjectsMenu };
