/**
 * WebSocket API Server
 * 
 * Provides real-time bidirectional communication using Socket.IO.
 * Clients can send commands and receive live updates.
 */

const { Server } = require('socket.io');

class WebSocketApiServer {
  constructor(apiController, config = {}) {
    this.apiController = apiController;
    this.config = {
      port: config.port || 3001,
      enabled: config.enabled !== false,
      apiKey: config.apiKey || null,
      corsOrigins: config.corsOrigins || '*'
    };
    
    this.io = null;
    this.connectedClients = new Map();
  }

  /**
   * Initialize Socket.IO server
   */
  initialize() {
    this.io = new Server(this.config.port, {
      cors: {
        origin: this.config.corsOrigins,
        methods: ['GET', 'POST']
      }
    });

    // Authentication middleware (if API key is configured)
    if (this.config.apiKey) {
      this.io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (token === this.config.apiKey) {
          next();
        } else {
          next(new Error('Unauthorized - Invalid API key'));
        }
      });
    }

    // Handle connections
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Subscribe to controller events to broadcast to all clients
    this.subscribeToControllerEvents();
  }

  /**
   * Handle new client connection
   */
  handleConnection(socket) {
    const clientId = socket.id;
    console.log(`✓ WebSocket client connected: ${clientId}`);
    
    this.connectedClients.set(clientId, {
      socket,
      connectedAt: new Date()
    });

    // Send current state to newly connected client
    socket.emit('state:current', this.apiController.getState());

    // Register event handlers
    this.registerSocketHandlers(socket);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`✗ WebSocket client disconnected: ${clientId}`);
      this.connectedClients.delete(clientId);
    });
  }

  /**
   * Register event handlers for a socket
   */
  registerSocketHandlers(socket) {
    const controller = this.apiController;

    // ==================== Timer Events ====================
    
    socket.on('timer:start', () => {
      const result = controller.startTimer();
      socket.emit('timer:result', result);
    });

    socket.on('timer:stop', () => {
      const result = controller.stopTimer();
      socket.emit('timer:result', result);
    });

    socket.on('timer:reset', () => {
      const result = controller.resetTimer();
      socket.emit('timer:result', result);
    });

    socket.on('timer:set', (data) => {
      const { hours, minutes, seconds } = data;
      
      if (hours === undefined || minutes === undefined || seconds === undefined) {
        socket.emit('error', { message: 'Missing required fields: hours, minutes, seconds' });
        return;
      }
      
      const result = controller.setTimer(hours, minutes, seconds);
      socket.emit('timer:result', result);
    });

    socket.on('timer:adjust', (data) => {
      const { seconds } = data;
      
      if (seconds === undefined) {
        socket.emit('error', { message: 'Missing required field: seconds' });
        return;
      }
      
      const result = controller.adjustTimer(seconds);
      socket.emit('timer:result', result);
    });

    // ==================== Display Events ====================
    
    socket.on('display:message', (data) => {
      const { text } = data;
      
      if (!text) {
        socket.emit('error', { message: 'Missing required field: text' });
        return;
      }
      
      const result = controller.displayMessage(text);
      socket.emit('display:result', result);
    });

    socket.on('display:clearMessage', () => {
      const result = controller.clearMessage();
      socket.emit('display:result', result);
    });

    socket.on('display:flash', () => {
      const result = controller.triggerFlash();
      socket.emit('display:result', result);
    });

    socket.on('display:toggleWindow', () => {
      const result = controller.toggleDisplayWindow();
      socket.emit('display:result', result);
    });

    // ==================== Clock Events ====================
    
    socket.on('clock:show', () => {
      const result = controller.showClock();
      socket.emit('clock:result', result);
    });

    socket.on('clock:hide', () => {
      const result = controller.hideClock();
      socket.emit('clock:result', result);
    });

    socket.on('clock:toggle', () => {
      const result = controller.toggleClock();
      socket.emit('clock:result', result);
    });

    // ==================== Preset Events ====================
    
    socket.on('preset:load', (data) => {
      const { index } = data;
      
      if (index === undefined) {
        socket.emit('error', { message: 'Missing required field: index' });
        return;
      }
      
      const result = controller.loadPreset(index);
      socket.emit('preset:result', result);
    });

    // ==================== State Request ====================
    
    socket.on('state:get', () => {
      socket.emit('state:current', controller.getState());
    });
  }

  /**
   * Subscribe to controller events and broadcast to all clients
   */
  subscribeToControllerEvents() {
    const controller = this.apiController;

    // Timer events
    controller.on('timer:update', (data) => {
      this.broadcast('timer:update', data);
    });

    controller.on('timer:started', (data) => {
      this.broadcast('timer:started', data);
    });

    controller.on('timer:stopped', (data) => {
      this.broadcast('timer:stopped', data);
    });

    controller.on('timer:reset', (data) => {
      this.broadcast('timer:reset', data);
    });

    controller.on('timer:set', (data) => {
      this.broadcast('timer:set', data);
    });

    controller.on('timer:adjusted', (data) => {
      this.broadcast('timer:adjusted', data);
    });

    // Clock events
    controller.on('clock:update', (data) => {
      this.broadcast('clock:update', data);
    });

    controller.on('clock:shown', (data) => {
      this.broadcast('clock:shown', data);
    });

    controller.on('clock:hidden', (data) => {
      this.broadcast('clock:hidden', data);
    });

    controller.on('clock:toggled', (data) => {
      this.broadcast('clock:toggled', data);
    });

    // Message events
    controller.on('message:shown', (data) => {
      this.broadcast('message:shown', data);
    });

    controller.on('message:cleared', (data) => {
      this.broadcast('message:cleared', data);
    });

    // Display events
    controller.on('display:flash', (data) => {
      this.broadcast('display:flash', data);
    });

    controller.on('display:windowToggled', (data) => {
      this.broadcast('display:windowToggled', data);
    });

    // Preset events
    controller.on('preset:loaded', (data) => {
      this.broadcast('preset:loaded', data);
    });
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Start the WebSocket server
   */
  start() {
    if (!this.config.enabled) {
      console.log('WebSocket API is disabled');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.initialize();
        console.log(`✓ WebSocket API server listening on port ${this.config.port}`);
        console.log(`  WebSocket endpoint: ws://localhost:${this.config.port}`);
        resolve();
      } catch (err) {
        console.error('✗ Failed to start WebSocket API server:', err);
        reject(err);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.io) {
        // Disconnect all clients
        this.io.disconnectSockets();
        
        // Close server
        this.io.close(() => {
          console.log('✓ WebSocket API server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

module.exports = WebSocketApiServer;
