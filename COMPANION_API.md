# Bitfocus Companion API Documentation

This application provides a REST API and WebSocket interface for integration with Bitfocus Companion and other automation systems.

## Configuration

The Companion server is enabled by default and runs on port **9999**.

To configure the server, add these settings to your application settings:

```json
{
  "companionEnabled": true,
  "companionPort": 9999
}
```

## HTTP REST API

Base URL: `http://localhost:9999/api`

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890123
}
```

---

### Get Timer State

```http
GET /api/state
```

**Response:**
```json
{
  "running": false,
  "paused": false,
  "timeRemaining": 2700,
  "totalTime": 2700,
  "hours": 0,
  "minutes": 45,
  "seconds": 0,
  "percentage": 100,
  "layout": "standard",
  "preset": "45min",
  "timestamp": 1234567890123
}
```

---

### Timer Control

#### Start Timer

```http
POST /api/timer/start
```

Starts the countdown timer if it's not already running.

**Response:**
```json
{
  "success": true,
  "action": "start",
  "state": { /* current timer state */ }
}
```

---

#### Stop Timer

```http
POST /api/timer/stop
```

Stops the countdown timer.

**Response:**
```json
{
  "success": true,
  "action": "stop",
  "state": { /* current timer state */ }
}
```

---

#### Reset Timer

```http
POST /api/timer/reset
```

Resets the timer to the last set time.

**Response:**
```json
{
  "success": true,
  "action": "reset",
  "state": { /* current timer state */ }
}
```

---

#### Set Timer Time

```http
POST /api/timer/setTime
Content-Type: application/json

{
  "seconds": 3600
}
```

Sets the timer to a specific duration in seconds.

**Response:**
```json
{
  "success": true,
  "action": "setTime",
  "seconds": 3600,
  "state": { /* current timer state */ }
}
```

---

### Preset Management

#### Get Available Presets

```http
GET /api/presets
```

**Response:**
```json
{
  "presets": [
    {
      "id": 0,
      "name": "45 min",
      "minutes": 45
    },
    {
      "id": 1,
      "name": "30 min",
      "minutes": 30
    }
    // ... more presets
  ]
}
```

---

#### Activate Preset

```http
POST /api/preset/:id
```

Activates a preset by its ID (0-7).

**Example:**
```http
POST /api/preset/2
```

**Response:**
```json
{
  "success": true,
  "presetId": 2,
  "state": { /* current timer state */ }
}
```

---

### Layout Management

#### Get Available Layouts

```http
GET /api/layouts
```

**Response:**
```json
{
  "layouts": [
    "standard",
    "minimal",
    "split",
    "feature",
    "message",
    "video",
    "split-vertical"
  ]
}
```

---

#### Set Layout

```http
POST /api/layout/:name
```

Changes the current display layout.

**Example:**
```http
POST /api/layout/minimal
```

**Response:**
```json
{
  "success": true,
  "layoutName": "minimal",
  "state": { /* current timer state */ }
}
```

---

## WebSocket API (Socket.IO)

Connect to: `ws://localhost:9999`

### Events

#### Client → Server

##### Execute Command

```javascript
socket.emit('command', {
  action: 'start' | 'stop' | 'reset' | 'setTime' | 'setPreset' | 'setLayout',
  data: { /* action-specific data */ }
});
```

**Examples:**

```javascript
// Start timer
socket.emit('command', { action: 'start' });

// Stop timer
socket.emit('command', { action: 'stop' });

// Reset timer
socket.emit('command', { action: 'reset' });

// Set time (3600 seconds = 1 hour)
socket.emit('command', {
  action: 'setTime',
  data: { seconds: 3600 }
});

// Activate preset
socket.emit('command', {
  action: 'setPreset',
  data: { presetId: 2 }
});

// Change layout
socket.emit('command', {
  action: 'setLayout',
  data: { layoutName: 'minimal' }
});
```

---

##### Get State

```javascript
socket.emit('getState');
```

**Response (via 'state' event):**
```javascript
socket.on('state', (state) => {
  console.log('Current state:', state);
});
```

---

#### Server → Client

##### State Updates

```javascript
socket.on('stateUpdate', (state) => {
  console.log('Timer state updated:', state);
});
```

The server broadcasts state updates automatically when:
- Timer starts, stops, or resets
- Time is manually set
- Layout or preset changes
- Timer counts down (throttled to 1 update per second)

**State Object:**
```javascript
{
  running: false,
  paused: false,
  timeRemaining: 2700,
  totalTime: 2700,
  hours: 0,
  minutes: 45,
  seconds: 0,
  percentage: 100,
  layout: "standard",
  preset: "45min",
  timestamp: 1234567890123
}
```

---

##### Connection Events

```javascript
// Connection established
socket.on('connect', () => {
  console.log('Connected to Companion server');
});

// Disconnected
socket.on('disconnect', () => {
  console.log('Disconnected from Companion server');
});

// Error
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

---

## Integration Examples

### cURL Examples

```bash
# Start the timer
curl -X POST http://localhost:9999/api/timer/start

# Stop the timer
curl -X POST http://localhost:9999/api/timer/stop

# Reset the timer
curl -X POST http://localhost:9999/api/timer/reset

# Set timer to 1 hour (3600 seconds)
curl -X POST http://localhost:9999/api/timer/setTime \
  -H "Content-Type: application/json" \
  -d '{"seconds": 3600}'

# Get current state
curl http://localhost:9999/api/state

# Activate preset 3
curl -X POST http://localhost:9999/api/preset/3

# Change to minimal layout
curl -X POST http://localhost:9999/api/layout/minimal
```

---

### JavaScript/Node.js Example

```javascript
const io = require('socket.io-client');

// Connect to the server
const socket = io('http://localhost:9999');

socket.on('connect', () => {
  console.log('Connected to timer server');
  
  // Get initial state
  socket.emit('getState');
});

socket.on('state', (state) => {
  console.log('Current state:', state);
});

socket.on('stateUpdate', (state) => {
  console.log('State updated:', state);
  console.log(`Time remaining: ${state.hours}h ${state.minutes}m ${state.seconds}s`);
  console.log(`Progress: ${state.percentage}%`);
});

// Start the timer after 2 seconds
setTimeout(() => {
  socket.emit('command', { action: 'start' });
}, 2000);

// Stop after 10 seconds
setTimeout(() => {
  socket.emit('command', { action: 'stop' });
}, 10000);
```

---

### Python Example

```python
import requests
import socketio

# REST API example
base_url = "http://localhost:9999/api"

# Start the timer
response = requests.post(f"{base_url}/timer/start")
print(response.json())

# Get current state
response = requests.get(f"{base_url}/state")
state = response.json()
print(f"Time remaining: {state['hours']}h {state['minutes']}m {state['seconds']}s")

# WebSocket example
sio = socketio.Client()

@sio.on('connect')
def on_connect():
    print('Connected to timer server')
    sio.emit('getState')

@sio.on('stateUpdate')
def on_state_update(data):
    print(f"State updated: {data}")

sio.connect('http://localhost:9999')
sio.wait()
```

---

## Bitfocus Companion Module Development

When developing a Companion module for this application, you can use either:

1. **HTTP REST API** - Simple, stateless commands. Good for button presses and actions.
2. **WebSocket (Socket.IO)** - Real-time bidirectional updates. Good for feedback and variables.

### Recommended Approach

Use **WebSocket for state updates** and **HTTP for commands**:

- WebSocket connection maintains real-time state
- HTTP POST requests execute commands
- State updates via WebSocket drive Companion variables and feedback

### State Mapping for Companion

```javascript
// Companion Variables
$(countdown:time_remaining)  // "00:45:00"
$(countdown:hours)           // "0"
$(countdown:minutes)         // "45"
$(countdown:seconds)         // "0"
$(countdown:percentage)      // "100"
$(countdown:running)         // "true" or "false"
$(countdown:layout)          // "standard"
$(countdown:preset)          // "45min"

// Companion Feedback (button colors)
if (state.running) {
  return { color: rgb(0, 255, 0), bgcolor: rgb(0, 100, 0) };
}
```

---

## Error Handling

All HTTP endpoints return appropriate status codes:

- **200 OK** - Request succeeded
- **400 Bad Request** - Invalid request data
- **404 Not Found** - Endpoint doesn't exist
- **500 Internal Server Error** - Server error

Error responses include details:

```json
{
  "error": "Invalid time value",
  "details": "Seconds must be a positive number"
}
```

WebSocket errors are emitted via the `error` event:

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

---

## Performance Notes

- State updates are throttled to **1 update per second** when timer is running
- WebSocket connections are lightweight and can remain open indefinitely
- HTTP requests have minimal overhead (typically < 5ms response time)
- The server supports multiple simultaneous connections
- State broadcasts are sent to all connected WebSocket clients

---

## Troubleshooting

### Server Not Starting

Check the console for error messages:
```
🎮 Companion server started on port 9999
```

If you see an error about port already in use:
1. Check if another application is using port 9999
2. Change the port in settings: `{ "companionPort": 10000 }`

### Connection Refused

Make sure:
1. The application is running
2. Companion server is enabled: `{ "companionEnabled": true }`
3. You're connecting to the correct port
4. Firewall isn't blocking the port

### State Updates Not Received

Check WebSocket connection:
```javascript
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
```

The server broadcasts updates when:
- Timer state changes (start/stop/reset)
- Time is set manually
- Layout or preset changes
- Timer counts down (every second)

---

## Security Considerations

The Companion API is designed for local network use:

- No authentication required (assumes trusted network)
- Listens on `0.0.0.0` (all network interfaces)
- CORS is enabled for all origins
- Suitable for LAN use, not internet-exposed production

For production use or internet exposure:
1. Add authentication middleware
2. Use HTTPS/WSS with SSL certificates
3. Implement rate limiting
4. Restrict CORS to specific origins
5. Use API keys or tokens

---

## Development and Testing

### Testing with Postman

1. Import the API endpoints
2. Create a new request collection
3. Test each endpoint individually
4. Use Environment variables for base URL

### Testing with Browser DevTools

```javascript
// Open browser console at http://localhost:9999
fetch('/api/state')
  .then(r => r.json())
  .then(console.log);

// WebSocket test
const socket = io('http://localhost:9999');
socket.on('stateUpdate', console.log);
```

### Testing with Socket.IO Test Page

Create a simple HTML page:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Timer Control</h1>
  <button onclick="start()">Start</button>
  <button onclick="stop()">Stop</button>
  <button onclick="reset()">Reset</button>
  <pre id="state"></pre>
  
  <script>
    const socket = io('http://localhost:9999');
    
    socket.on('stateUpdate', (state) => {
      document.getElementById('state').textContent = 
        JSON.stringify(state, null, 2);
    });
    
    function start() { socket.emit('command', { action: 'start' }); }
    function stop() { socket.emit('command', { action: 'stop' }); }
    function reset() { socket.emit('command', { action: 'reset' }); }
  </script>
</body>
</html>
```

---

## Version History

- **v0.1.0** - Initial Companion API implementation
  - HTTP REST API
  - Socket.IO WebSocket support
  - Timer control (start/stop/reset)
  - Preset and layout management
  - Real-time state broadcasting
