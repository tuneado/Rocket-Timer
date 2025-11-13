# Countdown Timer - TODO List

This document tracks planned improvements and features for the Countdown Timer application.

## High Priority

### Timer Improvements
- [ ] **Higher Resolution Timer**: Implement 100ms interval updates instead of 1000ms
  - Update countdown interval from 1000ms to 100ms
  - Adjust display formatting to show milliseconds (optional display mode)
  - Test performance impact on canvas rendering
  
- [ ] **Advanced Timer Controls**: Add +5 min and +10 min buttons
  - Add +5 minute button next to existing +1 minute button
  - Add +10 minute button for longer adjustments
  - Implement corresponding -5 min and -10 min buttons
  - Update UI layout to accommodate new controls
  
- [ ] **Consolidate Time Adjustment Functions**
  - Refactor `addMinute()` and `subtractMinute()` into a single reusable function
  - Create `adjustTime(seconds)` that accepts positive or negative values
  - Reduce code duplication and improve maintainability

### Code Quality
- [ ] **Reduce Console Logging**
  - Review all console.log statements
  - Remove debug logs from production code
  - Keep only essential logs (errors, warnings, critical events)
  - Consider adding a debug mode flag for verbose logging

- [ ] **Elapsed Time Display**
  - Ensure elapsed time always shows seconds format (HH:MM:SS)
  - Fix any formatting inconsistencies
  - Test with various time ranges (short and long durations)

### UI/UX Enhancements
- [ ] **Clock Format Toggle**: Add 12-hour/24-hour clock format switching
  - Add toggle button or setting for clock format preference
  - Implement 12-hour format with AM/PM indicator
  - Save user preference in settings
  - Update display window to respect format setting

## API Development (Future)

### REST API
- [ ] Design REST API endpoints for timer control
  - `GET /timer/status` - Get current timer state
  - `POST /timer/start` - Start the timer
  - `POST /timer/stop` - Stop the timer
  - `POST /timer/reset` - Reset the timer
  - `POST /timer/set` - Set timer duration
  - `POST /timer/adjust` - Add/subtract time
  
### WebSocket API
- [ ] Implement WebSocket server for real-time control
  - Real-time timer state broadcasting
  - Bidirectional control messages
  - Connection management and authentication
  
### OSC (Open Sound Control) API
- [ ] Add OSC protocol support for broadcast control
  - OSC message parsing and handling
  - Timer control via OSC messages
  - Integration with professional broadcast systems

## Technical Debt
- [ ] Review and update dependencies
- [ ] Improve error handling throughout the application
- [ ] Add unit tests for core timer functions
- [ ] Document API interfaces and code structure
- [ ] Performance optimization for canvas rendering

## Completed
- [x] Canvas-based rendering system
- [x] Settings management system
- [x] Layout system with multiple presets
- [x] Video input support for HDMI capture
- [x] Feature image overlay
- [x] Flash animation at timer completion
- [x] Theme support (light/dark mode)
- [x] Message display functionality
- [x] Clock display with start/stop controls
- [x] Preset time buttons with customization
- [x] Auto-reset and auto-stop features
- [x] Sound notifications

## Notes
- This TODO list is based on the conversation history and planned improvements
- The original countdown.js has been backed up to countdown.js.bak
- New features should maintain backward compatibility with existing settings
- All UI changes should follow the existing Bulma CSS framework patterns
