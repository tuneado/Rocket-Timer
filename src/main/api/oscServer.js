/**
 * OSC API Server
 * 
 * Provides Open Sound Control protocol support for broadcast production integration.
 * Receives OSC messages for control and sends status updates.
 */

const osc = require('osc');

class OscApiServer {
  constructor(apiController, config = {}) {
    this.apiController = apiController;
    this.config = {
      inputPort: config.inputPort || 8000,
      outputPort: config.outputPort || 8001,
      outputHost: config.outputHost || '127.0.0.1',
      enabled: config.enabled !== false
    };
    
    this.udpPort = null;
  }

  /**
   * Initialize OSC UDP port
   */
  initialize() {
    this.udpPort = new osc.UDPPort({
      localAddress: '0.0.0.0',
      localPort: this.config.inputPort,
      remoteAddress: this.config.outputHost,
      remotePort: this.config.outputPort,
      metadata: true
    });

    // Handle incoming OSC messages
    this.udpPort.on('message', (oscMessage) => {
      this.handleOscMessage(oscMessage);
    });

    // Handle errors
    this.udpPort.on('error', (err) => {
      console.error('OSC Error:', err);
    });

    // Subscribe to controller events for outbound messages
    this.subscribeToControllerEvents();
  }

  /**
   * Handle incoming OSC message
   */
  handleOscMessage(oscMessage) {
    const address = oscMessage.address;
    const args = oscMessage.args;

    console.log(`OSC received: ${address}`, args);

    const controller = this.apiController;

    // ==================== Timer Control ====================
    
    if (address === '/timer/start') {
      controller.startTimer();
      this.sendStatus('/timer/started', 1);
    }
    else if (address === '/timer/stop') {
      controller.stopTimer();
      this.sendStatus('/timer/stopped', 1);
    }
    else if (address === '/timer/reset') {
      controller.resetTimer();
      this.sendStatus('/timer/reset', 1);
    }
    else if (address === '/timer/set') {
      // Expected: /timer/set [hours] [minutes] [seconds]
      if (args.length >= 3) {
        const hours = this.getArgValue(args[0]);
        const minutes = this.getArgValue(args[1]);
        const seconds = this.getArgValue(args[2]);
        controller.setTimer(hours, minutes, seconds);
        this.sendStatus('/timer/set', 1);
      }
    }
    else if (address === '/timer/adjust') {
      // Expected: /timer/adjust [seconds]
      if (args.length >= 1) {
        const seconds = this.getArgValue(args[0]);
        controller.adjustTimer(seconds);
        this.sendStatus('/timer/adjusted', seconds);
      }
    }
    
    // ==================== Display Control ====================
    
    else if (address === '/display/message') {
      // Expected: /display/message [text]
      if (args.length >= 1) {
        const text = this.getArgValue(args[0]);
        controller.displayMessage(text);
        this.sendStatus('/display/message/shown', 1);
      }
    }
    else if (address === '/display/clearMessage' || address === '/display/message/clear') {
      controller.clearMessage();
      this.sendStatus('/display/message/cleared', 1);
    }
    else if (address === '/display/flash') {
      controller.triggerFlash();
      this.sendStatus('/display/flashed', 1);
    }
    else if (address === '/display/window/toggle') {
      controller.toggleDisplayWindow();
    }
    
    // ==================== Clock Control ====================
    
    else if (address === '/clock/show') {
      controller.showClock();
      this.sendStatus('/clock/visible', 1);
    }
    else if (address === '/clock/hide') {
      controller.hideClock();
      this.sendStatus('/clock/visible', 0);
    }
    else if (address === '/clock/toggle') {
      controller.toggleClock();
    }
    
    // ==================== Preset Control ====================
    
    else if (address.startsWith('/preset/')) {
      // Expected: /preset/0 through /preset/7
      const indexStr = address.split('/')[2];
      const index = parseInt(indexStr, 10);
      if (!isNaN(index)) {
        controller.loadPreset(index);
        this.sendStatus('/preset/loaded', index);
      }
    }
    
    // ==================== State Query ====================
    
    else if (address === '/state/get') {
      this.sendState();
    }
  }

  /**
   * Get argument value from OSC arg object
   */
  getArgValue(arg) {
    if (typeof arg === 'object' && arg.value !== undefined) {
      return arg.value;
    }
    return arg;
  }

  /**
   * Send OSC status message
   */
  sendStatus(address, value) {
    if (this.udpPort) {
      this.udpPort.send({
        address: address,
        args: [{ type: value === parseInt(value) ? 'i' : 'f', value: value }]
      });
    }
  }

  /**
   * Send current state as OSC messages
   */
  sendState() {
    const state = this.apiController.getState();
    
    // Send timer state
    this.udpPort.send({
      address: '/timer/remaining',
      args: [{ type: 'i', value: state.timer.remainingTime }]
    });
    
    this.udpPort.send({
      address: '/timer/total',
      args: [{ type: 'i', value: state.timer.totalTime }]
    });
    
    this.udpPort.send({
      address: '/timer/running',
      args: [{ type: 'i', value: state.timer.running ? 1 : 0 }]
    });
    
    // Send clock state
    this.udpPort.send({
      address: '/clock/visible',
      args: [{ type: 'i', value: state.clock.visible ? 1 : 0 }]
    });
  }

  /**
   * Subscribe to controller events and send OSC messages
   */
  subscribeToControllerEvents() {
    const controller = this.apiController;

    // Timer updates
    controller.on('timer:update', (data) => {
      this.udpPort.send({
        address: '/timer/remaining',
        args: [{ type: 'i', value: data.remainingTime }]
      });
      
      this.udpPort.send({
        address: '/timer/progress',
        args: [{ type: 'f', value: data.progress || 0 }]
      });
    });

    controller.on('timer:started', () => {
      this.sendStatus('/timer/running', 1);
    });

    controller.on('timer:stopped', () => {
      this.sendStatus('/timer/running', 0);
    });

    // Clock updates
    controller.on('clock:update', (data) => {
      // Parse time string (HH:MM:SS)
      const parts = data.time.split(':');
      if (parts.length === 3) {
        this.udpPort.send({
          address: '/clock/time',
          args: [
            { type: 'i', value: parseInt(parts[0]) },
            { type: 'i', value: parseInt(parts[1]) },
            { type: 'i', value: parseInt(parts[2]) }
          ]
        });
      }
    });

    controller.on('clock:shown', () => {
      this.sendStatus('/clock/visible', 1);
    });

    controller.on('clock:hidden', () => {
      this.sendStatus('/clock/visible', 0);
    });
  }

  /**
   * Start the OSC server
   */
  start() {
    if (!this.config.enabled) {
      console.log('OSC API is disabled');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.initialize();
        
        this.udpPort.open();
        
        this.udpPort.on('ready', () => {
          console.log(`✓ OSC API server listening on UDP port ${this.config.inputPort}`);
          console.log(`  OSC output: ${this.config.outputHost}:${this.config.outputPort}`);
          resolve();
        });

        this.udpPort.on('error', (err) => {
          console.error('✗ OSC API server error:', err);
          reject(err);
        });
      } catch (err) {
        console.error('✗ Failed to start OSC API server:', err);
        reject(err);
      }
    });
  }

  /**
   * Stop the OSC server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.udpPort) {
        this.udpPort.close();
        console.log('✓ OSC API server stopped');
      }
      resolve();
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

module.exports = OscApiServer;
