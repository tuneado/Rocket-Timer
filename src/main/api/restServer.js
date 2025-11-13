/**
 * REST API Server
 * 
 * Provides HTTP REST endpoints for controlling the timer application.
 * Built with Express.js for robust routing and middleware support.
 */

const express = require('express');
const cors = require('cors');

class RestApiServer {
  constructor(apiController, config = {}) {
    this.apiController = apiController;
    this.config = {
      port: config.port || 3000,
      enabled: config.enabled !== false,
      apiKey: config.apiKey || null,
      corsOrigins: config.corsOrigins || '*'
    };
    
    this.app = null;
    this.server = null;
  }

  /**
   * Initialize Express app and configure middleware
   */
  initialize() {
    this.app = express();
    
    // Middleware
    // Note: CORS is permissive by default to allow local network access
    // In production, configure corsOrigins in settings to restrict origins
    this.app.use(cors({ origin: this.config.corsOrigins }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // API Key authentication middleware (if configured)
    if (this.config.apiKey) {
      this.app.use('/api', (req, res, next) => {
        const providedKey = req.headers['x-api-key'] || req.query.apiKey;
        if (providedKey !== this.config.apiKey) {
          return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized - Invalid API key' 
          });
        }
        next();
      });
    }
    
    // Register routes
    this.registerRoutes();
    
    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('REST API Error:', err);
      res.status(500).json({ 
        success: false, 
        error: err.message || 'Internal server error' 
      });
    });
  }

  /**
   * Register all API routes
   */
  registerRoutes() {
    const app = this.app;
    const controller = this.apiController;

    // ==================== Status & Health ====================
    
    app.get('/api/status', (req, res) => {
      const state = controller.getState();
      res.json({ 
        success: true, 
        data: state 
      });
    });

    app.get('/api/health', (req, res) => {
      res.json({ 
        success: true, 
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });

    // ==================== Timer Endpoints ====================
    
    app.post('/api/timer/start', (req, res) => {
      const result = controller.startTimer();
      res.json(result);
    });

    app.post('/api/timer/stop', (req, res) => {
      const result = controller.stopTimer();
      res.json(result);
    });

    app.post('/api/timer/reset', (req, res) => {
      const result = controller.resetTimer();
      res.json(result);
    });

    app.post('/api/timer/set', (req, res) => {
      const { hours, minutes, seconds } = req.body;
      
      // Validate input
      if (hours === undefined || minutes === undefined || seconds === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: hours, minutes, seconds' 
        });
      }
      
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      const s = parseInt(seconds, 10);
      
      if (isNaN(h) || isNaN(m) || isNaN(s) || h < 0 || m < 0 || s < 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid time values. Must be non-negative numbers.' 
        });
      }
      
      const result = controller.setTimer(h, m, s);
      res.json(result);
    });

    app.post('/api/timer/adjust', (req, res) => {
      const { seconds } = req.body;
      
      if (seconds === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: seconds' 
        });
      }
      
      const sec = parseInt(seconds, 10);
      if (isNaN(sec)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid seconds value. Must be a number.' 
        });
      }
      
      const result = controller.adjustTimer(sec);
      res.json(result);
    });

    // ==================== Display Endpoints ====================
    
    app.post('/api/display/message', (req, res) => {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing or invalid field: text' 
        });
      }
      
      const result = controller.displayMessage(text);
      res.json(result);
    });

    app.delete('/api/display/message', (req, res) => {
      const result = controller.clearMessage();
      res.json(result);
    });

    app.post('/api/display/flash', (req, res) => {
      const result = controller.triggerFlash();
      res.json(result);
    });

    app.post('/api/display/window/toggle', (req, res) => {
      const result = controller.toggleDisplayWindow();
      res.json(result);
    });

    // ==================== Clock Endpoints ====================
    
    app.get('/api/clock', (req, res) => {
      const state = controller.getState();
      res.json({ 
        success: true, 
        data: state.clock 
      });
    });

    app.post('/api/clock/show', (req, res) => {
      const result = controller.showClock();
      res.json(result);
    });

    app.post('/api/clock/hide', (req, res) => {
      const result = controller.hideClock();
      res.json(result);
    });

    app.post('/api/clock/toggle', (req, res) => {
      const result = controller.toggleClock();
      res.json(result);
    });

    // ==================== Preset Endpoints ====================
    
    app.post('/api/presets/:index', (req, res) => {
      const index = parseInt(req.params.index, 10);
      
      if (isNaN(index)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid preset index' 
        });
      }
      
      const result = controller.loadPreset(index);
      res.json(result);
    });

    // ==================== Root ====================
    
    app.get('/', (req, res) => {
      res.json({
        name: 'Countdown Timer REST API',
        version: '1.0.0',
        endpoints: {
          status: 'GET /api/status',
          health: 'GET /api/health',
          timer: {
            start: 'POST /api/timer/start',
            stop: 'POST /api/timer/stop',
            reset: 'POST /api/timer/reset',
            set: 'POST /api/timer/set',
            adjust: 'POST /api/timer/adjust'
          },
          display: {
            message: 'POST /api/display/message',
            clearMessage: 'DELETE /api/display/message',
            flash: 'POST /api/display/flash',
            toggleWindow: 'POST /api/display/window/toggle'
          },
          clock: {
            get: 'GET /api/clock',
            show: 'POST /api/clock/show',
            hide: 'POST /api/clock/hide',
            toggle: 'POST /api/clock/toggle'
          },
          presets: {
            load: 'POST /api/presets/:index'
          }
        }
      });
    });
  }

  /**
   * Start the REST API server
   */
  start() {
    if (!this.config.enabled) {
      console.log('REST API is disabled');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        if (!this.app) {
          this.initialize();
        }

        this.server = this.app.listen(this.config.port, () => {
          console.log(`✓ REST API server listening on port ${this.config.port}`);
          console.log(`  API endpoint: http://localhost:${this.config.port}/api`);
          resolve();
        });

        this.server.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.error(`✗ REST API port ${this.config.port} is already in use`);
            reject(new Error(`Port ${this.config.port} is already in use`));
          } else {
            console.error('✗ REST API server error:', err);
            reject(err);
          }
        });
      } catch (err) {
        console.error('✗ Failed to start REST API server:', err);
        reject(err);
      }
    });
  }

  /**
   * Stop the REST API server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('✓ REST API server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

module.exports = RestApiServer;
