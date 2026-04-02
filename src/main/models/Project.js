/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Project Data Model
 * Represents a complete app configuration that can be saved, loaded, and shared.
 * /
 */
const { v4: uuidv4 } = require('uuid');

class Project {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || 'Untitled Project';
    this.description = data.description || '';
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.modifiedAt = data.modifiedAt || new Date().toISOString();
    this.lastUsedAt = data.lastUsedAt || new Date().toISOString();
    this.usageCount = data.usageCount || 0;
    this.isDefault = data.isDefault || false;
    this.version = data.version || '1.0.0';
    
    // Complete app configuration
    this.config = data.config || this.getDefaultConfig();
  }

  /**
   * Get default configuration structure
   */
  getDefaultConfig() {
    return {
      timer: {
        defaultTime: { hours: 0, minutes: 45, seconds: 0 },
        lastSetTime: 2700000, // 45 minutes in ms
        autoStopAtZero: true,
        autoReset: false,
        flashAtZero: false,
        presets: [
          { id: 1, name: 'Preset 1', time: 300 },
          { id: 2, name: 'Preset 2', time: 600 },
          { id: 3, name: 'Preset 3', time: 900 },
          { id: 4, name: 'Preset 4', time: 1200 },
          { id: 5, name: 'Preset 5', time: 1500 },
          { id: 6, name: 'Preset 6', time: 1800 },
          { id: 7, name: 'Preset 7', time: 2700 },
          { id: 8, name: 'Preset 8', time: 3600 }
        ]
      },
      
      layout: {
        current: 'classic',
        hiddenBuiltinLayouts: [],
        preferences: {}
      },
      
      theme: {
        mode: 'dark',
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
        },
        fonts: {
          primary: 'system-ui',
          secondary: 'system-ui'
        }
      },
      
      media: {
        coverImage: {
          enabled: false,
          path: ''
        },
        backgroundImage: {
          enabled: false,
          path: '',
          opacity: 1.0
        },
        message: {
          visible: false,
          title: '',
          content: ''
        }
      },
      
      display: {
        clock: {
          visible: false,
          format: '24h'
        },
        warnings: {
          thresholdType: 'percentage',
          warningPercentage: 30,
          criticalPercentage: 5,
          warningTimeMinutes: 2,
          warningTimeSeconds: 0,
          criticalTimeMinutes: 0,
          criticalTimeSeconds: 30
        },
        canvas: {
          resolution: '1920x1080',
          quality: 'high',
          frameRate: 60
        },
        window: {
          rememberPosition: false,
          x: null,
          y: null,
          width: null,
          height: null
        }
      },
      
      api: {
        rest: {
          enabled: true,
          port: 9999
        },
        websocket: {
          enabled: true,
          port: 8080
        },
        osc: {
          enabled: true,
          receivePort: 7000,
          sendPort: 7001,
          metadata: true
        },
        allowExternal: false
      },
      
      audio: {
        enabled: false,
        completionSound: 'default',
        customSoundFile: null,
        customSoundFileName: null
      },

      appearance: {
        showWatermark: true,
        matchTimerColor: false
      },

      video: {
        defaultDevice: '',
        autoStartOnLaunch: false,
        autoStartOnLayout: true,
        releaseCameraIdle: true,
        resolution: '1920x1080',
        mirror: false,
        scaling: 'contain'
      }
    };
  }

  /**
   * Update project metadata
   */
  touch() {
    this.modifiedAt = new Date().toISOString();
  }

  /**
   * Increment usage count and update last used time
   */
  recordUsage() {
    this.usageCount++;
    this.lastUsedAt = new Date().toISOString();
    this.touch();
  }

  /**
   * Convert to JSON for storage
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      tags: this.tags,
      createdAt: this.createdAt,
      modifiedAt: this.modifiedAt,
      lastUsedAt: this.lastUsedAt,
      usageCount: this.usageCount,
      isDefault: this.isDefault,
      version: this.version,
      config: this.config
    };
  }

  /**
   * Create Project from JSON
   */
  static fromJSON(json) {
    return new Project(json);
  }

  /**
   * Validate project data structure
   */
  static validate(data) {
    const errors = [];
    
    if (!data.id || typeof data.id !== 'string') {
      errors.push('Invalid or missing project ID');
    }
    
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Invalid or missing project name');
    }
    
    if (!data.config || typeof data.config !== 'object') {
      errors.push('Invalid or missing configuration');
    }
    
    if (!data.version || typeof data.version !== 'string') {
      errors.push('Invalid or missing version');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Deep clone the project
   */
  clone(newName = null) {
    const cloned = new Project(JSON.parse(JSON.stringify(this.toJSON())));
    cloned.id = uuidv4(); // New unique ID
    cloned.name = newName || `${this.name} (Copy)`;
    cloned.createdAt = new Date().toISOString();
    cloned.modifiedAt = new Date().toISOString();
    cloned.lastUsedAt = new Date().toISOString();
    cloned.usageCount = 0;
    cloned.isDefault = false;
    return cloned;
  }
}

module.exports = Project;
