# API Audit & Bitfocus Companion Integration Plan

**Document Version:** 1.0  
**Date:** 2025-01-XX  
**Purpose:** Complete API inventory and structured plan for Bitfocus Companion module development

---

## Executive Summary

The Countdown Timer application currently implements a **UnifiedTimerAPIServer** with three protocols:
- **REST API** (port 9999)
- **WebSocket** (port 8080)  
- **OSC** (port 7000/7001)

This document provides a complete audit of existing capabilities and a detailed roadmap for creating a professional Bitfocus Companion module.

---

## Part 1: Current API Implementation Audit

### 1.1 Active API Server

**File:** `src/main/unifiedApiServer.js`  
**Class:** `UnifiedTimerAPIServer`  
**Status:** ✅ Active (used in main.js)

**Legacy Server:** `src/main/apiServer.js` (ApiServer) - ⚠️ Not currently active, kept for reference

### 1.2 REST API Endpoints (Complete Inventory)

#### **Timer Control** (✅ Complete)
| Endpoint | Method | Purpose | Body Parameters |
|----------|--------|---------|-----------------|
| `/api/timer/start` | POST | Start the timer | None |
| `/api/timer/stop` | POST | Stop the timer | None |
| `/api/timer/pause` | POST | Pause running timer | None |
| `/api/timer/resume` | POST | Resume paused timer | None |
| `/api/timer/reset` | POST | Reset to initial time | None |

#### **Time Setting** (✅ Complete)
| Endpoint | Method | Purpose | Body Parameters |
|----------|--------|---------|-----------------|
| `/api/timer/set-time` | POST | Set total time | `{totalSeconds?, hours?, minutes?, seconds?}` |
| `/api/timer/adjust` | POST | Add/subtract time | `{seconds?, minutes?}` |

#### **State Retrieval** (✅ Complete)
| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/api/timer/state` | GET | Current timer state | Full state object |
| `/api/timer` | GET | Legacy format | Backward compatible state |
| `/api/health` | GET | API health check | Uptime, version, endpoints |

#### **Presets** (✅ Complete)
| Endpoint | Method | Purpose | Body Parameters |
|----------|--------|---------|-----------------|
| `/api/presets` | GET | List all presets | None |
| `/api/presets` | POST | Create new preset | `{name, duration, category, settings}` |
| `/api/presets/:id/load` | POST | Load preset by ID | None (ID in path) |

#### **Settings** (✅ Complete)
| Endpoint | Method | Purpose | Body Parameters |
|----------|--------|---------|-----------------|
| `/api/settings` | GET | Get all settings | None |
| `/api/settings` | PUT | Update settings | Settings object |

#### **Visual Effects** (✅ Complete)
| Endpoint | Method | Purpose | Body Parameters |
|----------|--------|---------|-----------------|
| `/api/timer/flash` | POST | Trigger flash effect | `{cycles?, duration?}` |

#### **Message Overlay** (✅ Complete - via legacy ApiServer reference)
| Endpoint | Method | Purpose | Body Parameters |
|----------|--------|---------|-----------------|
| `/api/message` | POST | Display message | `{text, duration?}` |

#### **Layout Control** (✅ Complete - via legacy ApiServer reference)
| Endpoint | Method | Purpose | Body Parameters |
|----------|--------|---------|-----------------|
| `/api/layouts` | GET | List available layouts | None |
| `/api/layout` | POST | Change active layout | `{layoutId}` |

### 1.3 WebSocket Events

**Implementation:** Socket.IO on port 8080

#### **Client → Server (Commands)**
```javascript
socket.emit('timer:start')
socket.emit('timer:stop')
socket.emit('timer:pause')
socket.emit('timer:resume')
socket.emit('timer:reset')
socket.emit('timer:setTime', { hours, minutes, seconds })
socket.emit('timer:adjust', { minutes, seconds })
```

#### **Server → Client (State Updates)**
```javascript
socket.on('stateUpdate', (state) => {
  // Real-time state synchronization
})

socket.on('timerComplete', () => {
  // Timer reached zero event
})
```

### 1.4 OSC Protocol Support

**Ports:**
- **Receive:** 7000 (accepts commands)
- **Send:** 7001 (emits state/events)

**Status:** ✅ Implemented in UnifiedTimerAPIServer

**Typical OSC Paths:**
```
/timer/start
/timer/stop
/timer/pause
/timer/resume
/timer/reset
/timer/set-time
/timer/state
```

### 1.5 Internal State Management (appState)

**File:** `src/renderer/js/modules/appState.js`

**Complete State Structure:**
```javascript
{
  timer: {
    running: boolean,
    paused: boolean,
    remainingTime: number,    // milliseconds
    totalTime: number,        // milliseconds
    lastSetTime: number,      // milliseconds
    hours: number,
    minutes: number,
    seconds: number,
    percentage: number,       // 0-100
    formattedTime: string,    // "HH:MM:SS"
    endTime: Date,            // When timer finishes
    endTimeFormatted: string,
    preset: number | null     // Preset index or null for custom
  },
  
  camera: {
    active: boolean,
    deviceId: string,
    deviceLabel: string,
    opacity: number          // 0.0-1.0
  },
  
  server: {
    running: boolean,
    port: number,
    error: string | null,
    connectedClients: number
  },
  
  display: {
    visible: boolean,
    windowId: string
  },
  
  clock: {
    visible: boolean,
    time: string,
    format24h: boolean
  },
  
  layout: {
    current: string,         // e.g., "classic", "minimal"
    previous: string
  },
  
  message: {
    visible: boolean,
    text: string,
    charCount: number,
    maxChars: number
  },
  
  featureImage: {
    enabled: boolean,
    path: string,
    opacity: number
  },
  
  theme: string,             // "dark" or "light"
  
  settings: {
    autoReset: boolean,
    companionEnabled: boolean,
    soundEnabled: boolean,
    flashEnabled: boolean,
    releaseCameraIdle: boolean
  }
}
```

### 1.6 IPC Command Handling

**File:** `src/renderer/js/modules/ipcHandlers.js`

**Supported Commands:**
```javascript
'start'              // Start timer
'stop'               // Stop/pause timer
'pause'              // Pause timer
'reset'              // Reset timer
'setTime'            // Set time (hours, minutes, seconds)
'setHours'           // Set only hours component
'setMinutes'         // Set only minutes component
'setSeconds'         // Set only seconds component
'loadPreset'         // Load preset by name/ID
'changeLayout'       // Switch layout
'setMessage'         // Display message overlay
'addMinute'          // Add 1 minute (when stopped)
'subtractMinute'     // Subtract 1 minute (when stopped)
'toggleFeatureImage' // Show/hide background image
'flashScreen'        // Trigger flash effect
'muteSound'          // Mute audio
'unmuteSound'        // Enable audio
'toggleSound'        // Toggle mute state
```

---

## Part 2: Gap Analysis for Companion Module

### 2.1 Missing Functionality Identified

#### **High Priority Gaps**

1. **❌ Individual Component Setters (REST)**
   - Missing: `POST /api/timer/hours/:value`
   - Missing: `POST /api/timer/minutes/:value`
   - Missing: `POST /api/timer/seconds/:value`
   - **Impact:** Companion buttons for quick hour/minute/second adjustments
   - **Found in:** Legacy ApiServer only

2. **❌ Time Adjustment (Minute Increments)**
   - Missing: `POST /api/timer/add-minute`
   - Missing: `POST /api/timer/subtract-minute`
   - **Impact:** Common Companion use case for quick +1/-1 minute buttons
   - **Found in:** Legacy ApiServer only

3. **❌ Feature Image Control**
   - Missing: `POST /api/display/toggle-feature-image`
   - **Impact:** Background image show/hide from Companion
   - **Found in:** Legacy ApiServer only

4. **❌ Sound Control**
   - Missing: `POST /api/sound/mute`
   - Missing: `POST /api/sound/unmute`
   - Missing: `POST /api/sound/toggle`
   - **Impact:** Audio control from Companion
   - **Found in:** Legacy ApiServer only

5. **❌ Display Flash (Alternative Endpoint)**
   - Missing: `POST /api/display/flash`
   - **Available as:** `POST /api/timer/flash` ✅
   - **Impact:** Semantic clarity for Companion users

#### **Medium Priority Gaps**

6. **⚠️ Camera/Video Control**
   - Missing: `GET /api/camera/status`
   - Missing: `POST /api/camera/start`
   - Missing: `POST /api/camera/stop`
   - Missing: `POST /api/camera/toggle`
   - Missing: `POST /api/camera/opacity`
   - **Impact:** Video input control from Companion

7. **⚠️ Display Window Control**
   - Missing: `GET /api/display/status`
   - Missing: `POST /api/display/open`
   - Missing: `POST /api/display/close`
   - Missing: `POST /api/display/toggle`
   - **Impact:** External display management from Companion

8. **⚠️ Clock Control**
   - Missing: `POST /api/clock/show`
   - Missing: `POST /api/clock/hide`
   - Missing: `POST /api/clock/toggle`
   - Missing: `POST /api/clock/format` (12h/24h)
   - **Impact:** Clock visibility from Companion

9. **⚠️ Theme Control**
   - Missing: `POST /api/theme/set` (dark/light)
   - Missing: `POST /api/theme/toggle`
   - **Impact:** Theme switching from Companion (low priority for broadcast use)

#### **Low Priority Gaps**

10. **📝 Preset Details**
    - Missing: `GET /api/presets/:id`
    - **Available:** Full list via `GET /api/presets` ✅
    - **Impact:** Individual preset info query

11. **📝 Message Control Endpoints**
    - Partially implemented in legacy server
    - Missing: `POST /api/message/show`
    - Missing: `POST /api/message/hide`
    - Missing: `POST /api/message/toggle`
    - **Available:** `POST /api/message` (legacy) ✅

12. **📝 Video Settings API**
    - Missing: `POST /api/video/mirror` (recently added feature)
    - Missing: `POST /api/video/scaling` (contain/cover/stretch/none)
    - **Impact:** New video features not yet exposed to API

### 2.2 Companion Module Essential Features

#### **Required for Companion Module:**

✅ **Already Available:**
- Timer start/stop/pause/resume/reset
- Time setting (composite and total seconds)
- Time adjustment (seconds/minutes)
- State polling (GET /api/timer/state)
- WebSocket state updates (real-time feedback)
- Preset loading
- Flash effect trigger
- Layout switching *(needs verification in UnifiedTimerAPIServer)*

❌ **Needs Implementation:**
- Individual hour/minute/second setters
- Add/subtract minute quick actions
- Sound control endpoints
- Feature image toggle endpoint
- Camera control endpoints
- Display window control endpoints

---

## Part 3: Companion Module Requirements

### 3.1 Companion Module Features Checklist

#### **Actions (Buttons/Triggers)**

| Action | Status | API Endpoint | Notes |
|--------|--------|--------------|-------|
| Start Timer | ✅ Ready | `POST /api/timer/start` | |
| Stop Timer | ✅ Ready | `POST /api/timer/stop` | |
| Pause Timer | ✅ Ready | `POST /api/timer/pause` | |
| Resume Timer | ✅ Ready | `POST /api/timer/resume` | |
| Reset Timer | ✅ Ready | `POST /api/timer/reset` | |
| Set Time (H:M:S) | ✅ Ready | `POST /api/timer/set-time` | Dynamic fields |
| Set Hours | ❌ Missing | Need endpoint | Quick set |
| Set Minutes | ❌ Missing | Need endpoint | Quick set |
| Set Seconds | ❌ Missing | Need endpoint | Quick set |
| Add 1 Minute | ❌ Missing | Need endpoint | Common use case |
| Subtract 1 Minute | ❌ Missing | Need endpoint | Common use case |
| Add Custom Time | ✅ Ready | `POST /api/timer/adjust` | +/- seconds |
| Load Preset 1-8 | ✅ Ready | `POST /api/presets/:id/load` | 8 buttons |
| Next Layout | ⚠️ Partial | `POST /api/layout` | Need layout list |
| Flash Display | ✅ Ready | `POST /api/timer/flash` | Visual alert |
| Show Message | ⚠️ Partial | `POST /api/message` | Need verification |
| Toggle Feature Image | ❌ Missing | Need endpoint | Background control |
| Mute Sound | ❌ Missing | Need endpoint | Audio control |
| Unmute Sound | ❌ Missing | Need endpoint | Audio control |
| Toggle Sound | ❌ Missing | Need endpoint | Audio control |
| Start Camera | ❌ Missing | Need endpoint | Video input |
| Stop Camera | ❌ Missing | Need endpoint | Video input |
| Open Display Window | ❌ Missing | Need endpoint | External monitor |
| Close Display Window | ❌ Missing | Need endpoint | External monitor |

#### **Feedbacks (Button State/Color)**

| Feedback | Status | Data Source | Use Case |
|----------|--------|-------------|----------|
| Timer Running | ✅ Ready | `state.isRunning` | Green when running |
| Timer Paused | ✅ Ready | `state.isPaused` | Yellow when paused |
| Timer Stopped | ✅ Ready | `!running && !paused` | Red when stopped |
| Time Remaining | ✅ Ready | `state.formattedTime` | Display on button |
| Percentage | ✅ Ready | `state.percentage` | Progress bar |
| Warning Level | ⚠️ Needs Logic | Calculate from % | Color shift at thresholds |
| Preset Active | ✅ Ready | `state.preset` | Highlight active preset |
| Layout Active | ✅ Ready | `state.layout` | Highlight active layout |
| Sound Muted | ⚠️ Check | `state.settings.soundEnabled` | Mute state indicator |
| Camera Active | ⚠️ Check | `state.camera.active` | Camera on/off |
| Display Window Open | ⚠️ Check | `state.display.visible` | Window state |
| Message Visible | ✅ Ready | `state.message.visible` | Message active |

#### **Variables (Dynamic Text)**

| Variable | Status | Source | Description |
|----------|--------|--------|-------------|
| `time_remaining` | ✅ Ready | `formattedTime` | HH:MM:SS |
| `hours` | ✅ Ready | `hours` | Hours component |
| `minutes` | ✅ Ready | `minutes` | Minutes component |
| `seconds` | ✅ Ready | `seconds` | Seconds component |
| `percentage` | ✅ Ready | `percentage` | 0-100 |
| `status` | ✅ Ready | Derived | "Running/Paused/Stopped" |
| `preset_name` | ⚠️ Needs Mapping | `preset` index | Active preset name |
| `layout_name` | ✅ Ready | `layout.current` | Active layout |
| `end_time` | ✅ Ready | `endTimeFormatted` | Estimated finish |
| `message_text` | ✅ Ready | `message.text` | Current message |
| `total_time` | ✅ Ready | `totalTime` / 1000 | Total seconds |

#### **Presets (Dropdown Choices)**

| Preset Source | Status | API Endpoint | Notes |
|---------------|--------|--------------|-------|
| Preset List | ✅ Ready | `GET /api/presets` | Dynamic dropdown |
| Layout List | ✅ Ready | `GET /api/layouts` | Dynamic dropdown |

---

## Part 4: Structured Implementation Plan

### Phase 1: API Gap Closure (Week 1)
**Goal:** Implement missing endpoints in UnifiedTimerAPIServer

#### **Task 1.1: Individual Time Component Setters**
```javascript
// Add to unifiedApiServer.js
this.app.post('/api/timer/hours/:value', (req, res) => {
  const hours = parseInt(req.params.value)
  const result = this.setTimeComponent('hours', hours)
  res.json(result)
})

this.app.post('/api/timer/minutes/:value', (req, res) => {
  const minutes = parseInt(req.params.value)
  const result = this.setTimeComponent('minutes', minutes)
  res.json(result)
})

this.app.post('/api/timer/seconds/:value', (req, res) => {
  const seconds = parseInt(req.params.value)
  const result = this.setTimeComponent('seconds', seconds)
  res.json(result)
})
```

**Implementation:**
- Create `setTimeComponent(component, value)` method
- Validate range (hours 0-99, minutes/seconds 0-59)
- Stop timer if running before setting
- Send IPC command to renderer
- Return updated state

**Testing:**
- cURL commands
- Verify state updates via WebSocket

---

#### **Task 1.2: Minute Increment/Decrement**
```javascript
this.app.post('/api/timer/add-minute', (req, res) => {
  const result = this.adjustTime(60) // Add 60 seconds
  res.json(result)
})

this.app.post('/api/timer/subtract-minute', (req, res) => {
  const result = this.adjustTime(-60) // Subtract 60 seconds
  res.json(result)
})
```

**Implementation:**
- Reuse existing `adjustTime()` method
- Add validation: only allow when timer is stopped
- Prevent negative time values
- Update state and broadcast

**Testing:**
- Verify minute boundaries (0-59)
- Test rapid clicking behavior

---

#### **Task 1.3: Sound Control Endpoints**
```javascript
this.app.post('/api/sound/mute', (req, res) => {
  const result = this.setSoundMute(true)
  res.json(result)
})

this.app.post('/api/sound/unmute', (req, res) => {
  const result = this.setSoundMute(false)
  res.json(result)
})

this.app.post('/api/sound/toggle', (req, res) => {
  const result = this.toggleSoundMute()
  res.json(result)
})
```

**Implementation:**
- Create IPC commands: `muteSound`, `unmuteSound`, `toggleSound`
- Update `appState.settings.soundEnabled`
- Persist to settings
- Broadcast state change

**Testing:**
- Verify mute state in UI
- Test with timer completion sound

---

#### **Task 1.4: Feature Image Control**
```javascript
this.app.post('/api/display/toggle-feature-image', (req, res) => {
  const result = this.toggleFeatureImage()
  res.json(result)
})

this.app.post('/api/display/feature-image', (req, res) => {
  const { enabled } = req.body
  const result = this.setFeatureImage(enabled)
  res.json(result)
})
```

**Implementation:**
- Send IPC command `toggleFeatureImage`
- Update `appState.featureImage.enabled`
- Broadcast state change

**Testing:**
- Verify background image visibility
- Check both display and preview windows

---

#### **Task 1.5: Camera/Video Control**
```javascript
this.app.get('/api/camera/status', (req, res) => {
  res.json({
    success: true,
    data: {
      active: this.timerState.camera?.active || false,
      deviceId: this.timerState.camera?.deviceId,
      deviceLabel: this.timerState.camera?.deviceLabel,
      opacity: this.timerState.camera?.opacity
    }
  })
})

this.app.post('/api/camera/start', (req, res) => {
  const result = this.startCamera()
  res.json(result)
})

this.app.post('/api/camera/stop', (req, res) => {
  const result = this.stopCamera()
  res.json(result)
})

this.app.post('/api/camera/toggle', (req, res) => {
  const result = this.toggleCamera()
  res.json(result)
})

this.app.post('/api/camera/opacity', (req, res) => {
  const { opacity } = req.body // 0.0 - 1.0
  const result = this.setCameraOpacity(opacity)
  res.json(result)
})
```

**Implementation:**
- Create IPC handlers for camera control
- Update `appState.camera` object
- Handle device selection (use current device)
- Broadcast state updates

**Testing:**
- Test with USB webcam or HDMI capture card
- Verify opacity changes
- Test rapid start/stop

---

#### **Task 1.6: Display Window Control**
```javascript
this.app.get('/api/display/status', (req, res) => {
  res.json({
    success: true,
    data: {
      visible: this.timerState.display?.visible || false,
      windowId: this.timerState.display?.windowId
    }
  })
})

this.app.post('/api/display/open', (req, res) => {
  const result = this.openDisplayWindow()
  res.json(result)
})

this.app.post('/api/display/close', (req, res) => {
  const result = this.closeDisplayWindow()
  res.json(result)
})

this.app.post('/api/display/toggle', (req, res) => {
  const result = this.toggleDisplayWindow()
  res.json(result)
})
```

**Implementation:**
- Send IPC to main process (window management)
- Update `appState.display.visible`
- Handle multi-monitor scenarios

**Testing:**
- Test with external monitor
- Verify window positioning

---

#### **Task 1.7: Video Settings (Mirror & Scaling)**
```javascript
this.app.post('/api/video/mirror', (req, res) => {
  const { enabled } = req.body
  const result = this.setVideoMirror(enabled)
  res.json(result)
})

this.app.post('/api/video/scaling', (req, res) => {
  const { mode } = req.body // contain|cover|stretch|none
  const result = this.setVideoScaling(mode)
  res.json(result)
})
```

**Implementation:**
- Send IPC events: `video-mirror-changed`, `video-scaling-changed`
- Apply to UnifiedCanvasRenderer
- Update settings persistence

**Testing:**
- Verify live preview updates
- Test all scaling modes

---

### Phase 2: Companion Module Foundation (Week 2)
**Goal:** Create module scaffold and connection logic

#### **Task 2.1: Module Setup**
- Create Companion module repository: `companion-module-countdown-timer`
- Install Companion SDK dependencies
- Create `index.js` entry point
- Define module metadata (manufacturer, model, API version)

**File Structure:**
```
companion-module-countdown-timer/
├── package.json
├── index.js           # Main module entry
├── config.js          # Configuration fields
├── actions.js         # Button actions
├── feedbacks.js       # Button feedbacks
├── variables.js       # Dynamic variables
├── presets.js         # Pre-built button presets
├── api.js             # REST/WebSocket client
└── README.md          # Installation guide
```

---

#### **Task 2.2: Configuration Schema**
```javascript
// config.js
module.exports = {
  fields: [
    {
      type: 'textinput',
      id: 'host',
      label: 'Timer Host',
      default: 'localhost',
      width: 6
    },
    {
      type: 'number',
      id: 'rest_port',
      label: 'REST API Port',
      default: 9999,
      min: 1024,
      max: 65535,
      width: 6
    },
    {
      type: 'number',
      id: 'ws_port',
      label: 'WebSocket Port',
      default: 8080,
      min: 1024,
      max: 65535,
      width: 6
    },
    {
      type: 'checkbox',
      id: 'enable_websocket',
      label: 'Use WebSocket for real-time updates',
      default: true,
      width: 6
    },
    {
      type: 'number',
      id: 'poll_interval',
      label: 'Polling Interval (ms)',
      default: 500,
      min: 100,
      max: 5000,
      width: 6
    }
  ]
}
```

---

#### **Task 2.3: API Client Implementation**
```javascript
// api.js
const axios = require('axios')
const io = require('socket.io-client')

class TimerAPI {
  constructor(config, updateCallback) {
    this.config = config
    this.updateCallback = updateCallback
    this.baseURL = `http://${config.host}:${config.rest_port}/api`
    this.socket = null
    this.state = {}
  }

  async connect() {
    // HTTP Connection Test
    try {
      const health = await this.getHealth()
      console.log('Timer API connected:', health.version)
    } catch (error) {
      console.error('Connection failed:', error.message)
      throw error
    }

    // WebSocket Connection
    if (this.config.enable_websocket) {
      this.socket = io(`http://${this.config.host}:${this.config.ws_port}`)
      
      this.socket.on('connect', () => {
        console.log('WebSocket connected')
      })
      
      this.socket.on('stateUpdate', (state) => {
        this.state = state
        this.updateCallback(state)
      })
      
      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected')
      })
    } else {
      // Start polling
      this.startPolling()
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
    }
  }

  startPolling() {
    this.pollInterval = setInterval(async () => {
      try {
        const state = await this.getState()
        this.state = state
        this.updateCallback(state)
      } catch (error) {
        console.error('Polling error:', error.message)
      }
    }, this.config.poll_interval)
  }

  // REST API Methods
  async getHealth() {
    return this.get('/health')
  }

  async getState() {
    return this.get('/timer/state')
  }

  async startTimer() {
    return this.post('/timer/start')
  }

  async stopTimer() {
    return this.post('/timer/stop')
  }

  async pauseTimer() {
    return this.post('/timer/pause')
  }

  async resumeTimer() {
    return this.post('/timer/resume')
  }

  async resetTimer() {
    return this.post('/timer/reset')
  }

  async setTime(hours, minutes, seconds) {
    return this.post('/timer/set-time', { hours, minutes, seconds })
  }

  async setHours(value) {
    return this.post(`/timer/hours/${value}`)
  }

  async setMinutes(value) {
    return this.post(`/timer/minutes/${value}`)
  }

  async setSeconds(value) {
    return this.post(`/timer/seconds/${value}`)
  }

  async addMinute() {
    return this.post('/timer/add-minute')
  }

  async subtractMinute() {
    return this.post('/timer/subtract-minute')
  }

  async adjustTime(minutes, seconds) {
    return this.post('/timer/adjust', { minutes, seconds })
  }

  async loadPreset(id) {
    return this.post(`/presets/${id}/load`)
  }

  async getPresets() {
    return this.get('/presets')
  }

  async flash(cycles = 3, duration = 500) {
    return this.post('/timer/flash', { cycles, duration })
  }

  async muteSound() {
    return this.post('/sound/mute')
  }

  async unmuteSound() {
    return this.post('/sound/unmute')
  }

  async toggleSound() {
    return this.post('/sound/toggle')
  }

  async toggleFeatureImage() {
    return this.post('/display/toggle-feature-image')
  }

  async setLayout(layoutId) {
    return this.post('/layout', { layoutId })
  }

  async sendMessage(text, duration) {
    return this.post('/message', { text, duration })
  }

  // HTTP Helpers
  async get(endpoint) {
    const response = await axios.get(`${this.baseURL}${endpoint}`)
    return response.data
  }

  async post(endpoint, data = {}) {
    const response = await axios.post(`${this.baseURL}${endpoint}`, data)
    return response.data
  }
}

module.exports = TimerAPI
```

---

### Phase 3: Actions Implementation (Week 3)
**Goal:** Implement all button actions

#### **Task 3.1: Basic Timer Actions**
```javascript
// actions.js (excerpt)
module.exports = {
  getActions(instance) {
    return {
      start_timer: {
        name: 'Start Timer',
        options: [],
        callback: async (action) => {
          await instance.api.startTimer()
        }
      },
      
      stop_timer: {
        name: 'Stop Timer',
        options: [],
        callback: async (action) => {
          await instance.api.stopTimer()
        }
      },
      
      pause_timer: {
        name: 'Pause Timer',
        options: [],
        callback: async (action) => {
          await instance.api.pauseTimer()
        }
      },
      
      resume_timer: {
        name: 'Resume Timer',
        options: [],
        callback: async (action) => {
          await instance.api.resumeTimer()
        }
      },
      
      reset_timer: {
        name: 'Reset Timer',
        options: [],
        callback: async (action) => {
          await instance.api.resetTimer()
        }
      },

      set_time: {
        name: 'Set Time',
        options: [
          {
            type: 'number',
            label: 'Hours',
            id: 'hours',
            default: 0,
            min: 0,
            max: 99
          },
          {
            type: 'number',
            label: 'Minutes',
            id: 'minutes',
            default: 10,
            min: 0,
            max: 59
          },
          {
            type: 'number',
            label: 'Seconds',
            id: 'seconds',
            default: 0,
            min: 0,
            max: 59
          }
        ],
        callback: async (action) => {
          await instance.api.setTime(
            action.options.hours,
            action.options.minutes,
            action.options.seconds
          )
        }
      },

      quick_set_minutes: {
        name: 'Quick Set Minutes',
        options: [
          {
            type: 'number',
            label: 'Minutes',
            id: 'value',
            default: 15,
            min: 0,
            max: 59
          }
        ],
        callback: async (action) => {
          await instance.api.setMinutes(action.options.value)
        }
      },

      add_minute: {
        name: 'Add 1 Minute',
        options: [],
        callback: async (action) => {
          await instance.api.addMinute()
        }
      },

      subtract_minute: {
        name: 'Subtract 1 Minute',
        options: [],
        callback: async (action) => {
          await instance.api.subtractMinute()
        }
      },

      adjust_time: {
        name: 'Adjust Time',
        options: [
          {
            type: 'number',
            label: 'Minutes',
            id: 'minutes',
            default: 0,
            min: -59,
            max: 59
          },
          {
            type: 'number',
            label: 'Seconds',
            id: 'seconds',
            default: 30,
            min: -59,
            max: 59
          }
        ],
        callback: async (action) => {
          await instance.api.adjustTime(
            action.options.minutes,
            action.options.seconds
          )
        }
      }
    }
  }
}
```

#### **Task 3.2: Preset & Layout Actions**
```javascript
load_preset: {
  name: 'Load Preset',
  options: [
    {
      type: 'dropdown',
      label: 'Preset',
      id: 'preset_id',
      default: '0',
      choices: [] // Populated dynamically from API
    }
  ],
  callback: async (action) => {
    await instance.api.loadPreset(action.options.preset_id)
  }
},

change_layout: {
  name: 'Change Layout',
  options: [
    {
      type: 'dropdown',
      label: 'Layout',
      id: 'layout_id',
      default: 'classic',
      choices: [] // Populated dynamically
    }
  ],
  callback: async (action) => {
    await instance.api.setLayout(action.options.layout_id)
  }
}
```

#### **Task 3.3: Display & Sound Actions**
```javascript
flash_display: {
  name: 'Flash Display',
  options: [
    {
      type: 'number',
      label: 'Cycles',
      id: 'cycles',
      default: 3,
      min: 1,
      max: 10
    },
    {
      type: 'number',
      label: 'Duration (ms)',
      id: 'duration',
      default: 500,
      min: 100,
      max: 2000
    }
  ],
  callback: async (action) => {
    await instance.api.flash(
      action.options.cycles,
      action.options.duration
    )
  }
},

mute_sound: {
  name: 'Mute Sound',
  options: [],
  callback: async (action) => {
    await instance.api.muteSound()
  }
},

unmute_sound: {
  name: 'Unmute Sound',
  options: [],
  callback: async (action) => {
    await instance.api.unmuteSound()
  }
},

toggle_sound: {
  name: 'Toggle Sound Mute',
  options: [],
  callback: async (action) => {
    await instance.api.toggleSound()
  }
},

toggle_feature_image: {
  name: 'Toggle Feature Image',
  options: [],
  callback: async (action) => {
    await instance.api.toggleFeatureImage()
  }
},

send_message: {
  name: 'Send Message',
  options: [
    {
      type: 'textinput',
      label: 'Message',
      id: 'text',
      default: 'Hello World'
    },
    {
      type: 'number',
      label: 'Duration (ms)',
      id: 'duration',
      default: 5000,
      min: 1000,
      max: 60000
    }
  ],
  callback: async (action) => {
    await instance.api.sendMessage(
      action.options.text,
      action.options.duration
    )
  }
}
```

---

### Phase 4: Feedbacks Implementation (Week 4)
**Goal:** Implement button state indicators

#### **Task 4.1: Timer State Feedbacks**
```javascript
// feedbacks.js
module.exports = {
  getFeedbacks(instance) {
    return {
      timer_running: {
        type: 'boolean',
        name: 'Timer Running',
        description: 'Change button color when timer is running',
        defaultStyle: {
          bgcolor: combineRgb(0, 200, 0), // Green
          color: combineRgb(0, 0, 0)
        },
        options: [],
        callback: (feedback) => {
          return instance.state.isRunning === true
        }
      },

      timer_paused: {
        type: 'boolean',
        name: 'Timer Paused',
        description: 'Change button color when timer is paused',
        defaultStyle: {
          bgcolor: combineRgb(255, 165, 0), // Orange
          color: combineRgb(0, 0, 0)
        },
        options: [],
        callback: (feedback) => {
          return instance.state.isPaused === true
        }
      },

      timer_stopped: {
        type: 'boolean',
        name: 'Timer Stopped',
        description: 'Change button color when timer is stopped',
        defaultStyle: {
          bgcolor: combineRgb(200, 0, 0), // Red
          color: combineRgb(255, 255, 255)
        },
        options: [],
        callback: (feedback) => {
          return !instance.state.isRunning && !instance.state.isPaused
        }
      },

      time_remaining_threshold: {
        type: 'boolean',
        name: 'Time Remaining Threshold',
        description: 'Change color when time drops below threshold',
        defaultStyle: {
          bgcolor: combineRgb(255, 0, 0), // Red
          color: combineRgb(255, 255, 255)
        },
        options: [
          {
            type: 'number',
            label: 'Threshold (seconds)',
            id: 'threshold',
            default: 60,
            min: 0,
            max: 3600
          }
        ],
        callback: (feedback) => {
          const threshold = feedback.options.threshold
          const remaining = instance.state.remainingTime || 0
          return remaining <= threshold && remaining > 0
        }
      },

      percentage_threshold: {
        type: 'boolean',
        name: 'Percentage Threshold',
        description: 'Change color when percentage drops below threshold',
        defaultStyle: {
          bgcolor: combineRgb(255, 255, 0), // Yellow
          color: combineRgb(0, 0, 0)
        },
        options: [
          {
            type: 'number',
            label: 'Percentage',
            id: 'percentage',
            default: 25,
            min: 0,
            max: 100
          }
        ],
        callback: (feedback) => {
          const threshold = feedback.options.percentage
          const current = instance.state.percentage || 0
          return current <= threshold && current > 0
        }
      },

      preset_active: {
        type: 'boolean',
        name: 'Preset Active',
        description: 'Highlight button when specific preset is loaded',
        defaultStyle: {
          bgcolor: combineRgb(0, 100, 200), // Blue
          color: combineRgb(255, 255, 255)
        },
        options: [
          {
            type: 'dropdown',
            label: 'Preset',
            id: 'preset_id',
            default: '0',
            choices: [] // Populated from API
          }
        ],
        callback: (feedback) => {
          return instance.state.preset === feedback.options.preset_id
        }
      },

      layout_active: {
        type: 'boolean',
        name: 'Layout Active',
        description: 'Highlight button when specific layout is active',
        defaultStyle: {
          bgcolor: combineRgb(100, 0, 200), // Purple
          color: combineRgb(255, 255, 255)
        },
        options: [
          {
            type: 'dropdown',
            label: 'Layout',
            id: 'layout_id',
            default: 'classic',
            choices: [] // Populated from API
          }
        ],
        callback: (feedback) => {
          return instance.state.layout === feedback.options.layout_id
        }
      },

      sound_muted: {
        type: 'boolean',
        name: 'Sound Muted',
        description: 'Highlight when sound is muted',
        defaultStyle: {
          bgcolor: combineRgb(150, 0, 0), // Dark red
          color: combineRgb(255, 255, 255)
        },
        options: [],
        callback: (feedback) => {
          return instance.state.settings?.soundEnabled === false
        }
      }
    }
  }
}
```

---

### Phase 5: Variables Implementation (Week 4)
**Goal:** Provide dynamic text for button labels

#### **Task 5.1: Variable Definitions**
```javascript
// variables.js
module.exports = {
  getVariables(instance) {
    return [
      {
        variableId: 'time_remaining',
        name: 'Time Remaining (HH:MM:SS)'
      },
      {
        variableId: 'hours',
        name: 'Hours'
      },
      {
        variableId: 'minutes',
        name: 'Minutes'
      },
      {
        variableId: 'seconds',
        name: 'Seconds'
      },
      {
        variableId: 'percentage',
        name: 'Percentage Remaining'
      },
      {
        variableId: 'status',
        name: 'Timer Status'
      },
      {
        variableId: 'status_emoji',
        name: 'Timer Status (Emoji)'
      },
      {
        variableId: 'preset_name',
        name: 'Active Preset Name'
      },
      {
        variableId: 'layout_name',
        name: 'Active Layout Name'
      },
      {
        variableId: 'end_time',
        name: 'Estimated End Time'
      },
      {
        variableId: 'total_time',
        name: 'Total Time (HH:MM:SS)'
      },
      {
        variableId: 'elapsed_time',
        name: 'Elapsed Time (HH:MM:SS)'
      },
      {
        variableId: 'message_text',
        name: 'Current Message'
      }
    ]
  },

  updateVariables(instance, state) {
    const status = state.isRunning ? 'Running' : 
                   state.isPaused ? 'Paused' : 'Stopped'
    
    const statusEmoji = state.isRunning ? '▶️' : 
                        state.isPaused ? '⏸️' : '⏹️'

    instance.setVariableValues({
      time_remaining: state.formattedTime || '--:--:--',
      hours: String(Math.floor(state.remainingTime / 3600) || 0).padStart(2, '0'),
      minutes: String(Math.floor((state.remainingTime % 3600) / 60) || 0).padStart(2, '0'),
      seconds: String(state.remainingTime % 60 || 0).padStart(2, '0'),
      percentage: String(state.percentage || 0),
      status: status,
      status_emoji: statusEmoji,
      preset_name: instance.presets[state.preset]?.name || 'Custom',
      layout_name: state.layout || 'Unknown',
      end_time: state.endTimeFormatted || '--:--:--',
      total_time: formatTime(state.totalTime),
      elapsed_time: formatTime(state.totalTime - state.remainingTime),
      message_text: state.message?.text || ''
    })
  }
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
```

---

### Phase 6: Presets & Polish (Week 5)
**Goal:** Create pre-built button layouts and documentation

#### **Task 6.1: Companion Button Presets**
```javascript
// presets.js
module.exports = {
  getPresets(instance) {
    return [
      {
        category: 'Timer Control',
        name: 'Start/Stop Toggle',
        type: 'button',
        style: {
          text: 'START\\n$(countdown-timer:time_remaining)',
          size: '18',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(0, 128, 0)
        },
        steps: [
          {
            down: [
              {
                actionId: 'start_timer'
              }
            ],
            up: []
          }
        ],
        feedbacks: [
          {
            feedbackId: 'timer_running',
            options: {},
            style: {
              bgcolor: combineRgb(0, 200, 0),
              text: 'STOP\\n$(countdown-timer:time_remaining)'
            }
          },
          {
            feedbackId: 'timer_paused',
            options: {},
            style: {
              bgcolor: combineRgb(255, 165, 0),
              text: 'RESUME\\n$(countdown-timer:time_remaining)'
            }
          }
        ]
      },

      {
        category: 'Timer Control',
        name: 'Reset Timer',
        type: 'button',
        style: {
          text: 'RESET',
          size: '18',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(200, 0, 0)
        },
        steps: [
          {
            down: [
              {
                actionId: 'reset_timer'
              }
            ],
            up: []
          }
        ],
        feedbacks: []
      },

      {
        category: 'Quick Time',
        name: '15 Minutes',
        type: 'button',
        style: {
          text: '15:00',
          size: '24',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(50, 50, 50)
        },
        steps: [
          {
            down: [
              {
                actionId: 'set_time',
                options: {
                  hours: 0,
                  minutes: 15,
                  seconds: 0
                }
              }
            ],
            up: []
          }
        ],
        feedbacks: []
      },

      {
        category: 'Quick Adjust',
        name: 'Add 1 Minute',
        type: 'button',
        style: {
          text: '+1 MIN',
          size: '18',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(0, 100, 0)
        },
        steps: [
          {
            down: [
              {
                actionId: 'add_minute'
              }
            ],
            up: []
          }
        ],
        feedbacks: []
      },

      {
        category: 'Quick Adjust',
        name: 'Subtract 1 Minute',
        type: 'button',
        style: {
          text: '-1 MIN',
          size: '18',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(100, 0, 0)
        },
        steps: [
          {
            down: [
              {
                actionId: 'subtract_minute'
              }
            ],
            up: []
          }
        ],
        feedbacks: []
      },

      {
        category: 'Display',
        name: 'Time Display',
        type: 'button',
        style: {
          text: '$(countdown-timer:status_emoji)\\n$(countdown-timer:time_remaining)',
          size: '24',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(30, 30, 30)
        },
        steps: [],
        feedbacks: [
          {
            feedbackId: 'timer_running',
            options: {},
            style: {
              bgcolor: combineRgb(0, 100, 0)
            }
          },
          {
            feedbackId: 'timer_paused',
            options: {},
            style: {
              bgcolor: combineRgb(150, 100, 0)
            }
          },
          {
            feedbackId: 'time_remaining_threshold',
            options: {
              threshold: 60
            },
            style: {
              bgcolor: combineRgb(200, 0, 0),
              color: combineRgb(255, 255, 0)
            }
          }
        ]
      },

      {
        category: 'Effects',
        name: 'Flash Display',
        type: 'button',
        style: {
          text: 'FLASH',
          size: '18',
          color: combineRgb(0, 0, 0),
          bgcolor: combineRgb(255, 255, 0)
        },
        steps: [
          {
            down: [
              {
                actionId: 'flash_display',
                options: {
                  cycles: 3,
                  duration: 500
                }
              }
            ],
            up: []
          }
        ],
        feedbacks: []
      },

      {
        category: 'Audio',
        name: 'Mute Toggle',
        type: 'button',
        style: {
          text: '🔊',
          size: '44',
          color: combineRgb(255, 255, 255),
          bgcolor: combineRgb(0, 100, 200)
        },
        steps: [
          {
            down: [
              {
                actionId: 'toggle_sound'
              }
            ],
            up: []
          }
        ],
        feedbacks: [
          {
            feedbackId: 'sound_muted',
            options: {},
            style: {
              text: '🔇',
              bgcolor: combineRgb(150, 0, 0)
            }
          }
        ]
      }
    ]
  }
}
```

---

#### **Task 6.2: Documentation**

**Create README.md for Companion Module:**
```markdown
# Companion Module: Countdown Timer

Control the Countdown Timer application from Bitfocus Companion.

## Features

- Full timer control (start, stop, pause, resume, reset)
- Time setting (hours, minutes, seconds)
- Quick time adjustments (+/- 1 minute)
- Preset loading (up to 8 presets)
- Layout switching
- Display effects (flash)
- Sound control (mute/unmute)
- Message overlay
- Real-time state feedback via WebSocket
- Dynamic button states and colors
- Live variable updates

## Installation

1. Download the latest release from GitHub
2. Extract to Companion modules folder
3. Restart Companion
4. Add "Countdown Timer" module
5. Configure connection settings (host, ports)
6. Test connection with "Health Check" button

## Configuration

- **Timer Host:** IP or hostname (default: localhost)
- **REST API Port:** Default 9999
- **WebSocket Port:** Default 8080
- **Enable WebSocket:** Recommended for real-time updates
- **Polling Interval:** Fallback if WebSocket disabled (500ms recommended)

## Requirements

- Countdown Timer v2.0+ with API server enabled
- Network connectivity between Companion and Timer
- Ports 9999 (REST) and 8080 (WebSocket) accessible

## Actions Overview

### Timer Control
- Start Timer
- Stop Timer
- Pause Timer
- Resume Timer
- Reset Timer

### Time Setting
- Set Time (H:M:S)
- Quick Set Hours/Minutes/Seconds
- Add/Subtract 1 Minute
- Adjust Time (custom offset)

### Presets & Layouts
- Load Preset (1-8)
- Change Layout

### Display
- Flash Display
- Toggle Feature Image
- Send Message

### Audio
- Mute Sound
- Unmute Sound
- Toggle Mute

## Feedbacks

- Timer Running (Green)
- Timer Paused (Orange)
- Timer Stopped (Red)
- Time Threshold Warning (Yellow/Red)
- Percentage Threshold
- Preset Active Indicator
- Layout Active Indicator
- Sound Muted Indicator

## Variables

- `$(countdown-timer:time_remaining)` - HH:MM:SS
- `$(countdown-timer:percentage)` - 0-100
- `$(countdown-timer:status)` - Running/Paused/Stopped
- `$(countdown-timer:status_emoji)` - ▶️⏸️⏹️
- `$(countdown-timer:hours)` - Hours component
- `$(countdown-timer:minutes)` - Minutes component
- `$(countdown-timer:seconds)` - Seconds component
- `$(countdown-timer:end_time)` - Estimated finish time
- `$(countdown-timer:preset_name)` - Active preset
- `$(countdown-timer:layout_name)` - Active layout

## Troubleshooting

### Connection Failed
- Verify Timer application is running
- Check API server is enabled in Timer settings
- Confirm ports 9999/8080 are not blocked
- Test with: `curl http://localhost:9999/api/health`

### WebSocket Not Updating
- Enable WebSocket in module config
- Check port 8080 accessibility
- Fallback to polling mode if needed

### Actions Not Working
- Check Timer app is responsive
- Verify API endpoints exist (health check)
- Review Companion logs for errors
- Ensure Timer version is v2.0+

## Support

- GitHub Issues: [link]
- Companion Forum: [link]
- API Documentation: Open Timer app → http://localhost:9999/api

## Version History

- **v1.0.0** - Initial release with full API coverage
```

---

### Phase 7: Testing & Deployment (Week 6)
**Goal:** Comprehensive testing and release

#### **Task 7.1: Unit Testing**
- Test all API endpoints individually
- Verify WebSocket state synchronization
- Test error handling (network failures, invalid inputs)
- Validate dropdown population (presets, layouts)
- Test rapid button clicking (debouncing)

#### **Task 7.2: Integration Testing**
- Test with actual Countdown Timer app
- Verify state consistency across multiple Companion instances
- Test with external display window
- Test with camera active
- Test all feedback conditions
- Validate variable updates

#### **Task 7.3: Performance Testing**
- WebSocket latency measurement
- Polling efficiency
- Button response time
- State update frequency (500ms)
- Memory usage monitoring

#### **Task 7.4: User Acceptance Testing**
- Broadcast production scenario testing
- Multi-preset workflow
- Quick time adjustment workflow
- Emergency controls (flash, reset)
- Failure recovery (API server restart)

#### **Task 7.5: Release Preparation**
- Package module for Companion store
- Create installation video
- Write detailed changelog
- Submit to Companion team
- Announce on forums

---

## Part 5: Priority Roadmap

### **Immediate (Week 1-2)**
1. ✅ Implement missing REST endpoints (Tasks 1.1-1.7)
2. ✅ Test all new endpoints with cURL
3. ✅ Update API documentation in Timer app
4. ✅ Create Companion module scaffold

### **Core Development (Week 3-4)**
5. ✅ Implement all actions (timer, presets, display, sound)
6. ✅ Implement all feedbacks (states, thresholds, indicators)
7. ✅ Implement variables with dynamic updates
8. ✅ Set up WebSocket real-time synchronization

### **Polish & Launch (Week 5-6)**
9. ✅ Create pre-built button presets
10. ✅ Write comprehensive documentation
11. ✅ Test in production scenarios
12. ✅ Package and release v1.0

### **Future Enhancements**
- Multi-timer support (if Timer app adds this)
- OSC integration as alternative protocol
- Advanced presets (time ranges, color coding)
- Custom feedback colors/icons
- Trigger actions (auto-flash at 30s, etc.)
- Integration with ProPresenter, vMix, etc.

---

## Part 6: Risk Assessment

### **Technical Risks**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WebSocket disconnect during event | Medium | High | Implement auto-reconnect with exponential backoff |
| REST API timeout | Low | Medium | Add timeout configuration, fallback to cached state |
| State desync (Companion vs Timer) | Low | High | Use WebSocket as primary, poll as verification |
| Network latency | Medium | Low | Display connection quality indicator |
| API breaking changes | Low | High | Version compatibility checking |

### **User Experience Risks**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Confusing action names | Medium | Medium | Clear naming conventions, tooltips |
| Too many configuration options | Low | Low | Sane defaults, optional advanced settings |
| Button feedback not obvious | Medium | High | Strong color coding, emoji icons |
| Variable syntax confusion | Medium | Low | Provide copy-paste examples |

---

## Part 7: Success Metrics

### **Technical Success**
- ✅ All 30+ API endpoints implemented and tested
- ✅ WebSocket latency < 100ms average
- ✅ 99.9% command success rate
- ✅ Auto-reconnect within 5 seconds
- ✅ State sync accuracy 100%

### **User Success**
- ✅ Installation < 5 minutes
- ✅ First button working in < 2 minutes
- ✅ Pre-built presets cover 80% of use cases
- ✅ Positive feedback from 10+ users
- ✅ Featured in Companion module store

---

## Appendix A: API Endpoint Quick Reference

### **Currently Implemented in UnifiedTimerAPIServer**

```
✅ GET  /api/health
✅ GET  /api/timer/state
✅ GET  /api/timer (legacy)
✅ POST /api/timer/start
✅ POST /api/timer/stop
✅ POST /api/timer/pause
✅ POST /api/timer/resume
✅ POST /api/timer/reset
✅ POST /api/timer/set-time
✅ POST /api/timer/adjust
✅ POST /api/timer/flash
✅ GET  /api/presets
✅ POST /api/presets
✅ POST /api/presets/:id/load
✅ GET  /api/settings
✅ PUT  /api/settings
```

### **To Be Implemented (High Priority)**

```
❌ POST /api/timer/hours/:value
❌ POST /api/timer/minutes/:value
❌ POST /api/timer/seconds/:value
❌ POST /api/timer/add-minute
❌ POST /api/timer/subtract-minute
❌ POST /api/sound/mute
❌ POST /api/sound/unmute
❌ POST /api/sound/toggle
❌ POST /api/display/toggle-feature-image
❌ POST /api/message (verify, may exist in legacy)
❌ POST /api/layout (verify, may exist in legacy)
❌ GET  /api/layouts (verify, may exist in legacy)
```

### **To Be Implemented (Medium Priority)**

```
❌ GET  /api/camera/status
❌ POST /api/camera/start
❌ POST /api/camera/stop
❌ POST /api/camera/toggle
❌ POST /api/camera/opacity
❌ GET  /api/display/status
❌ POST /api/display/open
❌ POST /api/display/close
❌ POST /api/display/toggle
❌ POST /api/video/mirror
❌ POST /api/video/scaling
```

---

## Appendix B: WebSocket Event Reference

### **Server → Client**

```javascript
'stateUpdate'        // Full timer state (emitted on every change)
'timerComplete'      // Timer reached zero
'presetLoaded'       // Preset was loaded
'layoutChanged'      // Layout switched
'error'              // Error occurred
'connected'          // Initial connection
'reconnected'        // Reconnection after disconnect
```

### **Client → Server**

```javascript
'timer:command'      // Send any timer command
'getState'           // Request current state
'subscribe'          // Subscribe to specific event
'unsubscribe'        // Unsubscribe from event
```

---

## Appendix C: Companion Module File Checklist

```
✅ package.json          - Dependencies and metadata
✅ index.js              - Main module entry point
✅ config.js             - Configuration schema
✅ actions.js            - All button actions
✅ feedbacks.js          - Button state feedbacks
✅ variables.js          - Dynamic variables
✅ presets.js            - Pre-built button layouts
✅ api.js                - REST/WebSocket client
✅ README.md             - User documentation
✅ CHANGELOG.md          - Version history
✅ LICENSE               - MIT License
✅ .gitignore            - Ignore node_modules, etc.
📝 DEVELOPMENT.md        - Developer setup guide
📝 TESTING.md            - Test scenarios
📝 examples/             - Sample Companion pages
```

---

## Conclusion

This comprehensive plan provides:

1. **Complete API audit** - All existing endpoints documented
2. **Gap analysis** - Missing functionality identified and prioritized
3. **Structured roadmap** - 6-week development plan with clear milestones
4. **Implementation details** - Code examples for all major components
5. **Risk mitigation** - Technical and UX risks addressed
6. **Success criteria** - Measurable goals for launch

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1: API Gap Closure
3. Set up Companion module repository
4. Initialize testing infrastructure

**Estimated Total Effort:** 6 weeks (1 developer, part-time)  
**Complexity:** Medium (REST API + WebSocket + Companion SDK)  
**Value:** High (professional broadcast integration)
