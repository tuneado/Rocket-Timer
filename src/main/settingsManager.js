/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class SettingsManager {
  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.settings = this.loadSettings();
  }

  getDefaultSettings() {
    return {
      // Display
      defaultLayout: 'classic',
      defaultTheme: 'dark',
      showClock: false,
      timeFormat: '24h',

      // Timer
      defaultTime: {
        hours: 0,
        minutes: 45,
        seconds: 0
      },
      autoStopAtZero: true,
      autoReset: false,
      soundNotification: false,
      flashAtZero: false,
      clockFormat: '24h',

      // Timer State Thresholds
      timerThresholdType: 'percentage',
      warningPercentage: 30,
      criticalPercentage: 5,
      warningTimeMinutes: 2,
      warningTimeSeconds: 0,
      criticalTimeMinutes: 0,
      criticalTimeSeconds: 30,

      // Canvas
      canvasResolution: '1920x1080',
      canvasQuality: 'high',
      frameRate: 60,

      // External Display
      autoOpenDisplay: false,
      displayMonitor: 0,

      // Performance
      hardwareAcceleration: true,
      reduceMotion: false,
      lowPowerMode: false,

      // Video Input
      defaultVideoDevice: '',
      autoStartVideoLaunch: false,
      autoStartVideoLayout: true,
      releaseCameraIdle: true,
      videoResolution: '1920x1080',
      mirrorVideo: false,
      videoScaling: 'contain',

      // Presets (time in seconds)
      presets: [
        { id: 1, name: 'Preset 1', time: 300 },
        { id: 2, name: 'Preset 2', time: 600 },
        { id: 3, name: 'Preset 3', time: 900 },
        { id: 4, name: 'Preset 4', time: 1200 },
        { id: 5, name: 'Preset 5', time: 1500 },
        { id: 6, name: 'Preset 6', time: 1800 },
        { id: 7, name: 'Preset 7', time: 2700 },
        { id: 8, name: 'Preset 8', time: 3600 }
      ],

      // API & Integration
      companionServerEnabled: true,
      companionServerPort: 9999,
      companionAllowExternal: false,

      // Appearance
      appearanceTheme: 'dark',
      matchTimerColor: false,
      showWatermark: true,

      // Keyboard Shortcuts
      keyboardShortcuts: {
        'space': { enabled: true, key: 'space', description: 'Start/Stop timer' },
        'r': { enabled: true, key: 'r', description: 'Reset timer' },
        'arrowup': { enabled: true, key: 'arrowup', description: 'Add one minute' },
        'arrowdown': { enabled: true, key: 'arrowdown', description: 'Subtract one minute' },
        'shift+arrowup': { enabled: true, key: 'shift+arrowup', description: 'Add 5 minutes' },
        'shift+arrowdown': { enabled: true, key: 'shift+arrowdown', description: 'Subtract 5 minutes' },
        'ctrl+arrowup': { enabled: true, key: 'ctrl+arrowup', description: 'Add 10 minutes' },
        'ctrl+arrowdown': { enabled: true, key: 'ctrl+arrowdown', description: 'Subtract 10 minutes' },
        'f': { enabled: true, key: 'f', description: 'Flash screen' },
        'm': { enabled: true, key: 'm', description: 'Toggle sound mute' },
        'i': { enabled: true, key: 'i', description: 'Toggle feature image' },
        '1': { enabled: true, key: '1', description: 'Activate preset 1' },
        '2': { enabled: true, key: '2', description: 'Activate preset 2' },
        '3': { enabled: true, key: '3', description: 'Activate preset 3' },
        '4': { enabled: true, key: '4', description: 'Activate preset 4' },
        '5': { enabled: true, key: '5', description: 'Activate preset 5' },
        '6': { enabled: true, key: '6', description: 'Activate preset 6' },
        '7': { enabled: true, key: '7', description: 'Activate preset 7' },
        '8': { enabled: true, key: '8', description: 'Activate preset 8' },
      },
      
      // Cover Image (highest z-index overlay)
      
      // Background Image (low z-index, always visible when set)
      backgroundImage: {
        enabled: false,
        path: '',
        opacity: 1.0
      },
      
      // Canvas Colors
      colors: {
        countdown: '#ffffff',
        clock: '#808080',
        elapsed: '#808080',
        message: '#ffffff',
        messageBackground: '#000000',
        separator: '#333333',
        background: '#000000',
        progressSuccess: '#4ade80',
        progressWarning: '#f59e0b',
        progressDanger: '#ef4444',
        progressOvertime: '#991b1b'
      }
    };
  }

  loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const loadedSettings = JSON.parse(data);
        // Merge with defaults to ensure all properties exist
        return { ...this.getDefaultSettings(), ...loadedSettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return this.getDefaultSettings();
  }

  saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  getSettings() {
    return this.settings;
  }

  getSetting(key) {
    return this.settings[key];
  }

  setSetting(key, value) {
    this.settings[key] = value;
    return this.saveSettings(this.settings);
  }

  resetSettings() {
    this.settings = this.getDefaultSettings();
    return this.saveSettings(this.settings);
  }
}

module.exports = SettingsManager;
