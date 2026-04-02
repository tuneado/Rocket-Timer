/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
const { contextBridge, ipcRenderer, desktopCapturer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => {
        // Pass only the data, not the event object
        func(args[0]);
      });
    },
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  },
  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard-read-text'),
  },
  // Stream handling for canvas capture
  desktopCapturer: {
    getSources: (opts) => desktopCapturer.getSources(opts),
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
    onUpdate: (callback) => {
      ipcRenderer.on('settings-updated', (event, settings) => callback(settings));
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
