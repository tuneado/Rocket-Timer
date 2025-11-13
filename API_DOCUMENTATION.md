# Countdown Timer API Documentation

This document provides comprehensive documentation for the Countdown Timer's unified API system, which supports REST, WebSocket, and OSC protocols for remote control.

## Overview

The Countdown Timer API allows you to control the timer remotely from:
- Web applications (via REST or WebSocket)
- Mobile apps (via REST or WebSocket)
- Broadcast production systems (via OSC)
- Automation scripts (any protocol)

All three protocols provide access to the same functionality and receive the same real-time updates.

## Getting Started

### Enable the APIs

By default, all APIs are enabled when the application starts. Configuration options will be added in a future update to allow individual control.

### Default Ports

- **REST API**: `http://localhost:3000`
- **WebSocket API**: `ws://localhost:3001`
- **OSC Input**: UDP port `8000`
- **OSC Output**: UDP port `8001` to `127.0.0.1`

---

## REST API

The REST API provides HTTP endpoints for controlling the timer.

### Base URL

```
http://localhost:3000
```

### Authentication (Optional)

If an API key is configured, include it in requests:

**Header:**
```
X-API-Key: your-api-key-here
```

**Query parameter:**
```
?apiKey=your-api-key-here
```

### Endpoints

#### Status & Health

##### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2025-11-13T16:00:00.000Z"
}
```

##### GET `/api/status`

Get complete application state.

**Response:**
```json
{
  "success": true,
  "data": {
    "timer": {
      "remainingTime": 1500,
      "totalTime": 1500,
      "running": false,
      "formattedTime": "00:25:00"
    },
    "clock": {
      "time": "16:23:45",
      "visible": true
    },
    "message": {
      "text": "",
      "visible": false
    },
    "display": {
      "windowVisible": true
    }
  }
}
```

#### Timer Control

##### POST `/api/timer/start`

Start the timer.

**Response:**
```json
{
  "success": true,
  "message": "Timer started"
}
```

##### POST `/api/timer/stop`

Stop the timer.

**Response:**
```json
{
  "success": true,
  "message": "Timer stopped"
}
```

##### POST `/api/timer/reset`

Reset the timer to its last set time.

**Response:**
```json
{
  "success": true,
  "message": "Timer reset"
}
```

##### POST `/api/timer/set`

Set the timer duration.

**Request Body:**
```json
{
  "hours": 0,
  "minutes": 25,
  "seconds": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Timer set",
  "totalSeconds": 1500
}
```

##### POST `/api/timer/adjust`

Adjust the timer by adding or subtracting seconds.

**Request Body:**
```json
{
  "seconds": 60
}
```
*Use negative values to subtract time*

**Response:**
```json
{
  "success": true,
  "message": "Timer adjusted by 60 seconds",
  "seconds": 60
}
```

#### Display Control

##### POST `/api/display/message`

Display a message on the timer.

**Request Body:**
```json
{
  "text": "Your message here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message displayed",
  "text": "Your message here"
}
```

##### DELETE `/api/display/message`

Clear the displayed message.

**Response:**
```json
{
  "success": true,
  "message": "Message cleared"
}
```

##### POST `/api/display/flash`

Trigger the flash animation effect.

**Response:**
```json
{
  "success": true,
  "message": "Flash triggered"
}
```

##### POST `/api/display/window/toggle`

Toggle the display window on/off.

**Response:**
```json
{
  "success": true,
  "message": "Display window toggled",
  "visible": true
}
```

#### Clock Control

##### GET `/api/clock`

Get the current clock state.

**Response:**
```json
{
  "success": true,
  "data": {
    "time": "16:23:45",
    "visible": true
  }
}
```

##### POST `/api/clock/show`

Show the clock.

**Response:**
```json
{
  "success": true,
  "message": "Clock shown"
}
```

##### POST `/api/clock/hide`

Hide the clock.

**Response:**
```json
{
  "success": true,
  "message": "Clock hidden"
}
```

##### POST `/api/clock/toggle`

Toggle clock visibility.

**Response:**
```json
{
  "success": true,
  "message": "Clock shown",
  "visible": true
}
```

#### Presets

##### POST `/api/presets/:index`

Load a preset timer value (index 0-7).

**Example:** `POST /api/presets/3`

**Response:**
```json
{
  "success": true,
  "message": "Preset 3 loaded",
  "index": 3
}
```

### Example: curl Commands

```bash
# Get status
curl http://localhost:3000/api/status

# Start timer
curl -X POST http://localhost:3000/api/timer/start

# Set timer to 5 minutes
curl -X POST http://localhost:3000/api/timer/set \
  -H "Content-Type: application/json" \
  -d '{"hours": 0, "minutes": 5, "seconds": 0}'

# Display a message
curl -X POST http://localhost:3000/api/display/message \
  -H "Content-Type: application/json" \
  -d '{"text": "Break Time!"}'

# With API key
curl http://localhost:3000/api/status \
  -H "X-API-Key: your-api-key"
```

### Example: JavaScript/Fetch

```javascript
// Get status
const response = await fetch('http://localhost:3000/api/status');
const data = await response.json();
console.log(data);

// Start timer
await fetch('http://localhost:3000/api/timer/start', {
  method: 'POST'
});

// Set timer
await fetch('http://localhost:3000/api/timer/set', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hours: 0, minutes: 10, seconds: 0 })
});

// Display message
await fetch('http://localhost:3000/api/display/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Your message here' })
});
```

---

## WebSocket API

The WebSocket API provides real-time bidirectional communication using Socket.IO.

### Connection

```javascript
// Using Socket.IO client
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-api-key-here' // Optional
  }
});

socket.on('connect', () => {
  console.log('Connected to timer!');
});
```

### Events - Send (Client → Server)

#### Timer Events

```javascript
// Start timer
socket.emit('timer:start');

// Stop timer
socket.emit('timer:stop');

// Reset timer
socket.emit('timer:reset');

// Set timer
socket.emit('timer:set', {
  hours: 0,
  minutes: 25,
  seconds: 0
});

// Adjust timer
socket.emit('timer:adjust', {
  seconds: 60 // positive to add, negative to subtract
});
```

#### Display Events

```javascript
// Display message
socket.emit('display:message', {
  text: 'Your message here'
});

// Clear message
socket.emit('display:clearMessage');

// Trigger flash
socket.emit('display:flash');

// Toggle display window
socket.emit('display:toggleWindow');
```

#### Clock Events

```javascript
// Show clock
socket.emit('clock:show');

// Hide clock
socket.emit('clock:hide');

// Toggle clock
socket.emit('clock:toggle');
```

#### Preset Events

```javascript
// Load preset (index 0-7)
socket.emit('preset:load', {
  index: 3
});
```

#### State Query

```javascript
// Request current state
socket.emit('state:get');
```

### Events - Receive (Server → Client)

#### Initial State

```javascript
// Received when first connected
socket.on('state:current', (state) => {
  console.log('Current state:', state);
  // state contains: timer, clock, message, display
});
```

#### Timer Updates

```javascript
// Timer state updated (every second while running)
socket.on('timer:update', (data) => {
  console.log('Remaining:', data.remainingTime);
  console.log('Progress:', data.progress);
});

// Timer started
socket.on('timer:started', (data) => {
  console.log('Timer started');
});

// Timer stopped
socket.on('timer:stopped', (data) => {
  console.log('Timer stopped');
});

// Timer reset
socket.on('timer:reset', (data) => {
  console.log('Timer reset');
});

// Timer set
socket.on('timer:set', (data) => {
  console.log('Timer set to:', data.totalSeconds, 'seconds');
});

// Timer adjusted
socket.on('timer:adjusted', (data) => {
  console.log('Timer adjusted by:', data.seconds, 'seconds');
});
```

#### Clock Updates

```javascript
// Clock time updated
socket.on('clock:update', (data) => {
  console.log('Clock:', data.time);
});

// Clock shown/hidden/toggled
socket.on('clock:shown', (data) => {
  console.log('Clock shown');
});

socket.on('clock:hidden', (data) => {
  console.log('Clock hidden');
});

socket.on('clock:toggled', (data) => {
  console.log('Clock toggled:', data.visible);
});
```

#### Message Updates

```javascript
// Message displayed
socket.on('message:shown', (data) => {
  console.log('Message:', data.text);
});

// Message cleared
socket.on('message:cleared', () => {
  console.log('Message cleared');
});
```

#### Display Updates

```javascript
// Flash triggered
socket.on('display:flash', () => {
  console.log('Flash animation triggered');
});

// Display window toggled
socket.on('display:windowToggled', (data) => {
  console.log('Display window visible:', data.visible);
});
```

#### Preset Updates

```javascript
// Preset loaded
socket.on('preset:loaded', (data) => {
  console.log('Preset loaded:', data.index);
});
```

#### Operation Results

```javascript
// Operation results
socket.on('timer:result', (result) => {
  if (result.success) {
    console.log('Success:', result.message);
  } else {
    console.error('Error:', result.message);
  }
});

// Similar for display:result, clock:result, preset:result
```

#### Errors

```javascript
// Error messages
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

### Complete Example: Web Dashboard

```html
<!DOCTYPE html>
<html>
<head>
  <title>Timer Control</title>
  <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
</head>
<body>
  <h1>Countdown Timer Control</h1>
  <div id="status">Connecting...</div>
  <div id="time">--:--:--</div>
  <button onclick="startTimer()">Start</button>
  <button onclick="stopTimer()">Stop</button>
  <button onclick="resetTimer()">Reset</button>

  <script>
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      document.getElementById('status').textContent = 'Connected';
    });

    socket.on('state:current', (state) => {
      document.getElementById('time').textContent = state.timer.formattedTime;
    });

    socket.on('timer:update', (data) => {
      document.getElementById('time').textContent = data.formattedTime;
    });

    function startTimer() {
      socket.emit('timer:start');
    }

    function stopTimer() {
      socket.emit('timer:stop');
    }

    function resetTimer() {
      socket.emit('timer:reset');
    }
  </script>
</body>
</html>
```

---

## OSC API

The OSC (Open Sound Control) API provides UDP-based communication for broadcast production integration.

### Connection

- **Input Port**: `8000` (UDP) - Receives commands
- **Output Port**: `8001` (UDP) - Sends status updates
- **Protocol**: OSC over UDP

### OSC Address Space

#### Timer Control

```
/timer/start                    Start the timer
/timer/stop                     Stop the timer
/timer/reset                    Reset the timer
/timer/set [hours] [minutes] [seconds]    Set timer duration
/timer/adjust [seconds]         Adjust timer (+ or -)
```

#### Display Control

```
/display/message [text]         Display a message
/display/clearMessage           Clear message
/display/message/clear          Alternative clear
/display/flash                  Trigger flash effect
/display/window/toggle          Toggle display window
```

#### Clock Control

```
/clock/show                     Show clock
/clock/hide                     Hide clock
/clock/toggle                   Toggle clock
```

#### Preset Control

```
/preset/0                       Load preset 0
/preset/1                       Load preset 1
...
/preset/7                       Load preset 7
```

#### State Query

```
/state/get                      Request current state
```

### OSC Status Messages (Outbound)

These messages are automatically sent to the configured output destination:

```
/timer/remaining [seconds]      Remaining time (sent every update)
/timer/progress [float]         Progress 0.0-100.0 (sent every update)
/timer/running [0|1]            Timer running state
/timer/started                  Timer was started
/timer/stopped                  Timer was stopped
/clock/time [h] [m] [s]         Current clock time
/clock/visible [0|1]            Clock visibility state
```

### Example: Python with python-osc

```python
from pythonosc import udp_client
from pythonosc.dispatcher import Dispatcher
from pythonosc.osc_server import BlockingOSCUDPServer

# Create client to send commands
client = udp_client.SimpleUDPClient("127.0.0.1", 8000)

# Start timer
client.send_message("/timer/start", [])

# Set timer to 5 minutes
client.send_message("/timer/set", [0, 5, 0])

# Display message
client.send_message("/display/message", ["Break Time!"])

# Load preset 3
client.send_message("/preset/3", [])

# Create server to receive status updates
def timer_remaining_handler(address, *args):
    print(f"Time remaining: {args[0]} seconds")

def timer_running_handler(address, *args):
    print(f"Timer running: {args[0]}")

dispatcher = Dispatcher()
dispatcher.map("/timer/remaining", timer_remaining_handler)
dispatcher.map("/timer/running", timer_running_handler)

server = BlockingOSCUDPServer(("127.0.0.1", 8001), dispatcher)
server.serve_forever()  # Receive status updates
```

### Example: TouchOSC / Lemur

Configure your TouchOSC or Lemur layout to send messages to:
- **Host**: Your computer's IP address
- **Port**: `8000`

Button configurations:
- Start: `/timer/start`
- Stop: `/timer/stop`
- Reset: `/timer/reset`
- Preset buttons: `/preset/0`, `/preset/1`, etc.

For receiving status, configure:
- **Receive Port**: `8001`
- Map incoming `/timer/remaining` to a label or progress bar

---

## Integration Examples

### Stream Deck Integration

Use the **System: Website** action with REST API:

1. Add a button
2. Set action to **System: Website**
3. URL: `http://localhost:3000/api/timer/start`
4. Add more buttons for stop, reset, presets, etc.

### OBS Studio Integration

Use the **Browser Source** with WebSocket:

Create an HTML file with the WebSocket example code and add it as a Browser Source in OBS.

### Companion Module

Create a custom Companion module that uses the REST or WebSocket API to control the timer from a Stream Deck or other control surface.

### Node-RED

Use HTTP Request nodes for REST API or Socket.IO nodes for WebSocket communication.

---

## Error Handling

All APIs return error information:

### REST API Errors

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `500` - Internal server error

### WebSocket Errors

```javascript
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

### OSC

OSC is UDP-based and does not provide error responses. Check the application logs for any OSC-related errors.

---

## Best Practices

1. **Rate Limiting**: Don't send commands too frequently. The timer updates once per second.

2. **Connection Management**: 
   - REST: Use connection pooling for multiple requests
   - WebSocket: Maintain a single connection and reuse it
   - OSC: Reuse UDP sockets

3. **Error Handling**: Always handle errors gracefully

4. **State Sync**: 
   - Use WebSocket for real-time updates
   - Use REST for one-off commands
   - Use OSC for broadcast production systems

5. **Authentication**: Use API keys in production environments

6. **CORS**: Configure CORS origins appropriately for web applications

---

## Troubleshooting

### Cannot Connect to API

1. Check that the application is running
2. Verify the port numbers
3. Check firewall settings
4. For WebSocket: Ensure Socket.IO client version is compatible

### Authentication Fails

1. Verify the API key is correct
2. Check the header name (`X-API-Key`) or query parameter (`apiKey`)
3. Ensure the API key matches the configured value

### OSC Messages Not Received

1. Verify UDP port 8000 is not blocked
2. Check that OSC messages are formatted correctly
3. Use OSC debugging tools to verify messages

### Timer State Not Updating

1. For WebSocket: Check connection is established
2. For OSC: Verify output port configuration
3. Check application logs for errors

---

## Support

For issues, feature requests, or questions:
- GitHub: https://github.com/tuneado/Countdown-Timer
- Check the logs in the application console

---

## Version

API Version: 1.0.0  
Last Updated: 2025-11-13
