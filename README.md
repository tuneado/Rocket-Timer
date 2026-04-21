# 🚀 Rocket Timer

A professional broadcast-grade countdown timer built with Electron, featuring canvas-based rendering, multi-protocol API control, and extensive customization.

Rocket Timer was made by Andre Raimundo with love, shaped by real-world experience in the AV and event industry. It was built to fill the gaps and missing features that are often hard to find in other timer apps. If you have an idea, spot something missing, or want a feature to be implemented, let me know.

**Version**: 1.1.0 | **License**: GPL-3.0

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [API Documentation](#api-documentation)
- [Settings](#settings)
- [Architecture](#architecture)
- [Development](#development)
- [Windows Debug Workflow](#windows-debug-workflow)

---

## Overview

**Countdown Timer** is designed for professional live production environments — churches, conferences, live streams, theater shows, and broadcast studios. It provides:

- A full-screen canvas-rendered countdown display for external monitors/projectors
- A feature-rich control panel with Preact UI and keyboard shortcuts
- Remote control via REST API, WebSocket, and OSC protocols
- Integration with Bitfocus Companion and other broadcast control systems
- High-resolution millisecond-precision timer engine with zero-crossing completion detection
- Custom layout system with visual editor
- Video input support (webcam, HDMI capture)
- Multi-output rendering (preview + external display)

---

## Features

### Core Timer Engine
- **High-resolution millisecond precision** with 100ms drift compensation
- **Zero-crossing detection** — automatically triggers completion events when timer passes through zero
- **Overtime mode** — count up beyond zero or auto-stop at zero
- **Auto-reset** — automatically reset after completion
- **8 saveable quick presets** — customize via Ctrl+Click or long-press (800ms)
- **Elapsed time tracking** — independent of timer adjustments

### Canvas Rendering
- **1920×1080 canvas** (configurable resolution)
- **Unified render loop** — single master canvas feeds both preview and external display
- **Smooth animations** — interpolated progress bar, spring effects, transitions
- **Real-time elements**:
  - Countdown digits (configurable size/position)
  - Clock (12/24 hour formats)
  - Progress bar with warning/critical thresholds
  - Elapsed time and end time
  - Message overlay
  - Video frame (webcam/HDMI)
  - Cover and background images
  - Separator line

### Layout System
- **Built-in layouts**: Classic, Minimal, and more
- **Custom layouts**: JSON-based positioning for all canvas elements
- **Layout Creator**: Visual tool to create and edit custom layouts
- **Import/Export**: Share layouts as JSON files
- **Live selection**: Switch layouts while timer is running

### External Display Window
- **Separate window** — always-on-top, positionable on secondary monitor/projector
- **Full synchronization** — themes, messages, video input, images
- **Auto-open option** — open automatically on secondary display in settings

### Multi-Protocol API
- **REST API** (port 9999) — HTTP/JSON for web automation
- **WebSocket** (port 8080) — Real-time bidirectional state sync
- **OSC** (ports 7000/7001) — Open Sound Control for lighting/audio consoles
- **Bitfocus Companion** — Full compatibility for broadcast production workflows
- **Rate limiting & authentication** — configurable security options

### Video Input
- **Webcam support** — real-time camera feed on canvas
- **HDMI capture cards** — integrate external video sources
- **Auto-start/stop** — based on layout configuration
- **Resolution selection** — per-device settings

### Sound & Visual Effects
- **Custom sound upload** — MP3, WAV, OGG files
- **Default beep** — 800 Hz sine wave with Web Audio API
- **Flash effect** — full-screen red/black flash at timer completion
- **Global mute toggle** — keyboard shortcut or settings

### Settings & Customization
- **8 settings sections**: Display, Timer, Canvas, Layouts, Performance, Video, API, Appearance
- **Canvas colors**: Customizable countdown, clock, elapsed, message, separator, progress, background
- **Camera settings**: Auto-start, device selection, resolution
- **Appearance**: Theme, clock format, cover/background images
- **Performance**: Frame rate, quality, hardware acceleration, low-power mode

---

## Installation

### Download

Download the latest release for your platform from the [Releases](https://github.com/tuneado/Rocket-Timer/releases) page:

- **macOS**: `.dmg` installer (Apple Silicon / Intel)
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` or `.deb`

### macOS — Opening the App for the First Time

Rocket Timer is not currently signed with an Apple Developer certificate. macOS will show a security warning the first time you try to open it. This is normal for apps distributed outside the Mac App Store.

To open the app:

1. Double-click the `.dmg` file and drag **Rocket Timer** to your **Applications** folder
2. Try to open the app — macOS will show a warning that it cannot verify the developer
3. Go to **Apple menu () → System Settings → Privacy & Security**
4. Scroll down to the **Security** section
5. You should see a message about Rocket Timer being blocked — click **Open Anyway**
6. Click **Open** in the confirmation dialog
7. Enter your login password if prompted

> **Note:** The "Open Anyway" button is only available for about one hour after you first try to open the app. If you don't see it, try opening the app again first.

Alternatively, you can **right-click** (or Control-click) on the app and choose **Open** from the context menu. This also bypasses the Gatekeeper warning.

### Build from Source

#### Requirements
- **Node.js** 18+ and npm
- **Electron** 38.1.0

#### Setup

```bash
# Clone the repository
git clone https://github.com/tuneado/Rocket-Timer.git
cd Rocket-Timer

# Install dependencies
npm install

# Start in development mode
npm start

# Build for production
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

---

## Quick Start

### 1. Start the Application
```bash
npm start
```

### 2. Set Timer
1. Click **Hours**, **Minutes**, **Seconds** inputs in the left panel
2. Or use keyboard arrows: **↑** (add minute), **↓** (subtract minute)
3. Or click a preset button (1-8)

### 3. Start Countdown
- Press **Space** or click **Start/Stop** button
- Observe the countdown in the preview canvas

### 4. External Display
1. Go to **Settings** → **Display**
2. Enable "Open Display Window"
3. Position on secondary monitor

### 5. API Control
```bash
# Start timer via REST API
curl -X POST http://localhost:9999/api/timer/start

# Set time to 10 minutes
curl -X POST http://localhost:9999/api/timer/set-time \
  -H "Content-Type: application/json" \
  -d '{"minutes": 10}'

# Get current state
curl http://localhost:9999/api/timer/state
```

---

## Keyboard Shortcuts

### Timer Control
| Key | Action |
|-----|--------|
| **Space** | Start/Stop timer |
| **R** | Reset to set duration |
| **↑** | Add 1 minute |
| **↓** | Subtract 1 minute |

### Display Control
| Key | Action |
|-----|--------|
| **F** | Flash screen |
| **M** | Mute/unmute sound |
| **I** | Toggle image |

### Quick Presets
| Key | Preset Duration |
|-----|-----------------|
| **1** | 5 minutes |
| **2** | 10 minutes |
| **3** | 15 minutes |
| **4** | 20 minutes |
| **5** | 25 minutes |
| **6** | 30 minutes |
| **7** | 45 minutes |
| **8** | 60 minutes |

### Preset Management
- **Click** — Load preset time
- **Ctrl/Cmd + Click** — Save current time to preset
- **Hold 800ms** — Save current time to preset

---

## API Documentation

### Base URLs
```
REST:      http://localhost:9999/api
WebSocket: ws://localhost:8080
OSC:       osc://localhost:7000 (receive), 7001 (send)
```

### REST API Endpoints

#### Health Check
```
GET /api/health
```
Returns API info and current application state.

#### Timer Control
```
POST /api/timer/start      — Start timer
POST /api/timer/stop       — Stop timer
POST /api/timer/pause      — Pause (if running)
POST /api/timer/resume     — Resume (if paused)
POST /api/timer/reset      — Reset to set duration
```

#### Set Time
```
POST /api/timer/set-time
Content-Type: application/json

{
  "totalSeconds": 600,
  "hours": 0,
  "minutes": 10,
  "seconds": 0
}
```

#### Adjust Time
```
POST /api/timer/adjust
Content-Type: application/json

{
  "minutes": 1,
  "seconds": 30
}
```

#### Get Current State
```
GET /api/timer/state
```
Returns:
```json
{
  "running": false,
  "paused": false,
  "remainingSeconds": 600,
  "totalSeconds": 600,
  "hours": 0,
  "minutes": 10,
  "seconds": 0,
  "percentage": 100,
  "formattedTime": "00:10:00",
  "preset": null
}
```

#### Presets
```
GET /api/presets                    — Get all presets
POST /api/presets/:id/load          — Load preset by ID
GET /api/presets/:id                — Get preset details
```

#### Effects
```
POST /api/timer/flash
Content-Type: application/json

{
  "cycles": 3,
  "duration": 500
}
```

#### Settings
```
GET /api/settings                   — Get all settings
PUT /api/settings                   — Update settings
```

#### Message Overlay
```
POST /api/message
Content-Type: application/json

{
  "text": "Hello World",
  "duration": 5000
}
```

#### Layout
```
GET /api/layouts                    — Get all layouts
POST /api/layout                    — Change layout
{
  "layoutId": "classic"
}
```

### Response Format
```json
{
  "success": true,
  "data": { /* ... */ },
  "message": "Success message",
  "timestamp": 1234567890
}
```

### WebSocket Events

**Client → Server (Commands)**
```javascript
socket.emit('timer:start');
socket.emit('timer:stop');
socket.emit('timer:reset');
socket.emit('timer:setTime', { minutes: 10 });
socket.emit('timer:adjust', { minutes: 1 });
```

**Server → Client (Events)**
```javascript
socket.on('stateUpdate', (state) => {
  console.log('Timer state:', state);
});

socket.on('timerComplete', () => {
  console.log('Timer reached zero!');
});
```

---

## Settings

### Display Section
- **Default Layout** — Load this layout on startup
- **Default Theme** — Dark or Light mode
- **Show Clock** — Display time on canvas
- **Clock Format** — 12-hour or 24-hour

### Timer Section
- **Default Time** — Hours, Minutes, Seconds (preset on startup)
- **Auto-Stop at Zero** — Stop or count up when reaching 00:00:00
- **Auto-Reset** — Automatically reset after completion
- **Sound on Timer End** — Play notification sound
- **Custom Sound File** — Upload MP3/WAV/OGG for end notification
- **Clear Custom Sound** — Remove custom sound and use default beep
- **Flash at Zero** — Trigger flash effect on timer completion

### Canvas Section
- **Resolution** — Width × Height (default 1920×1080)
- **Quality** — High (smooth) or Low (performance)
- **Frame Rate** — 30, 60, 120 fps

### Layouts Section
- **Default Layout** — Select which layout to load on startup
- **Import/Export** — Upload/download custom layouts as JSON
- **Layout Management** — Create, edit, delete custom layouts

### Performance Section
- **Hardware Acceleration** — Enable/disable GPU acceleration
- **Reduce Motion** — Disable animations for accessibility
- **Low Power Mode** — Reduce frame rate to save battery

### Video Input Section
- **Default Device** — Select webcam or capture card
- **Auto-Start on Launch** — Activate camera when app opens
- **Auto-Start on Layout** — Enable if layout has video frame
- **Release Camera When Idle** — Free camera when timer not running

### API & Integration Section
- **Enable API Server** — Turn API on/off
- **REST Port** — Default 9999
- **WebSocket Port** — Default 8080
- **OSC Receive Port** — Default 7000
- **OSC Send Port** — Default 7001
- **Allow External Connections** — Accept requests from other machines
- **Authentication** — Enable API key authentication
- **Rate Limiting** — Requests per second

### Appearance Section
- **Theme** — Light or Dark
- **Match Timer Color** — Apply timer color to UI elements
- **Canvas Colors** — Customize:
  - Countdown digits
  - Clock
  - Elapsed time
  - Message overlay
  - Separator line
  - Progress bar
  - Background
- **Cover Image** — Image displayed before timer starts
- **Background Image** — Static background with opacity control

---

## Architecture

### Directory Structure
```
src/
├── main/                      # Electron main process
│   ├── main.js               # Entry point
│   ├── windows.js            # Window management
│   ├── menu.js               # Application menu
│   ├── ipcHandlers.js        # Main ↔ Renderer communication
│   ├── settingsManager.js    # Settings persistence
│   └── unifiedApiServer.js   # REST + WebSocket + OSC
│
├── preload/
│   └── preload.js            # Context isolation bridge
│
└── renderer/
    ├── components/           # Preact JSX components
    │   ├── App.jsx
    │   ├── LeftPanel.jsx
    │   ├── RightPanel.jsx
    │   ├── TimePicker.jsx
    │   ├── Presets.jsx
    │   ├── PreviewCanvas.jsx
    │   └── ... (more)
    │
    ├── js/
    │   ├── countdown.js      # Main orchestrator
    │   ├── modules/
    │   │   ├── appState.js        # Centralized state (pub/sub)
    │   │   ├── timerControls.js   # Timer logic
    │   │   ├── displayManager.js  # Display updates
    │   │   ├── videoManager.js    # Video input
    │   │   ├── presetManager.js   # Quick presets
    │   │   ├── messageManager.js  # Message overlay
    │   │   ├── clockManager.js    # Clock display
    │   │   ├── settingsManager.js # Settings UI
    │   │   ├── timeInputs.js      # Time input handling
    │   │   └── ipcHandlers.js     # API event handlers
    │   │
    │   ├── canvas/
    │   │   ├── UnifiedCanvasRenderer.js  # Main render engine
    │   │   └── canvasEffects.js
    │   │
    │   ├── layouts/
    │   │   └── layoutRegistry.js  # Layout management
    │   │
    │   └── utils/
    │       ├── logger.js          # Logging system
    │       └── ...
    │
    ├── css/
    │   └── (Tailwind, Bootstrap Icons, custom CSS)
    │
    └── html/
        ├── index.html            # Main window
        ├── settings.html         # Settings window
        ├── display.html          # External display window
        └── layoutCreator.html    # Layout editor
```

### Key Technologies
- **Electron 38.1.0** — Desktop framework
- **Preact** — Lightweight React alternative (components)
- **Canvas API** — Rendering engine
- **Tailwind CSS 4** — Styling
- **Express 5** — REST API
- **WebSocket (ws)** — Real-time sync
- **OSC** — Lighting/audio console integration
- **Node.js** — Backend runtime

### Architectural Patterns
- **Context Isolation** + **Preload Bridge** — Security
- **Pub/Sub State Management** — Centralized `appState`
- **Module Decomposition** — Single orchestrator (`countdown.js`) delegates to focused modules
- **Unified Rendering** — Single canvas distributes to all outputs via `addOutput()`

---

## Development

### Windows Debug Workflow

For a complete cross-machine workflow (Mac + Windows), including branch strategy, debug loop, logging, CI expectations, and Git line-ending setup, see:

- [docs/WINDOWS_DEBUG_WORKFLOW.md](docs/WINDOWS_DEBUG_WORKFLOW.md)

### Setup Development Environment
```bash
npm install                    # Install dependencies
npm run build:js              # Build JavaScript bundles
npm run build:css             # Build Tailwind CSS
npm start                      # Start dev mode with hot reload
```

### Build Commands
```bash
npm run build:js              # Build ES6 modules via esbuild
npm run build:css             # Compile Tailwind CSS
npm run build                  # Full build for production
npm run dev                    # Development mode
```

### Code Structure

#### countdown.js (Main Orchestrator)
- **1453 lines** — Coordinates all timer logic
- Creates `timerState` object with high-resolution timer
- Initializes 10+ dependent modules
- Sets up IPC handlers and event listeners
- Manages keyboard shortcuts

#### appState.js (State Management)
- **Pub/Sub pattern** — subscribe to specific paths or wildcard '*'
- **Change history** — tracks last 50 state changes
- **Automatic updates** — notifies all subscribers on state change
- Used by all modules for reactive UI updates

#### UnifiedCanvasRenderer.js (Rendering Engine)
- **1722 lines** — Canvas rendering system
- Single render loop every frame (~16ms at 60fps)
- Renders all canvas elements (countdown, clock, progress, message, video, etc.)
- Multi-output: feeds preview canvas + display window simultaneously
- Smooth interpolation-based animations

#### timerControls.js (Timer Logic)
- Handles start/stop/pause/resume/reset
- Manages zero-crossing completion detection
- Plays sound/flash at timer end
- Supports both running and paused states

### Adding a New Feature

1. **Create a module** in `src/renderer/js/modules/` if it's substantial
2. **Update appState** if new state is needed
3. **Add to countdown.js** initialization if it's a core feature
4. **Add UI components** in `src/renderer/components/` (Preact) or settings.html (vanilla)
5. **Add settings** if user customization is needed
6. **Add IPC handlers** if main process interaction required
7. **Test** with `npm start`

### Debugging

**Logger System**: Detailed logging at multiple levels
```javascript
import logger from '../utils/logger.js';
logger.info('SECTION', 'Message here');
logger.debug('SECTION', 'Debug details');
logger.warn('SECTION', 'Warning');
logger.error('SECTION', 'Error details');
```

**AppState Inspector**: In browser console:
```javascript
window.appState.getState()      // Current full state
window.appState.getHistory()    // Last 50 changes
window.appState.getDebugInfo()  // Debug info
```

**Canvas Inspector**: In browser console:
```javascript
window.canvasRenderer.state     // Renderer state
window.canvasRenderer.layout    // Current layout
```

### Performance Optimization
- **Reduced state logging** — timer updates skip debug logs (happens every frame)
- **Throttled IPC** — state updates max 10/second (100ms)
- **60 fps default** — configurable frame rate in settings
- **Single canvas** — unified rendering for all outputs
- **Hardware acceleration** — GPU rendering in settings

---

## Troubleshooting

### Timer Not Starting
1. Check **Settings** → **Timer** → "Auto-Stop at Zero" is enabled
2. Verify keyboard shortcuts work (press **Space**)
3. Check browser console for errors (F12)

### Sound Not Playing
1. Check **Settings** → **Timer** → "Sound on Timer End" is enabled
2. If custom sound: verify file is MP3/WAV/OGG
3. Check system audio levels
4. Browser console: look for audio context errors

### API Not Responding
1. Verify **Settings** → **API & Integration** → "Enable API Server" is ON
2. Check port 9999 is not blocked by firewall
3. Test: `curl http://localhost:9999/api/health`
4. Check main process console for errors

### External Display Not Showing
1. Ensure secondary monitor/display is connected
2. Go to **Settings** → **Display** → enable "Open Display Window"
3. Window should appear on secondary monitor (may be off-screen, drag to reposition)

### Video Not Displaying
1. Check camera is connected and not in use by other apps
2. **Settings** → **Video Input** → verify device is selected
3. Verify current layout has video frame enabled
4. Try different resolution in settings

---

## License

GPL-3.0 — See LICENSE file for details

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

For issues, questions, or feature requests:
- **GitHub Issues** — Report bugs and feature requests
- **Documentation** — See this README for full details

---

**Built with ❤️ for broadcast professionals**
