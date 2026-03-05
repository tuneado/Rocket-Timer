/**
 * Status Footer Manager
 * Manages error/warning messages and status icons in persistent footer
 * Subscribes to appState for automatic status updates
 */

import logger from './utils/logger.js';
import appState from './modules/appState.js';

class StatusBar {
  constructor() {
    this.messageElement = null;
    this.cameraIcon = null;
    this.serverIcon = null;
    this.currentMessage = null;
    this.clearTimeout = null;
    this.unsubscribers = []; // Store unsubscribe functions
  }

  /**
   * Initialize the status footer
   */
  init() {
    this.messageElement = document.getElementById('statusMessage');
    this.cameraIcon = document.getElementById('cameraStatus');
    this.serverIcon = document.getElementById('serverStatus');
    
    if (!this.messageElement || !this.cameraIcon || !this.serverIcon) {
      logger.error('SYSTEM', 'Status footer elements not found');
      return false;
    }
    
    // Set initial states from appState
    this.setCameraStatus(appState.get('camera.active'));
    
    const serverState = appState.get('server');
    if (serverState.running) {
      this.setServerStatus('active', serverState.port);
    } else if (serverState.error && serverState.error !== 'Disabled in settings') {
      this.setServerStatus('error');
    } else {
      this.setServerStatus('inactive');
    }
    
    // Subscribe to state changes for automatic updates
    this.setupStateSubscriptions();
    
    logger.info('SYSTEM', 'Status footer initialized with state subscriptions');
    return true;
  }

  /**
   * Setup subscriptions to appState for automatic updates
   */
  setupStateSubscriptions() {
    // Camera status subscription
    this.unsubscribers.push(
      appState.subscribe('camera.active', (isActive) => {
        this.setCameraStatus(isActive);
        logger.debug('STATUSBAR', `Camera status updated: ${isActive}`);
      })
    );

    // Server status subscription
    this.unsubscribers.push(
      appState.subscribe('server.running', (isRunning) => {
        if (isRunning) {
          const port = appState.get('server.port');
          this.setServerStatus('active', port);
        } else {
          const error = appState.get('server.error');
          // Treat "Disabled in settings" as inactive, not error
          const isActualError = error && error !== 'Disabled in settings';
          this.setServerStatus(isActualError ? 'error' : 'inactive');
        }
        logger.debug('STATUSBAR', `Server status updated: ${isRunning}`);
      })
    );

    // Server error subscription
    this.unsubscribers.push(
      appState.subscribe('server.error', (error) => {
        if (error && error !== 'Disabled in settings') {
          this.setServerStatus('error');
          this.error(`API Server Error: ${error}`, 5000);
        } else if (error === 'Disabled in settings') {
          // Don't show error message for disabled state
          this.setServerStatus('inactive');
        }
      })
    );

    // Timer running subscription (for future enhancements)
    this.unsubscribers.push(
      appState.subscribe('timer.running', (isRunning) => {
        logger.debug('STATUSBAR', `Timer running: ${isRunning}`);
        // Could add a timer icon/indicator here in the future
      })
    );

    logger.info('STATUSBAR', 'State subscriptions established (4 subscriptions)');
  }

  /**
   * Cleanup subscriptions
   */
  destroy() {
    // Unsubscribe from all state changes
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
    
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout);
    }
    
    logger.info('STATUSBAR', 'Status bar destroyed, subscriptions cleaned up');
  }

  /**
   * Show a message (warning, error, success, or info)
   * @param {string} message - The message to display
   * @param {string} type - 'success', 'info', 'warning', or 'danger'
   * @param {number} duration - Auto-clear duration in ms (0 = persistent)
   */
  showMessage(message, type = 'warning', duration = 0) {
    if (!this.messageElement) return;

    // Clear any existing timeout
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout);
      this.clearTimeout = null;
    }

    // Remove existing color classes
    this.messageElement.classList.remove(
      'has-text-success', 
      'has-text-info', 
      'has-text-warning', 
      'has-text-danger'
    );

    // Add appropriate Bulma color class
    switch (type) {
      case 'danger':
      case 'error':
        this.messageElement.classList.add('has-text-danger');
        break;
      case 'success':
        this.messageElement.classList.add('has-text-success');
        break;
      case 'info':
        this.messageElement.classList.add('has-text-info');
        break;
      case 'warning':
      default:
        this.messageElement.classList.add('has-text-warning');
        break;
    }

    // Set message
    this.messageElement.textContent = message;
    this.currentMessage = { message, type };

    // Auto-clear if duration is set
    if (duration > 0) {
      this.clearTimeout = setTimeout(() => {
        this.clearMessage();
      }, duration);
    }

    logger.info('SYSTEM', `Status: ${type} - ${message}`);
  }

  /**
   * Clear the current message
   */
  clearMessage() {
    if (!this.messageElement) return;

    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout);
      this.clearTimeout = null;
    }

    this.messageElement.textContent = '';
    this.messageElement.classList.remove(
      'has-text-success', 
      'has-text-info', 
      'has-text-warning', 
      'has-text-danger'
    );
    this.currentMessage = null;
  }

  /**
   * Set camera icon status
   * @param {boolean} isLive - True if camera is live
   */
  setCameraStatus(isLive) {
    if (!this.cameraIcon) return;

    this.cameraIcon.classList.remove('camera-inactive', 'camera-live');
    
    if (isLive) {
      this.cameraIcon.classList.add('camera-live');
      this.cameraIcon.title = 'Camera Live';
    } else {
      this.cameraIcon.classList.add('camera-inactive');
      this.cameraIcon.title = 'Camera Inactive';
    }
  }

  /**
   * Set server/API icon status
   * @param {string} status - 'inactive', 'active', or 'error'
   * @param {number} port - Optional port number to show in tooltip
   */
  setServerStatus(status, port = null) {
    if (!this.serverIcon) return;

    this.serverIcon.classList.remove('server-inactive', 'server-active', 'server-error');
    
    switch (status) {
      case 'active':
        this.serverIcon.classList.add('server-active');
        this.serverIcon.title = port ? 
          `Unified API Server Running\nREST: :${port} | WebSocket: :8080 | OSC: :7000` : 
          'Unified API Server Running (REST, WebSocket, OSC)';
        break;
      case 'error':
        this.serverIcon.classList.add('server-error');
        this.serverIcon.title = 'Unified API Server Error';
        break;
      case 'inactive':
      default:
        this.serverIcon.classList.add('server-inactive');
        this.serverIcon.title = 'Unified API Server Inactive';
        break;
    }
  }

  /**
   * Show warning message
   * @param {string} message
   * @param {number} duration
   */
  warning(message, duration = 0) {
    this.showMessage(message, 'warning', duration);
  }

  /**
   * Show error message
   * @param {string} message
   * @param {number} duration
   */
  error(message, duration = 0) {
    this.showMessage(message, 'danger', duration);
  }

  /**
   * Show info message
   * @param {string} message
   * @param {number} duration
   */
  info(message, duration = 5000) {
    this.showMessage(message, 'info', duration);
  }

  /**
   * Show success message
   * @param {string} message
   * @param {number} duration
   */
  success(message, duration = 5000) {
    this.showMessage(message, 'success', duration);
  }

  /**
   * Show camera live status (updates icon)
   * @param {string} message - Optional message to display
   * @param {number} duration - Auto-clear duration for message
   */
  camera(message = null, duration = 0) {
    this.setCameraStatus(true);
    
    if (message) {
      this.showMessage(message, 'info', duration);
    }
  }

  /**
   * Hide/clear - clears message and sets camera to inactive
   */
  hide() {
    this.clearMessage();
    this.setCameraStatus(false);
  }

  /**
   * Get current status
   */
  getCurrentStatus() {
    return this.currentMessage;
  }

  /**
   * Check if there's an active message
   */
  isVisible() {
    return this.currentMessage !== null;
  }
}

// Create and export singleton instance
const statusBar = new StatusBar();

// Make globally available
window.statusBar = statusBar;

// Export for ES modules
export default statusBar;