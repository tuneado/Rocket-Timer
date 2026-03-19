# Bitfocus Companion Module Development Plan
## Countdown Timer Integration

**Status:** 📋 Planning Phase - Awaiting Approval  
**Target Platform:** Bitfocus Companion v3.x  
**Module Name:** `companion-module-countdown-timer`  
**API Version:** 2.0.0  
**Created:** March 6, 2026

---

## 📁 Project Structure & Organization

### Recommended Folder Location

**Option 1: Separate Repository (RECOMMENDED)**
```
/Users/andreRaimundo/Documents/SITES/GITHUB REPOS/
├── Countdown-Timer/                    # Main application
└── companion-module-countdown-timer/   # Companion module (NEW)
```

**Benefits:**
- ✅ Clean separation of concerns
- ✅ Independent versioning and releases
- ✅ Easier to publish to npm and Companion Module Registry
- ✅ Can have its own git repository
- ✅ Follows Bitfocus best practices

**Option 2: Subfolder (Alternative)**
```
/Users/andreRaimundo/Documents/SITES/GITHUB REPOS/Countdown-Timer/
├── companion-module/                   # Module code
├── src/                               # Main app
├── docs/
└── package.json
```

**Recommendation:** Use Option 1 (separate repository) for professional deployment.

---

## 🏗️ Module File Structure

Based on Bitfocus Companion v3.x module development guidelines:

```
companion-module-countdown-timer/
├── package.json                    # Module metadata & dependencies
├── package-lock.json
├── .gitignore
├── README.md                       # Module documentation
├── LICENSE                         # MIT License
├── HELP.md                         # User guide (shown in Companion)
│
├── companion/                      # Companion module manifest
│   └── manifest.json              # Module definition for Companion
│
├── src/
│   ├── index.js                   # Main module class
│   ├── actions.js                 # All available actions
│   ├── feedbacks.js               # Button feedbacks (colors/states)
│   ├── variables.js               # Dynamic variables
│   ├── presets.js                 # Pre-configured button layouts
│   ├── config.js                  # Configuration fields
│   ├── api.js                     # REST API client
│   ├── websocket.js               # WebSocket connection handler
│   └── constants.js               # Shared constants and enums
│
├── assets/                        # Module assets
│   └── icon.png                   # Module icon (72x72px)
│
└── tests/                         # Unit tests (optional)
    └── api.test.js
```

---

## 📋 Implementation Checklist

### Phase 1: Project Setup (Day 1)

#### 1.1 Create Project Structure
- [ ] Create new folder: `companion-module-countdown-timer`
- [ ] Initialize git repository
- [ ] Create `package.json` with proper metadata
- [ ] Set up `.gitignore`
- [ ] Create folder structure (`src/`, `companion/`, `assets/`)

#### 1.2 Dependencies Setup
```json
{
  "dependencies": {
    "@companion-module/base": "^1.0.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0"
  },
  "devDependencies": {
    "@companion-module/tools": "^1.0.0"
  }
}
```

#### 1.3 Module Manifest
Create `companion/manifest.json`:
```json
{
  "id": "countdown-timer",
  "name": "Countdown Timer",
  "shortname": "countdown-timer",
  "description": "Professional broadcast countdown timer control",
  "version": "1.0.0",
  "author": "Your Name",
  "manufacturer": "Custom",
  "products": ["Countdown Timer v2.0+"],
  "keywords": ["timer", "countdown", "broadcast", "production"],
  "main": "src/index.js"
}
```

---

### Phase 2: Core Module Implementation (Days 2-3)

#### 2.1 Configuration (`src/config.js`)
Connection settings users will configure:

```javascript
// Configuration fields
- Host (default: localhost)
- REST API Port (default: 9999)
- WebSocket Port (default: 8080)
- Enable WebSocket (toggle)
- Connection timeout (default: 5000ms)
- Auto-reconnect (toggle)
```

#### 2.2 Main Module Class (`src/index.js`)

**Key Methods:**
```javascript
class CountdownTimerModule {
  async init(config) {
    // Initialize API and WebSocket clients
  }

  async destroy() {
    // Clean up connections
  }

  async configUpdated(config) {
    // Handle config changes
  }

  getConfigFields() {
    // Return configuration UI
  }

  updateStatus(status, message) {
    // Update connection status
  }
}
```

#### 2.3 REST API Client (`src/api.js`)

**Core Functions:**
```javascript
class CountdownTimerAPI {
  constructor(host, port) {
    this.baseURL = `http://${host}:${port}/api`;
  }

  // Timer control
  async start()
  async stop()
  async pause()
  async resume()
  async reset()

  // Time management
  async setTime(hours, minutes, seconds)
  async setHours(value)
  async setMinutes(value)
  async setSeconds(value)
  async addMinute()
  async subtractMinute()
  async adjustTime(seconds, minutes)

  // Presets
  async getPresets()
  async loadPreset(id)

  // Layouts
  async getLayouts()
  async setLayout(layoutId)

  // Messages
  async sendMessage(text, duration)
  async hideMessage()
  async toggleMessage()

  // Sound
  async muteSound()
  async unmuteSound()
  async toggleSound()

  // Display
  async flash(cycles, duration)
  async toggleFeatureImage()
  async setFeatureImage(enabled)

  // State
  async getState()
  async getHealth()
}
```

#### 2.4 WebSocket Handler (`src/websocket.js`)

**Real-time State Updates:**
```javascript
class WebSocketHandler {
  constructor(host, port, onStateUpdate) {
    this.socket = io(`ws://${host}:${port}`);
  }

  connect() {
    // Handle connection events
  }

  disconnect() {
    // Clean disconnect
  }

  subscribeToUpdates(callback) {
    this.socket.on('timer-update', callback);
  }
}
```

---

### Phase 3: Actions Implementation (Days 4-5)

#### 3.1 Action Categories (`src/actions.js`)

**Timer Control Actions** (5 actions)
```javascript
1. Start Timer
2. Stop Timer  
3. Pause Timer
4. Resume Timer
5. Reset Timer
```

**Time Setting Actions** (6 actions)
```javascript
6. Set Time (H:M:S inputs)
7. Set Hours (0-99)
8. Set Minutes (0-59)
9. Set Seconds (0-59)
10. Adjust Time (+/- seconds/minutes)
11. Set Time from Variable
```

**Quick Time Actions** (2 actions)
```javascript
12. Add 1 Minute
13. Subtract 1 Minute
```

**Preset Actions** (2 actions)
```javascript
14. Load Preset (dropdown selector)
15. Load Preset by ID (text input)
```

**Layout Actions** (1 action)
```javascript
16. Change Layout (dropdown: Classic/Minimal/Modern/Compact/Video)
```

**Message Actions** (4 actions)
```javascript
17. Send Message (text + optional duration)
18. Show Message (text, persistent)
19. Hide Message
20. Toggle Message
```

**Sound Actions** (3 actions)
```javascript
21. Mute Sound
22. Unmute Sound
23. Toggle Sound
```

**Display Actions** (4 actions)
```javascript
24. Flash Display (cycles + duration inputs)
25. Toggle Feature Image
26. Enable Feature Image
27. Disable Feature Image
```

**TOTAL: 27 Actions**

#### 3.2 Action Options

Each action will have appropriate options:

```javascript
// Example: Set Time action
{
  id: 'setTime',
  name: 'Set Time',
  options: [
    {
      type: 'number',
      label: 'Hours',
      id: 'hours',
      default: 0,
      min: 0,
      max: 99
    },
    {
      type: 'number',
      label: 'Minutes',
      id: 'minutes',
      default: 10,
      min: 0,
      max: 59
    },
    {
      type: 'number',
      label: 'Seconds',
      id: 'seconds',
      default: 0,
      min: 0,
      max: 59
    }
  ],
  callback: async (action) => {
    await this.api.setTime(
      action.options.hours,
      action.options.minutes,
      action.options.seconds
    );
  }
}

// Example: Send Message action
{
  id: 'sendMessage',
  name: 'Send Message',
  options: [
    {
      type: 'textinput',
      label: 'Message Text',
      id: 'text',
      default: 'Stand by...',
      useVariables: true
    },
    {
      type: 'number',
      label: 'Duration (ms, 0 = persistent)',
      id: 'duration',
      default: 0,
      min: 0
    }
  ],
  callback: async (action) => {
    const text = await this.parseVariablesInString(action.options.text);
    await this.api.sendMessage(text, action.options.duration);
  }
}
```

---

### Phase 4: Feedbacks Implementation (Days 6-7)

#### 4.1 Feedback Types (`src/feedbacks.js`)

**Timer State Feedbacks** (7 feedbacks)
```javascript
1. Timer Running (Green background)
2. Timer Paused (Orange background)
3. Timer Stopped (Red background)
4. Timer Warning (Yellow when < threshold)
5. Timer Critical (Red when < threshold)
6. Timer Percentage (color based on %)
7. Timer Specific State (user-selected state)
```

**Time Threshold Feedbacks** (2 feedbacks)
```javascript
8. Time Below Threshold (seconds)
9. Time Above Threshold (seconds)
```

**Feature State Feedbacks** (3 feedbacks)
```javascript
10. Sound Muted (indicator)
11. Feature Image Active (indicator)
12. Layout Active (indicator)
```

**TOTAL: 12 Feedbacks**

#### 4.2 Feedback Examples

```javascript
// Running state feedback
{
  feedbackId: 'timerRunning',
  name: 'Timer Running',
  type: 'boolean',
  defaultStyle: {
    bgcolor: combineRgb(0, 255, 0),  // Green
    color: combineRgb(0, 0, 0)
  },
  options: [],
  callback: (feedback) => {
    return this.timerState?.isRunning === true;
  }
}

// Time threshold feedback
{
  feedbackId: 'timeBelow',
  name: 'Time Below Threshold',
  type: 'boolean',
  defaultStyle: {
    bgcolor: combineRgb(255, 0, 0),  // Red
    color: combineRgb(255, 255, 255)
  },
  options: [
    {
      type: 'number',
      label: 'Threshold (seconds)',
      id: 'threshold',
      default: 60,
      min: 0
    }
  ],
  callback: (feedback) => {
    return this.timerState?.remainingTime < feedback.options.threshold;
  }
}
```

---

### Phase 5: Variables Implementation (Day 8)

#### 5.1 Variable Definitions (`src/variables.js`)

**Time Variables** (8 variables)
```javascript
1. time_remaining → "00:10:35"
2. hours → "00"
3. minutes → "10"
4. seconds → "35"
5. total_time → "00:15:00"
6. elapsed_time → "00:04:25"
7. end_time → "14:45:30"
8. percentage → "67"
```

**Status Variables** (3 variables)
```javascript
9. status → "Running" | "Paused" | "Stopped"
10. status_emoji → "▶️" | "⏸️" | "⏹️"
11. warning_level → "normal" | "warning" | "critical"
```

**Feature Variables** (3 variables)
```javascript
12. preset_name → "15 Minutes"
13. layout_name → "Classic"
14. sound_enabled → "ON" | "OFF"
```

**Connection Variables** (2 variables)
```javascript
15. connection_status → "Connected" | "Disconnected"
16. api_version → "2.0.0"
```

**TOTAL: 16 Variables**

#### 5.2 Variable Update Logic

```javascript
updateVariables(state) {
  this.setVariableValues({
    time_remaining: state.formattedTime,
    hours: Math.floor(state.remainingTime / 3600).toString().padStart(2, '0'),
    minutes: Math.floor((state.remainingTime % 3600) / 60).toString().padStart(2, '0'),
    seconds: (state.remainingTime % 60).toString().padStart(2, '0'),
    percentage: state.percentage.toString(),
    status: state.isRunning ? 'Running' : (state.isPaused ? 'Paused' : 'Stopped'),
    status_emoji: state.isRunning ? '▶️' : (state.isPaused ? '⏸️' : '⏹️'),
    // ... more variables
  });
}
```

---

### Phase 6: Presets Implementation (Day 9)

#### 6.1 Preset Buttons (`src/presets.js`)

**Control Presets** (6 presets)
```javascript
1. Start/Stop Toggle
2. Pause/Resume Toggle
3. Reset Timer
4. Add 1 Minute
5. Subtract 1 Minute
6. Flash Display
```

**Time Setting Presets** (3 presets)
```javascript
7. Set 5 Minutes
8. Set 10 Minutes
9. Set 15 Minutes
```

**Layout Presets** (5 presets)
```javascript
10. Classic Layout
11. Minimal Layout
12. Modern Layout
13. Compact Layout
14. Video Layout
```

**Message Presets** (2 presets)
```javascript
15. "Stand By" Message
16. Hide Message
```

**TOTAL: 16 Preset Buttons**

#### 6.2 Preset Example

```javascript
{
  category: 'Timer Control',
  name: 'Start/Stop',
  type: 'button',
  style: {
    text: 'START\\n$(countdown-timer:time_remaining)',
    size: 'auto',
    color: combineRgb(255, 255, 255),
    bgcolor: combineRgb(0, 0, 0)
  },
  steps: [
    {
      down: [
        {
          actionId: 'start',
          options: {}
        }
      ],
      up: []
    }
  ],
  feedbacks: [
    {
      feedbackId: 'timerRunning',
      options: {},
      style: {
        bgcolor: combineRgb(0, 255, 0),
        color: combineRgb(0, 0, 0),
        text: 'STOP\\n$(countdown-timer:time_remaining)'
      }
    }
  ]
}
```

---

### Phase 7: Documentation (Day 10)

#### 7.1 README.md

```markdown
# Companion Module: Countdown Timer

Control your Countdown Timer application from Bitfocus Companion.

## Features
- Full timer control
- Preset management
- Layout switching
- Message overlay
- Real-time feedback
- 16 dynamic variables

## Installation
1. Install Countdown Timer app
2. Enable API server in settings
3. Install this module in Companion
4. Configure connection (host + ports)

## Available Actions
[List all 27 actions]

## Feedbacks
[List all 12 feedbacks]

## Variables
[List all 16 variables]
```

#### 7.2 HELP.md (Shown in Companion)

User-friendly guide with:
- Quick start guide
- Connection setup
- Common use cases
- Troubleshooting
- Example button configurations

---

## 🧪 Testing Strategy

### Unit Testing
```javascript
// Test API client
- Connection success/failure
- All endpoint calls
- Error handling
- Timeout handling

// Test WebSocket
- Connection/reconnection
- State updates
- Disconnect handling
```

### Integration Testing
```javascript
// With actual Countdown Timer app
1. Start app and verify API operational
2. Test each action manually
3. Verify feedbacks update correctly
4. Check variables populate
5. Test reconnection scenarios
6. Verify error messages
```

### Stream Deck Testing
```javascript
// Physical hardware test
1. Install module in Companion
2. Configure connection
3. Create test page with all actions
4. Test each button
5. Verify visual feedback
6. Check variable updates in real-time
```

---

## 📦 Publishing Process

### 1. Prepare for Release
- [ ] Complete all features
- [ ] Write comprehensive documentation
- [ ] Test with actual hardware
- [ ] Create README with screenshots
- [ ] Add LICENSE file (MIT)
- [ ] Create CHANGELOG.md
- [ ] Set version to 1.0.0

### 2. npm Package
```bash
# Publish to npm
npm publish

# Module will be: companion-module-countdown-timer
```

### 3. Submit to Companion Module Registry
- [ ] Fork companion-modules repository
- [ ] Add module manifest
- [ ] Submit pull request
- [ ] Wait for review and approval

### 4. Announce Release
- [ ] Post in Companion Facebook group
- [ ] Share in broadcast communities
- [ ] Update main app README with link

---

## 🎯 Development Timeline

### Week 1: Core Development
- **Day 1:** Project setup, structure, dependencies
- **Day 2-3:** Core module, API client, WebSocket handler
- **Day 4-5:** Implement all 27 actions
- **Day 6-7:** Implement all 12 feedbacks

### Week 2: Polish & Release
- **Day 8:** Implement all 16 variables
- **Day 9:** Create 16 preset buttons
- **Day 10:** Documentation, testing, polish
- **Day 11-12:** Integration testing with hardware
- **Day 13-14:** Final testing, package, publish

**Total Effort:** 2 weeks (full-time) or 4 weeks (part-time)

---

## 🔧 Technical Requirements

### Development Environment
```bash
Node.js >= 18.x
npm >= 9.x
Bitfocus Companion >= 3.0.0
Countdown Timer >= 2.0.0
```

### Required Software
- Bitfocus Companion (for testing)
- Countdown Timer app
- Stream Deck (recommended for full testing)

### Skills Required
- JavaScript/Node.js
- REST API integration
- WebSocket/Socket.IO
- Companion Module API v3.x

---

## 🚀 Quick Start Commands

### After Approval, Run:
```bash
# Create project folder
mkdir ../companion-module-countdown-timer
cd ../companion-module-countdown-timer

# Initialize project
npm init -y

# Install dependencies
npm install @companion-module/base axios socket.io-client
npm install --save-dev @companion-module/tools

# Create structure
mkdir -p src companion assets tests

# Start development
# [Copy template files and begin implementation]
```

---

## ❓ Decision Points

**PLEASE CONFIRM:**

1. **Project Location**
   - ☐ Option 1: Separate repository (recommended)
   - ☐ Option 2: Subfolder in main repo

2. **Module ID**
   - ☐ `countdown-timer` (matches app name)
   - ☐ `professional-countdown-timer` (more descriptive)
   - ☐ Other: _______________

3. **Scope**
   - ☐ Implement all 27 actions
   - ☐ Start with basic 15 actions, expand later
   - ☐ Other: _______________

4. **Testing**
   - ☐ Have Stream Deck hardware available
   - ☐ Will test with Companion Emulator only
   - ☐ Other: _______________

5. **Publishing**
   - ☐ Publish to npm + Companion registry
   - ☐ Private use only
   - ☐ Other: _______________

---

## 📌 Next Steps

**Awaiting your approval to:**
1. Create project structure
2. Set up package.json and dependencies
3. Begin core module implementation

**Ready to proceed when you say GO! 🚦**

---

**Created by:** API Designer Agent  
**Based on:** Bitfocus Companion v3.x Module Development Guidelines  
**Reference:** https://companion.free/for-developers/module-development/home/
