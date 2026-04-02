/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Centralized Logger Utility
 * Provides consistent logging with levels, categories, and formatting
 * /
 */
class Logger {
  constructor() {
    // Log levels
    this.LEVELS = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      NONE: 4
    };

    // Detect environment
    this.isDevelopment = this._detectEnvironment();

    // Set log level based on environment
    // Development: show DEBUG and above
    // Production: show WARN and above (suppress INFO and DEBUG)
    this.currentLevel = this.isDevelopment ? this.LEVELS.DEBUG : this.LEVELS.WARN;

    // Log categories with emojis
    this.CATEGORIES = {
      TIMER: '⏱️',
      VIDEO: '📹',
      AUDIO: '🔊',
      SETTINGS: '⚙️',
      CANVAS: '🎨',
      LAYOUT: '📐',
      PRESET: '💾',
      FEATURE: '📷',
      IPC: '🔄',
      SYSTEM: '⚡'
    };

    // Enable/disable console output
    this.enabled = true;

    // Store logs for debugging (optional)
    this.logHistory = [];
    this.maxHistorySize = this.isDevelopment ? 200 : 50;
    
    // Try to load config (development only)
    this._loadConfig();
    
    // Log the environment on initialization
    console.log(`🔧 Logger initialized - Environment: ${this.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} - Level: ${this.getLevelName()}`);
  }

  /**
   * Load logger configuration
   * @private
   */
  _loadConfig() {
    try {
      // Try to get config from window if it was set by main process
      if (typeof window !== 'undefined' && window.loggerConfig) {
        const config = window.loggerConfig;
        const envConfig = config[this.isDevelopment ? 'development' : 'production'];
        
        // Apply override if set (highest priority)
        if (config.override && this.LEVELS[config.override] !== undefined) {
          this.currentLevel = this.LEVELS[config.override];
          this.enabled = true;
          console.log(`🔧 Logger override applied: ${config.override}`);
        } else if (envConfig) {
          // Apply environment config
          if (envConfig.level && this.LEVELS[envConfig.level] !== undefined) {
            this.currentLevel = this.LEVELS[envConfig.level];
          }
          if (envConfig.enabled !== undefined) {
            this.enabled = envConfig.enabled;
          }
          if (envConfig.maxHistorySize) {
            this.maxHistorySize = envConfig.maxHistorySize;
          }
        }
      }
    } catch (error) {
      // Silently fail - use defaults
      console.warn('Logger config load failed:', error);
    }
  }

  /**
   * Detect if we're in development or production
   * @private
   */
  _detectEnvironment() {
    // Method 1: Check if we're loading from file:// protocol (development)
    // In development, Electron loads from file:// 
    // In production packaged app, it also loads from file:// but from .asar
    if (typeof window !== 'undefined' && window.location) {
      const href = window.location.href;
      // Development typically has the full file path visible
      // Production has .asar in the path
      if (href.includes('.asar')) {
        return false; // Production (packaged)
      }
      // If file protocol and not .asar, likely development
      if (window.location.protocol === 'file:') {
        return true; // Development
      }
    }

    // Method 2: Check if running in Electron dev mode via process.env
    // This won't work in renderer unless exposed via preload
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
      return process.env.NODE_ENV === 'development';
    }

    // Method 3: Check for development indicators in path
    if (typeof window !== 'undefined' && window.location) {
      const path = window.location.pathname || '';
      return path.includes('/src/') || path.includes('/renderer/');
    }

    // Default to development for safety (show more logs rather than less)
    return true;
  }

  /**
   * Get the current log level name
   * @private
   */
  getLevelName() {
    for (const [name, value] of Object.entries(this.LEVELS)) {
      if (value === this.currentLevel) {
        return name;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Set the minimum log level
   * @param {string} level - 'DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'
   */
  setLevel(level) {
    const upperLevel = level.toUpperCase();
    if (this.LEVELS.hasOwnProperty(upperLevel)) {
      this.currentLevel = this.LEVELS[upperLevel];
    }
  }

  /**
   * Enable or disable logging
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Format log message with category
   * @private
   */
  _formatMessage(category, message) {
    const emoji = this.CATEGORIES[category] || '📝';
    const timestamp = new Date().toLocaleTimeString();
    return `[${timestamp}] ${emoji} ${message}`;
  }

  /**
   * Add to log history
   * @private
   */
  _addToHistory(level, category, message, data) {
    this.logHistory.push({
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    });

    // Keep history size under control
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Log at DEBUG level
   * @param {string} category - Category constant (e.g., 'TIMER')
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  debug(category, message, data = null) {
    if (!this.enabled || this.currentLevel > this.LEVELS.DEBUG) return;

    const formatted = this._formatMessage(category, message);
    if (data !== null) {
      console.debug(formatted, data);
    } else {
      console.debug(formatted);
    }

    this._addToHistory('DEBUG', category, message, data);
  }

  /**
   * Log at INFO level
   * @param {string} category - Category constant
   * @param {string} message - Log message
   * @param {*} data - Optional data
   */
  info(category, message, data = null) {
    if (!this.enabled || this.currentLevel > this.LEVELS.INFO) return;

    const formatted = this._formatMessage(category, message);
    if (data !== null) {
      console.log(formatted, data);
    } else {
      console.log(formatted);
    }

    this._addToHistory('INFO', category, message, data);
  }

  /**
   * Log at WARN level
   * @param {string} category - Category constant
   * @param {string} message - Log message
   * @param {*} data - Optional data
   */
  warn(category, message, data = null) {
    if (!this.enabled || this.currentLevel > this.LEVELS.WARN) return;

    const formatted = this._formatMessage(category, message);
    if (data !== null) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }

    this._addToHistory('WARN', category, message, data);
  }

  /**
   * Log at ERROR level
   * @param {string} category - Category constant
   * @param {string} message - Log message
   * @param {*} error - Optional error object
   */
  error(category, message, error = null) {
    if (!this.enabled || this.currentLevel > this.LEVELS.ERROR) return;

    const formatted = this._formatMessage(category, message);
    if (error !== null) {
      console.error(formatted, error);
    } else {
      console.error(formatted);
    }

    this._addToHistory('ERROR', category, message, error);
  }

  /**
   * Get log history
   * @param {number} count - Number of recent logs to return
   * @returns {Array}
   */
  getHistory(count = null) {
    if (count === null) {
      return [...this.logHistory];
    }
    return this.logHistory.slice(-count);
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this.logHistory = [];
  }

  /**
   * Export logs as text
   * @returns {string}
   */
  exportLogs() {
    return this.logHistory.map(log => {
      const date = new Date(log.timestamp).toLocaleString();
      const emoji = this.CATEGORIES[log.category] || '📝';
      let text = `[${date}] [${log.level}] ${emoji} ${log.message}`;
      if (log.data) {
        text += `\n  Data: ${JSON.stringify(log.data, null, 2)}`;
      }
      return text;
    }).join('\n');
  }
}

// Create singleton instance
const logger = new Logger();

// Make globally available
if (typeof window !== 'undefined') {
  window.logger = logger;
}

// Export for ES modules
export default logger;
