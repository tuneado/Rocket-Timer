/**
 * REST API Server
 * Provides HTTP REST API and Socket.IO interface for external control
 * Compatible with Bitfocus Companion and other control systems
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { ipcMain } = require('electron');
const path = require('path');

/**
 * Format seconds into HH:MM:SS string - handles negative time
 * @param {number} sec - Time in seconds (can be negative)
 * @returns {string} Formatted time string (e.g., "01:23:45" or "-00:05:30")
 */
function formatTime(sec) {
  const isNegative = sec < 0;
  const absSec = Math.abs(sec);
  const h = String(Math.floor(absSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((absSec % 3600) / 60)).padStart(2, "0");
  const s = String(absSec % 60).padStart(2, "0");
  return `${isNegative ? '-' : ''}${h}:${m}:${s}`;
}

class ApiServer {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.app = null;
    this.server = null;
    this.io = null;
    this.port = 9999;
    this.enabled = false;
    
    // Cached application state from renderer (single source of truth)
    this.currentState = null;
  }

  /**
   * Start the REST API server
   * @param {number} port - Port to listen on (default: 9999)
   * @param {boolean} enabled - Whether to start enabled
   * @param {boolean} allowExternal - Allow external connections (default: false, localhost only)
   * @returns {Promise<boolean>} Success status
   */
  start(port = this.port, enabled = true, allowExternal = false) {
    return new Promise((resolve, reject) => {
      if (!enabled) {
        console.log('🔌 REST API server disabled in settings');
        resolve(false);
        return;
      }

      this.port = port;
      this.enabled = true;
      this.allowExternal = allowExternal;
      
      try {
        // Create Express app
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Create HTTP server
        this.server = http.createServer(this.app);
        
        // Setup Socket.IO with CORS
        this.io = socketIO(this.server, {
          cors: {
            origin: '*',
            methods: ['GET', 'POST']
          }
        });
        
        // Setup routes and handlers
        this.setupHTTPRoutes();
        this.setupSocketIO();
        this.setupIPCListeners();
        
        // Handle server errors (port already in use, etc.)
        this.server.on('error', (err) => {
          console.error('❌ Companion server error:', err.message);
          
          // Notify renderer of error
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('companion-server-status', {
              running: false,
              port: this.port,
              error: err.message
            });
          }
          
          reject(err);
        });
        
        // Start listening
        const host = this.allowExternal ? '0.0.0.0' : '127.0.0.1';
        this.server.listen(this.port, host, () => {
          console.log('═══════════════════════════════════════════════');
          console.log('🔌 REST API Server Started');
          console.log(`   Listening:  ${host}:${this.port}`);
          console.log(`   HTTP API:   http://localhost:${this.port}/api`);
          console.log(`   Socket.IO:  ws://localhost:${this.port}`);
          if (this.allowExternal) {
            console.log(`   External:   Enabled (accessible from network)`);
          }
          console.log('═══════════════════════════════════════════════');
          
          resolve(true);
        });
      } catch (error) {
        console.error('❌ Failed to start Companion server:', error);
        reject(error);
      }
    });
  }

  /**
   * Setup HTTP REST API routes
   */
  setupHTTPRoutes() {
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        version: '1.0.0',
        uptime: process.uptime()
      });
    });

    // Get application state
    this.app.get('/api/state', (req, res) => {
      res.json(this.formatStateForAPI(this.currentState || {}));
    });

    // Timer controls
    this.app.post('/api/timer/start', (req, res) => {
      console.log('📥 Received /api/timer/start request');
      this.handleCommand('start');
      // Small delay to allow state to update before responding
      setTimeout(() => {
        res.json({ success: true, action: 'start' });
      }, 20);
    });

    this.app.post('/api/timer/stop', (req, res) => {
      console.log('📥 Received /api/timer/stop request');
      this.handleCommand('stop');
      // Small delay to allow state to update before responding
      setTimeout(() => {
        res.json({ success: true, action: 'stop' });
      }, 20);
    });

    this.app.post('/api/timer/pause', (req, res) => {
      this.handleCommand('pause');
      res.json({ success: true, action: 'pause' });
    });

    this.app.post('/api/timer/resume', (req, res) => {
      this.handleCommand('resume');
      res.json({ success: true, action: 'resume' });
    });

    this.app.post('/api/timer/reset', (req, res) => {
      this.handleCommand('reset');
      res.json({ success: true, action: 'reset' });
    });

    // Set time
    this.app.post('/api/timer/time', (req, res) => {
      const { hours = 0, minutes = 0, seconds = 0 } = req.body;
      this.handleCommand('setTime', { hours, minutes, seconds });
      res.json({ 
        success: true, 
        action: 'setTime', 
        time: { hours, minutes, seconds } 
      });
    });

    // Individual time component setters
    this.app.post('/api/timer/hours/:value', (req, res) => {
      const hours = parseInt(req.params.value);
      if (isNaN(hours) || hours < 0 || hours > 23) {
        return res.status(400).json({ success: false, error: 'Hours must be between 0-23' });
      }
      this.handleCommand('setHours', { hours });
      res.json({ success: true, action: 'setHours', hours });
    });

    this.app.post('/api/timer/minutes/:value', (req, res) => {
      const minutes = parseInt(req.params.value);
      if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        return res.status(400).json({ success: false, error: 'Minutes must be between 0-59' });
      }
      this.handleCommand('setMinutes', { minutes });
      res.json({ success: true, action: 'setMinutes', minutes });
    });

    this.app.post('/api/timer/seconds/:value', (req, res) => {
      const seconds = parseInt(req.params.value);
      if (isNaN(seconds) || seconds < 0 || seconds > 59) {
        return res.status(400).json({ success: false, error: 'Seconds must be between 0-59' });
      }
      this.handleCommand('setSeconds', { seconds });
      res.json({ success: true, action: 'setSeconds', seconds });
    });

    // Presets
    this.app.get('/api/presets', (req, res) => {
      this.handleCommand('getPresets');
      // For now, return empty - will be populated via IPC response
      res.json({ success: true, presets: [1, 2, 3, 4] });
    });

    this.app.post('/api/preset/:id', (req, res) => {
      const presetId = parseInt(req.params.id);
      this.handleCommand('loadPreset', { preset: presetId });
      res.json({ success: true, action: 'loadPreset', preset: presetId });
    });

    // Layouts
    this.app.get('/api/layouts', (req, res) => {
      const layouts = ['classic', 'minimal', 'clockfocus', 'detailed', 'circular', 'video'];
      res.json({ success: true, layouts });
    });

    this.app.post('/api/layout/:name', (req, res) => {
      const layoutName = req.params.name;
      this.handleCommand('changeLayout', { layout: layoutName });
      res.json({ success: true, action: 'changeLayout', layout: layoutName });
    });

    // Message control
    this.app.post('/api/message', (req, res) => {
      const { message } = req.body;
      this.handleCommand('setMessage', { message });
      res.json({ success: true, action: 'setMessage', message });
    });

    // Time adjustment controls
    this.app.post('/api/timer/add-minute', (req, res) => {
      this.handleCommand('addMinute');
      res.json({ success: true, action: 'addMinute' });
    });

    this.app.post('/api/timer/subtract-minute', (req, res) => {
      this.handleCommand('subtractMinute');
      res.json({ success: true, action: 'subtractMinute' });
    });

    // Display controls
    this.app.post('/api/display/toggle-feature-image', (req, res) => {
      this.handleCommand('toggleFeatureImage');
      res.json({ success: true, action: 'toggleFeatureImage' });
    });

    this.app.post('/api/display/flash', (req, res) => {
      this.handleCommand('flashScreen');
      res.json({ success: true, action: 'flashScreen' });
    });

    // Sound controls
    this.app.post('/api/sound/mute', (req, res) => {
      this.handleCommand('muteSound');
      res.json({ success: true, action: 'muteSound' });
    });

    this.app.post('/api/sound/unmute', (req, res) => {
      this.handleCommand('unmuteSound');
      res.json({ success: true, action: 'unmuteSound' });
    });

    this.app.post('/api/sound/toggle', (req, res) => {
      this.handleCommand('toggleSound');
      res.json({ success: true, action: 'toggleSound' });
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      console.error('❌ HTTP Error:', err);
      res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    });

    // Root route - API info page
    this.app.get('/', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Countdown Timer - Companion API</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 900px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2196F3;
      margin-top: 0;
    }
    h2 {
      color: #555;
      border-bottom: 2px solid #2196F3;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    .endpoint {
      background: #f8f8f8;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
      border-left: 4px solid #2196F3;
    }
    .method {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 12px;
      margin-right: 10px;
    }
    .get { background: #4CAF50; color: white; }
    .post { background: #FF9800; color: white; }
    code {
      background: #eee;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .status {
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      display: inline-block;
      margin: 20px 0;
    }
    a {
      color: #2196F3;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    ul {
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎮 Countdown Timer - Companion API</h1>
    <div class="status">✅ Server Running on Port ${this.port}</div>
    
    <h2>Quick Start</h2>
    <p>This server provides REST API and WebSocket interfaces for controlling the Countdown Timer.</p>
    
    <h2>REST API Endpoints</h2>
    
    <div class="endpoint">
      <span class="method get">GET</span>
      <code>/api/health</code>
      <p>Check server health and status</p>
    </div>
    
    <div class="endpoint">
      <span class="method get">GET</span>
      <code>/api/state</code>
      <p>Get current timer state</p>
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/api/timer/start</code>
      <p>Start the countdown timer</p>
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/api/timer/stop</code>
      <p>Stop the countdown timer</p>
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/api/timer/reset</code>
      <p>Reset the timer to last set time</p>
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/api/timer/time</code>
      <p>Set timer duration (body: <code>{"hours": 0, "minutes": 45, "seconds": 0}</code>)</p>
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/api/timer/hours/:value</code>
      <p>Set only hours (0-23)</p>
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/api/timer/minutes/:value</code>
      <p>Set only minutes (0-59)</p>
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/api/timer/seconds/:value</code>
      <p>Set only seconds (0-59)</p>
    </div>
    
    <div class="endpoint">
      <span class="method get">GET</span>
      <code>/api/presets</code>
      <p>Get available presets</p>
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/api/preset/:id</code>
      <p>Activate preset (0-7)</p>
    </div>
    
    <div class="endpoint">
      <span class="method get">GET</span>
      <code>/api/layouts</code>
      <p>Get available layouts</p>
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/api/layout/:name</code>
      <p>Change layout</p>
    </div>
    
    <h2>WebSocket (Socket.IO)</h2>
    <p>Connect to: <code>ws://localhost:${this.port}</code></p>
    <p>Real-time bidirectional communication with automatic state updates.</p>
    
    <h2>Try It Now</h2>
    <ul>
      <li><a href="/api/health" target="_blank">Test Health Endpoint</a></li>
      <li><a href="/api/state" target="_blank">Get Current State</a></li>
      <li><a href="/api/layouts" target="_blank">Get Available Layouts</a></li>
      <li><a href="/api/presets" target="_blank">Get Presets</a></li>
    </ul>
    
    <h2>Documentation</h2>
    <p>For complete API documentation, see <code>COMPANION_API.md</code> in the project root.</p>
    
    <h2>Example Usage</h2>
    <pre style="background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto;">
# Start the timer
curl -X POST http://localhost:${this.port}/api/timer/start

# Get current state
curl http://localhost:${this.port}/api/state

# Set timer to 5 minutes
curl -X POST http://localhost:${this.port}/api/timer/time \\
  -H "Content-Type: application/json" \\
  -d '{"minutes": 5}'
    </pre>
  </div>
</body>
</html>
      `);
    });

    // 404 handler (must be last)
    this.app.use((req, res) => {
      res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found',
        path: req.path,
        availableEndpoints: [
          'GET /api/health',
          'GET /api/state',
          'POST /api/timer/start',
          'POST /api/timer/stop',
          'POST /api/timer/reset',
          'POST /api/timer/time',
          'POST /api/timer/hours/:value',
          'POST /api/timer/minutes/:value',
          'POST /api/timer/seconds/:value',
          'POST /api/timer/add-minute',
          'POST /api/timer/subtract-minute',
          'GET /api/presets',
          'POST /api/preset/:id',
          'GET /api/layouts',
          'POST /api/layout/:name',
          'POST /api/message',
          'POST /api/display/flash',
          'POST /api/display/toggle-feature-image',
          'POST /api/sound/mute',
          'POST /api/sound/unmute',
          'POST /api/sound/toggle'
        ]
      });
    });
  }

  /**
   * Setup Socket.IO handlers
   */
  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log(`✅ Socket.IO client connected: ${socket.id}`);
      
      // Send initial state immediately
      socket.emit('state', this.formatStateForAPI(this.currentState || {}));

      // Handle commands
      socket.on('command', (data) => {
        console.log(`📨 Command from ${socket.id}:`, data);
        this.handleSocketCommand(socket, data);
      });

      // Request state
      socket.on('getState', () => {
        socket.emit('state', this.formatStateForAPI(this.currentState || {}));
      });

      // Ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Disconnect
      socket.on('disconnect', (reason) => {
        console.log(`❌ Socket.IO client disconnected: ${socket.id} (${reason})`);
      });

      socket.on('error', (error) => {
        console.error('❌ Socket.IO error:', error);
      });
    });
  }

  /**
   * Handle Socket.IO commands
   */
  handleSocketCommand(socket, data) {
    const { action, ...params } = data;
    
    try {
      this.handleCommand(action, params);
      
      // Send acknowledgment with slight delay to ensure state updates
      setTimeout(() => {
        socket.emit('ack', { success: true, action });
      }, 50);
    } catch (error) {
      console.error('❌ Error handling socket command:', error);
      socket.emit('error', { 
        success: false, 
        action, 
        error: error.message 
      });
    }
  }

  /**
   * Forward command to main process
   */
  handleCommand(action, params = {}) {
    console.log('🎮 handleCommand called:', { action, params });
    console.log('   mainWindow exists:', !!this.mainWindow);
    console.log('   mainWindow destroyed:', this.mainWindow ? this.mainWindow.isDestroyed() : 'N/A');
    
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      console.error('❌ Main window not available for command:', action);
      return;
    }
    
    const commandData = { action, data: params };
    console.log('🎮 Sending command to renderer:', commandData);
    this.mainWindow.webContents.send('companion-command', commandData);
    console.log('✅ Command sent via IPC');
  }

  /**
   * Setup IPC listeners for state updates from renderer
   */
  setupIPCListeners() {
    // Listen for state updates from renderer (appState)
    ipcMain.on('companion-state-update', (event, state) => {
      //console.log('📊 Received state update from renderer');
      
      // Cache the state directly (appState is single source of truth)
      this.currentState = state;
      
      // Format and broadcast to all Socket.IO clients
      if (this.io) {
        const apiState = this.formatStateForAPI(state);
        this.io.emit('stateUpdate', apiState);
      }
    });
  }

  /**
   * Transform appState to API-compatible format
   * Converts internal state structure to external API format
   */
  formatStateForAPI(appState) {
    if (!appState || !appState.timer) {
      return {
        running: false,
        paused: false,
        timeRemaining: 0,
        totalTime: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        percentage: 0,
        formattedTime: '00:00:00',
        layout: 'classic',
        preset: null,
        cameraActive: false,
        serverRunning: false,
        clockTime: '00:00:00',
        messageVisible: false,
        messageText: '',
        featureImageEnabled: false,
        soundMuted: false,
        theme: 'dark',
        timestamp: Date.now()
      };
    }

    const { timer, camera, server, display, clock, layout, message, featureImage, theme, settings } = appState;
    
    // Calculate time components from milliseconds - handle negative time correctly
    const remainingSeconds = Math.floor(timer.remainingTime / 1000);
    const isNegative = remainingSeconds < 0;
    const absSeconds = Math.abs(remainingSeconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    
    // Calculate percentage - never go below 0%
    const percentage = timer.totalTime > 0 
      ? Math.max(0, Math.round((timer.remainingTime / timer.totalTime) * 100))
      : 0;

    return {
      // Timer state
      running: timer.running,
      paused: timer.paused,
      timeRemaining: remainingSeconds,
      totalTime: Math.floor(timer.totalTime / 1000),
      hours,
      minutes,
      seconds,
      percentage,
      formattedTime: timer.formattedTime || formatTime(remainingSeconds),
      preset: timer.preset,
      
      // Layout
      layout: layout.current,
      
      // Camera
      cameraActive: camera.active,
      
      // Server
      serverRunning: server.running,
      
      // Clock
      clockTime: clock.time,
      
      // Message
      messageVisible: message.visible,
      messageText: message.text,
      
      // Feature Image
      featureImageEnabled: featureImage.enabled,
      
      // Sound
      soundMuted: !settings?.soundEnabled,
      
      // Theme
      theme,
      
      // Metadata
      timestamp: Date.now()
    };
  }

  /**
   * Stop the REST API server
   * @returns {Promise<void>}
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        console.log('🔌 Stopping Companion server...');
        
        if (this.io) {
          this.io.close();
          this.io = null;
        }
        
        this.server.close(() => {
          this.server = null;
          this.app = null;
          this.enabled = false;
          
          console.log('✅ Companion server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if server is running
   */
  isRunning() {
    return this.server !== null && this.enabled;
  }

  /**
   * Get current port
   */
  getPort() {
    return this.port;
  }

  /**
   * Get server status for status bar / settings
   */
  getStatus() {
    return {
      running: this.isRunning(),
      port: this.port,
      error: null
    };
  }

  /**
   * Get connection info
   */
  getInfo() {
    return {
      running: this.isRunning(),
      port: this.port,
      httpUrl: `http://localhost:${this.port}/api`,
      socketUrl: `ws://localhost:${this.port}`,
      connectedClients: this.io ? this.io.sockets.sockets.size : 0
    };
  }
}

module.exports = ApiServer;
