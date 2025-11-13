# Countdown Timer - TODO List

This document tracks planned improvements and features for the Countdown Timer application.

## High Priority

### Timer Improvements
- [x] **Higher Resolution Timer**: Implement 100ms interval updates instead of 1000ms
  - Updated countdown interval from 1000ms to 100ms
  - Timer now ticks every 100ms for better precision
  - Display updates every second (10 ticks) to maintain performance
  
- [x] **Advanced Timer Controls**: Add +5 min and +10 min buttons
  - Added +5 minute button next to existing +1 minute button
  - Added +10 minute button for longer adjustments
  - Implemented corresponding -5 min and -10 min buttons
  - Updated UI layout to accommodate new controls
  
- [x] **Consolidate Time Adjustment Functions**
  - Refactored into a single reusable `adjustTime(seconds)` function
  - Function accepts positive or negative values for add/subtract
  - Created convenience functions: addMinute(), subtractMinute(), addFiveMinutes(), etc.
  - Reduced code duplication and improved maintainability

### Code Quality
- [x] **Reduce Console Logging**
  - Reviewed all console.log statements
  - Removed ~15 debug logs from production code
  - Kept only essential logs (errors, warnings, critical events)
  
- [x] **Elapsed Time Display**
  - Verified elapsed time shows seconds format (HH:MM:SS)
  - Uses consistent formatTime() function for all time displays
  - Handles both positive and negative elapsed time correctly

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
