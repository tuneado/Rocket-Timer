/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Status Footer Manager
 * Messages and status icons for the footer. Writes to appState ('ui.status',
 * 'ui.performance', 'ui.cameraStatus'); components/StatusFooter.jsx renders them.
 */
import logger from './utils/logger.js';
import appState from './modules/appState.js';

const PERFORMANCE_LABELS = { good: 'Good', warning: 'Fair', critical: 'Poor' };

class StatusBar {
  constructor() {
    this.clearTimeout = null;
    this.unsubscribers = [];
  }

  /**
   * Follow camera state and report API server errors
   */
  init() {
    this.setCameraStatus(appState.get('camera.active'));
    this.unsubscribers.push(
      appState.subscribe('camera.active', (isActive) => this.setCameraStatus(isActive)),
      appState.subscribe('server.error', (error) => {
        if (error && error !== 'Disabled in settings') {
          this.error(`API Server Error: ${error}`, 5000);
        }
      })
    );
  }

  destroy() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
    clearTimeout(this.clearTimeout);
  }

  /**
   * Show a message
   * @param {string} message
   * @param {string} type - 'success', 'info', 'warning', or 'danger'/'error'
   * @param {number} duration - Auto-clear after ms (0 = persistent)
   */
  showMessage(message, type = 'warning', duration = 0) {
    clearTimeout(this.clearTimeout);
    this.clearTimeout = null;

    appState.set('ui.status', { text: message, type: type === 'error' ? 'danger' : type });
    if (duration > 0) {
      this.clearTimeout = setTimeout(() => this.clearMessage(), duration);
    }
    logger.info('SYSTEM', `Status: ${type} - ${message}`);
  }

  clearMessage() {
    clearTimeout(this.clearTimeout);
    this.clearTimeout = null;
    appState.set('ui.status', { text: '', type: 'info' });
  }

  /**
   * @param {boolean|string} status - true (live), false (inactive), or 'error'/'unavailable'
   */
  setCameraStatus(status) {
    appState.set('ui.cameraStatus', status === true ? true : (status === 'error' || status === 'unavailable') ? 'error' : false);
  }

  /**
   * @param {string} level - 'good', 'warning', 'critical'
   * @param {object} [stats] - renderer performance stats for the tooltip
   */
  setPerformanceStatus(level, stats = null) {
    let title = `Performance: ${PERFORMANCE_LABELS[level] || 'Unknown'}`;
    if (stats) {
      title = stats.isIdle && level === 'good'
        ? `Performance: Idle\nNo changes to render | ${stats.averageRenderTime}ms avg`
        : `${title}\n${stats.currentFPS} FPS | ${stats.averageRenderTime}ms avg`;
      if (level === 'critical') title += `\nDropped: ${stats.droppedFrames} frames`;
    }
    const current = appState.get('ui.performance');
    if (current.level !== level || current.title !== title) {
      appState.set('ui.performance', { level, title });
    }
  }

  warning(message, duration = 0) {
    this.showMessage(message, 'warning', duration);
  }

  error(message, duration = 0) {
    this.showMessage(message, 'danger', duration);
  }

  info(message, duration = 5000) {
    this.showMessage(message, 'info', duration);
  }

  success(message, duration = 5000) {
    this.showMessage(message, 'success', duration);
  }

  /**
   * Camera live, with an optional message
   */
  camera(message = null, duration = 0) {
    this.setCameraStatus(true);
    if (message) this.showMessage(message, 'info', duration);
  }

  /**
   * Clear the message and set the camera inactive
   */
  hide() {
    this.clearMessage();
    this.setCameraStatus(false);
  }

  getCurrentStatus() {
    const status = appState.get('ui.status');
    return status.text ? status : null;
  }

  isVisible() {
    return Boolean(appState.get('ui.status').text);
  }
}

const statusBar = new StatusBar();

// Make globally available
window.statusBar = statusBar;

export default statusBar;
