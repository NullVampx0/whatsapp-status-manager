const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('whatsappAPI', {
  onQRCode: (callback) => ipcRenderer.on('qr-code', (_, data) => callback(data)),
  onConnected: (callback) => ipcRenderer.on('connected', (_, data) => callback(data)),
  onDisconnected: (callback) => ipcRenderer.on('disconnected', () => callback()),
  onMessageSent: (callback) => ipcRenderer.on('message-sent', (_, data) => callback(data)),
  setStatus: (data) => ipcRenderer.invoke('set-status', data),
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),
  getStatuses: () => ipcRenderer.invoke('get-statuses'),
  updateMessage: (data) => ipcRenderer.invoke('update-message', data),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
})
