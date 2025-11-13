/**
 * Unified API Controller
 * 
 * This controller provides a unified interface for timer control operations
 * that can be accessed via multiple protocols (IPC, REST, WebSocket, OSC).
 * 
 * It maintains the application state and broadcasts updates to all connected clients.
 */

const EventEmitter = require('events');

class ApiController extends EventEmitter {
  constructor(mainWindow, getDisplayWindow, getSettingsWindow) {
    super();
    
    this.mainWindow = mainWindow;
    this.getDisplayWindow = getDisplayWindow;
    this.getSettingsWindow = getSettingsWindow;
    
    // Store current state
    this.state = {
      timer: {
        remainingTime: 0,
        totalTime: 0,
        running: false,
        formattedTime: '00:00:00'
      },
      clock: {
        time: '00:00:00',
        visible: false
      },
      message: {
        text: '',
        visible: false
      },
      display: {
        windowVisible: false
      }
    };
  }

  /**
   * Get current application state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Broadcast state update to all clients
   */
  broadcastStateUpdate(eventType, data) {
    this.emit(eventType, data);
  }

  // ==================== Timer Operations ====================

  /**
   * Start the timer
   */
  startTimer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('menu-start-stop');
      this.state.timer.running = true;
      this.broadcastStateUpdate('timer:started', { running: true });
      return { success: true, message: 'Timer started' };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Stop the timer
   */
  stopTimer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('menu-start-stop');
      this.state.timer.running = false;
      this.broadcastStateUpdate('timer:stopped', { running: false });
      return { success: true, message: 'Timer stopped' };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Reset the timer
   */
  resetTimer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('menu-reset');
      this.broadcastStateUpdate('timer:reset', {});
      return { success: true, message: 'Timer reset' };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Set timer duration
   * @param {number} hours 
   * @param {number} minutes 
   * @param {number} seconds 
   */
  setTimer(hours, minutes, seconds) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
      this.mainWindow.webContents.send('api-set-timer', { hours, minutes, seconds, totalSeconds });
      this.state.timer.totalTime = totalSeconds;
      this.state.timer.remainingTime = totalSeconds;
      this.broadcastStateUpdate('timer:set', { hours, minutes, seconds, totalSeconds });
      return { success: true, message: 'Timer set', totalSeconds };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Adjust timer by adding or subtracting seconds
   * @param {number} seconds - Positive to add, negative to subtract
   */
  adjustTimer(seconds) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('api-adjust-timer', { seconds });
      this.broadcastStateUpdate('timer:adjusted', { seconds });
      return { success: true, message: `Timer adjusted by ${seconds} seconds`, seconds };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Update timer state (called from IPC handlers)
   */
  updateTimerState(data) {
    this.state.timer = {
      ...this.state.timer,
      remainingTime: data.remainingTime,
      totalTime: data.totalTime,
      formattedTime: data.formattedTime,
      progress: data.progressPercent
    };
    this.broadcastStateUpdate('timer:update', this.state.timer);
  }

  // ==================== Display Operations ====================

  /**
   * Display a message
   * @param {string} text 
   */
  displayMessage(text) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('api-display-message', { text });
      this.state.message = { text, visible: true };
      this.broadcastStateUpdate('message:shown', { text });
      return { success: true, message: 'Message displayed', text };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Clear the displayed message
   */
  clearMessage() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('api-clear-message');
      this.state.message = { text: '', visible: false };
      this.broadcastStateUpdate('message:cleared', {});
      return { success: true, message: 'Message cleared' };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Trigger flash animation
   */
  triggerFlash() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('api-trigger-flash');
      this.broadcastStateUpdate('display:flash', {});
      return { success: true, message: 'Flash triggered' };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Toggle display window
   */
  toggleDisplayWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('toggle-display-window');
      this.state.display.windowVisible = !this.state.display.windowVisible;
      this.broadcastStateUpdate('display:windowToggled', { visible: this.state.display.windowVisible });
      return { success: true, message: 'Display window toggled', visible: this.state.display.windowVisible };
    }
    return { success: false, message: 'Main window not available' };
  }

  // ==================== Clock Operations ====================

  /**
   * Show clock
   */
  showClock() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('menu-toggle-clock', true);
      this.state.clock.visible = true;
      this.broadcastStateUpdate('clock:shown', { visible: true });
      return { success: true, message: 'Clock shown' };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Hide clock
   */
  hideClock() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('menu-toggle-clock', false);
      this.state.clock.visible = false;
      this.broadcastStateUpdate('clock:hidden', { visible: false });
      return { success: true, message: 'Clock hidden' };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Toggle clock visibility
   */
  toggleClock() {
    const newState = !this.state.clock.visible;
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('menu-toggle-clock', newState);
      this.state.clock.visible = newState;
      this.broadcastStateUpdate('clock:toggled', { visible: newState });
      return { success: true, message: `Clock ${newState ? 'shown' : 'hidden'}`, visible: newState };
    }
    return { success: false, message: 'Main window not available' };
  }

  /**
   * Update clock state (called from IPC handlers)
   */
  updateClockState(data) {
    this.state.clock = {
      time: data.time,
      visible: data.visible
    };
    this.broadcastStateUpdate('clock:update', this.state.clock);
  }

  // ==================== Preset Operations ====================

  /**
   * Load a preset by index
   * @param {number} index - Preset index (0-7)
   */
  loadPreset(index) {
    if (index < 0 || index > 7) {
      return { success: false, message: 'Invalid preset index. Must be 0-7.' };
    }
    
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('api-load-preset', { index });
      this.broadcastStateUpdate('preset:loaded', { index });
      return { success: true, message: `Preset ${index} loaded`, index };
    }
    return { success: false, message: 'Main window not available' };
  }
}

module.exports = ApiController;
