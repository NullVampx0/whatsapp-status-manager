const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { initWhatsApp, setCurrentStatus, getConnectionStatus, updateStatusMessage } = require('./bot/whatsapp')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 800,
    minHeight: 580,
    frame: false,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  createWindow()
  initWhatsApp(mainWindow)
})

app.on('window-all-closed', () => {
  app.quit()
})

// IPC Handlers
ipcMain.handle('set-status', (_, data) => {
  setCurrentStatus(data.statusId, data.message, data.enabled)
})

ipcMain.handle('get-connection-status', () => {
  return getConnectionStatus()
})

ipcMain.handle('update-message', (_, data) => {
  updateStatusMessage(data.statusId, data.message)
})

ipcMain.on('window-minimize', () => mainWindow.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.on('window-close', () => mainWindow.close())
