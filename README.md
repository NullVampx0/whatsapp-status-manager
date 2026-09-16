# WhatsApp Status Manager

A desktop app for Windows that auto-replies to WhatsApp messages based on your current status.

## Setup

1. Install Node.js from https://nodejs.org (v18 or higher recommended)

2. Navigate to the project folder and install dependencies:
   ```
   cd whatsapp-status-manager
   npm install
   ```

3. Start the app:
   ```
   npm start
   ```

4. Scan the QR code with your WhatsApp mobile app:
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices → Link a Device
   - Scan the QR code shown in the app

## Usage

- Select a status (Sleeping, Busy, Driving, etc.)
- Enable the "Auto Reply" toggle
- Anyone who messages you on WhatsApp will receive an automatic reply with your status message
- Click a status again to deactivate it
- Edit auto-reply messages by clicking a status and modifying the text in the editor

## Notes

- Your phone needs to stay connected to the internet
- Session is saved locally in `./wa-session` — you only need to scan QR once
- Auto-reply does NOT send to group chats
- Does NOT reply to your own messages

## Troubleshooting

- **QR code not appearing:** Wait a few seconds; Puppeteer (the headless browser) needs time to start
- **Session expired:** Delete the `wa-session` folder and restart — you'll need to scan QR again
- **App won't start:** Make sure Node.js v18+ is installed and `npm install` completed without errors
