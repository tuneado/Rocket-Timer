# API Implementation Checklist - Companion Module Preparation

**Quick Reference:** Missing endpoints that need implementation before Companion module development

---

## HIGH PRIORITY - Week 1

### 1. Individual Time Component Setters
**Location:** `src/main/unifiedApiServer.js`

```javascript
// Add after existing timer endpoints (around line 180)

this.app.post('/api/timer/hours/:value', (req, res) => {
  const hours = parseInt(req.params.value)
  if (isNaN(hours) || hours < 0 || hours > 99) {
    return res.status(400).json({
      success: false,
      error: 'Hours must be between 0 and 99'
    })
  }
  const result = this.setHours(hours)
  res.json(result)
})

this.app.post('/api/timer/minutes/:value', (req, res) => {
  const minutes = parseInt(req.params.value)
  if (isNaN(minutes) || minutes < 0 || minutes > 59) {
    return res.status(400).json({
      success: false,
      error: 'Minutes must be between 0 and 59'
    })
  }
  const result = this.setMinutes(minutes)
  res.json(result)
})

this.app.post('/api/timer/seconds/:value', (req, res) => {
  const seconds = parseInt(req.params.value)
  if (isNaN(seconds) || seconds < 0 || seconds > 59) {
    return res.status(400).json({
      success: false,
      error: 'Seconds must be between 0 and 59'
    })
  }
  const result = this.setSeconds(seconds)
  res.json(result)
})
```

**Implementation Methods:**
```javascript
// Add these methods to UnifiedTimerAPIServer class

setHours(hours) {
  try {
    this.sendCommand('setHours', { hours })
    return {
      success: true,
      message: `Hours set to ${hours}`,
      data: { hours }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

setMinutes(minutes) {
  try {
    this.sendCommand('setMinutes', { minutes })
    return {
      success: true,
      message: `Minutes set to ${minutes}`,
      data: { minutes }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

setSeconds(seconds) {
  try {
    this.sendCommand('setSeconds', { seconds })
    return {
      success: true,
      message: `Seconds set to ${seconds}`,
      data: { seconds }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

---

### 2. Minute Increment/Decrement
**Location:** `src/main/unifiedApiServer.js`

```javascript
this.app.post('/api/timer/add-minute', (req, res) => {
  const result = this.addMinute()
  res.json(result)
})

this.app.post('/api/timer/subtract-minute', (req, res) => {
  const result = this.subtractMinute()
  res.json(result)
})
```

**Implementation Methods:**
```javascript
addMinute() {
  try {
    this.sendCommand('addMinute', {})
    return {
      success: true,
      message: 'Added 1 minute',
      data: { adjustment: 60 }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

subtractMinute() {
  try {
    this.sendCommand('subtractMinute', {})
    return {
      success: true,
      message: 'Subtracted 1 minute',
      data: { adjustment: -60 }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

---

### 3. Sound Control
**Location:** `src/main/unifiedApiServer.js`

```javascript
this.app.post('/api/sound/mute', (req, res) => {
  const result = this.muteSound()
  res.json(result)
})

this.app.post('/api/sound/unmute', (req, res) => {
  const result = this.unmuteSound()
  res.json(result)
})

this.app.post('/api/sound/toggle', (req, res) => {
  const result = this.toggleSound()
  res.json(result)
})
```

**Implementation Methods:**
```javascript
muteSound() {
  try {
    this.sendCommand('muteSound', {})
    return {
      success: true,
      message: 'Sound muted'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

unmuteSound() {
  try {
    this.sendCommand('unmuteSound', {})
    return {
      success: true,
      message: 'Sound unmuted'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

toggleSound() {
  try {
    this.sendCommand('toggleSound', {})
    return {
      success: true,
      message: 'Sound toggled'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

---

### 4. Feature Image Control
**Location:** `src/main/unifiedApiServer.js`

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

**Implementation Methods:**
```javascript
toggleFeatureImage() {
  try {
    this.sendCommand('toggleFeatureImage', {})
    return {
      success: true,
      message: 'Feature image toggled'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

setFeatureImage(enabled) {
  try {
    this.sendCommand('setFeatureImage', { enabled })
    return {
      success: true,
      message: `Feature image ${enabled ? 'enabled' : 'disabled'}`,
      data: { enabled }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

---

### 5. Layout & Message Endpoints (Verify/Port from Legacy)
**Check if these exist in unifiedApiServer, if not, add:**

```javascript
this.app.get('/api/layouts', (req, res) => {
  const result = this.getLayouts()
  res.json(result)
})

this.app.post('/api/layout', (req, res) => {
  const { layoutId } = req.body
  const result = this.setLayout(layoutId)
  res.json(result)
})

this.app.post('/api/message', (req, res) => {
  const { text, duration } = req.body
  const result = this.sendMessage(text, duration)
  res.json(result)
})

this.app.post('/api/message/toggle', (req, res) => {
  const result = this.toggleMessage()
  res.json(result)
})
```

---

## MEDIUM PRIORITY - Week 2

### 6. Camera Control
```javascript
this.app.get('/api/camera/status', (req, res) => {
  res.json({
    success: true,
    data: {
      active: this.timerState.camera?.active || false,
      deviceId: this.timerState.camera?.deviceId,
      deviceLabel: this.timerState.camera?.deviceLabel,
      opacity: this.timerState.camera?.opacity || 1.0
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
```

---

### 7. Display Window Control
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

---

### 8. Video Settings (Mirror & Scaling)
```javascript
this.app.post('/api/video/mirror', (req, res) => {
  const { enabled } = req.body
  const result = this.setVideoMirror(enabled)
  res.json(result)
})

this.app.post('/api/video/scaling', (req, res) => {
  const { mode } = req.body // contain|cover|stretch|none
  if (!['contain', 'cover', 'stretch', 'none'].includes(mode)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid scaling mode. Must be: contain, cover, stretch, or none'
    })
  }
  const result = this.setVideoScaling(mode)
  res.json(result)
})
```

---

## HELPER: sendCommand Method

**Verify this exists in UnifiedTimerAPIServer (should be around line 580-620):**

```javascript
sendCommand(action, data = {}) {
  if (!this.mainWindow || this.mainWindow.isDestroyed()) {
    throw new Error('Main window not available')
  }
  
  this.mainWindow.webContents.send('api-command', {
    action,
    data
  })
  
  // Broadcast to WebSocket clients
  if (this.wss) {
    this.broadcast({
      type: 'command-sent',
      action,
      data,
      timestamp: Date.now()
    })
  }
}
```

---

## Testing Checklist

### After each endpoint implementation:

1. **Start Timer app**
   ```bash
   npm start
   ```

2. **Test with cURL**
   ```bash
   # Test health
   curl http://localhost:9999/api/health
   
   # Test new endpoints
   curl -X POST http://localhost:9999/api/timer/hours/1
   curl -X POST http://localhost:9999/api/timer/add-minute
   curl -X POST http://localhost:9999/api/sound/mute
   curl -X POST http://localhost:9999/api/display/toggle-feature-image
   ```

3. **Verify state update**
   ```bash
   curl http://localhost:9999/api/timer/state | jq
   ```

4. **Test WebSocket broadcast**
   - Open browser console: `ws://localhost:8080`
   - Trigger endpoint
   - Verify `stateUpdate` event received

5. **Check UI update**
   - Verify Timer UI reflects changes
   - Check display window if open
   - Verify settings persistence

---

## IPC Command Handler Checklist

**File:** `src/renderer/js/modules/ipcHandlers.js`

**Verify these cases exist in the `api-command` handler (around line 370):**

```javascript
ipcRenderer.on('api-command', (command) => {
  const { action, data } = command
  
  switch (action) {
    // These should already exist ✅
    case 'start-timer':
    case 'stop-timer':
    case 'pause-timer':
    case 'resume-timer':
    case 'reset-timer':
    
    // Add these if missing ❌
    case 'setHours':
      // Get current M:S, update hours input, call updateTimeFromInputs()
      break
      
    case 'setMinutes':
      // Get current H:S, update minutes input, call updateTimeFromInputs()
      break
      
    case 'setSeconds':
      // Get current H:M, update seconds input, call updateTimeFromInputs()
      break
      
    case 'addMinute':
      // Call existing addMinute logic from companion-command handler
      break
      
    case 'subtractMinute':
      // Call existing subtractMinute logic from companion-command handler
      break
      
    case 'muteSound':
      // Call actions.setMuteState(true)
      break
      
    case 'unmuteSound':
      // Call actions.setMuteState(false)
      break
      
    case 'toggleSound':
      // Call actions.toggleMuteState()
      break
      
    case 'toggleFeatureImage':
      // Click feature image button
      break
      
    case 'setFeatureImage':
      // Set specific state
      break
  }
})
```

---

## Update API Documentation

**File:** `src/main/unifiedApiServer.js` (around line 890)

**Add to `getAPIDocumentation()` method:**

```javascript
'POST /timer/hours/:value': 'Set hours component (0-99)',
'POST /timer/minutes/:value': 'Set minutes component (0-59)',
'POST /timer/seconds/:value': 'Set seconds component (0-59)',
'POST /timer/add-minute': 'Add 1 minute to timer',
'POST /timer/subtract-minute': 'Subtract 1 minute from timer',
'POST /sound/mute': 'Mute sound',
'POST /sound/unmute': 'Unmute sound',
'POST /sound/toggle': 'Toggle sound mute state',
'POST /display/toggle-feature-image': 'Toggle background image',
'POST /display/feature-image': 'Set feature image state (body: {enabled: boolean})',
'GET  /camera/status': 'Get camera status',
'POST /camera/start': 'Start camera',
'POST /camera/stop': 'Stop camera',
'POST /camera/toggle': 'Toggle camera',
'GET  /display/status': 'Get display window status',
'POST /display/open': 'Open display window',
'POST /display/close': 'Close display window',
'POST /display/toggle': 'Toggle display window',
'POST /video/mirror': 'Set video mirror (body: {enabled: boolean})',
'POST /video/scaling': 'Set video scaling mode (body: {mode: "contain|cover|stretch|none"})'
```

---

## Quick Start Implementation Order

1. **Day 1:** Individual time setters (hours/minutes/seconds) + tests
2. **Day 2:** Minute increment/decrement + tests
3. **Day 3:** Sound control endpoints + tests
4. **Day 4:** Feature image control + tests
5. **Day 5:** Layout/Message endpoints (verify/port) + tests
6. **Week 2:** Camera, Display, Video endpoints + comprehensive testing

---

## Success Criteria

- [ ] All 25+ new endpoints implemented
- [ ] All endpoints return consistent JSON format
- [ ] All commands trigger IPC to renderer
- [ ] State updates broadcast via WebSocket
- [ ] API documentation page updated
- [ ] All cURL tests pass
- [ ] UI reflects all API changes
- [ ] No breaking changes to existing endpoints

**Ready for Companion module development when all checkboxes are complete.**
