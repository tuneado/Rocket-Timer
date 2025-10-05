const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => {
        // Pass only the data, not the event object
        func(args[0]);
      });
    },
  },
});
