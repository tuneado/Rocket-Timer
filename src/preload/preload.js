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
});
