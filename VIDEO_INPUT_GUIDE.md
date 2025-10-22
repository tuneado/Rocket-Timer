# 🎥 Video Input Feature Guide

## Overview
The Countdown Timer now supports **HDMI capture cards** and other video input devices. You can inject live video feeds directly into your timer canvas, with timer overlays appearing on top of the video.

## 🔌 Supported Devices
- **USB Capture Cards** (Elgato Cam Link, AVerMedia, etc.)
- **PCIe Capture Cards** (Blackmagic DeckLink, etc.)
- **HDMI to USB Adapters**
- **Built-in Webcams** (for testing)
- Any device recognized as a `videoinput` by WebRTC

## ✨ Features
- ✅ **Live Video Background**: Real-time HDMI input as canvas background
- ✅ **Timer Overlays**: All timer graphics (countdown, clock, progress) render on top
- ✅ **Opacity Control**: Adjust video opacity (0-100%) to balance background/overlay
- ✅ **Multi-Window Sync**: Video appears in both main window and external display
- ✅ **Device Selection**: Detect and choose from multiple video inputs
- ✅ **Full HD Support**: 1920x1080 @ 60fps (ideal settings)

## 🚀 How to Use

### Step 1: Connect Your Capture Card
1. Plug in your HDMI capture card via USB or PCIe
2. Connect an HDMI source (camera, media player, computer, etc.)
3. Ensure the device is powered on and recognized by your OS

### Step 2: Detect Video Devices
1. Open the Countdown Timer app
2. Scroll to the **"Video Input (HDMI Capture)"** card
3. Click **"Detect Devices"** button
4. Grant camera permissions if prompted
5. Available devices will populate in the dropdown

### Step 3: Start Video Input
1. Select your capture card from the dropdown
2. Click **"Start Video"** button
3. Video feed will appear as canvas background
4. Status indicator will show **"Active"** in green

### Step 4: Adjust Overlay Visibility (Optional)
- Use the **"Video Opacity"** slider to adjust background brightness
- Lower opacity = timer overlay more visible
- Higher opacity = video more prominent
- Default: 100%

### Step 5: Stop Video (When Done)
- Click **"Stop Video"** to disable video input
- Timer will return to solid background color

## 🎨 How It Works

### Canvas Layer Stack
```
┌─────────────────────────────────┐
│   Message Overlay (top)         │
├─────────────────────────────────┤
│   Clock / Elapsed Time          │
├─────────────────────────────────┤
│   Countdown Timer               │
├─────────────────────────────────┤
│   Progress Bar / Circle         │
├─────────────────────────────────┤
│   Video Input (background)      │  ← HDMI Capture
└─────────────────────────────────┘
```

### Rendering Process
1. **Video Frame**: Drawn first (fills entire 1920x1080 canvas)
2. **Timer Graphics**: Rendered on top with transparency
3. **60fps Animation**: Smooth video + timer updates
4. **Multi-Window**: Same feed appears in external display

## 🔧 Technical Details

### Video Settings
- **Resolution**: 1920x1080 (ideal)
- **Frame Rate**: 60fps (ideal)
- **Format**: Whatever the capture card provides
- **Audio**: Disabled (timer doesn't need audio)

### Browser Compatibility
- Uses **WebRTC getUserMedia()** API
- Built into Chromium/Electron
- No external dependencies required
- Cross-platform (Windows, macOS, Linux)

### Device Detection
```javascript
// Enumerate all video input devices
const devices = await navigator.mediaDevices.enumerateDevices();
const videoDevices = devices.filter(d => d.kind === 'videoinput');
```

### Video Capture
```javascript
// Open specific device
const stream = await navigator.mediaDevices.getUserMedia({
  video: { 
    deviceId: yourCaptureDeviceId,
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 60 }
  }
});
```

### Canvas Integration
```javascript
// Draw video frame as background
ctx.drawImage(videoElement, 0, 0, 1920, 1080);

// Then draw timer overlays on top
drawProgressBar();
drawCountdown();
drawClock();
```

## 🎯 Use Cases

### 1. **Live Event Broadcasting**
- HDMI from camera → Capture card → Timer overlay
- Perfect for conferences, presentations, sports events

### 2. **Media Player Integration**
- HDMI from media player → Capture card → Countdown over video
- Synchronize content playback with timer

### 3. **Multi-Computer Setup**
- HDMI from another computer → Capture card → Timer overlay
- Combine different video sources with timing

### 4. **Camera Feeds**
- HDMI camera → Capture card → Timer on live video
- Ideal for recording sessions, performances

## 🛠️ Troubleshooting

### No Devices Found
- ✅ Check capture card is properly connected
- ✅ Verify device appears in system camera settings
- ✅ Grant camera permissions when prompted
- ✅ Restart the app and try "Detect Devices" again

### Video Not Appearing
- ✅ Ensure HDMI source is powered on and outputting signal
- ✅ Check video opacity isn't set to 0%
- ✅ Try stopping and restarting video input
- ✅ Verify capture card drivers are installed (if required)

### Low Frame Rate / Lag
- ✅ Close other applications using the capture card
- ✅ Reduce video opacity (lighter rendering load)
- ✅ Check capture card specs (may not support 60fps)
- ✅ Use a simpler layout (less overlay graphics)

### Video Not in External Display
- ✅ Ensure external display window is open
- ✅ Video state syncs automatically via IPC
- ✅ Try stopping/starting video after opening display

## 📝 Code Architecture

### Files Involved
```
src/renderer/js/videoInputManager.js    # Core video input management
src/renderer/js/canvasRenderer.js        # Canvas integration
src/renderer/js/countdown.js             # UI controls
src/renderer/js/displayCanvas.js         # External display sync
src/main/ipcHandlers.js                  # IPC communication
src/renderer/html/index.html             # Video input UI card
```

### Key Classes
- **VideoInputManager**: Handles device enumeration, stream management
- **CanvasRenderer**: Integrates video drawing into canvas rendering loop
- **IPC Handlers**: Sync video state between main and display windows

## 🎓 Pro Tips
1. **Test with Webcam First**: Use built-in webcam to verify feature works before using capture card
2. **Adjust Opacity**: Lower to 70-80% for better text readability over video
3. **Use Dark Layouts**: Timer overlays are more visible with darker themes
4. **Check Resolution**: Ensure capture card outputs 1080p for best quality
5. **NDI Compatibility**: Video input works seamlessly with NDI output

## 🔮 Future Enhancements
- [ ] Chroma key (green screen) support
- [ ] Video rotation/flip controls
- [ ] Crop/zoom video to specific region
- [ ] Multiple video inputs simultaneously
- [ ] Video recording with timer overlay

---

**Need Help?** Check the main README or open an issue on GitHub!
