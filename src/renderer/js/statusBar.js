/**
 * Status Footer Manager
 * Manages error/warning messages and status icons in persistent footer
 */

import logger from './utils/logger.js';

class StatusBar {
  constructor() {
    this.messageElement = null;
    this.cameraIcon = null;
    this.serverIcon = null;
    this.currentMessage = null;
    this.clearTimeout = null;
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
    
    // Set initial states
    this.setCameraStatus(false);
    this.setServerStatus('inactive');
    
    logger.info('SYSTEM', 'Status footer initialized');
    return true;
  }

  /**
   * Show a message (warning or error)
   * @param {string} message - The message to display
   * @param {string} type - 'warning' or 'error'
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
    this.messageElement.classList.remove('has-text-warning', 'has-text-danger');

    // Add appropriate color class
    if (type === 'error') {
      this.messageElement.classList.add('has-text-danger');
    } else {
      this.messageElement.classList.add('has-text-warning');
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
    this.messageElement.classList.remove('has-text-warning', 'has-text-danger');
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
        this.serverIcon.title = port ? `API Server Running (Port ${port})` : 'API Server Running';
        break;
      case 'error':
        this.serverIcon.classList.add('server-error');
        this.serverIcon.title = 'API Server Error';
        break;
      case 'inactive':
      default:
        this.serverIcon.classList.add('server-inactive');
        this.serverIcon.title = 'API Server Inactive';
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
    this.showMessage(message, 'error', duration);
  }

  /**
   * Show camera live status (just updates icon, optional message)
   * @param {string} message - Optional message to display
   * @param {number} duration - Auto-clear duration for message
   */
  camera(message = null, duration = 0) {
    this.setCameraStatus(true);
    
    if (message) {
      // Clear any error/warning styling when camera is live
      this.clearMessage();
    }
  }

  /**
   * Legacy methods for compatibility
   */
  info(message, duration = 5000) {
    // Redirect to warning for visibility
    this.warning(message, duration);
  }

  success(message, duration = 5000) {
    // Clear message after success
    if (duration > 0) {
      setTimeout(() => this.clearMessage(), duration);
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