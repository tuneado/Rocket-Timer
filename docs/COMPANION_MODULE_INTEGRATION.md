# Bitfocus Companion Integration

The Countdown Timer now has a dedicated **Companion Module** for full Stream Deck and control surface integration!

## 🚀 Rocket Timer Module

**Location:** `../companion-module-rocket-timer/`  
**Module ID:** `rocket-timer`  
**Version:** 1.0.0 (Phase 1)  
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

### Features (Phase 1)

✅ **15 Actions**
- Timer Control (Start, Stop, Pause, Resume, Reset)
- Time Management (Set H/M/S, Quick adjustments)
- Preset Loading
- Layout Switching
- Sound Control & Display Effects

✅ **8 Feedbacks**
- Visual button states (Green/Orange/Red)
- Time threshold warnings
- Layout indicators

✅ **16 Variables**
- Real-time time display
- Status indicators
- Timer metadata

✅ **12 Preset Buttons**
- Ready-to-use configurations
- Smart feedback integration

### Documentation

- **User Guide:** [README.md](../companion-module-rocket-timer/README.md)
- **Quick Start:** [HELP.md](../companion-module-rocket-timer/HELP.md)
- **Development:** [DEVELOPMENT.md](../companion-module-rocket-timer/DEVELOPMENT.md)
- **Full Plan:** [COMPANION_MODULE_DEVELOPMENT_PLAN.md](COMPANION_MODULE_DEVELOPMENT_PLAN.md)

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
- `POST /api/sound/toggle` - Sound control
- `POST /api/display/flash` - Flash effect
- `WebSocket ws://localhost:8080` - Real-time updates

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
- Message overlay control
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
