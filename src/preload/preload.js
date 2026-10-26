/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
const { contextBridge, ipcRenderer } = require('electron');

// Channels a page may use through the generic ipcRenderer bridge. Kept to what the
// main process actually handles (ipcMain.on / ipcMain.handle) or sends, so a page
// can't reach anything else. tests/unit/preloadChannels.test.js checks these lists
// against src/main — add a channel here when adding one there.
const SEND_CHANNELS = new Set([
  'apply-settings',
  'clear-message',
  'clock-state-response',
  'clock-update',
  'companion-state-update',
  'current-theme-response',
  'display-message',
  'flash-at-zero',
  'layout-changed',
  'layout-creator:saved',
  'layout-list-updated',
  'main-window-ready',
  'menu-theme-toggle',
  'open-api-docs',
  'open-layout-creator',
  'performance-stats-update',
  'request-clock-state',
  'request-current-theme',
  'request-display-state',
  'request-display-sync',
  'request-server-status',
  'settings-colors-updated',
  'settings-presets-updated',
  'show-restart-notification',
  'sync-background-image-update',
  'sync-current-state',
  'timer-update',
  'toggle-clock-visibility',
  'toggle-cover-image',
  'toggle-display-window',
  'update-menu-states',
  'update-theme',
  'video-device-selected',
  'video-input-started',
  'video-input-stopped',
  'video-mirror-changed',
  'video-opacity-changed',
  'video-scaling-changed'
]);

const INVOKE_CHANNELS = new Set([
  'api-adjust-time',
  'api-pause-timer',
  'api-reset-timer',
  'api-resume-timer',
  'api-set-time',
  'api-start-timer',
  'api-stop-timer',
  'api-trigger-flash',
  'clipboard-read-text',
  'create-project',
  'delete-project',
  'duplicate-project',
  'get-app-version',
  'get-current-layout',
  'get-current-project',
  'get-network-addresses',
  'get-projects',
  'get-resource-path',
  'get-setting',
  'get-settings',
  'load-project',
  'rename-project',
  'reset-settings',
  'save-project',
  'save-setting',
  'save-settings',
  'select-background-image',
  'select-cover-image',
  'timer:command',
  'timer:get-state'
]);

const RECEIVE_CHANNELS = new Set([
  'api-command',
  'api-timer-state-update',
  'apply-settings',
  'clear-message',
  'companion-server-status',
  'display-window-closed',
  'display-window-state-changed',
  'flash-at-zero',
  'layout-changed',
  'layout-list-updated',
  'menu-reset',
  'menu-start-stop',
  'menu-theme-change',
  'performance-stats-update',
  'request-clock-state',
  'request-current-state-for-display',
  'request-current-theme-for-display',
  'settings-presets-updated',
  'show-message',
  'sync-background-image',
  'sync-cover-image',
  'theme-updated',
  'timer:complete',
  'timer:state',
  'toggle-clock-display',
  'toggle-cover-image',
  'update-clock',
  'update-display',
  'update-status',
  'video-device-changed',
  'video-input-live',
  'video-input-start',
  'video-input-stop',
  'video-mirror-changed',
  'video-opacity-change',
  'video-scaling-changed'
]);

const blocked = (kind, channel) => {
  console.warn(`[preload] Blocked IPC ${kind} on unknown channel "${channel}"`);
};

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      if (!SEND_CHANNELS.has(channel)) return blocked('send', channel);
      ipcRenderer.send(channel, data);
    },
    // Returns a function that removes the listener
    on: (channel, func) => {
      if (!RECEIVE_CHANNELS.has(channel)) {
        blocked('listener', channel);
        return () => {};
      }
      // Pass only the data, not the event object
      const listener = (event, ...args) => func(args[0]);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    invoke: (channel, ...args) => {
      if (!INVOKE_CHANNELS.has(channel)) {
        blocked('invoke', channel);
        return Promise.reject(new Error(`IPC channel not allowed: ${channel}`));
      }
      return ipcRenderer.invoke(channel, ...args);
    },
  },
  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard-read-text'),
  },
  // App info
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  getResourcePath: (resourcePath) => ipcRenderer.invoke('get-resource-path', resourcePath),
  // Settings API
  settings: {
    getAll: () => ipcRenderer.invoke('get-settings'),
    get: (key) => ipcRenderer.invoke('get-setting', key),
    saveAll: (settings) => ipcRenderer.invoke('save-settings', settings),
    save: (key, value) => ipcRenderer.invoke('save-setting', key, value),
    reset: () => ipcRenderer.invoke('reset-settings'),
    // Returns a function that removes the listener
    onUpdate: (callback) => {
      const listener = (event, settings) => callback(settings);
      ipcRenderer.on('settings-updated', listener);
      return () => ipcRenderer.removeListener('settings-updated', listener);
    }
  },
  // Custom layouts (stored by the main process). Synchronous so LayoutRegistry stays synchronous.
  layouts: {
    getAll: () => ipcRenderer.sendSync('layouts:get-all'),
    save: (id, layoutData) => ipcRenderer.sendSync('layouts:save', id, layoutData),
    remove: (id) => ipcRenderer.sendSync('layouts:remove', id),
    clear: () => ipcRenderer.sendSync('layouts:clear'),
    importLegacy: (legacyLayouts) => ipcRenderer.sendSync('layouts:import-legacy', legacyLayouts),
    onChanged: (callback) => {
      ipcRenderer.on('layouts:changed', (event, layouts) => callback(layouts));
    }
  },
  // Projects API
  projects: {
    list: () => ipcRenderer.invoke('get-projects'),
    create: (name, setAsDefault = false) => ipcRenderer.invoke('create-project', name, setAsDefault),
    rename: (id, newName) => ipcRenderer.invoke('rename-project', id, newName),
    load: (id) => ipcRenderer.invoke('load-project', id),
    save: () => ipcRenderer.invoke('save-project'),
    delete: (id) => ipcRenderer.invoke('delete-project', id),
    duplicate: (id, newName = null) => ipcRenderer.invoke('duplicate-project', id, newName),
    getCurrent: () => ipcRenderer.invoke('get-current-project'),
    onSaveRequest: (callback) => {
      ipcRenderer.on('project-save-request', () => callback());
    },
  },
});
