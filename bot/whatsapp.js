const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode')
const path = require('path')
const { app } = require('electron')

// Store session in user data dir so it persists after install/updates
const SESSION_PATH = path.join(app.getPath('userData'), 'wa-session')

let client = null
let mainWindow = null
let currentStatus = { statusId: null, message: '', enabled: false }
let connectionInfo = { connected: false, name: '', number: '' }
let messages = {}

// Cooldown map: track last reply time per contact to avoid spamming
const replyCooldown = new Map()
const COOLDOWN_MS = 60 * 1000 // 1 minute per contact

function initWhatsApp(win) {
  mainWindow = win

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    },
  })

  client.on('qr', async (qr) => {
    try {
      const dataUrl = await qrcode.toDataURL(qr, { width: 300, margin: 1 })
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('qr-code', dataUrl)
      }
    } catch (err) {
      console.error('QR generation error:', err)
    }
  })

  client.on('ready', () => {
    const info = client.info
    connectionInfo = {
      connected: true,
      name: info.pushname || 'Unknown',
      number: info.wid.user || '',
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('connected', {
        name: connectionInfo.name,
        number: connectionInfo.number,
      })
    }
    console.log('WhatsApp client ready:', connectionInfo.name)
  })

  client.on('disconnected', (reason) => {
    console.log('WhatsApp disconnected:', reason)
    connectionInfo = { connected: false, name: '', number: '' }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('disconnected')
    }
  })

  const handleIncoming = async (msg) => {
    console.log('[MSG] from:', msg.from, '| fromMe:', msg.fromMe, '| enabled:', currentStatus.enabled, '| statusId:', currentStatus.statusId)

    // Only reply to incoming messages (not from self)
    if (msg.fromMe) return
    if (!currentStatus.enabled || !currentStatus.statusId) return

    // Avoid replying to group messages — group IDs end with @g.us
    if (msg.from.endsWith('@g.us')) return

    // Cooldown check — don't spam same person
    const now = Date.now()
    const lastReply = replyCooldown.get(msg.from) || 0
    if (now - lastReply < COOLDOWN_MS) {
      console.log('[MSG] Skipping reply to', msg.from, '— cooldown active')
      return
    }
    replyCooldown.set(msg.from, now)

    console.log('[MSG] Sending auto-reply to', msg.from, ':', currentStatus.message)

    try {
      await client.sendMessage(msg.from, currentStatus.message)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('message-sent', {
          to: msg.from,
          message: currentStatus.message,
        })
      }
    } catch (err) {
      console.error('Error sending auto-reply:', err)
    }
  }

  client.on('message', handleIncoming)

  client.initialize()
}

function setCurrentStatus(statusId, message, enabled) {
  currentStatus = { statusId, message, enabled }
  if (statusId && message) {
    messages[statusId] = message
  }
  console.log('Status updated:', currentStatus)
}

function updateStatusMessage(statusId, message) {
  messages[statusId] = message
  if (currentStatus.statusId === statusId) {
    currentStatus.message = message
  }
}

function getConnectionStatus() {
  return connectionInfo
}

module.exports = { initWhatsApp, setCurrentStatus, getConnectionStatus, updateStatusMessage }
