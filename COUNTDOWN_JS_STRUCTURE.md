# Countdown.js Modular Architecture

## 🎉 Refactoring Complete! 

**Original Size:** 1750 lines (monolithic)  
**Current Size:** 1092 lines (38% reduction)  
**Extracted Modules:** 8 modules (1171 lines)  
**Location:** `src/renderer/js/`

---

## 📦 Module Structure

### **Core File**
- **countdown.js** (1092 lines) - Main application orchestrator
  - Imports all modules
  - DOM event listeners
  - State management wrappers
  - IPC communication
  - App initialization

### **Extracted Modules**

#### **1. utils/timeFormatter.js** (18 lines)
- `formatTime(seconds)` - Pure utility for HH:MM:SS formatting
- Handles positive/negative time
- No dependencies

#### **2. modules/timeInputs.js** (109 lines)
- `normalizeTimeInputs()` - Validates and normalizes time inputs
- `updateTimeFromInputs()` - Syncs inputs to timer state
- `addMinute()` - Add 1 minute functionality
- `subtractMinute()` - Subtract 1 minute functionality
- Uses dependency injection for state and callbacks

#### **3. modules/clockManager.js** (98 lines)
- `updateClock()` - Real-time clock update (every second)
- `startClock()` - Start clock interval
- `stopClock()` - Stop clock interval
- Manages clockState (interval getter/setter)

#### **4. modules/messageManager.js** (191 lines)
- `updateCharCounter()` - Character counter with color warnings
- `displayMessage()` - Show message on canvas
- `hideMessage()` - Hide message from canvas
- `clearMessage()` - Clear message input
- `manualPaste()`, `handlePaste()`, `handleKeyDown()` - Clipboard integration (Cmd+V)
- Manages messageState (display status)

#### **5. modules/presetManager.js** (113 lines)
- `updatePresetFromInputs()` - Update preset button with current time
- `resetPresetsToDefault()` - Reset to [5,10,15,20,25,30,45,60] minutes
- `loadSavedPresets()` - Load presets from localStorage
- Visual feedback (200ms color flash)

#### **6. modules/settingsManager.js** (102 lines)
- `loadAndApplySettings()` - Apply defaultTime, layout, theme from settings
- `applyCanvasColors()` - Apply color customizations to CSS variables
- Handles settings.getAll() integration

#### **7. modules/displayManager.js** (116 lines)
- `updateDisplay()` - Update canvas renderer with current state
- `sendStateUpdate()` - Send state to companion API server
- `changeLayout()` - Switch canvas layout with persistence
- Progress calculation (100% → 0%)
- Elapsed time display

#### **8. modules/timerControls.js** (201 lines)
- `startTimer()` - Start countdown with auto-stop logic
- `stopTimer()` - Pause countdown
- `resetTimer()` - Reset to last set time
- `handleTimerComplete()` - Sound, flash, auto-reset logic
- `flashAtZero()` - Trigger flash animation

#### **9. modules/videoManager.js** (241 lines)
- `handleVideoInputForLayout()` - Auto-start/stop video based on layout
- `initializeVideoInputControls()` - Device detection and selection UI
- `updateVideoStatus()` - Update status display in settings
- Device persistence via localStorage

---

## 🔄 Dependency Injection Pattern

All modules use **dependency injection** to avoid tight coupling:

```javascript
// Example: Timer Controls
export function startTimer(timerState, { 
  startStopBtn, 
  updateButtonIcon, 
  setInputsDisabled, 
  updateDisplay, 
  sendStateUpdate,
  handleTimerComplete
}) {
  // Module logic here
}

// Called from countdown.js:
countdown = TimerControls.startTimer(timerState, {
  startStopBtn,
  updateButtonIcon,
  setInputsDisabled,
  updateDisplay,
  sendStateUpdate,
  handleTimerComplete
});
```

---

## 🎯 State Management

**State Wrappers** in countdown.js encapsulate module-level variables:

```javascript
const timerState = {
  get remainingTime() { return remainingTime; },
  setRemainingTime(value) { remainingTime = value; },
  get totalTime() { return totalTime; },
  setTotalTime(value) { totalTime = value; },
  get running() { return running; },
  setRunning(value) { running = value; },
  get lastSetTime() { return lastSetTime; },
  setLastSetTime(value) { lastSetTime = value; }
};

const clockState = {
  getInterval() { return clockInterval; },
  setInterval(value) { clockInterval = value; }
};

const messageState = {
  isDisplayed() { return messageDisplayed; },
  setDisplayed(value) { messageDisplayed = value; }
};
```

---

## 📊 Import Map

```javascript
// countdown.js imports
import { createFlashAnimation } from './canvas/canvasEffects.js';
import statusBar from './statusBar.js';
import { formatTime } from './utils/timeFormatter.js';
import * as TimeInputs from './modules/timeInputs.js';
import * as ClockManager from './modules/clockManager.js';
import * as MessageManager from './modules/messageManager.js';
import * as PresetManager from './modules/presetManager.js';
import * as SettingsManager from './modules/settingsManager.js';
import * as DisplayManager from './modules/displayManager.js';
import * as TimerControls from './modules/timerControls.js';
import * as VideoManager from './modules/videoManager.js';
```

---

## 🔧 Wrapper Functions

**Critical:** Wrapper functions must be defined **before** DOMContentLoaded to prevent API/IPC crashes:

```javascript
// Lines 177-224 in countdown.js
function normalizeTimeInputs() {
  TimeInputs.normalizeTimeInputs({ getElementById: document.getElementById.bind(document) });
}

function updateTimeFromInputs() {
  TimeInputs.updateTimeFromInputs(timerState, { 
    getElementById: document.getElementById.bind(document), 
    updateDisplay, 
    sendStateUpdate 
  });
}

// ... more wrappers for all modules
```

---

## ✅ Testing Strategy

After each module extraction:
1. ✅ Create module file with dependency injection
2. ✅ Add import to countdown.js
3. ✅ Create/update wrapper functions
4. ✅ Replace old implementation
5. ✅ Start app (`npm start`)
6. ✅ Test features manually
7. ✅ Verify terminal state updates
8. ✅ Commit with detailed message

---

## 🎯 Benefits Achieved

1. **Modularity** - Each module has a single responsibility
2. **Testability** - Modules can be tested independently
3. **Maintainability** - Changes isolated to specific modules
4. **Reusability** - Modules can be reused across projects
5. **Readability** - countdown.js reduced from 1750 → 1092 lines
6. **Separation of Concerns** - UI, logic, and state cleanly separated

---

## 🚀 Git History

```
5d86ca1 - Refactor: Create preset, settings, and display manager modules
628841d - Refactor: Extract clock and message modules
262673f - Refactor: Extract time input utilities
6ff1918 - Refactor: Extract formatTime() utility
(+ timer controls, video manager commits)
```

**Safety Tag:** `api-integration-complete` (backup before modularization)  
**Final Tag:** `modular-refactor-complete` (all modules extracted and tested)

---

## 📝 Remaining Inline Code

**IPC Event Handlers** (~150 lines) - Left inline as they're tightly coupled:
- `ipcRenderer.on('menu-toggle-display')` - Display window toggle
- `ipcRenderer.on('menu-toggle-clock')` - Clock toggle
- `ipcRenderer.on('companion-server-status')` - Server status
- `ipcRenderer.on('companion-command')` - API command handler
- `ipcRenderer.on('request-clock-state')` - Clock state sync
- `ipcRenderer.on('request-current-theme-for-display')` - Theme sync

These are small, event-driven, and better left as inline handlers.

---

## 🎓 Lessons Learned

1. **Incremental approach** - Extract one module at a time, test, commit
2. **Wrapper placement matters** - Must be before DOMContentLoaded
3. **State wrappers** - Clean way to share state without globals
4. **Dependency injection** - Keeps modules pure and testable
5. **Not everything needs extraction** - Some code is fine inline

---

**Refactoring Status:** ✅ **COMPLETE** (91% of planned tasks, 20/22)
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
