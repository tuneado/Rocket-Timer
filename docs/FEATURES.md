# Rocket Timer — Feature Overview

**Rocket Timer** is a professional countdown timer built for live events, conferences, church services, theater productions, and broadcast studios. It runs as a desktop application on macOS, Windows, and Linux, giving you a dedicated timer display on an external monitor or projector while keeping full control on your main screen.

---

## Video Input

Send your camera feed, presentation, or any HDMI source directly to the same monitor as your timer — no need for a separate switcher or output.

- Connect a **webcam** or **HDMI capture card** (e.g., Elgato Cam Link, Magewell)
- The video feed is rendered right on the timer canvas alongside the countdown, clock, and progress bar
- **Auto-start** the camera when the app launches or when a video-enabled layout is selected
- Select your preferred **device** and **resolution** in settings
- **Mirror/flip** the video for confidence monitor setups
- Video automatically stops when switching to a layout without a video frame, saving system resources

This means you can use a single monitor output for both your timer and your live camera or presentation feed.

---

## Customizable Appearance

Make the timer match your event's look and feel.

### Colors
Every element on the canvas can be individually colored:
- **Countdown digits** — the main timer display
- **Clock** — current time of day
- **Elapsed time** — how long since the timer started
- **Message overlay** — text and background
- **Progress bar** — success, warning, and critical states
- **Separator lines**
- **Canvas background**

### Background & Cover Images
- Set a **background image** with adjustable opacity — great for branding or event logos
- Use a **cover image** that displays before the timer starts — perfect for holding slides or sponsor screens

### Layouts
Choose from 6 built-in layouts or create your own:
- **Classic** — full-featured with countdown, clock, progress bar, elapsed time, and end time
- **Minimal** — clean countdown-only display
- **Clock Focus** — emphasizes the current time alongside the countdown
- **Detailed** — shows all available information
- **Circular** — progress displayed as a circular arc
- **Video** — side-by-side timer and video feed

#### Custom Layouts
- Use the **Layout Creator** — a visual drag-and-drop editor to position every element exactly where you want it
- **Import/Export** layouts as JSON files to share across setups or teams
- Switch layouts on the fly while the timer is running

---

## Screen Flash

A full-screen red flash effect triggers when the timer reaches zero — immediately visible to speakers and presenters even at a distance. Configurable flash cycles and intensity. Can also be triggered manually at any time via a button or keyboard shortcut (**F**).

---

## Message Overlay

Display text messages on the timer screen in real time — perfect for cueing speakers, showing announcements, or sending stage directions.

- Type a message and display it instantly on the external monitor
- Set an optional **auto-dismiss duration**
- Show and hide messages via the UI, keyboard, or API
- Message text and background colors are fully customizable

---

## Bitfocus Companion Integration *(Coming Soon)*

Full integration with **Bitfocus Companion** for Stream Deck and control surface operation. The companion module (**companion-module-rocket-timer**) connects over the network and provides:

- **Actions** — Start, Stop, Pause, Resume, Reset, Set Time, Load Preset, Change Layout, Send Message, Flash, Mute/Unmute
- **Feedbacks** — Timer running/stopped state, warning/critical thresholds, overtime indication
- **Variables** — Remaining time, formatted time, hours/minutes/seconds, progress percentage, current layout
- **Presets** — Ready-made Stream Deck button configurations

Control your timer from a Stream Deck, Touch Portal, or any Companion-compatible surface.

---

## Additional Features

### Multi-Protocol API
Control the timer remotely via:
- **REST API** (port 9999) — HTTP/JSON endpoints for any automation tool
- **WebSocket** (port 8080) — real-time bidirectional state sync
- **OSC** (ports 7000/7001) — Open Sound Control for lighting and audio consoles

### External Display Window
- Separate full-screen window for your secondary monitor or projector
- Automatically mirrors the timer, clock, messages, video, and effects
- Always-on-top option to prevent other windows from covering it

### Precision Timer Engine
- **Millisecond accuracy** with wall-clock-based timing — never drifts, even when the app window is in the background
- **Overtime mode** — optionally count up past zero instead of stopping
- **Auto-reset** after completion

### Quick Presets
- **8 preset slots** — one-click access to your most-used durations
- Customize presets via Ctrl+Click or long-press
- Load presets via keyboard shortcuts (keys 1–8)

### Sound Notifications
- Plays a sound when the timer reaches zero
- Upload your own **MP3, WAV, or OGG** file, or use the built-in beep
- Global mute toggle

### Keyboard Shortcuts
Full keyboard control — Space to start/stop, R to reset, arrow keys for time adjustments, number keys for presets, and more.

---

## Platform Support

| Platform | Format |
|----------|--------|
| macOS (Apple Silicon) | `.dmg`, `.zip` |
| macOS (Intel) | `.dmg`, `.zip` |
| Windows | `.exe` installer |
| Linux | `.AppImage`, `.deb` |

---

*Rocket Timer v1.0.0-beta.1 — Built by [50hz Event Solutions](https://50-hz.com)*
