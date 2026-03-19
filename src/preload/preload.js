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
});
