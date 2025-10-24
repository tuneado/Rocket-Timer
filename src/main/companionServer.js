/**
 * Companion Server
 * Provides HTTP REST API and Socket.IO interface for external control
 * Compatible with Bitfocus Companion and other control systems
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { ipcMain } = require('electron');

class CompanionServer {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.app = null;
    this.server = null;
    this.io = null;
    this.port = 9999;
    this.enabled = false;
    
    // Timer state that gets broadcast to clients
    this.timerState = {
      running: false,
      paused: false,
      timeRemaining: 0,
      totalTime: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      percentage: 0,
      layout: 'standard',
      preset: null,
      timestamp: Date.now()
    };
  }

  /**
   * Start the Companion server
   * @param {number} port - Port to listen on (default: 9999)
   * @param {boolean} enabled - Whether to start enabled
   * @returns {Promise<boolean>} Success status
   */
  start(port = this.port, enabled = true) {
    return new Promise((resolve, reject) => {
      if (!enabled) {
        console.log('🔌 Companion server disabled in settings');
        resolve(false);
        return;
      }

      this.port = port;
      this.enabled = true;
      
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
        
        // Start listening
        this.server.listen(this.port, (err) => {
          if (err) {
            console.error('❌ Failed to start Companion server:', err);
            reject(err);
            return;
          }
          
          console.log('═══════════════════════════════════════════════');
          console.log('🔌 Companion Server Started');
          console.log(`   HTTP API:   http://localhost:${this.port}/api`);
          console.log(`   Socket.IO:  ws://localhost:${this.port}`);
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

    // Get current state
    this.app.get('/api/state', (req, res) => {
      res.json(this.timerState);
    });

    // Timer controls
    this.app.post('/api/timer/start', (req, res) => {
      console.log('📥 Received /api/timer/start request');
      this.handleCommand('start');
      res.json({ success: true, action: 'start' });
    });

    this.app.post('/api/timer/stop', (req, res) => {
      console.log('📥 Received /api/timer/stop request');
      this.handleCommand('stop');
      res.json({ success: true, action: 'stop' });
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
          'GET /api/presets',
          'POST /api/preset/:id',
          'GET /api/layouts',
          'POST /api/layout/:name'
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
      socket.emit('state', this.timerState);

      // Handle commands
      socket.on('command', (data) => {
        console.log(`📨 Command from ${socket.id}:`, data);
        this.handleSocketCommand(socket, data);
      });

      // Request state
      socket.on('getState', () => {
        socket.emit('state', this.timerState);
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
      socket.emit('ack', { success: true, action });
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
    // Listen for state updates from renderer
    ipcMain.on('companion-state-update', (event, state) => {
      console.log('📊 Received state update from renderer:', state);
      this.updateTimerState(state);
    });
  }

  /**
   * Update timer state and broadcast to all clients
   */
  updateTimerState(updates) {
    // Map renderer state to API state format
    const mappedUpdates = {
      running: updates.running !== undefined ? updates.running : this.timerState.running,
      paused: updates.paused !== undefined ? updates.paused : this.timerState.paused,
      timeRemaining: updates.timeRemaining !== undefined ? updates.timeRemaining : this.timerState.timeRemaining,
      totalTime: updates.totalTime !== undefined ? updates.totalTime : this.timerState.totalTime,
      hours: updates.hours !== undefined ? updates.hours : this.timerState.hours,
      minutes: updates.minutes !== undefined ? updates.minutes : this.timerState.minutes,
      seconds: updates.seconds !== undefined ? updates.seconds : this.timerState.seconds,
      percentage: updates.percentage !== undefined ? updates.percentage : this.timerState.percentage,
      layout: updates.layout !== undefined ? updates.layout : this.timerState.layout,
      preset: updates.preset !== undefined ? updates.preset : this.timerState.preset,
      timestamp: Date.now()
    };
    
    this.timerState = mappedUpdates;
    
    // Broadcast to all Socket.IO clients
    if (this.io) {
      this.io.emit('stateUpdate', this.timerState);
    }
  }

  /**
   * Stop the Companion server
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

module.exports = CompanionServer;
