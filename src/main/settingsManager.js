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

      // Presets
      presets: [
        { id: 1, time: '05:00' },
        { id: 2, time: '10:00' },
        { id: 3, time: '15:00' },
        { id: 4, time: '20:00' }
      ],

      // API & Integration
      companionServerEnabled: true,
      companionServerPort: 9999,
      companionAllowExternal: false,

      // Appearance
      appearanceTheme: 'dark',
      matchTimerColor: false,
      
      // Cover Image (highest z-index overlay)
      coverImage: {
        enabled: false,
        path: ''
      },
      
      // Background Image (low z-index, always visible when set)
      backgroundImage: {
        enabled: false,
        path: '',
        opacity: 1.0
      },
      
      // Canvas Colors
      colors: {
        countdown: '#ffffff',
        clock: '#a0a0a0',
        elapsed: '#808080',
        message: '#ffaa00',
        messageBackground: '#000000',
        separator: '#333333',
        background: '#000000',
        progressSuccess: '#4ade80',
        progressWarning: '#fbbf24',
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
