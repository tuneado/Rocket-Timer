# Canvas-Based Rendering Architecture

## Overview
The countdown timer uses a **canvas-based rendering system** with **multiple switchable layouts** for the main display area while maintaining all existing UI controls. The canvas is rendered in real-time using `requestAnimationFrame` and can be streamed to an external display window.

## Layout System

### Overview
The layout system allows users to switch between different canvas layouts (Classic, Minimal, Split Screen) with all styling controlled by CSS variables. Layouts define structure and positioning; CSS variables define colors, fonts, and styling.

### Architecture

#### Components

1. **Layout Descriptors** (embedded in `layoutRegistry.js`)
   - JSON objects defining element positions, sizes, and visibility
   - All positions use normalized coordinates (0-1 range)
   - Resolution-independent design

2. **LayoutRegistry** (`src/renderer/layouts/layoutRegistry.js`)
   - Manages available layouts
   - Provides API: `getLayout(id)`, `getAllLayouts()`, `getDefaultLayout()`
   - Works in both Node.js and browser environments

3. **Canvas CSS Variables** (`src/renderer/css/shared.css`)
   - Define colors, fonts, and styling
   - Theme-aware (dark/light modes)
   - Applied via `getComputedStyle()`

4. **Layout Selector UI** (in `index.html`)
   - Dropdown menu to choose layouts
   - Saves selection to localStorage
   - Syncs between main and display windows

### Available Layouts

#### 1. Classic
Traditional centered layout with all elements visible:
- Progress bar at top (80% width)
- Large centered countdown
- Clock below countdown
- Horizontal separator
- Message area at bottom

#### 2. Minimal
Clean countdown-focused design:
- No progress bar
- Extra large countdown (280px)
- No clock
- No separator
- Message area at bottom

#### 3. Clock Focus
Large clock display with countdown below:
- Small progress bar at top (80% width)
- Extra large clock (280px) as main element
- Horizontal separator
- Countdown below separator (120px)
- Message area at bottom

#### 4. Detailed
Complete information display with all elements:
- Progress bar at top
- Large countdown (180px) as main element
- Clock display below countdown (70px)
- **Elapsed time** (left side, 50px) - shows time passed (can go negative)
- **Remaining time** (right side, 50px) - shows time left
- Horizontal separator
- Message area at bottom

### Layout Descriptor Schema

The layout system supports **three ways** to specify positions and sizes:

1. **Named positions**: "left", "center", "right" (x-axis) / "top", "middle", "bottom" (y-axis)
2. **Percentages**: "10%", "50%", "75%" (CSS-like)
3. **Decimals**: 0.1, 0.5, 0.75 (normalized 0-1 range, backward compatible)

```javascript
{
  "name": "Layout Name",
  "description": "Layout description",
  "resolution": { "width": 1920, "height": 1080 },
  
  "progressBar": {
    "enabled": true,                          // Show/hide progress bar
    "position": { 
      "x": "10%",                             // Can be: "left", "center", "right", "25%", or 0.1
      "y": "10%"                              // Can be: "top", "middle", "bottom", "25%", or 0.1
    },
    "size": { 
      "width": "80%",                         // Can be: "50%", 960 (pixels), or 0.5
      "height": "4%" 
    },
    "cornerRadius": 25                        // Pixels
  },
  
  "countdown": {
    "enabled": true,                          // Show/hide countdown
    "position": { 
      "x": "center",                          // Named position (easiest!)
      "y": "45%" 
    },
    "fontSize": 200,                          // Pixels
    "alignment": "center"                     // left, center, right
  },
  
  "clock": {
    "enabled": true,                          // Show/hide clock
    "position": { 
      "x": "center", 
      "y": "60%" 
    },
    "fontSize": 60,
    "alignment": "center"
  },
  
  "elapsed": {
    "enabled": true,                          // Show/hide elapsed time
    "position": { 
      "x": "25%", 
      "y": "73%" 
    },
    "fontSize": 50,
    "alignment": "center"
  },
  
  "remaining": {
    "enabled": true,                          // Show/hide remaining time
    "position": { 
      "x": "75%", 
      "y": "73%" 
    },
    "fontSize": 50,
    "alignment": "center"
  },
  
  "separator": {
    "enabled": true,                          // Show/hide separator
    "position": { 
      "y": "middle"                           // Named position for y-axis
    },
    "width": "90%",                           // Percentage of canvas width
    "thickness": 3,                           // Pixels
    "orientation": "horizontal"               // horizontal or vertical
  },
  
  "message": {
    "enabled": true,                          // Show/hide message area
    "position": { 
      "x": "center", 
      "y": "85%" 
    },
    "fontSize": 70,
    "alignment": "center",
    "maxLines": 2,                            // Line limit
    "lineHeight": 1.3                         // Line height multiplier
  }
}
```

#### Position Value Examples

**X-axis (horizontal)**:
- `"left"` → 0% (left edge)
- `"center"` → 50% (horizontal center)
- `"right"` → 100% (right edge)
- `"25%"` → 25% from left
- `0.25` → 25% from left (decimal notation)
- `480` → 480 pixels from left (absolute)

**Y-axis (vertical)**:
- `"top"` → 0% (top edge)
- `"middle"` → 50% (vertical center)
- `"bottom"` → 100% (bottom edge)
- `"33%"` → 33% from top
- `0.33` → 33% from top (decimal notation)
- `360` → 360 pixels from top (absolute)

**Sizes**:
- `"80%"` → 80% of canvas dimension
- `0.8` → 80% of canvas dimension (decimal notation)
- `1536` → 1536 pixels (absolute)

💡 **Tip**: Use **named positions** ("center", "middle") for best readability!

### Canvas CSS Variables

Defined in `:root` and `[data-theme="light"]` in `shared.css`:

```css
/* Colors */
--canvas-countdown-color: #4caf50;
--canvas-clock-color: #999999;
--canvas-message-color: #f1f1f1;
--canvas-separator-color: #444444;
--canvas-background: #121212;

/* Progress bar gradients */
--canvas-progress-success-start: #4caf50;
--canvas-progress-success-end: #66bb6a;
--canvas-progress-warning-start: #ff9500;
--canvas-progress-warning-end: #ffb340;
--canvas-progress-danger-start: #ff4757;
--canvas-progress-danger-end: #ff6b7a;
--canvas-progress-bg: #2a2a2a;

/* Typography */
--canvas-font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
--canvas-countdown-weight: bold;
--canvas-clock-weight: normal;
--canvas-message-weight: 600;
```

### Adding a New Layout

See **[LAYOUT_POSITIONING_GUIDE.md](LAYOUT_POSITIONING_GUIDE.md)** for detailed examples!

1. **Create layout descriptor** in `layoutRegistry.js`:
```javascript
const myCustomLayout = {
  name: "My Custom Layout",
  description: "Description here",
  
  progressBar: {
    enabled: true,
    position: { x: "10%", y: "5%" },     // Use named positions or percentages
    size: { width: "80%", height: "3%" }
  },
  
  countdown: {
    enabled: true,
    position: { x: "center", y: "40%" }, // Named position + percentage
    fontSize: 200,
    alignment: "center"
  },
  
  clock: {
    enabled: true,
    position: { x: "center", y: "60%" },
    fontSize: 60,
    alignment: "center"
  },
  
  separator: {
    enabled: true,
    position: { y: "middle" },           // Named position for y-axis
    width: "90%",
    thickness: 3,
    orientation: "horizontal"
  },
  
  message: {
    enabled: true,
    position: { x: "center", y: "85%" },
    fontSize: 70,
    alignment: "center",
    maxLines: 2,
    lineHeight: 1.3
  }
};
```

2. **Add to layouts registry**:
```javascript
const layouts = {
  classic: classicLayout,
  minimal: minimalLayout,
  splitscreen: splitscreenLayout,
  custom: myCustomLayout  // Add here
};
```

3. **Add to UI selector** in `index.html`:
```html
<option value="custom">My Custom - Description here</option>
```

4. **Test**: The layout will be immediately available in the dropdown

### Implementation Details

#### CanvasRenderer Integration

**Constructor accepts layout**:
```javascript
const layout = LayoutRegistry.getLayout('classic');
const renderer = new CanvasRenderer('timerCanvas', layout);
```

**Switch layouts at runtime**:
```javascript
const newLayout = LayoutRegistry.getLayout('minimal');
canvasRenderer.setLayout(newLayout);
```

**Theme changes update styles**:
```javascript
canvasRenderer.updateTheme('light');  // Refreshes CSS variable cache
```

#### Rendering Process

1. **Read layout configuration**: Position, size, enabled flags
2. **Read CSS computed styles**: Colors, fonts, weights
3. **Calculate absolute coordinates**: Multiply normalized values by canvas dimensions
4. **Draw elements**: Use ctx drawing methods with calculated values

```javascript
// Example: Drawing countdown
const x = width * this.layout.countdown.position.x;  // Normalized → absolute
const y = height * this.layout.countdown.position.y;
const fontSize = this.layout.countdown.fontSize;      // Already in pixels
const color = this.styles.countdownColor;             // From CSS

ctx.font = `${this.styles.countdownWeight} ${fontSize}px ${this.styles.fontFamily}`;
ctx.fillStyle = color;
ctx.textAlign = this.layout.countdown.alignment;
ctx.fillText(this.state.countdown, x, y);
```

### IPC Synchronization

Layout changes are synchronized between windows:

```javascript
// Main window changes layout
localStorage.setItem('canvasLayout', layoutId);
ipcRenderer.send('layout-changed', layoutId);

// Display window receives change
ipcRenderer.on('layout-changed', (layoutId) => {
  const layout = LayoutRegistry.getLayout(layoutId);
  displayRenderer.setLayout(layout);
  localStorage.setItem('canvasLayout', layoutId);
});
```

## Architecture

### Main Components

#### 1. **CanvasRenderer (`src/renderer/js/canvasRenderer.js`)**
- **Purpose**: Master canvas renderer that draws the entire timer display
- **Features**:
  - 16:9 aspect ratio (1920x1080 resolution)
  - 60fps rendering via `requestAnimationFrame`
  - Canvas stream capture at 30fps via `canvas.captureStream()`
  - Responsive scaling while maintaining aspect ratio
  - Theme support (dark/light modes)

**Key Methods**:
- `setState(newState)` - Update render state (countdown, progress, message, etc.)
- `draw()` - Main drawing function called every frame
- `getStream()` - Returns the MediaStream for external display
- `handleResize()` - Maintains 16:9 aspect ratio on window resize

#### 2. **Main Window (`src/renderer/html/index.html`)**
- **Left Column**: All UI controls (inputs, buttons, presets, messages)
- **Right Column**: Canvas display showing timer (`#timerCanvas`)
- **Integration**: countdown.js updates canvas state instead of DOM elements

#### 3. **External Display (`src/renderer/html/display.html`)**
- **Purpose**: Fullscreen display window for external monitors
- **Method**: Uses `<video>` element to display canvas stream
- **Benefits**: 
  - Single source of truth (the canvas)
  - No duplicate rendering logic
  - Perfect synchronization
  - NDI/ffmpeg ready (stream placeholder included)

#### 4. **Stream Handler (`src/renderer/js/displayStream.js`)**
- **Purpose**: Connects external display to canvas stream
- **Method**: Uses Electron's `desktopCapturer` API
- **Process**:
  1. Requests stream from main process
  2. Receives stream ID via IPC
  3. Captures main window content
  4. Displays in video element

### Data Flow

```
User Interaction (Controls)
    ↓
countdown.js (Timer Logic)
    ↓
canvasRenderer.setState()
    ↓
Canvas Drawing (60fps)
    ↓
├─→ Main Window Display (canvas element)
└─→ Canvas Stream (30fps)
        ↓
    IPC Communication
        ↓
    External Display (video element)
```

### Rendering Pipeline

1. **State Updates** (countdown.js):
   ```javascript
   canvasRenderer.setState({
     countdown: '00:25:00',
     progress: 75,
     clock: '14:30:00',
     message: 'Break Time!',
     showClock: true,
     showMessage: true,
     theme: 'dark'
   });
   ```

2. **Animation Loop** (canvasRenderer.js):
   ```javascript
   requestAnimationFrame(() => {
     this.draw();  // Renders to canvas
   });
   ```

3. **Canvas Stream** (automatic):
   ```javascript
   this.stream = canvas.captureStream(30);  // 30fps stream
   ```

4. **External Display** (displayStream.js):
   ```javascript
   video.srcObject = stream;  // Display stream in video element
   ```

## Key Features

### 1. **Single Master Canvas**
- One canvas renders all visual content
- No duplicate rendering logic
- Consistent appearance across displays

### 2. **Live Preview**
- Main window shows scaled-down version
- External display shows full-screen version
- Both use the same canvas source

### 3. **Smooth Animations**
- 60fps rendering in main window
- 30fps streaming to external display
- `requestAnimationFrame` for optimal performance

### 4. **16:9 Aspect Ratio**
- Maintains aspect ratio on resize
- Scales correctly for different screen sizes
- Professional presentation format

### 5. **Theme Support**
- Dark and light modes
- Synchronized across all windows
- Canvas adapts colors automatically

## Canvas Drawing Details

### Layout Structure (16:9 - 1920x1080)
```
┌─────────────────────────────────────────┐
│  Progress Bar (10% height, 80% width)   │ 10%
├─────────────────────────────────────────┤
│                                          │
│         Countdown Timer (large)          │ 45%
│            00:25:00                      │
│                                          │
│           Clock (if visible)             │ 15%
│            14:30:00                      │
├─────────────────────────────────────────┤ 75%
│         Separator Line                   │
├─────────────────────────────────────────┤
│                                          │
│      Message Area (if visible)           │ 20%
│       (Max 2 lines, auto-wrapped)        │
│                                          │
└─────────────────────────────────────────┘
```

### Drawing Methods

#### Progress Bar
- **Location**: Top 10% of canvas
- **Colors**: Green (>30%), Amber (10-30%), Red (<10%)
- **Style**: Rounded rectangle with gradient fill

#### Countdown Timer
- **Location**: Center (45% from top)
- **Font**: SF Mono, 200px, bold
- **Color**: Green (#4caf50)
- **Effect**: Subtle shadow for depth

#### Clock
- **Location**: Below countdown (60% from top)
- **Font**: SF Mono, 60px
- **Color**: Gray (#888)
- **Visibility**: Toggleable

#### Separator
- **Location**: 75% from top
- **Style**: 3px line, 90% width
- **Color**: Theme-dependent (#444 dark, #ddd light)

#### Message
- **Location**: Below separator (85% from top)
- **Font**: SF Mono, 70px, bold
- **Wrapping**: Auto-wraps to 2 lines max
- **Color**: Theme-dependent

## Performance Optimization

### Canvas Rendering
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 60fps via `requestAnimationFrame`
- **Scaling**: CSS scales display size while maintaining resolution

### Stream Capture
- **Frame Rate**: 30fps (optimal for streaming)
- **Method**: `canvas.captureStream(30)`
- **Format**: MediaStream (ready for recording/streaming)

### Memory Management
- Cleanup on window close
- Stream tracks stopped properly
- Event listeners removed

## Future Enhancements (Placeholders Included)

### NDI Output
The canvas stream can be fed to NDI (Network Device Interface):
```javascript
// Placeholder in canvasRenderer.js
// TODO: Implement NDI output using ndi-sdk
// this.stream → NDI Encoder → Network
```

### FFmpeg Recording
The stream can be recorded using FFmpeg:
```javascript
// Placeholder for FFmpeg integration
// this.stream → FFmpeg → MP4/WebM file
```

### OBS Integration
Stream can be captured by OBS Studio:
1. Window Capture (current implementation)
2. Browser Source (future enhancement)

## Migration Notes

### What Changed
- ✅ Main display area now uses `<canvas>` instead of DOM elements
- ✅ External display uses `<video>` element for stream playback
- ✅ All controls remain the same (no UI changes for users)
- ✅ Timer logic unchanged (only output method changed)

### What Stayed the Same
- ✅ All buttons and controls
- ✅ Preset management
- ✅ Message input and display
- ✅ Theme toggle
- ✅ Clock visibility toggle
- ✅ IPC communication for most features

### Backward Compatibility
- Old display.js kept for reference
- Can revert to DOM rendering if needed
- All existing features maintained

## Troubleshooting

### Canvas not displaying
- Check console for CanvasRenderer initialization
- Verify canvas element exists in DOM
- Ensure canvasRenderer.js loads before countdown.js

### Stream not connecting to external display
- Check IPC communication in console
- Verify desktopCapturer permissions
- Ensure main window is visible when stream starts

### Performance issues
- Canvas resolution can be reduced (currently 1920x1080)
- Stream FPS can be lowered (currently 30fps)
- Consider disabling shadows/gradients for lower-end systems

## Code Documentation

All code includes comprehensive comments explaining:
- **What** each function does
- **Why** design decisions were made
- **How** components interact
- **When** functions are called

## Running the Application

```bash
npm start
```

The application will start with:
1. Main window showing controls and canvas preview
2. Canvas rendering at 60fps
3. Option to open external display (Window → Show Display)
4. External display streams canvas at 30fps

---

**Architecture Summary**: Clean, modular, performant canvas-based rendering with live streaming to external displays, maintaining all existing functionality while enabling future enhancements like NDI/FFmpeg output.
