# Countdown Timer API Documentation

**Version:** 2.0.0  
**Base URL:** `http://localhost:9999/api`  
**WebSocket URL:** `ws://localhost:8080`  
**Last Updated:** March 6, 2026

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [System](#system)
  - [Timer Control](#timer-control)
  - [Time Management](#time-management)
  - [Presets](#presets)
  - [Layouts](#layouts)
  - [Messages](#messages)
  - [Sound Control](#sound-control)
  - [Display Effects](#display-effects)
  - [Settings](#settings)
- [WebSocket Events](#websocket-events)
- [Examples](#examples)

---

## Overview

The Countdown Timer REST API provides comprehensive control over timer functionality, enabling integration with broadcast systems, automation tools, and control surfaces like Bitfocus Companion.

### Available Protocols

- **REST API** - Port 9999 (HTTP)
- **WebSocket** - Port 8080 (Real-time updates)
- **OSC** - Ports 7000/7001 (OSC protocol)

### Features

- Full timer control (start, stop, pause, resume, reset)
- Flexible time management (hours, minutes, seconds)
- Preset loading and management
- Layout switching
- Message overlay control
- Sound control
- Display effects (flash)
- Real-time state updates via WebSocket

---

## Authentication

Currently, the API does not require authentication when accessed from localhost. For external access, ensure the "Allow External Connections" option is enabled in settings.

---

## Response Format

All API responses follow a consistent JSON format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* ... relevant data ... */ },
  "timestamp": 1772755916339
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error description",
  "timestamp": 1772755916339
}
```

---

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Endpoint not found
- `500` - Internal server error

### Common Errors

```json
{
  "success": false,
  "error": "Hours must be between 0 and 99"
}
```

```json
{
  "success": false,
  "error": "layoutId is required and must be a string"
}
```

---

## Endpoints

### System

#### Get Health Status

Get API server health and version information.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 170.5453975,
  "timestamp": 1772755916339,
  "version": "2.0.0",
  "apis": {
    "rest": "http://localhost:9999",
    "websocket": "ws://localhost:8080",
    "osc": "osc://localhost:7000"
  }
}
```

**Example:**
```bash
curl http://localhost:9999/api/health
```

---

#### Get API Documentation

Get list of all available endpoints.

**Endpoint:** `GET /`

**Response:**
```json
{
  "version": "2.0.0",
  "title": "Countdown Timer Unified API",
  "description": "Professional timer control via REST, WebSocket, and OSC protocols",
  "protocols": {
    "rest": {
      "baseUrl": "http://localhost:9999/api",
      "endpoints": { /* ... */ }
    }
  }
}
```

**Example:**
```bash
curl http://localhost:9999/api
```

---

### Timer Control

#### Get Timer State

Get current timer state and all related information.

**Endpoint:** `GET /timer/state`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "main-timer",
    "name": "Main Timer",
    "totalTime": 600,
    "remainingTime": 450,
    "elapsedTime": 150,
    "isRunning": true,
    "isPaused": false,
    "isOvertime": false,
    "startTime": "2026-03-06T10:30:00.000Z",
    "endTime": "2026-03-06T10:37:30.000Z",
    "endTimeFormatted": "10:37 AM",
    "formattedTime": "00:07:30",
    "formattedElapsed": "00:02:30",
    "percentage": 25,
    "remainingPercentage": 75,
    "warningLevel": "normal",
    "warningColor": "#4ade80",
    "messageVisible": false,
    "messageText": "",
    "featureImageEnabled": false,
    "soundMuted": false
  },
  "timestamp": 1772755916339
}
```

**Example:**
```bash
curl http://localhost:9999/api/timer/state
```

---

#### Get Timer State (Legacy)

Get timer state in legacy format for backward compatibility.

**Endpoint:** `GET /timer`

**Response:**
```json
{
  "success": true,
  "timer": {
    "running": true,
    "paused": false,
    "time_remaining": 450,
    "time_total": 600,
    "time_elapsed": 150,
    "formatted_time": "00:07:30",
    "formatted_elapsed": "00:02:30",
    "percentage": 75,
    "end_time": "2026-03-06T10:37:30.000Z"
  }
}
```

---

#### Start Timer

Start the countdown timer.

**Endpoint:** `POST /timer/start`

**Response:**
```json
{
  "success": true,
  "message": "Timer start command sent"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/start
```

---

#### Stop Timer

Stop the running timer.

**Endpoint:** `POST /timer/stop`

**Response:**
```json
{
  "success": true,
  "message": "Timer stop command sent"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/stop
```

---

#### Pause Timer

Pause the running timer.

**Endpoint:** `POST /timer/pause`

**Response:**
```json
{
  "success": true,
  "message": "Timer pause command sent"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/pause
```

---

#### Resume Timer

Resume a paused timer.

**Endpoint:** `POST /timer/resume`

**Response:**
```json
{
  "success": true,
  "message": "Timer resume command sent"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/resume
```

---

#### Reset Timer

Reset the timer to its initial duration.

**Endpoint:** `POST /timer/reset`

**Response:**
```json
{
  "success": true,
  "message": "Timer reset command sent"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/reset
```

---

### Time Management

#### Set Total Time

Set the timer's total duration using hours, minutes, and seconds or total seconds.

**Endpoint:** `POST /timer/set-time`

**Request Body:**
```json
{
  "hours": 1,
  "minutes": 30,
  "seconds": 0
}
```

OR

```json
{
  "totalSeconds": 5400
}
```

**Response:**
```json
{
  "success": true,
  "message": "Set time command sent",
  "totalSeconds": 5400,
  "timeSet": {
    "totalSeconds": 5400,
    "hours": 1,
    "minutes": 30,
    "seconds": 0,
    "formatted": "01:30:00"
  }
}
```

**Examples:**
```bash
# Using components
curl -X POST http://localhost:9999/api/timer/set-time \
  -H "Content-Type: application/json" \
  -d '{"hours": 1, "minutes": 30, "seconds": 0}'

# Using total seconds
curl -X POST http://localhost:9999/api/timer/set-time \
  -H "Content-Type: application/json" \
  -d '{"totalSeconds": 600}'
```

---

#### Set Hours

Set only the hours component of the timer.

**Endpoint:** `POST /timer/hours/:value`

**Parameters:**
- `value` - Integer between 0 and 99

**Response:**
```json
{
  "success": true,
  "message": "Hours set to 2",
  "data": {
    "hours": 2
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/hours/2
```

**Validation:**
- Must be between 0 and 99
- Timer will be stopped if currently running

---

#### Set Minutes

Set only the minutes component of the timer.

**Endpoint:** `POST /timer/minutes/:value`

**Parameters:**
- `value` - Integer between 0 and 59

**Response:**
```json
{
  "success": true,
  "message": "Minutes set to 30",
  "data": {
    "minutes": 30
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/minutes/30
```

**Validation:**
- Must be between 0 and 59
- Timer will be stopped if currently running

---

#### Set Seconds

Set only the seconds component of the timer.

**Endpoint:** `POST /timer/seconds/:value`

**Parameters:**
- `value` - Integer between 0 and 59

**Response:**
```json
{
  "success": true,
  "message": "Seconds set to 45",
  "data": {
    "seconds": 45
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/seconds/45
```

**Validation:**
- Must be between 0 and 59
- Timer will be stopped if currently running

---

#### Adjust Time

Adjust the timer by adding or subtracting seconds or minutes.

**Endpoint:** `POST /timer/adjust`

**Request Body:**
```json
{
  "seconds": 30,
  "minutes": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Time adjust command sent",
  "adjustment": 90
}
```

**Example:**
```bash
# Add 1 minute and 30 seconds
curl -X POST http://localhost:9999/api/timer/adjust \
  -H "Content-Type: application/json" \
  -d '{"minutes": 1, "seconds": 30}'

# Subtract 30 seconds
curl -X POST http://localhost:9999/api/timer/adjust \
  -H "Content-Type: application/json" \
  -d '{"seconds": -30}'
```

---

#### Add One Minute

Add exactly 60 seconds to the timer.

**Endpoint:** `POST /timer/add-minute`

**Response:**
```json
{
  "success": true,
  "message": "Added 1 minute",
  "data": {
    "adjustment": 60
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/add-minute
```

**Note:** Only works when timer is stopped.

---

#### Subtract One Minute

Subtract exactly 60 seconds from the timer.

**Endpoint:** `POST /timer/subtract-minute`

**Response:**
```json
{
  "success": true,
  "message": "Subtracted 1 minute",
  "data": {
    "adjustment": -60
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/timer/subtract-minute
```

**Note:** Only works when timer is stopped. Prevents negative time.

---

### Presets

#### Get All Presets

Retrieve list of all saved timer presets.

**Endpoint:** `GET /presets`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "0",
      "name": "5 Minutes",
      "duration": 300,
      "category": "default"
    },
    {
      "id": "1",
      "name": "15 Minutes",
      "duration": 900,
      "category": "default"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:9999/api/presets
```

---

#### Create Preset

Create a new timer preset.

**Endpoint:** `POST /presets`

**Request Body:**
```json
{
  "name": "Commercial Break",
  "duration": 180,
  "category": "custom",
  "settings": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preset create command sent",
  "data": {
    "id": "1709715916339",
    "name": "Commercial Break",
    "duration": 180,
    "category": "custom",
    "settings": {},
    "createdAt": "2026-03-06T10:30:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/presets \
  -H "Content-Type: application/json" \
  -d '{"name": "Commercial Break", "duration": 180, "category": "custom"}'
```

---

#### Load Preset

Load a specific preset by ID.

**Endpoint:** `POST /presets/:id/load`

**Parameters:**
- `id` - Preset ID

**Response:**
```json
{
  "success": true,
  "message": "Preset load command sent",
  "presetId": "1"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/presets/1/load
```

---

### Layouts

#### Get Available Layouts

Get list of all available timer layouts (built-in and custom).

**Endpoint:** `GET /layouts`

**Response:**
```json
{
  "success": true,
  "data": [
    {"id": "classic", "name": "Classic", "description": "...", "type": "builtin"},
    {"id": "minimal", "name": "Minimal", "description": "...", "type": "builtin"},
    {"id": "clockfocus", "name": "Clock Focus", "description": "...", "type": "builtin"},
    {"id": "detailed", "name": "Detailed", "description": "...", "type": "builtin"},
    {"id": "circular", "name": "Circular", "description": "...", "type": "builtin"},
    {"id": "video", "name": "Video Input", "description": "...", "type": "builtin"},
    {"id": "my_custom", "name": "My Custom Layout", "description": "...", "type": "custom"}
  ]
}
```

Each layout object includes:
- `id` - Unique layout identifier (use with `POST /layout`)
- `name` - Human-readable display name
- `description` - Layout description
- `type` - Either `"builtin"` or `"custom"`

**Example:**
```bash
curl http://localhost:9999/api/layouts
```

---

#### Change Layout

Switch to a different timer layout. Accepts any valid layout ID (built-in or custom).

**Endpoint:** `POST /layout`

**Request Body:**
```json
{
  "layoutId": "minimal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Layout changed to minimal",
  "data": {
    "layoutId": "minimal"
  }
}
```

**Error Response (invalid layout):**
```json
{
  "success": false,
  "error": "Layout 'nonexistent' not found"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/layout \
  -H "Content-Type: application/json" \
  -d '{"layoutId": "minimal"}'
```

**Built-in Layout IDs:**
- `classic` - Traditional countdown display
- `minimal` - Clean minimal design
- `clockfocus` - Large clock-focused display
- `detailed` - Detailed information layout
- `circular` - Circular progress display
- `video` - Layout optimized for video input

Custom layouts created via the Layout Creator are also available. Use `GET /layouts` to discover all available layout IDs.

---

### Messages

#### Send Message

Display a message overlay on the timer.

**Endpoint:** `POST /message`

**Request Body:**
```json
{
  "text": "Welcome to the show!",
  "duration": 5000
}
```

**Parameters:**
- `text` (required) - Message text to display
- `duration` (optional) - Auto-hide duration in milliseconds

**Response:**
```json
{
  "success": true,
  "message": "Message sent",
  "data": {
    "text": "Welcome to the show!",
    "duration": 5000
  }
}
```

**Examples:**
```bash
# Message with 5-second duration
curl -X POST http://localhost:9999/api/message \
  -H "Content-Type: application/json" \
  -d '{"text": "Welcome to the show!", "duration": 5000}'

# Persistent message (no auto-hide)
curl -X POST http://localhost:9999/api/message \
  -H "Content-Type: application/json" \
  -d '{"text": "Stand by..."}'
```

---

#### Show Message

Display a message (persistent, no auto-hide).

**Endpoint:** `POST /message/show`

**Request Body:**
```json
{
  "text": "Recording in progress"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent",
  "data": {
    "text": "Recording in progress"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/message/show \
  -H "Content-Type: application/json" \
  -d '{"text": "Recording in progress"}'
```

---

#### Hide Message

Hide the currently displayed message.

**Endpoint:** `POST /message/hide`

**Response:**
```json
{
  "success": true,
  "message": "Message hidden"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/message/hide
```

---

#### Toggle Message

Toggle message visibility on/off.

**Endpoint:** `POST /message/toggle`

**Response:**
```json
{
  "success": true,
  "message": "Message toggled"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/message/toggle
```

---

### Sound Control

#### Mute Sound

Mute all timer sounds.

**Endpoint:** `POST /sound/mute`

**Response:**
```json
{
  "success": true,
  "message": "Sound muted"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/sound/mute
```

---

#### Unmute Sound

Enable timer sounds.

**Endpoint:** `POST /sound/unmute`

**Response:**
```json
{
  "success": true,
  "message": "Sound unmuted"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/sound/unmute
```

---

#### Toggle Sound

Toggle sound mute state.

**Endpoint:** `POST /sound/toggle`

**Response:**
```json
{
  "success": true,
  "message": "Sound toggled"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/sound/toggle
```

---

### Display Effects

#### Trigger Flash

Trigger a red overlay flash effect on the display. The flash animates a red overlay that pulses on and off.

**Endpoint:** `POST /timer/flash` or `POST /display/flash`

**Request Body (optional):**
```json
{
  "cycles": 3,
  "duration": 500
}
```

**Parameters:**
- `cycles` (optional, default: 3) - Number of flash cycles
- `duration` (optional, default: 500) - Duration of each flash in milliseconds

**Response:**
```json
{
  "success": true,
  "message": "Flash command sent",
  "cycles": 3,
  "duration": 500
}
```

**Examples:**
```bash
# Default flash (3 cycles, 500ms each)
curl -X POST http://localhost:9999/api/timer/flash

# Custom flash (5 cycles, 300ms each)
curl -X POST http://localhost:9999/api/display/flash \
  -H "Content-Type: application/json" \
  -d '{"cycles": 5, "duration": 300}'
```

---

#### Toggle Feature Image

Toggle the background/feature image on/off.

**Endpoint:** `POST /display/toggle-feature-image`

**Response:**
```json
{
  "success": true,
  "message": "Feature image toggled"
}
```

**Example:**
```bash
curl -X POST http://localhost:9999/api/display/toggle-feature-image
```

---

#### Set Feature Image State

Explicitly set the feature image state.

**Endpoint:** `POST /display/feature-image`

**Request Body:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feature image enabled",
  "data": {
    "enabled": true
  }
}
```

**Examples:**
```bash
# Enable feature image
curl -X POST http://localhost:9999/api/display/feature-image \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Disable feature image
curl -X POST http://localhost:9999/api/display/feature-image \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

### Settings

#### Get Settings

Retrieve all application settings.

**Endpoint:** `GET /settings`

**Response:**
```json
{
  "success": true,
  "data": {
    "autoReset": false,
    "companionEnabled": true,
    "soundEnabled": true,
    "flashEnabled": true,
    "releaseCameraIdle": true
  }
}
```

**Example:**
```bash
curl http://localhost:9999/api/settings
```

---

#### Update Settings

Update application settings.

**Endpoint:** `PUT /settings`

**Request Body:**
```json
{
  "autoReset": true,
  "soundEnabled": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings update command sent",
  "data": {
    "autoReset": true,
    "soundEnabled": false
  }
}
```

**Example:**
```bash
curl -X PUT http://localhost:9999/api/settings \
  -H "Content-Type: application/json" \
  -d '{"autoReset": true, "soundEnabled": false}'
```

---

## WebSocket Events

Connect to `ws://localhost:8080` for real-time updates.

### Client → Server Events

```javascript
const socket = io('ws://localhost:8080');

// Timer control
socket.emit('timer-start');
socket.emit('timer-stop');
socket.emit('timer-pause');
socket.emit('timer-resume');
socket.emit('timer-reset');

// Time management
socket.emit('set-time', { totalSeconds: 600 });
socket.emit('adjust-time', { seconds: 30 });

// Presets
socket.emit('load-preset', { presetId: '1' });

// Get state
socket.emit('get-state');

// Ping
socket.emit('ping');
```

### Server → Client Events

```javascript
// Connection established
socket.on('connection-established', (data) => {
  console.log('Connected:', data);
});

// Timer state updates (full state object on every tick)
socket.on('timer-update', (state) => {
  // state contains: id, name, totalTime, remainingTime, elapsedTime,
  // isRunning, isPaused, isOvertime, formattedTime, formattedElapsed,
  // percentage, remainingPercentage, warningLevel, warningColor,
  // endTimeFormatted, messageVisible, messageText,
  // featureImageEnabled, soundMuted, timestamp
  console.log('Timer updated:', state);
});

// Command confirmations
socket.on('timer-start-requested', () => {});
socket.on('timer-stop-requested', () => {});
socket.on('timer-pause-requested', () => {});
socket.on('timer-resume-requested', () => {});
socket.on('timer-reset-requested', () => {});

// Time changes
socket.on('time-set-requested', (data) => {});
socket.on('time-adjust-requested', (data) => {});
socket.on('time-component-set', (data) => {});
socket.on('time-adjusted', (data) => {});

// Presets
socket.on('preset-load-requested', (data) => {});

// Display
socket.on('flash-requested', (data) => {});
socket.on('feature-image-toggled', () => {});
socket.on('feature-image-set', (data) => {});

// Layout
socket.on('layout-changed', (data) => {});

// Messages
socket.on('message-sent', (data) => {});
socket.on('message-hidden', () => {});
socket.on('message-toggled', () => {});

// Sound (payloads include { soundMuted: true/false })
socket.on('sound-muted', (data) => { /* data.soundMuted === true */ });
socket.on('sound-unmuted', (data) => { /* data.soundMuted === false */ });
socket.on('sound-toggled', (data) => { /* data.soundMuted reflects new state */ });

// Responses
socket.on('command-response', (data) => {});

// Pong
socket.on('pong', (data) => {
  console.log('Latency:', Date.now() - data.timestamp);
});
```

---

## Examples

### Complete Timer Control Sequence

```bash
#!/bin/bash

API="http://localhost:9999/api"

# Set timer to 10 minutes
curl -X POST $API/timer/set-time \
  -H "Content-Type: application/json" \
  -d '{"minutes": 10}'

# Start the timer
curl -X POST $API/timer/start

# Wait 5 seconds
sleep 5

# Pause the timer
curl -X POST $API/timer/pause

# Add 2 minutes
curl -X POST $API/timer/add-minute
curl -X POST $API/timer/add-minute

# Resume
curl -X POST $API/timer/resume

# Check state
curl $API/timer/state | jq '.data.formattedTime'

# Stop when done
curl -X POST $API/timer/stop
```

---

### Broadcast Integration Example

```bash
#!/bin/bash

API="http://localhost:9999/api"

# Pre-show: Set 15-minute timer
curl -X POST $API/timer/minutes/15
curl -X POST $API/layout \
  -H "Content-Type: application/json" \
  -d '{"layoutId": "modern"}'

# Show message
curl -X POST $API/message \
  -H "Content-Type: application/json" \
  -d '{"text": "Show starts in 15 minutes"}'

# Start countdown
curl -X POST $API/timer/start

# 5 minutes before show: Flash alert
sleep 600  # Wait 10 minutes
curl -X POST $API/display/flash \
  -H "Content-Type: application/json" \
  -d '{"cycles": 5, "duration": 300}'

# Update message
curl -X POST $API/message \
  -H "Content-Type: application/json" \
  -d '{"text": "Show starts in 5 minutes"}'
```

---

### WebSocket Real-time Monitoring

```javascript
// Node.js example
const io = require('socket.io-client');
const socket = io('ws://localhost:8080');

socket.on('connect', () => {
  console.log('Connected to Countdown Timer');
  
  // Request current state
  socket.emit('get-state');
});

socket.on('timer-update', (state) => {
  console.log(`Time Remaining: ${state.formattedTime}`);
  console.log(`Time Elapsed: ${state.formattedElapsed}`);
  console.log(`Percentage: ${state.remainingPercentage}%`);
  console.log(`Warning: ${state.warningLevel} (${state.warningColor})`);
  console.log(`Status: ${state.isRunning ? 'Running' : 'Stopped'}`);
  console.log(`Sound Muted: ${state.soundMuted}`);
  
  // Alert when time is low
  if (state.remainingTime <= 60 && state.isRunning) {
    console.log('⚠️  WARNING: Less than 1 minute remaining!');
  }
});

socket.on('timer-start-requested', () => {
  console.log('✅ Timer started');
});

socket.on('timer-stop-requested', () => {
  console.log('⏹️  Timer stopped');
});
```

---

### Python Integration Example

```python
import requests
import json

API_BASE = "http://localhost:9999/api"

class CountdownTimer:
    def __init__(self, base_url=API_BASE):
        self.base_url = base_url
    
    def start(self):
        return requests.post(f"{self.base_url}/timer/start").json()
    
    def stop(self):
        return requests.post(f"{self.base_url}/timer/stop").json()
    
    def set_time(self, hours=0, minutes=0, seconds=0):
        data = {"hours": hours, "minutes": minutes, "seconds": seconds}
        return requests.post(
            f"{self.base_url}/timer/set-time",
            json=data
        ).json()
    
    def get_state(self):
        return requests.get(f"{self.base_url}/timer/state").json()
    
    def send_message(self, text, duration=None):
        data = {"text": text}
        if duration:
            data["duration"] = duration
        return requests.post(
            f"{self.base_url}/message",
            json=data
        ).json()

# Usage
timer = CountdownTimer()

# Set 5 minute timer
timer.set_time(minutes=5)

# Start countdown
timer.start()

# Check status
state = timer.get_state()
print(f"Time remaining: {state['data']['formattedTime']}")

# Send message
timer.send_message("Recording in progress", duration=10000)
```

---

## Quick Reference Table

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **System** | `/health` | GET | Health check |
| | `/` | GET | API documentation |
| **Timer Control** | `/timer/state` | GET | Get current state |
| | `/timer` | GET | Get state (legacy) |
| | `/timer/start` | POST | Start timer |
| | `/timer/stop` | POST | Stop timer |
| | `/timer/pause` | POST | Pause timer |
| | `/timer/resume` | POST | Resume timer |
| | `/timer/reset` | POST | Reset timer |
| **Time Management** | `/timer/set-time` | POST | Set total time |
| | `/timer/hours/:value` | POST | Set hours (0-99) |
| | `/timer/minutes/:value` | POST | Set minutes (0-59) |
| | `/timer/seconds/:value` | POST | Set seconds (0-59) |
| | `/timer/adjust` | POST | Adjust time |
| | `/timer/add-minute` | POST | Add 1 minute |
| | `/timer/subtract-minute` | POST | Subtract 1 minute |
| **Presets** | `/presets` | GET | List presets |
| | `/presets` | POST | Create preset |
| | `/presets/:id/load` | POST | Load preset |
| **Layouts** | `/layouts` | GET | List layouts |
| | `/layout` | POST | Change layout |
| **Messages** | `/message` | POST | Send message |
| | `/message/show` | POST | Show message |
| | `/message/hide` | POST | Hide message |
| | `/message/toggle` | POST | Toggle message |
| **Sound** | `/sound/mute` | POST | Mute sound |
| | `/sound/unmute` | POST | Unmute sound |
| | `/sound/toggle` | POST | Toggle mute |
| **Display** | `/timer/flash` | POST | Trigger flash |
| | `/display/flash` | POST | Trigger flash |
| | `/display/toggle-feature-image` | POST | Toggle background |
| | `/display/feature-image` | POST | Set background state |
| **Settings** | `/settings` | GET | Get settings |
| | `/settings` | PUT | Update settings |

---

## Testing

Use the included test script to verify all endpoints:

```bash
./test-api-endpoints.sh
```

Or test individual endpoints with curl:

```bash
# Health check
curl http://localhost:9999/api/health

# Set timer to 10 minutes
curl -X POST http://localhost:9999/api/timer/minutes/10

# Get current state
curl http://localhost:9999/api/timer/state | jq
```

---

## Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/your-repo/issues)
- **Documentation:** [Additional guides](./README.md)
- **API Version:** Check `/api/health` for current version

---

**Last Updated:** March 6, 2026  
**API Version:** 2.0.0
