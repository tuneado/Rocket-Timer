/**
 * Application State Store
 * Centralized state management with pub/sub pattern
 * Single source of truth for all application state
 */

import logger from '../utils/logger.js';

class AppState {
  constructor() {
    this.state = {
      // Timer state
      timer: {
        running: false,
        paused: false,
        remainingTime: 0,      // milliseconds
        totalTime: 0,          // milliseconds
        lastSetTime: 0,        // milliseconds
        hours: 0,
        minutes: 0,
        seconds: 0,
        percentage: 100,
        formattedTime: '--:--:--', // formatted time string
        endTime: null,         // Date object when timer will finish
        endTimeFormatted: '--:--:--', // formatted end time string
        preset: null           // null or preset index (0-7), null = custom
      },

      // Camera/Video Input state
      camera: {
        active: false,
        deviceId: null,
        deviceLabel: null,
        opacity: 1.0
      },

      // Companion API Server state
      server: {
        running: false,
        port: null,
        error: null,
        connectedClients: 0
      },

      // External Display Window state
      display: {
        visible: false,
        windowId: null
      },

      // Clock state
      clock: {
        visible: true,
        time: null,
        format24h: true
      },

      // Layout state
      layout: {
        current: 'classic',
        previous: null
      },

      // Message state
      message: {
        visible: false,
        text: '',
        charCount: 0,
        maxChars: 100
      },

      // Background/Feature Image state
      featureImage: {
        enabled: false,
        path: null,
        opacity: 1.0
      },

      // Theme state
      theme: 'dark',

      // Settings state (subset of important settings)
      settings: {
        autoReset: false,
        companionEnabled: true,
        soundEnabled: true,
        flashEnabled: true,
        releaseCameraIdle: true
      }
    };

    // Subscribers: Map<path, Set<callback>>
    this.subscribers = new Map();
    
    // History for debugging (last 50 changes)
    this.history = [];
    this.maxHistory = 50;

    logger.info('STATE', 'AppState initialized');
  }

  /**
   * Get value at path (e.g., 'timer.running' or 'camera.active')
   * @param {string} path - Dot-notation path to value
   * @returns {any} Value at path
   */
  get(path) {
    if (!path) return { ...this.state };
    
    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }
    
    return value;
  }

  /**
   * Set value at path
   * @param {string} path - Dot-notation path
   * @param {any} value - New value
   * @param {boolean} silent - If true, don't notify subscribers
   */
  set(path, value, silent = false) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    // Navigate to parent object
    let target = this.state;
    for (const key of keys) {
      if (!(key in target)) {
        logger.warn('STATE', `Path ${path} does not exist in state`);
        return false;
      }
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    
    // Only update if value actually changed
    if (oldValue === value) {
      return false;
    }
    
    target[lastKey] = value;
    
    // Add to history
    this.addToHistory(path, oldValue, value);
    
    // Notify subscribers unless silent
    if (!silent) {
      this.notify(path, value, oldValue);
    }
    
    // Only log non-timer updates to reduce noise (timer updates happen every frame)
    if (!path.startsWith('timer.')) {
      logger.debug('STATE', `Updated ${path}:`, { old: oldValue, new: value });
    }
    
    return true;
  }

  /**
   * Update multiple values at once
   * @param {Object} updates - Object with path: value pairs
   * @param {boolean} silent - If true, don't notify subscribers
   */
  update(updates, silent = false) {
    const changes = [];
    
    for (const [path, value] of Object.entries(updates)) {
      const changed = this.set(path, value, true);
      if (changed) {
        changes.push({ path, value, old: this.get(path) });
      }
    }
    
    // Notify subscribers after all changes
    if (!silent && changes.length > 0) {
      for (const change of changes) {
        this.notify(change.path, change.value, change.old);
      }
    }
    
    return changes.length > 0;
  }

  /**
   * Subscribe to state changes
   * @param {string} path - Path to watch (e.g., 'timer.running' or '*' for all)
   * @param {Function} callback - Called when value changes: (newValue, oldValue, path) => {}
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (typeof callback !== 'function') {
      logger.error('STATE', 'Subscribe callback must be a function');
      return () => {};
    }
    
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    
    this.subscribers.get(path).add(callback);
    
    logger.debug('STATE', `Subscribed to ${path} (${this.subscribers.get(path).size} subscribers)`);
    
    // Return unsubscribe function
    return () => {
      if (this.subscribers.has(path)) {
        this.subscribers.get(path).delete(callback);
        logger.debug('STATE', `Unsubscribed from ${path}`);
      }
    };
  }

  /**
   * Notify all subscribers of a change
   * @private
   */
  notify(path, newValue, oldValue) {
    // Notify exact path subscribers
    if (this.subscribers.has(path)) {
      this.subscribers.get(path).forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          logger.error('STATE', `Error in subscriber callback for ${path}:`, error);
        }
      });
    }
    
    // Notify wildcard subscribers
    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          logger.error('STATE', `Error in wildcard subscriber callback:`, error);
        }
      });
    }
    
    // Notify parent path subscribers (e.g., 'timer' when 'timer.running' changes)
    const pathParts = path.split('.');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.');
      if (this.subscribers.has(parentPath + '.*')) {
        const parentValue = this.get(parentPath);
        this.subscribers.get(parentPath + '.*').forEach(callback => {
          try {
            callback(parentValue, undefined, path);
          } catch (error) {
            logger.error('STATE', `Error in parent subscriber callback for ${parentPath}.*:`, error);
          }
        });
      }
    }
  }

  /**
   * Get entire state (deep copy)
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Reset state to initial values
   */
  reset() {
    const oldState = this.getState();
    
    this.state = {
      timer: {
        running: false,
        paused: false,
        remainingTime: 0,
        totalTime: 0,
        lastSetTime: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        percentage: 100,
        formattedTime: '00:00:00',
        preset: null
      },
      camera: {
        active: false,
        deviceId: null,
        deviceLabel: null,
        opacity: 1.0
      },
      server: {
        running: false,
        port: null,
        error: null,
        connectedClients: 0
      },
      display: {
        visible: false,
        windowId: null
      },
      clock: {
        visible: true,
        time: null,
        format24h: true
      },
      layout: {
        current: 'classic',
        previous: null
      },
      message: {
        visible: false,
        text: '',
        charCount: 0,
        maxChars: 100
      },
      featureImage: {
        enabled: false,
        path: null,
        opacity: 1.0
      },
      theme: 'dark',
      settings: {
        autoReset: false,
        companionEnabled: true,
        soundEnabled: true,
        flashEnabled: true,
        releaseCameraIdle: true
      }
    };
    
    this.notify('*', this.state, oldState);
    this.history = [];
    
    logger.info('STATE', 'State reset to initial values');
  }

  /**
   * Add change to history
   * @private
   */
  addToHistory(path, oldValue, newValue) {
    this.history.push({
      timestamp: Date.now(),
      path,
      oldValue,
      newValue
    });
    
    // Trim history if too long
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Get state change history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      state: this.getState(),
      subscribers: Array.from(this.subscribers.entries()).map(([path, subs]) => ({
        path,
        count: subs.size
      })),
      historyLength: this.history.length,
      recentChanges: this.history.slice(-10)
    };
  }

  /**
   * Log current state to console
   */
  logState() {
    console.group('📊 Application State');
    console.log('Timer:', this.state.timer);
    console.log('Camera:', this.state.camera);
    console.log('Server:', this.state.server);
    console.log('Display:', this.state.display);
    console.log('Clock:', this.state.clock);
    console.log('Layout:', this.state.layout);
    console.log('Message:', this.state.message);
    console.log('Feature Image:', this.state.featureImage);
    console.log('Theme:', this.state.theme);
    console.log('Settings:', this.state.settings);
    console.groupEnd();
  }
}

// Create singleton instance
const appState = new AppState();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.appState = appState;
}

export default appState;
