# Countdown.js Code Organization

## File Structure Overview
**Total Lines:** ~1750  
**Location:** `src/renderer/js/countdown.js`

This file contains all main timer functionality. It's organized into logical sections:

---

## 📋 Table of Contents

### 1. **Imports & Global State** (Lines 1-25)
- Canvas effects import
- Status bar import  
- Timer state variables (countdown, remainingTime, totalTime, running, etc.)
- Canvas renderer initialization
- IPC renderer setup

### 2. **Settings Management** (Lines 29-155)
- `loadAndApplySettings()` - Load and apply user settings
- `applyCanvasColors()` - Apply color customizations
- Settings update listeners
- DOMContentLoaded initialization

### 3. **DOM Elements** (Lines 254-261)
- Button references (start/stop, reset, add/subtract minute)
- Message input controls
- Character counter

### 4. **Clock Functions** (Lines 267-328)
- `updateClock()` - Update real-time clock display
- `startClock()` - Start the clock
- `stopClock()` - Stop the clock

### 5. **Timer Core Functions** (Lines 329-480)
- `formatTime()` - Format seconds to HH:MM:SS
- `updateButtonIcon()` - Update button icon and text
- `flashAtZero()` - Flash animation at completion
- `handleTimerComplete()` - Handle timer reaching zero
- `updateDisplay()` - Update canvas with current state
- `sendStateUpdate()` - Send state to companion API
- `changeLayout()` - Change canvas layout

### 6. **IPC Event Listeners** (Lines 481-606)
- Menu toggle handlers (display, clock)
- Companion server status updates
- **Companion API command handler** (lines 534-595)
  - start, stop, reset commands
  - setTime, loadPreset, changeLayout
  - setMessage command
- Menu state updates

### 7. **Timer Controls** (Lines 609-699)
- Start/Stop button handler
- Reset button handler  
- Timer interval logic
- Auto-stop functionality

### 8. **Flash & Mute Buttons** (Lines 701-775)
- Flash button - manual flash trigger
- Mute sounds button - toggle notifications
- `updateMuteButtonState()` - Update mute button UI

### 9. **Feature Image** (Lines 777-857)
- Feature image toggle button
- `updateFeatureImageButtonState()` - Update UI state
- Image enable/disable logic

### 10. **Preset Management** (Lines 859-923)
- Preset button click handlers
- `updatePresetFromInputs()` - Update preset with current time
- Cmd/Ctrl+Click to update presets
- `resetPresetsToDefault()` - Reset all presets
- Preset persistence (localStorage)

### 11. **Time Input Management** (Lines 925-991)
- `normalizeTimeInputs()` - Handle overflow (60+ seconds/minutes)
- `updateTimeFromInputs()` - Update timer from input fields
- `addMinute()` / `subtractMinute()` - Adjust time buttons
- Input change listeners

### 12. **Message System** (Lines 993-1090)
- `updateCharCounter()` - Character count display
- `displayMessage()` - Show message on canvas
- `hideMessage()` - Hide message
- `clearMessage()` - Clear message input
- Paste handling (Electron clipboard API)
- `handlePaste()`, `handleKeyDown()`, `handleContextMenu()`
- `manualPaste()` - Manual paste function

### 13. **UI Helper Functions** (Lines 1069-1146)
- `setInputsDisabled()` - Disable/enable inputs during countdown
- `setTheme()` - Toggle dark/light theme
- Button event listeners (add/subtract minute, message buttons)

### 14. **Display Window Management** (Lines 1248-1358)
- Display window IPC listeners
- State synchronization
- `request-current-state-for-display` handler
- Clock state requests
- Theme requests
- `loadSavedPresets()` - Load presets from localStorage

### 15. **Layout Management** (Lines 1359-1399)
- Layout selector initialization
- Layout change handler
- Layout persistence

### 16. **Initialization** (Lines 1401-1527)
- DOMContentLoaded handler
- Preset loading
- Layout initialization
- Theme initialization
- Clock initialization
- Menu event listeners

### 17. **Video Input Management** (Lines 1530-1749)
- `handleVideoInputForLayout()` - Auto-start/stop video based on layout
- `initializeVideoInputControls()` - Setup video controls
- `updateVideoStatus()` - Update video status UI
- Device detection
- Video start/stop handlers
- Device change listeners

---

## 🔄 Key Data Flow

### Timer State Flow
```
User Input → normalizeTimeInputs() → updateTimeFromInputs() 
→ updateDisplay() → canvasRenderer.setState() → sendStateUpdate()
```

### Companion API Flow
```
HTTP Request → companionServer.js → IPC 'companion-command' 
→ countdown.js handler (line 534) → Execute action → sendStateUpdate()
```

### Settings Flow
```
Settings Window → IPC 'apply-settings' → countdown.js (line 194)
→ applyCanvasColors() → updateDisplay()
```

---

## 🎯 Most Important Functions

| Function | Line | Purpose |
|----------|------|---------|
| `updateDisplay()` | 417 | Updates canvas with current timer state |
| `sendStateUpdate()` | 452 | Sends state to Companion API |
| `handleTimerComplete()` | 374 | Handles timer completion (flash, sound, auto-reset) |
| `loadAndApplySettings()` | 29 | Loads user settings on startup |
| `handleVideoInputForLayout()` | 1530 | Auto-manages video input based on layout |

---

## 📦 Dependencies

### Internal Modules
- `./canvas/canvasEffects.js` - Flash animations
- `./statusBar.js` - Status bar component
- `CanvasRenderer` (global) - Canvas drawing engine
- `LayoutRegistry` (global) - Layout definitions

### External APIs
- `window.electron.ipcRenderer` - IPC communication
- `window.electron.settings` - Settings management
- `window.electron.clipboard` - Clipboard access
- `localStorage` - Preset/layout persistence

---

## 🚨 Critical Notes

1. **DO NOT rename functions** - Many are called from IPC listeners and DOM events
2. **State variables are module-level** - shared across all functions
3. **canvasRenderer is global** - initialized in DOMContentLoaded
4. **IPC listeners are set up immediately** - not in DOMContentLoaded

---

## 🔧 Future Refactoring Suggestions

If you want to modularize safely:
1. Extract **pure utility functions** first (formatTime, normalizeTimeInputs)
2. Keep **state and DOM manipulation** in main file
3. Use **function exports** not class-based modules
4. Test thoroughly after each extraction

**Note:** Previous modularization attempt broke the app because function references changed.
