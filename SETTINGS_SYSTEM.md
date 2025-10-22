# Settings System Documentation

## Overview
The Countdown Timer app now includes a comprehensive settings system that persists user preferences and synchronizes them across all windows.

## Architecture

### Components

1. **SettingsManager** (`src/main/settingsManager.js`)
   - Main process singleton that handles settings persistence
   - Stores settings in: `~/Library/Application Support/countdown-timer/settings.json` (macOS)
   - Manages default values and validation

2. **IPC Handlers** (`src/main/ipcHandlers.js`)
   - Provides communication bridge between renderer and main process
   - Handles: `get-settings`, `save-settings`, `get-setting`, `save-setting`, `reset-settings`

3. **Preload Script** (`src/preload/preload.js`)
   - Exposes secure settings API to renderer process
   - Available via `window.electron.settings`

4. **Settings UI** (`src/renderer/js/settings.js`)
   - Manages the preferences window
   - Handles form state and user input
   - Auto-saves on change

## Settings Structure

```javascript
{
  // Display
  defaultLayout: 'classic',        // 'classic' | 'minimal' | 'clockfocus' | 'detailed' | 'circular' | 'video'
  defaultTheme: 'dark',             // 'dark' | 'light' | 'auto'
  showClock: false,                 // boolean
  timeFormat: '24h',                // '24h' | '12h'

  // Timer
  defaultTime: {
    hours: 0,
    minutes: 45,
    seconds: 0
  },
  autoReset: false,                 // boolean
  soundNotification: false,         // boolean

  // Canvas
  canvasResolution: '1920x1080',    // '1920x1080' | '1280x720' | '2560x1440' | '3840x2160' | 'custom'
  canvasQuality: 'high',            // 'high' | 'balanced' | 'performance'
  frameRate: 60,                    // 60 | 30 | 24

  // External Display
  autoOpenDisplay: false,           // boolean
  displayMonitor: 0,                // number (monitor index)

  // Performance
  hardwareAcceleration: true,       // boolean
  reduceMotion: false,              // boolean
  lowPowerMode: false,              // boolean

  // Video Input
  defaultVideoDevice: '',           // string (device ID)
  autoStartVideoLaunch: false,      // boolean
  autoStartVideoLayout: true,       // boolean
  releaseCameraIdle: true,          // boolean
  videoResolution: '1920x1080',     // '1920x1080' | '1280x720' | 'auto'

  // Presets
  presets: [
    { id: 1, time: '05:00' },
    { id: 2, time: '10:00' },
    { id: 3, time: '15:00' },
    { id: 4, time: '20:00' }
  ],

  // Appearance
  appearanceTheme: 'dark',          // 'dark' | 'light' | 'auto'

  // Canvas Colors
  colors: {
    countdown: '#ffffff',
    clock: '#a0a0a0',
    elapsed: '#808080',
    message: '#ffaa00',
    separator: '#333333',
    background: '#000000',
    progressSuccess: '#4ade80',
    progressWarning: '#fbbf24',
    progressDanger: '#ef4444'
  }
}
```

## Usage

### In Renderer Process

```javascript
// Get all settings
const settings = await window.electron.settings.getAll();

// Get a specific setting
const theme = await window.electron.settings.get('defaultTheme');

// Save all settings
await window.electron.settings.saveAll(newSettings);

// Save a single setting
await window.electron.settings.save('defaultTheme', 'dark');

// Reset to defaults
await window.electron.settings.reset();

// Listen for settings updates
window.electron.settings.onUpdate((settings) => {
  console.log('Settings updated:', settings);
});
```

### In Main Process

```javascript
const SettingsManager = require('./settingsManager');
const settingsManager = new SettingsManager();

// Get settings
const settings = settingsManager.getSettings();
const theme = settingsManager.getSetting('defaultTheme');

// Save settings
settingsManager.saveSettings({ defaultTheme: 'dark' });
settingsManager.setSetting('defaultTheme', 'dark');

// Reset
settingsManager.resetSettings();
```

## Features

### Auto-Save
- All settings auto-save when changed in the preferences window
- No need for a "Save" button
- Changes are immediately persisted to disk

### Cross-Window Sync
- Settings changes are broadcast to all open windows
- Main window, display window, and settings window stay in sync

### Theme Support
- Dark mode
- Light mode
- Auto (follows system preference)
- Theme changes apply immediately

### Preset Management
- Create, edit, and delete time presets
- Drag to reorder (UI ready, functionality pending)
- Import/export presets (UI ready, functionality pending)

### Color Customization
- Customize all canvas colors
- Color picker for easy selection
- Live preview in main application

## File Location

Settings are stored in:
- **macOS**: `~/Library/Application Support/countdown-timer/settings.json`
- **Windows**: `%APPDATA%/countdown-timer/settings.json`
- **Linux**: `~/.config/countdown-timer/settings.json`

## Default Values

When the app starts for the first time or settings are reset, default values are applied from `SettingsManager.getDefaultSettings()`.

## Future Enhancements

- [ ] Import/Export settings as JSON file
- [ ] Settings profiles (multiple saved configurations)
- [ ] Cloud sync
- [ ] Preset drag-and-drop reordering
- [ ] Custom keyboard shortcuts
- [ ] Advanced video input settings
- [ ] Canvas export settings
