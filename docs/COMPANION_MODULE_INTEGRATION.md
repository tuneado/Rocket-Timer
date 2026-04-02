# Bitfocus Companion Integration

The Countdown Timer now has a dedicated **Companion Module** for full Stream Deck and control surface integration!

## 🚀 Rocket Timer Module

**Location:** `../companion-module-rocket-timer/`  
**Module ID:** `rocket-timer`  
**Version:** 1.0.0
**Status:** ✅ Ready for Testing

### Quick Start

1. **Get the Module**
   ```bash
   cd ../companion-module-rocket-timer
   ```

2. **Link to Companion** (macOS)
   ```bash
   cd ~/Library/Application\ Support/companion/module-local-dev/
   ln -s /path/to/companion-module-rocket-timer rocket-timer
   ```

3. **Add in Companion**
   - Open Bitfocus Companion
   - Connections → Add Connection
   - Search "Rocket Timer"
   - Configure: localhost, port 9999

### Features

✅ **16 Actions**
- Timer Control (Start, Stop, Pause, Resume, Reset, Toggle, Toggle Start/Stop)
- Time Management (Set H/M/S, Adjust, Add/Subtract minutes)
- Preset Loading
- Layout Switching (Classic, Minimal, Clock Focus, Detailed, Circular, Video)
- Sound Control (Mute, Unmute, Toggle)
- Display Effects (Flash, Feature Image)
- Message Overlays (Send, Show, Set Text, Toggle)

✅ **11 Feedbacks**
- Boolean feedbacks: Timer Running, Paused, Stopped, Overtime
- Warning Level (Normal, Warning, Critical, Overtime)
- Message Visible, Feature Image Enabled, Sound Muted
- Connection State
- **Advanced feedbacks:** Warning Color (Background), Warning Color (Text) — dynamically color buttons using the API's real-time warning color

✅ **14 Variables**
- Real-time formatted time and elapsed time (HH:MM:SS)
- Numeric values (total/remaining/elapsed seconds, percentage)
- Status indicators (running, paused, overtime, warning level, state)
- Timer metadata (name, end time, connection)

✅ **30+ Preset Buttons**
- Timer control (Start/Stop, Reset, ±1/5/10 min)
- Timer display (Remaining, Elapsed, Percentage, End Time) with dynamic warning colors
- 8 preset buttons, custom timer
- Message controls, sound toggle
- 6 layout buttons (Classic, Minimal, Clock Focus, Detailed, Circular, Video)
- Display effects (Flash, Feature Image)
- Status display with multi-state feedback

### Documentation

- **User Guide:** [README.md](../companion-module-rocket-timer/README.md)
- **Quick Start:** [HELP.md](../companion-module-rocket-timer/companion/HELP.md)
- **API Docs:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

### API Requirements

The Companion module uses these API endpoints (all implemented):

**Core Endpoints:**
- `GET /api/health` - Connection verification
- `GET /api/timer/state` - State retrieval
- `POST /api/timer/{start|stop|pause|resume|reset}` - Control
- `POST /api/timer/{hours|minutes|seconds}/:value` - Time setting
- `POST /api/timer/{add-minute|subtract-minute}` - Quick adjustments
- `GET /api/presets` + `POST /api/presets/:id/load` - Presets
- `GET /api/layouts` + `POST /api/layout` - Layouts
- `POST /api/sound/{mute|unmute|toggle}` - Sound control
- `POST /api/display/flash` - Flash effect
- `POST /api/display/toggle-feature-image` - Feature image
- `POST /api/message` + `POST /api/message/{show|hide|toggle}` - Messages
- `WebSocket ws://localhost:8080` - Real-time updates (timer-update, sound events with payload)

All endpoints are documented in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

### Testing Status

| Component | Status |
|-----------|--------|
| Module Implementation | ✅ Complete |
| API Integration | ✅ Complete |
| Documentation | ✅ Complete |
| Hardware Testing | ⏳ Pending |
| Publishing | ⏳ Pending |

### Publishing Plan

After successful testing:
1. Create GitHub repository
2. Publish to npm as `companion-module-rocket-timer`
3. Submit to Bitfocus Companion module registry
4. Announce in Companion community

### Phase 2 (Future)

Planned expansions:
- Camera/video control
- Display window management
- Advanced presets
- Custom macros

### Support

For Companion module issues:
- Check [DEVELOPMENT.md](../companion-module-rocket-timer/DEVELOPMENT.md)
- Review Companion logs
- Test API manually: `curl http://localhost:9999/api/health`

---

**Ready to control your broadcast timer from Stream Deck! 🎮**
