// Default statuses config
const defaultStatuses = [
  { id: 'sleeping', icon: '😴', label: 'Sleeping', color: '#bc8cff', message: "Hey! I'm currently sleeping 😴 I'll get back to you when I wake up!" },
  { id: 'busy', icon: '⏳', label: 'Busy', color: '#d29922', message: "Hey! I'm busy right now ⏳ I'll reply as soon as I'm free!" },
  { id: 'driving', icon: '🚗', label: 'Driving', color: '#db6d28', message: "Hey! I'm driving right now 🚗 I'll text you back when I arrive!" },
  { id: 'meeting', icon: '💼', label: 'In a Meeting', color: '#58a6ff', message: "Hey! I'm in a meeting right now 💼 I'll get back to you shortly!" },
  { id: 'workout', icon: '🏋️', label: 'Working Out', color: '#39d353', message: "Hey! I'm working out right now 🏋️ I'll reply when I'm done!" },
  { id: 'dnd', icon: '🔕', label: 'Do Not Disturb', color: '#f85149', message: "Hey! I'm on Do Not Disturb mode 🔕 I'll get back to you later!" },
]

let statuses = JSON.parse(localStorage.getItem('statuses') || 'null') || defaultStatuses
let activeStatusId = null
let autoReplyEnabled = false
let editingStatusId = null

// Render status buttons
function renderStatusGrid() {
  const grid = document.getElementById('status-grid')
  grid.innerHTML = ''
  statuses.forEach(s => {
    const btn = document.createElement('button')
    btn.className = 'status-btn' + (activeStatusId === s.id ? ' active' : '')
    btn.dataset.id = s.id
    btn.innerHTML = `
      ${activeStatusId === s.id ? '<span class="active-badge">ACTIVE</span>' : ''}
      <span class="btn-icon">${s.icon}</span>
      <span class="btn-label">${s.label}</span>
      <span class="btn-preview">${s.message}</span>
    `
    btn.addEventListener('click', () => toggleStatus(s.id))
    grid.appendChild(btn)
  })
}

function toggleStatus(id) {
  if (activeStatusId === id) {
    activeStatusId = null
  } else {
    activeStatusId = id
  }
  updateBotStatus()
  renderStatusGrid()
  showMessageEditor(id)
}

function updateBotStatus() {
  const status = statuses.find(s => s.id === activeStatusId)
  window.whatsappAPI.setStatus({
    statusId: activeStatusId,
    message: status ? status.message : '',
    enabled: autoReplyEnabled && activeStatusId !== null,
  })
}

function showMessageEditor(id) {
  const status = statuses.find(s => s.id === id)
  if (!status) return
  editingStatusId = id
  const content = document.getElementById('message-editor-content')
  content.innerHTML = `
    <div class="editor-status-name">${status.icon} ${status.label}</div>
    <textarea class="message-textarea" id="msg-textarea">${status.message}</textarea>
    <button class="save-btn" id="save-msg-btn">Save Message</button>
    <div class="saved-hint" id="saved-hint">&#10003; Saved!</div>
  `
  document.getElementById('save-msg-btn').addEventListener('click', saveMessage)
}

function saveMessage() {
  const textarea = document.getElementById('msg-textarea')
  const idx = statuses.findIndex(s => s.id === editingStatusId)
  if (idx !== -1) {
    statuses[idx].message = textarea.value
    localStorage.setItem('statuses', JSON.stringify(statuses))
    window.whatsappAPI.updateMessage({ statusId: editingStatusId, message: textarea.value })
    const hint = document.getElementById('saved-hint')
    hint.style.display = 'block'
    setTimeout(() => { hint.style.display = 'none' }, 2000)
    renderStatusGrid()
    if (activeStatusId === editingStatusId) updateBotStatus()
  }
}

function addLog(message) {
  const log = document.getElementById('activity-log')
  const empty = log.querySelector('.log-empty')
  if (empty) empty.remove()
  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const entry = document.createElement('div')
  entry.className = 'log-entry'
  entry.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${message}</span>`
  log.prepend(entry)
  // Keep only 50 log entries
  while (log.children.length > 50) log.removeChild(log.lastChild)
}

// Auto reply toggle
document.getElementById('auto-reply-toggle').addEventListener('change', (e) => {
  autoReplyEnabled = e.target.checked
  updateBotStatus()
  addLog(autoReplyEnabled ? 'Auto-reply enabled' : 'Auto-reply disabled')
})

// Window controls
document.getElementById('btn-minimize').addEventListener('click', () => window.whatsappAPI.minimize())
document.getElementById('btn-maximize').addEventListener('click', () => window.whatsappAPI.maximize())
document.getElementById('btn-close').addEventListener('click', () => window.whatsappAPI.close())

// WhatsApp events
window.whatsappAPI.onQRCode((dataUrl) => {
  document.getElementById('qr-placeholder').classList.add('hidden')
  const img = document.getElementById('qr-image')
  img.src = dataUrl
  img.classList.remove('hidden')
  document.getElementById('status-dot').className = 'dot connecting'
  document.getElementById('status-text').textContent = 'Scan QR Code'
  addLog('QR code ready — scan with WhatsApp')
})

window.whatsappAPI.onConnected((data) => {
  document.getElementById('qr-container').classList.add('hidden')
  document.getElementById('user-info').classList.remove('hidden')
  document.getElementById('user-name').textContent = data.name || 'Unknown'
  document.getElementById('user-number').textContent = data.number || ''
  document.getElementById('status-dot').className = 'dot connected'
  document.getElementById('status-text').textContent = 'Connected'
  addLog(`Connected as ${data.name}`)
})

window.whatsappAPI.onDisconnected(() => {
  document.getElementById('qr-container').classList.remove('hidden')
  document.getElementById('user-info').classList.add('hidden')
  document.getElementById('qr-placeholder').classList.remove('hidden')
  document.getElementById('qr-image').classList.add('hidden')
  document.getElementById('status-dot').className = 'dot disconnected'
  document.getElementById('status-text').textContent = 'Disconnected'
  addLog('Disconnected from WhatsApp')
})

window.whatsappAPI.onMessageSent((data) => {
  addLog(`Auto-replied to ${data.to}: "${data.message.substring(0, 40)}${data.message.length > 40 ? '...' : ''}"`)
})

// Init
renderStatusGrid()
