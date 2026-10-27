/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Main window controller: canvas renderer, timer mirror, settings, IPC and
 * keyboard shortcuts. The Preact components (components/) render from appState
 * and call the actions registered here (mainActions.js).
 */
import statusBar from './statusBar.js';
import { formatTime } from './utils/timeFormatter.js';
import { KeyboardManager, VisualFeedback } from './utils/keyboardManager.js';
import appState from './modules/appState.js';
import UnifiedCanvasRenderer from './UnifiedCanvasRenderer.js';
import actions, { registerActions } from './mainActions.js';
import * as ClockManager from './modules/clockManager.js';
import * as MessageManager from './modules/messageManager.js';
import * as PresetManager from './modules/presetManager.js';
import * as SettingsManager from './modules/settingsManager.js';
import * as DisplayManager from './modules/displayManager.js';
import * as TimerControls from './modules/timerControls.js';
import * as VideoManager from './modules/videoManager.js';
import { initializeIPCHandlers } from './modules/ipcHandlers.js';

const { ipcRenderer } = window.electron;

// The countdown runs in the main process (src/main/timerEngine.js). These mirror its
// latest state ('timer:state'); change the time only through timerCommand().
let remainingTime = 0; // ms
let totalTime = 0; // ms
let lastSetTime = 0; // ms
let running = false;
let stoppedAtZero = false;
let engineState = null;

let canvasRenderer = null;
const keyboard = new KeyboardManager();

// Read-only timer state for the modules (seconds unless noted)
const timerState = {
  get remainingTime() { return Math.floor(remainingTime / 1000); },
  get totalTime() { return Math.floor(totalTime / 1000); },
  get remainingTimeMs() { return remainingTime; },
  get totalTimeMs() { return totalTime; },
  get running() { return running; },
  get paused() { return engineState?.paused || false; },
  get stoppedAtZero() { return stoppedAtZero; },
  get lastSetTime() { return Math.floor(lastSetTime / 1000); },
  get elapsedMs() { return engineState?.elapsedMs || 0; },
  // False until the timer has run since the time was last set
  get started() { return engineState?.started || false; },
  get endAt() { return engineState?.endAt || null; },
  get warningLevel() { return engineState?.warningLevel || 'normal'; },
  get preset() { return engineState?.preset ?? null; }
};

function timerCommand(command) {
  return ipcRenderer.invoke('timer:command', command)
    .catch((error) => console.error('Timer command failed:', command, error));
}

/**
 * Apply a timer engine state: canvas, display window and appState
 */
function applyTimerState(state) {
  engineState = state;
  remainingTime = state.remainingMs;
  totalTime = state.totalMs;
  lastSetTime = state.lastSetMs;
  running = state.running;
  stoppedAtZero = state.stoppedAtZero;

  updateDisplay();
  sendStateUpdate();
}

ipcRenderer.on('timer:state', (state) => applyTimerState(state));
ipcRenderer.on('timer:complete', () => TimerControls.handleTimerComplete({ flashAtZero: flash }));

function updateDisplay() {
  return DisplayManager.updateDisplay(timerState, { canvasRenderer, ipcRenderer });
}

function sendStateUpdate() {
  DisplayManager.sendStateUpdate(timerState);
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Flash the screen; the flash button shows it while running
 */
function flash() {
  appState.set('ui.flashing', true);
  TimerControls.flashAtZero(canvasRenderer, ipcRenderer, {
    onComplete: () => appState.set('ui.flashing', false)
  });
}

async function setMuted(muted) {
  try {
    await window.electron.settings.save('soundNotification', !muted);
    appState.set('settings.soundEnabled', !muted);
    console.log('🔊 Sound notifications:', muted ? 'disabled' : 'enabled');
  } catch (error) {
    console.error('Error updating sound settings:', error);
  }
}

/**
 * Show or hide the cover image (chosen in Settings > Appearance)
 */
async function setCoverImage(enabled) {
  try {
    const settings = await window.electron.settings.getAll();
    if (!settings.coverImage || !settings.coverImage.path) {
      statusBar.warning('Please select a cover image in Settings > Appearance first.', 5000);
      return;
    }

    await window.electron.settings.save('coverImage', { ...settings.coverImage, enabled });
    if (enabled) {
      await canvasRenderer.enableFeatureImage(settings.coverImage.path);
    } else {
      canvasRenderer.disableFeatureImage();
    }
    ipcRenderer.send('toggle-cover-image', enabled);

    appState.update({
      'coverImage.enabled': enabled,
      'coverImage.path': settings.coverImage.path,
      'coverImage.opacity': settings.coverImage.opacity || 1.0
    });
  } catch (error) {
    console.error('Error toggling cover image:', error);
  }
}

async function changeLayout(layoutId) {
  const layout = DisplayManager.changeLayout(layoutId, { canvasRenderer, LayoutRegistry, ipcRenderer });
  if (layout) {
    console.log('Layout changed to:', layout.name);
    await VideoManager.handleVideoInputForLayout(layout, { canvasRenderer, ipcRenderer });
  }
}

const messageDeps = () => ({ canvasRenderer, ipcRenderer, statusBar });

registerActions({
  timerCommand,
  toggle: () => timerCommand({ action: 'toggle' }),
  reset: () => timerCommand({ action: 'reset' }),
  // Add (or, negative, subtract) minutes; ignored once stopped at zero
  adjust: (minutes) => timerCommand({ action: 'adjust', seconds: minutes * 60 }),
  setTime: (seconds) => timerCommand({ action: 'set-time', seconds }),
  loadPreset: (index) => timerCommand({ action: 'load-preset', index }),
  savePreset: (index) => PresetManager.savePreset(index, timerState.lastSetTime, statusBar),
  resetPresets: () => PresetManager.resetPresets(),

  flash,
  setMuted,
  toggleMute: () => setMuted(appState.get('settings.soundEnabled')),
  setCoverImage,
  toggleCoverImage: () => setCoverImage(!appState.get('coverImage.enabled')),

  setMessageDraft: (text) => MessageManager.setDraft(text),
  showMessage: (text) => MessageManager.showMessage(text, messageDeps()),
  hideMessage: () => MessageManager.hideMessage(messageDeps()),
  toggleMessage: () => (appState.get('message.visible')
    ? MessageManager.hideMessage(messageDeps())
    : MessageManager.showMessage(undefined, messageDeps())),
  clearMessage: () => MessageManager.clearMessage(messageDeps()),

  changeLayout,
  updateDisplay,
  formatTime,
  applyCanvasColors: (colors) => SettingsManager.applyCanvasColors(colors),
  setTheme
});

// ============================================================================
// SETTINGS
// ============================================================================

window.electron.settings.onUpdate((settings) => {
  if (typeof settings.matchTimerColor !== 'undefined') {
    localStorage.setItem('matchTimerColor', settings.matchTimerColor.toString());
  }

  if (settings.colors) {
    SettingsManager.applyCanvasColors(settings.colors);
    canvasRenderer?.updateStyleCache();
  }

  if (canvasRenderer) {
    canvasRenderer.applyTimerThresholds(settings);
    if (settings.showWatermark !== undefined) {
      canvasRenderer.watermark.enabled = settings.showWatermark;
    }
    updateDisplay();
  }

  if (settings.defaultTheme || settings.appearanceTheme) {
    const theme = settings.appearanceTheme || settings.defaultTheme;
    const resolved = theme === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('theme', resolved);
    canvasRenderer?.updateTheme(resolved);
  }

  if (settings.soundNotification !== undefined) {
    appState.set('settings.soundEnabled', Boolean(settings.soundNotification));
  }

  if (settings.clockFormat !== undefined) {
    localStorage.setItem('clockFormat', settings.clockFormat);
  }

  if (settings.keyboardShortcuts) {
    applyShortcutSettings(settings.keyboardShortcuts);
  }

  // e.g. after a project switch
  PresetManager.applyPresets(settings.presets);
});

function setTheme(dark) {
  const theme = dark ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  appState.set('theme', theme);

  canvasRenderer?.updateTheme(theme);
  ipcRenderer.send('update-theme', theme);
  ipcRenderer.send('update-menu-states', theme, localStorage.getItem('clock') === 'on');
}

// ============================================================================
// LAYOUTS
// ============================================================================

/**
 * Refresh the layouts offered in the selector (hidden built-ins left out).
 * Falls back to the default layout if the current one no longer exists.
 */
function refreshLayouts() {
  let hidden = [];
  try {
    hidden = JSON.parse(localStorage.getItem('hiddenBuiltinLayouts') || '[]');
  } catch {
    hidden = [];
  }

  const layouts = LayoutRegistry.getAllLayouts()
    .filter(layout => !(layout.type === 'builtin' && hidden.includes(layout.id)))
    .map(({ id, name }) => ({ id, name }));
  appState.set('ui.layouts', layouts);

  if (!LayoutRegistry.hasLayout(appState.get('layout.current'))) {
    changeLayout(LayoutRegistry.getDefaultLayout());
  }
}

ipcRenderer.on('layout-list-updated', refreshLayouts);

// ============================================================================
// STARTUP
// ============================================================================

async function loadFonts() {
  try {
    // Load the monospace fonts explicitly before the canvas measures text
    const fonts = ['"JetBrains Mono"', '"SF Mono"', 'Consolas', 'Monaco'];
    await Promise.all(fonts.flatMap(font => ['400', 'bold', '600'].map(weight =>
      document.fonts.load(`${weight} 16px ${font}`)
    ))).catch(() => {
      console.log('Some fonts failed to load, using system fallbacks');
    });
    await document.fonts.ready;
  } catch (error) {
    console.warn('Font loading encountered an issue, continuing:', error);
  }
}

/**
 * Cover and background images saved in settings
 */
async function restoreImages(settings) {
  const cover = settings.coverImage || {};
  appState.update({
    'coverImage.enabled': Boolean(cover.enabled),
    'coverImage.path': cover.path || null,
    'coverImage.opacity': cover.opacity || 1.0
  });

  try {
    if (cover.enabled && cover.path) {
      await canvasRenderer.enableCoverImage(cover.path);
    }
    const background = settings.backgroundImage;
    if (background && background.enabled && background.path) {
      await canvasRenderer.enableBackgroundImage(background.path, background.opacity || 1.0);
    }
    updateDisplay();
  } catch (error) {
    console.error('Error loading images:', error);
  }
}

/**
 * Report renderer health in the status footer and to the settings window
 */
function monitorPerformance() {
  setInterval(() => {
    const stats = canvasRenderer.getPerformanceStats();
    if (!stats) return;

    // Skipped frames while idle (nothing to render) are not a problem
    let status = 'good';
    if (!stats.isIdle) {
      const renderRatio = parseFloat(stats.averageRenderTime) / (1000 / stats.targetFPS);
      const dropRatio = stats.droppedFrames / Math.max(stats.frameCount, 1);
      if (renderRatio > 0.9 || dropRatio > 0.1) status = 'critical';
      else if (renderRatio > 0.6 || dropRatio > 0.05) status = 'warning';
    }

    statusBar.setPerformanceStatus(status, stats);
    ipcRenderer.send('performance-stats-update', stats);
  }, 1000);
}

/**
 * Send appState (minus the UI-only part) to the API server
 */
function sendCompanionState() {
  // eslint-disable-next-line no-unused-vars
  const { ui, ...state } = appState.getStateRef();
  ipcRenderer.send('companion-state-update', state);
}

document.addEventListener('DOMContentLoaded', async () => {
  statusBar.init();
  await loadFonts();

  await SettingsManager.loadAndApplySettings();
  const settings = await window.electron.settings.getAll().catch(() => ({}));

  // Canvas renderer at the configured resolution, with the saved layout
  const [width, height] = (settings.canvasResolution || '1920x1080').split('x').map(n => parseInt(n, 10));
  canvasRenderer = new UnifiedCanvasRenderer(width, height);
  window.canvasRenderer = canvasRenderer;

  const previewCanvas = document.getElementById('timerCanvas');
  if (previewCanvas) {
    canvasRenderer.addOutput('preview', previewCanvas, { scale: 1, enabled: true, aspectRatio: 16 / 9 });
  }

  let layoutId = localStorage.getItem('canvasLayout');
  if (!LayoutRegistry.hasLayout(layoutId)) layoutId = LayoutRegistry.getDefaultLayout();
  const layout = LayoutRegistry.getLayout(layoutId);
  console.log('🎨 Loading layout:', layout?.name);
  canvasRenderer.setLayout(layout);
  appState.set('layout.current', layoutId);

  canvasRenderer.applyTimerThresholds(settings);
  if (settings.showWatermark === false) {
    canvasRenderer.watermark.enabled = false;
  }
  canvasRenderer.start();

  setTheme(localStorage.getItem('theme') !== 'light');

  // Current timer state from the engine
  applyTimerState(await ipcRenderer.invoke('timer:get-state'));

  // Clock: always in the info bar; on the canvas if the layout or the user wants it
  ClockManager.startTicker({ canvasRenderer, ipcRenderer });
  if ((layout.clock && layout.clock.enabled) || localStorage.getItem('clock') === 'on') {
    ClockManager.startClock();
  } else {
    ClockManager.stopClock();
  }

  PresetManager.applyPresets(settings.presets?.length ? settings.presets : PresetManager.DEFAULT_PRESETS);
  refreshLayouts();

  appState.update({
    'settings.soundEnabled': Boolean(settings.soundNotification),
    'theme': localStorage.getItem('theme') === 'light' ? 'light' : 'dark',
    'clock.visible': localStorage.getItem('clock') === 'on'
  });

  await VideoManager.handleVideoInputForLayout(layout, { canvasRenderer, ipcRenderer });
  restoreImages(settings);

  initializeIPCHandlers({
    ipcRenderer,
    statusBar,
    timerState,
    getCanvasRenderer: () => canvasRenderer,
    actions
  });
  initializeKeyboardShortcuts(settings);
  ipcRenderer.send('request-server-status');

  // API server: throttled to 10 updates per second
  let stateUpdateThrottle = null;
  appState.subscribe('*', (newValue, oldValue, path) => {
    if (stateUpdateThrottle || path.startsWith('ui.')) return;
    stateUpdateThrottle = setTimeout(() => {
      sendCompanionState();
      stateUpdateThrottle = null;
    }, 100);
  });
  sendCompanionState();

  monitorPerformance();
  ipcRenderer.send('main-window-ready');
});

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Run an action with feedback on its button, unless the button is disabled
 */
function press(buttonId, action, feedback = VisualFeedback.pulse) {
  const button = document.getElementById(buttonId);
  if (button?.disabled) return;
  if (button) feedback(button);
  action();
}

function initializeKeyboardShortcuts(settings) {
  keyboard.register('space', () => press('startStop', actions.toggle), 'Start/Stop timer');
  keyboard.register('r', () => press('reset', actions.reset), 'Reset timer');
  keyboard.register('arrowup', () => press('addMinute', () => actions.adjust(1)), 'Add one minute');
  keyboard.register('arrowdown', () => press('subtractMinute', () => actions.adjust(-1)), 'Subtract one minute');
  keyboard.register('shift+arrowup', () => press('addFive', () => actions.adjust(5), VisualFeedback.flashSuccess), 'Add 5 minutes');
  keyboard.register('shift+arrowdown', () => press('subtractFive', () => actions.adjust(-5), VisualFeedback.flashSuccess), 'Subtract 5 minutes');
  keyboard.register('ctrl+arrowup', () => press('addTen', () => actions.adjust(10), VisualFeedback.flashSuccess), 'Add 10 minutes');
  keyboard.register('ctrl+arrowdown', () => press('subtractTen', () => actions.adjust(-10), VisualFeedback.flashSuccess), 'Subtract 10 minutes');
  keyboard.register('f', () => press('flashButton', actions.flash, VisualFeedback.flashSuccess), 'Flash screen');
  keyboard.register('m', () => press('muteSounds', actions.toggleMute), 'Toggle sound mute');
  keyboard.register('i', () => press('coverImage', actions.toggleCoverImage), 'Toggle cover image');

  // Number keys 1-8 for quick presets (ignored while running, like the buttons)
  for (let i = 1; i <= 8; i++) {
    keyboard.register(String(i), () => {
      if (running) return;
      const button = document.querySelectorAll('.preset')[i - 1];
      if (button) VisualFeedback.flashSuccess(button);
      actions.loadPreset(i - 1);
    }, `Activate preset ${i}`);
  }

  keyboard.init();
  applyShortcutSettings(settings.keyboardShortcuts);
}

/**
 * Enable/disable shortcuts per settings; the button tooltips follow 'ui.shortcuts'
 */
function applyShortcutSettings(shortcutSettings) {
  keyboard.applySettings(shortcutSettings);
  appState.set('ui.shortcuts', Object.fromEntries(
    keyboard.getShortcuts().map(({ key, enabled }) => [key, enabled])
  ));
}

// ============================================================================
// OTHER MAIN PROCESS EVENTS
// ============================================================================

ipcRenderer.on('update-status', (data) => {
  if (!data) return;
  switch (data.status) {
    case 'downloading':
      statusBar.info(data.message || 'Downloading update...', 0);
      break;
    case 'ready':
      statusBar.success(data.message || 'Update ready — restart to apply', 0);
      break;
    case 'installing':
      statusBar.info(data.message || 'Installing update...', 0);
      break;
    case 'error':
      statusBar.error(data.message || 'Update failed', 8000);
      break;
  }
});

// Background image changed in the settings window
ipcRenderer.on('sync-background-image', async (data) => {
  if (!canvasRenderer) return;
  try {
    if (data.enabled && data.path) {
      await canvasRenderer.enableBackgroundImage(data.path, data.opacity || 1.0);
    } else if (!data.enabled) {
      canvasRenderer.disableBackgroundImage();
    }
    updateDisplay();
  } catch (error) {
    console.error('Error syncing background image:', error);
  }
});
