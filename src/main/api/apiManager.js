/**
 * API Manager
 * 
 * Orchestrates all API servers (REST, WebSocket, OSC) and manages their lifecycle.
 * Provides a unified interface for starting/stopping APIs.
 */

const ApiController = require('./apiController');
const RestApiServer = require('./restServer');
const WebSocketApiServer = require('./websocketServer');
const OscApiServer = require('./oscServer');

class ApiManager {
  constructor(mainWindow, getDisplayWindow, getSettingsWindow, settingsManager) {
    this.mainWindow = mainWindow;
    this.getDisplayWindow = getDisplayWindow;
    this.getSettingsWindow = getSettingsWindow;
    this.settingsManager = settingsManager;
    
    // Initialize API controller
    this.apiController = new ApiController(
      mainWindow,
      getDisplayWindow,
      getSettingsWindow
    );
    
    // Initialize API servers (but don't start them yet)
    this.restServer = null;
    this.websocketServer = null;
    this.oscServer = null;
    
    this.initialized = false;
  }

  /**
   * Initialize API servers with settings
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Get API settings
      const settings = this.settingsManager.getSettings();
      const apiConfig = settings.api || {};
      
      // Create REST server
      this.restServer = new RestApiServer(this.apiController, {
        port: apiConfig.restPort || 3000,
        enabled: apiConfig.restEnabled !== false,
        apiKey: apiConfig.apiKey || null,
        corsOrigins: apiConfig.corsOrigins || '*'
      });
      
      // Create WebSocket server
      this.websocketServer = new WebSocketApiServer(this.apiController, {
        port: apiConfig.websocketPort || 3001,
        enabled: apiConfig.websocketEnabled !== false,
        apiKey: apiConfig.apiKey || null,
        corsOrigins: apiConfig.corsOrigins || '*'
      });
      
      // Create OSC server
      this.oscServer = new OscApiServer(this.apiController, {
        inputPort: apiConfig.oscInputPort || 8000,
        outputPort: apiConfig.oscOutputPort || 8001,
        outputHost: apiConfig.oscOutputHost || '127.0.0.1',
        enabled: apiConfig.oscEnabled !== false
      });
      
      this.initialized = true;
      console.log('✓ API Manager initialized');
    } catch (err) {
      console.error('✗ Failed to initialize API Manager:', err);
      throw err;
    }
  }

  /**
   * Start all enabled API servers
   */
  async startAll() {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('\n=== Starting API Servers ===');
    
    const results = await Promise.allSettled([
      this.restServer.start(),
      this.websocketServer.start(),
      this.oscServer.start()
    ]);
    
    // Log any startup failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const serverName = ['REST', 'WebSocket', 'OSC'][index];
        console.error(`✗ ${serverName} API failed to start:`, result.reason);
      }
    });
    
    console.log('=== API Servers Started ===\n');
  }

  /**
   * Stop all API servers
   */
  async stopAll() {
    console.log('\n=== Stopping API Servers ===');
    
    if (this.restServer) {
      await this.restServer.stop();
    }
    
    if (this.websocketServer) {
      await this.websocketServer.stop();
    }
    
    if (this.oscServer) {
      await this.oscServer.stop();
    }
    
    console.log('=== API Servers Stopped ===\n');
  }

  /**
   * Get API controller instance
   */
  getController() {
    return this.apiController;
  }

  /**
   * Get REST server instance
   */
  getRestServer() {
    return this.restServer;
  }

  /**
   * Get WebSocket server instance
   */
  getWebSocketServer() {
    return this.websocketServer;
  }

  /**
   * Get OSC server instance
   */
  getOscServer() {
    return this.oscServer;
  }

  /**
   * Update API configuration and restart servers if needed
   */
  async updateConfig(newConfig) {
    // Update individual server configs
    if (this.restServer) {
      this.restServer.updateConfig(newConfig.rest || {});
    }
    
    if (this.websocketServer) {
      this.websocketServer.updateConfig(newConfig.websocket || {});
    }
    
    if (this.oscServer) {
      this.oscServer.updateConfig(newConfig.osc || {});
    }
    
    // Restart servers to apply new config
    await this.stopAll();
    await this.startAll();
  }

  /**
   * Get API status information
   */
  getStatus() {
    return {
      initialized: this.initialized,
      rest: {
        enabled: this.restServer?.config.enabled || false,
        port: this.restServer?.config.port || 3000,
        running: this.restServer?.server !== null
      },
      websocket: {
        enabled: this.websocketServer?.config.enabled || false,
        port: this.websocketServer?.config.port || 3001,
        connectedClients: this.websocketServer?.getConnectedClientsCount() || 0,
        running: this.websocketServer?.io !== null
      },
      osc: {
        enabled: this.oscServer?.config.enabled || false,
        inputPort: this.oscServer?.config.inputPort || 8000,
        outputPort: this.oscServer?.config.outputPort || 8001,
        running: this.oscServer?.udpPort !== null
      }
    };
  }
}

module.exports = ApiManager;
