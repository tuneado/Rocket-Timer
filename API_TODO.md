# Unified API Implementation - TODO

This document outlines the plan for implementing a unified API system supporting REST, WebSocket, and OSC protocols for remote control of the Countdown Timer.

## Current Architecture (Backed up)

The current implementation uses Electron IPC (Inter-Process Communication):
- **File**: `src/main/ipcHandlers.js` (backed up to `ipcHandlers.js.bak`)
- **Communication**: Renderer process ↔ Main process via IPC
- **Scope**: Internal communication between Electron windows only

## Unified API Goals

Create a unified API layer that:
1. Maintains existing IPC functionality
2. Adds REST API for HTTP-based control
3. Adds WebSocket API for real-time bidirectional communication
4. Adds OSC API for broadcast production integration
5. Provides consistent interface across all protocols

## Implementation Plan

### Phase 1: Core API Architecture ✅ COMPLETE

- [x] Backup current IPC handlers (`ipcHandlers.js.bak`)
- [x] Create API TODO document
- [x] Design unified API interface layer
- [x] Create API controller/router abstraction (`apiController.js`)
- [x] Create REST API server (`restServer.js`)
- [x] Create WebSocket API server (`websocketServer.js`)
- [x] Create OSC API server (`oscServer.js`)
- [x] Create API Manager to orchestrate all APIs (`apiManager.js`)
- [x] Update package.json with dependencies
- [x] Integrate API Manager into main.js
- [x] Add API command handlers to countdown.js
- [x] Define API endpoints and their mappings

### Phase 2: REST API Implementation ✅ COMPLETE

#### 2.1 Setup (Dependencies & Structure) ✅ COMPLETE
- [x] Add Express.js dependency (`express`)
- [x] Add CORS middleware (`cors`)
- [x] Add body-parser middleware
- [x] Create `src/main/api/restServer.js`
- [x] Create `src/main/api/routes/` directory structure

#### 2.2 REST Endpoints - Timer Control ✅ COMPLETE
- [x] `GET /api/status` - Get current timer state
- [x] `GET /api/health` - Health check endpoint
- [x] `POST /api/timer/start` - Start the timer
- [x] `POST /api/timer/stop` - Stop the timer
- [x] `POST /api/timer/reset` - Reset the timer
- [x] `POST /api/timer/set` - Set timer duration
- [x] `POST /api/timer/adjust` - Add/subtract time

#### 2.3 REST Endpoints - Display Control ✅ COMPLETE
- [x] `POST /api/display/message` - Display a message
- [x] `DELETE /api/display/message` - Clear message
- [x] `POST /api/display/flash` - Trigger flash animation
- [x] `POST /api/display/window/toggle` - Toggle display window

#### 2.4 REST Endpoints - Clock Control ✅ COMPLETE
- [x] `GET /api/clock` - Get clock state
- [x] `POST /api/clock/show` - Show clock
- [x] `POST /api/clock/hide` - Hide clock
- [x] `POST /api/clock/toggle` - Toggle clock visibility

#### 2.5 REST Endpoints - Presets ✅ COMPLETE
- [x] `POST /api/presets/:index` - Set timer to preset

#### 2.6 REST API Configuration
- [x] Add settings for API port (default: 3000)
- [x] Add settings for API authentication (optional token)
- [x] Add settings for CORS origins
- [ ] Create API enable/disable toggle in settings UI (to be done later)

### Phase 3: WebSocket API Implementation ✅ COMPLETE

#### 3.1 Setup ✅ COMPLETE
- [x] Add Socket.IO dependency (`socket.io`)
- [x] Create `src/main/api/websocketServer.js`
- [x] Configure WebSocket server on separate port

#### 3.2 WebSocket Events - Inbound (Client → Server) ✅ COMPLETE
- [x] `timer:start` - Start timer
- [x] `timer:stop` - Stop timer
- [x] `timer:reset` - Reset timer
- [x] `timer:set` - Set timer duration
- [x] `timer:adjust` - Adjust time
- [x] `display:message` - Show message
- [x] `display:clearMessage` - Clear message
- [x] `display:flash` - Trigger flash
- [x] `display:toggleWindow` - Toggle display window
- [x] `clock:toggle` - Toggle clock
- [x] `clock:show` - Show clock
- [x] `clock:hide` - Hide clock
- [x] `preset:load` - Load preset
- [x] `state:get` - Request current state

#### 3.3 WebSocket Events - Outbound (Server → Client) ✅ COMPLETE
- [x] `state:current` - Full current state (sent on connection)
- [x] `timer:update` - Timer state changed
- [x] `timer:started` - Timer started
- [x] `timer:stopped` - Timer stopped
- [x] `timer:reset` - Timer reset
- [x] `timer:set` - Timer duration set
- [x] `timer:adjusted` - Timer adjusted
- [x] `clock:update` - Clock time updated
- [x] `clock:shown` - Clock shown
- [x] `clock:hidden` - Clock hidden
- [x] `clock:toggled` - Clock toggled
- [x] `message:shown` - Message displayed
- [x] `message:cleared` - Message cleared
- [x] `display:flash` - Flash triggered
- [x] `display:windowToggled` - Display window toggled
- [x] `preset:loaded` - Preset loaded
- [x] `error` - Error message
- [x] `timer:result` / `display:result` / `clock:result` / `preset:result` - Operation results

#### 3.4 WebSocket Configuration ✅ COMPLETE
- [x] Add settings for WebSocket port (default: 3001)
- [x] Add connection authentication (API key support)
- [x] Handle client connections/disconnections
- [x] Track connected clients

### Phase 4: OSC API Implementation ✅ COMPLETE

#### 4.1 Setup ✅ COMPLETE
- [x] Add OSC dependency (`osc`)
- [x] Create `src/main/api/oscServer.js`
- [x] Configure OSC UDP server

#### 4.2 OSC Address Space - Timer ✅ COMPLETE
- [x] `/timer/start` - Start timer
- [x] `/timer/stop` - Stop timer
- [x] `/timer/reset` - Reset timer
- [x] `/timer/set [hours] [minutes] [seconds]` - Set duration
- [x] `/timer/adjust [seconds]` - Adjust time
- [x] `/state/get` - Query current state

#### 4.3 OSC Address Space - Display ✅ COMPLETE
- [x] `/display/message [text]` - Show message
- [x] `/display/clearMessage` - Clear message
- [x] `/display/message/clear` - Alternative clear
- [x] `/display/flash` - Trigger flash
- [x] `/display/window/toggle` - Toggle display window

#### 4.4 OSC Address Space - Clock ✅ COMPLETE
- [x] `/clock/toggle` - Toggle clock
- [x] `/clock/show` - Show clock
- [x] `/clock/hide` - Hide clock

#### 4.5 OSC Address Space - Presets ✅ COMPLETE
- [x] `/preset/[0-7]` - Load preset by index

#### 4.6 OSC Configuration ✅ COMPLETE
- [x] Add settings for OSC input port (default: 8000)
- [x] Add settings for OSC output port (default: 8001)
- [x] Add settings for output destination IP/port
- [x] Configure OSC message handling

#### 4.7 OSC Status Updates (Outbound) ✅ COMPLETE
- [x] Send `/timer/remaining [seconds]` on updates
- [x] Send `/timer/progress [float]` on updates
- [x] Send `/timer/running [0|1]` on state change
- [x] Send `/timer/started` when started
- [x] Send `/timer/stopped` when stopped
- [x] Send `/clock/time [h] [m] [s]` on updates
- [x] Send `/clock/visible [0|1]` on visibility change

### Phase 5: Unified API Controller ✅ COMPLETE

#### 5.1 Create Abstraction Layer ✅ COMPLETE
- [x] Create `src/main/api/apiController.js`
- [x] Abstract timer operations (start, stop, reset, set, adjust)
- [x] Abstract display operations (message, clear, flash, toggle window)
- [x] Abstract clock operations (show, hide, toggle)
- [x] Abstract preset operations (load preset)
- [x] Map operations to IPC commands

#### 5.2 Bridge APIs to Controller ✅ COMPLETE
- [x] Connect REST endpoints to controller
- [x] Connect WebSocket events to controller
- [x] Connect OSC messages to controller
- [x] Add IPC handlers in countdown.js for API commands
- [x] Ensure all APIs trigger same underlying operations

#### 5.3 State Broadcasting ✅ COMPLETE
- [x] Controller broadcasts state changes via EventEmitter
- [x] WebSocket server subscribes to controller events
- [x] OSC server subscribes to controller events
- [x] All clients receive real-time updates

### Phase 6: Security & Configuration (Partial)

#### 6.1 Authentication
- [ ] Implement API key/token authentication for REST
- [ ] Implement token-based auth for WebSocket
- [ ] Add IP whitelist option for OSC
- [ ] Add authentication UI in settings

#### 6.2 Settings UI
- [ ] Add "Remote Control" section to settings
- [ ] Enable/disable REST API toggle
- [ ] Enable/disable WebSocket API toggle
- [ ] Enable/disable OSC API toggle
- [ ] Port configuration inputs
- [ ] Authentication token input/generation
- [ ] Show API status indicators (active/inactive)
- [ ] Display API URLs/endpoints when active

#### 6.3 Security Best Practices
- [ ] Rate limiting on REST endpoints
- [ ] Input validation on all APIs
- [ ] Sanitize message text input
- [ ] Prevent command injection
- [ ] Add HTTPS support option (with cert)
- [ ] Add WSS support option (secure WebSocket)

### Phase 7: Documentation & Examples

#### 7.1 API Documentation
- [ ] Create `API_DOCUMENTATION.md`
- [ ] Document all REST endpoints with examples
- [ ] Document all WebSocket events with examples
- [ ] Document all OSC addresses with examples
- [ ] Include authentication setup instructions

#### 7.2 Example Clients
- [ ] Create example REST client (curl/JavaScript)
- [ ] Create example WebSocket client (JavaScript/HTML)
- [ ] Create example OSC client (Python/TouchOSC template)
- [ ] Create Postman collection for REST API
- [ ] Create example integration scripts

#### 7.3 Integration Guides
- [ ] Write guide for OBS Studio integration
- [ ] Write guide for Stream Deck integration
- [ ] Write guide for TouchOSC/Lemur setup
- [ ] Write guide for custom web dashboard
- [ ] Write guide for companion module creation

### Phase 8: Testing & Validation

#### 8.1 Unit Tests
- [ ] Test REST endpoints
- [ ] Test WebSocket events
- [ ] Test OSC message handling
- [ ] Test API controller methods
- [ ] Test authentication

#### 8.2 Integration Tests
- [ ] Test REST → Timer operation
- [ ] Test WebSocket → Timer operation
- [ ] Test OSC → Timer operation
- [ ] Test state broadcasting to all clients
- [ ] Test concurrent operations from multiple APIs

#### 8.3 Performance Tests
- [ ] Load test REST API
- [ ] Test WebSocket with multiple clients
- [ ] Test OSC message throughput
- [ ] Measure latency for each protocol

### Phase 9: Deployment & Monitoring

#### 9.1 Error Handling
- [ ] Add comprehensive error logging
- [ ] Return proper error codes/messages
- [ ] Handle server startup failures
- [ ] Handle port conflicts

#### 9.2 Monitoring
- [ ] Log API requests (optional setting)
- [ ] Track connected WebSocket clients
- [ ] Monitor OSC message rate
- [ ] Display API statistics in UI

#### 9.3 Graceful Shutdown
- [ ] Close REST server on app quit
- [ ] Disconnect WebSocket clients properly
- [ ] Close OSC ports on app quit
- [ ] Save API state/configuration

## Technical Notes

### Port Assignments (Defaults)
- REST API: `3000`
- WebSocket: `3001` (or same as REST)
- OSC Input: `8000` (UDP)
- OSC Output: `8001` (UDP)

### Dependencies to Add
```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "socket.io": "^4.6.0",
  "osc": "^2.4.4" or "node-osc": "^9.1.0"
}
```

### Architecture Pattern
```
┌─────────────────┐
│   Renderer      │
│   (UI)          │
└────────┬────────┘
         │ IPC
┌────────▼────────────────────────┐
│   Main Process                  │
│   ┌──────────────────────┐     │
│   │  API Controller      │     │
│   │  (Unified Logic)     │     │
│   └──┬────┬────┬─────┬───┘     │
│      │    │    │     │         │
│   ┌──▼─┐ ┌▼──┐ ┌▼───┐ ┌▼──┐   │
│   │IPC │ │REST│ │WSS │ │OSC│   │
│   └────┘ └────┘ └────┘ └───┘   │
└─────────────────────────────────┘
         │     │     │      │
    Renderer REST  WebSocket OSC
    Windows Clients Clients Clients
```

## Benefits

### For Users
- Remote control from any device on network
- Integration with broadcast production tools
- Custom control surfaces and dashboards
- Automation and scripting capabilities

### For Developers
- Clean separation of concerns
- Easy to add new protocols
- Consistent API across all methods
- Testable architecture

## Considerations

- **Network Security**: All network APIs should be opt-in and configurable
- **Performance**: Avoid excessive broadcasting to reduce CPU usage
- **Backward Compatibility**: Keep existing IPC functionality intact
- **User Experience**: Make API setup simple with sensible defaults
