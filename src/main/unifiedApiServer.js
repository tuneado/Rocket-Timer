/**
 * Unified Timer API Server
 * Provides REST, WebSocket, and OSC interfaces for professional timer control
 * Compatible with Bitfocus Companion, lighting consoles, and broadcasting systems
 */

const express = require('express')
const WebSocket = require('ws')
const osc = require('osc')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { EventEmitter } = require('events')
const { ipcMain } = require('electron')

class UnifiedTimerAPIServer extends EventEmitter {
  constructor(mainWindow, config = {}) {
    super()
    
    this.mainWindow = mainWindow
    this.config = {
      restPort: config.restPort || 9999,
      wsPort: config.wsPort || 8080,
      oscPort: config.oscPort || 7000,
      oscRemotePort: config.oscRemotePort || 7001,
      enableAuth: config.enableAuth || false,
      enableRateLimit: config.enableRateLimit || true,
      allowExternal: config.allowExternal || false,
      colors: config.colors || {},
      ...config
    }
    
    // Shared timer state (synchronized with renderer)
    this.timerState = {
      id: 'main-timer',
      name: 'Main Timer',
      totalTime: 0,
      remainingTime: 0,
      isRunning: false,
      isPaused: false,
      startTime: null,
      endTime: null,
      warningLevel: 'normal',
      adjustments: [],
      presets: [],
      settings: {},
      formattedTime: '00:00:00',
      percentage: 0,
      elapsedTime: '00:00:00'
    }
    
    this.clients = {
      websocket: new Set(),
      osc: new Set()
    }
    
    this.servers = {
      rest: null,
      ws: null,
      osc: null
    }
    
    this.started = false // Track if server was actually started
    
    this.setupIPCHandlers()
  }

  // ===== IPC HANDLERS FOR RENDERER COMMUNICATION =====
  setupIPCHandlers() {
    // Listen for timer state updates from renderer
    ipcMain.on('companion-state-update', (event, newState) => {
      this.updateTimerState(newState)
    })
    
    // Listen for API commands from renderer
    ipcMain.handle('api-start-timer', () => this.startTimer())
    ipcMain.handle('api-stop-timer', () => this.stopTimer())
    ipcMain.handle('api-pause-timer', () => this.pauseTimer())
    ipcMain.handle('api-resume-timer', () => this.resumeTimer())
    ipcMain.handle('api-reset-timer', () => this.resetTimer())
    ipcMain.handle('api-adjust-time', (event, seconds) => this.adjustTime(seconds))
    ipcMain.handle('api-set-time', (event, totalSeconds) => this.setTime(totalSeconds))
    ipcMain.handle('api-trigger-flash', (event, cycles, duration) => this.triggerFlash(cycles, duration))
    
    // Listen for settings updates (colors)
    ipcMain.on('settings-colors-updated', (event, colors) => {
      this.updateColors(colors)
    })
  }

  // ===== REST API SETUP =====
  setupRESTAPI() {
    this.app = express()
    
    // Middleware
    const corsOptions = {
      origin: this.config.allowExternal ? true : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    }
    this.app.use(cors(corsOptions))
    
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true }))
    
    // Rate limiting
    if (this.config.enableRateLimit) {
      const limiter = rateLimit({
        windowMs: 1000, // 1 second
        max: 100, // 100 requests per second
        message: { success: false, error: 'Rate limit exceeded' }
      })
      this.app.use('/api/', limiter)
    }
    
    // API Documentation endpoint
    this.app.get('/api', (req, res) => {
      res.json(this.getAPIDocumentation())
    })
    
    // Timer State Endpoints
    this.app.get('/api/timer/state', (req, res) => {
      res.json({
        success: true,
        data: this.getFormattedTimerState(),
        timestamp: Date.now()
      })
    })
    
    // Timer Control Endpoints
    this.app.post('/api/timer/start', (req, res) => {
      const result = this.startTimer()
      res.json(result)
    })
    
    this.app.post('/api/timer/stop', (req, res) => {
      const result = this.stopTimer()
      res.json(result)
    })
    
    this.app.post('/api/timer/pause', (req, res) => {
      const result = this.pauseTimer()
      res.json(result)
    })
    
    this.app.post('/api/timer/resume', (req, res) => {
      const result = this.resumeTimer()
      res.json(result)
    })
    
    this.app.post('/api/timer/reset', (req, res) => {
      const result = this.resetTimer()
      res.json(result)
    })
    
    // Time Adjustment Endpoints
    this.app.post('/api/timer/adjust', (req, res) => {
      const { seconds, minutes } = req.body
      const adjustSeconds = (seconds || 0) + ((minutes || 0) * 60)
      
      const result = this.adjustTime(adjustSeconds)
      res.json(result)
    })
    
    this.app.post('/api/timer/set-time', (req, res) => {
      const { totalSeconds, hours = 0, minutes = 0, seconds = 0 } = req.body
      
      // Use totalSeconds if provided, otherwise calculate from components
      const timeInSeconds = totalSeconds || (hours * 3600) + (minutes * 60) + seconds
      
      // Validate that we have a positive time value
      if (timeInSeconds <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Time must be greater than 0',
          received: { totalSeconds, hours, minutes, seconds },
          calculated: timeInSeconds
        })
      }
      
      const result = this.setTime(timeInSeconds)
      res.json({
        ...result,
        timeSet: {
          totalSeconds: timeInSeconds,
          hours: Math.floor(timeInSeconds / 3600),
          minutes: Math.floor((timeInSeconds % 3600) / 60),
          seconds: timeInSeconds % 60,
          formatted: this.formatTime(timeInSeconds)
        }
      })
    })
    
    // Preset Management Endpoints
    this.app.get('/api/presets', (req, res) => {
      res.json({
        success: true,
        data: this.timerState.presets || []
      })
    })
    
    this.app.post('/api/presets', (req, res) => {
      const { name, duration, category, settings } = req.body
      const result = this.createPreset(name, duration, category, settings)
      res.json(result)
    })
    
    this.app.post('/api/presets/:id/load', (req, res) => {
      const result = this.loadPreset(req.params.id)
      res.json(result)
    })
    
    // Settings Endpoints
    this.app.get('/api/settings', (req, res) => {
      res.json({
        success: true,
        data: this.timerState.settings || {}
      })
    })
    
    this.app.put('/api/settings', (req, res) => {
      const result = this.updateSettings(req.body)
      res.json(result)
    })
    
    // Flash Control
    this.app.post('/api/timer/flash', (req, res) => {
      const { cycles, duration } = req.body
      const result = this.triggerFlash(cycles, duration)
      res.json(result)
    })
    
    // Health Check
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: Date.now(),
        version: '2.0.0',
        apis: {
          rest: `http://localhost:${this.config.restPort}`,
          websocket: `ws://localhost:${this.config.wsPort}`,
          osc: `osc://localhost:${this.config.oscPort}`
        }
      })
    })
    
    // Legacy compatibility endpoints (for existing integrations)
    this.app.get('/api/timer', (req, res) => {
      // Legacy endpoint - same as /api/timer/state but with different format
      const state = this.getFormattedTimerState()
      res.json({
        success: true,
        timer: {
          running: state.isRunning,
          paused: state.isPaused,
          time_remaining: state.remainingTime,
          time_total: state.totalTime,
          time_elapsed: state.totalTime - state.remainingTime,
          formatted_time: state.formattedTime,
          formatted_elapsed: state.elapsedTime,
          percentage: state.percentage,
          end_time: state.endTime
        }
      })
    })
    
    // Error handling
    this.app.use((err, req, res, next) => {
      console.error('🚨 REST API Error:', err)
      res.status(500).json({
        success: false,
        error: err.message,
        timestamp: Date.now()
      })
    })
    
    // Start REST server
    const host = this.config.allowExternal ? '0.0.0.0' : '127.0.0.1'
    this.servers.rest = this.app.listen(this.config.restPort, host, () => {
      console.log(`🌐 REST API server running on ${host}:${this.config.restPort}`)
      console.log(`📖 API Documentation: http://localhost:${this.config.restPort}/api`)
    })
    
    return this.servers.rest
  }

  // ===== WEBSOCKET API SETUP =====
  setupWebSocketAPI() {
    const wsOptions = {
      port: this.config.wsPort,
      host: this.config.allowExternal ? '0.0.0.0' : '127.0.0.1',
      clientTracking: true
    }
    
    this.servers.ws = new WebSocket.Server(wsOptions)
    
    this.servers.ws.on('connection', (ws, req) => {
      const clientIP = req.socket.remoteAddress
      console.log(`🔌 WebSocket client connected from ${clientIP}`)
      this.clients.websocket.add(ws)
      
      // Send current state immediately
      ws.send(JSON.stringify({
        type: 'connection-established',
        data: this.getFormattedTimerState(),
        timestamp: Date.now()
      }))
      
      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const command = JSON.parse(message)
          this.handleWebSocketCommand(ws, command)
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Invalid JSON message',
            timestamp: Date.now()
          }))
        }
      })
      
      // Handle disconnection
      ws.on('close', () => {
        console.log(`🔌 WebSocket client disconnected from ${clientIP}`)
        this.clients.websocket.delete(ws)
      })
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('🚨 WebSocket error:', error)
        this.clients.websocket.delete(ws)
      })
    })
    
    console.log(`🔌 WebSocket API server running on port ${this.config.wsPort}`)
    return this.servers.ws
  }
  
  handleWebSocketCommand(ws, command) {
    const { type, data = {} } = command
    let result = { success: false, error: 'Unknown command' }
    
    try {
      switch (type) {
        case 'timer-start':
          result = this.startTimer()
          break
          
        case 'timer-stop':
          result = this.stopTimer()
          break
          
        case 'timer-pause':
          result = this.pauseTimer()
          break
          
        case 'timer-resume':
          result = this.resumeTimer()
          break
          
        case 'timer-reset':
          result = this.resetTimer()
          break
          
        case 'adjust-time':
          result = this.adjustTime(data.seconds || 0)
          break
          
        case 'set-time':
          result = this.setTime(data.totalSeconds || 0)
          break
          
        case 'load-preset':
          result = this.loadPreset(data.presetId)
          break
          
        case 'get-state':
          result = { success: true, data: this.getFormattedTimerState() }
          break
          
        case 'trigger-flash':
          result = this.triggerFlash(data.cycles, data.duration)
          break
          
        case 'ping':
          result = { success: true, pong: Date.now() }
          break
          
        default:
          result = { success: false, error: `Unknown command: ${type}` }
      }
    } catch (error) {
      result = { success: false, error: error.message }
    }
    
    // Send response back to sender
    ws.send(JSON.stringify({
      type: 'command-response',
      originalCommand: type,
      result,
      timestamp: Date.now()
    }))
  }

  // ===== OSC API SETUP =====
  setupOSCAPI() {
    try {
      // OSC Server (receive commands)
      this.servers.osc = new osc.UDPPort({
        localAddress: this.config.allowExternal ? '0.0.0.0' : '127.0.0.1',
        localPort: this.config.oscPort,
        remoteAddress: '127.0.0.1',
        remotePort: this.config.oscRemotePort,
        metadata: true
      })
      
      // OSC Message Handlers
      this.servers.osc.on('message', (oscMsg) => {
        console.log(`🎛️ OSC Message: ${oscMsg.address}`, oscMsg.args)
        
        try {
          switch (oscMsg.address) {
            case '/timer/start':
              this.startTimer()
              this.sendOSCResponse('/timer/started', [1])
              break
              
            case '/timer/stop':
              this.stopTimer()
              this.sendOSCResponse('/timer/stopped', [1])
              break
              
            case '/timer/pause':
              this.pauseTimer()
              this.sendOSCResponse('/timer/paused', [1])
              break
              
            case '/timer/resume':
              this.resumeTimer()
              this.sendOSCResponse('/timer/resumed', [1])
              break
              
            case '/timer/reset':
              this.resetTimer()
              this.sendOSCResponse('/timer/reset', [1])
              break
              
            case '/timer/adjust':
              const adjustSeconds = oscMsg.args[0]?.value || 0
              this.adjustTime(adjustSeconds)
              this.sendOSCResponse('/timer/adjusted', [adjustSeconds])
              break
              
            case '/timer/set-time':
              const totalSeconds = oscMsg.args[0]?.value || 0
              this.setTime(totalSeconds)
              this.sendOSCResponse('/timer/time-set', [totalSeconds])
              break
              
            case '/timer/get-state':
              const state = this.getFormattedTimerState()
              this.sendOSCResponse('/timer/state', [
                { type: 'i', value: state.remainingTime },
                { type: 'i', value: state.totalTime },
                { type: 'i', value: state.isRunning ? 1 : 0 },
                { type: 'i', value: state.isPaused ? 1 : 0 }
              ])
              break
              
            case '/timer/load-preset':
              const presetId = oscMsg.args[0]?.value || 0
              this.loadPreset(presetId)
              this.sendOSCResponse('/timer/preset-loaded', [presetId])
              break
              
            case '/timer/flash':
              const cycles = oscMsg.args[0]?.value || 3
              this.triggerFlash(cycles)
              this.sendOSCResponse('/timer/flash-triggered', [cycles])
              break
              
            default:
              console.log(`🎛️ Unknown OSC command: ${oscMsg.address}`)
              this.sendOSCResponse('/error', [
                { type: 's', value: `Unknown command: ${oscMsg.address}` }
              ])
          }
        } catch (error) {
          console.error('🚨 OSC command error:', error)
          this.sendOSCResponse('/error', [
            { type: 's', value: error.message }
          ])
        }
      })
      
      this.servers.osc.on('ready', () => {
        const host = this.config.allowExternal ? '0.0.0.0' : '127.0.0.1'
        console.log(`🎛️ OSC API server running on ${host}:${this.config.oscPort}`)
        console.log(`🎛️ OSC remote port: ${this.config.oscRemotePort}`)
      })
      
      this.servers.osc.on('error', (error) => {
        console.error('🚨 OSC Error:', error)
      })
      
      this.servers.osc.open()
    } catch (error) {
      console.error('🚨 Failed to setup OSC API:', error)
    }
  }
  
  sendOSCResponse(address, args = []) {
    if (this.servers.osc && this.servers.osc.socket) {
      this.servers.osc.send({
        address,
        args
      })
    }
  }
  
  broadcastOSCUpdate(event, data) {
    if (!this.servers.osc || !this.servers.osc.socket) return
    
    switch (event) {
      case 'timer-update':
        this.sendOSCResponse('/timer/update', [
          { type: 'i', value: data.remainingTime || 0 },
          { type: 'i', value: data.totalTime || 0 },
          { type: 'i', value: data.isRunning ? 1 : 0 },
          { type: 'i', value: data.isPaused ? 1 : 0 },
          { type: 'f', value: data.percentage || 0 },
          { type: 's', value: data.warningLevel || 'normal' },
          { type: 's', value: data.warningColor || '#4ade80' }
        ])
        break
        
      case 'timer-started':
        this.sendOSCResponse('/timer/event/started', [
          { type: 'i', value: Date.now() }
        ])
        break
        
      case 'timer-stopped':
        this.sendOSCResponse('/timer/event/stopped', [
          { type: 'i', value: Date.now() }
        ])
        break
        
      case 'time-adjusted':
        this.sendOSCResponse('/timer/event/adjusted', [
          { type: 'i', value: data.adjustment || 0 },
          { type: 'i', value: data.newRemainingTime || 0 }
        ])
        break
    }
  }

  // ===== CORE TIMER METHODS =====
  startTimer() {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'start-timer'
      })
      
      console.log('⏰ Timer start command sent via API')
      const result = { success: true, message: 'Timer start command sent' }
      
      // Broadcast to all connected clients
      this.broadcastToAll('timer-start-requested', {})
      
      return result
    } catch (error) {
      console.error('🚨 Start timer error:', error)
      return { success: false, error: error.message }
    }
  }
  
  stopTimer() {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'stop-timer'
      })
      
      console.log('⏹️ Timer stop command sent via API')
      const result = { success: true, message: 'Timer stop command sent' }
      
      // Broadcast to all connected clients
      this.broadcastToAll('timer-stop-requested', {})
      
      return result
    } catch (error) {
      console.error('🚨 Stop timer error:', error)
      return { success: false, error: error.message }
    }
  }
  
  pauseTimer() {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'pause-timer'
      })
      
      console.log('⏸️ Timer pause command sent via API')
      const result = { success: true, message: 'Timer pause command sent' }
      
      // Broadcast to all connected clients
      this.broadcastToAll('timer-pause-requested', {})
      
      return result
    } catch (error) {
      console.error('🚨 Pause timer error:', error)
      return { success: false, error: error.message }
    }
  }
  
  resumeTimer() {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'resume-timer'
      })
      
      console.log('▶️ Timer resume command sent via API')
      const result = { success: true, message: 'Timer resume command sent' }
      
      // Broadcast to all connected clients
      this.broadcastToAll('timer-resume-requested', {})
      
      return result
    } catch (error) {
      console.error('🚨 Resume timer error:', error)
      return { success: false, error: error.message }
    }
  }
  
  resetTimer() {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'reset-timer'
      })
      
      console.log('🔄 Timer reset command sent via API')
      const result = { success: true, message: 'Timer reset command sent' }
      
      // Broadcast to all connected clients
      this.broadcastToAll('timer-reset-requested', {})
      
      return result
    } catch (error) {
      console.error('🚨 Reset timer error:', error)
      return { success: false, error: error.message }
    }
  }
  
  adjustTime(seconds) {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'adjust-time',
        data: { seconds }
      })
      
      console.log(`⏱️ Time adjust command sent: ${seconds} seconds via API`)
      const result = { success: true, message: 'Time adjust command sent', adjustment: seconds }
      
      // Broadcast to all connected clients
      this.broadcastToAll('time-adjust-requested', { seconds })
      
      return result
    } catch (error) {
      console.error('🚨 Adjust time error:', error)
      return { success: false, error: error.message }
    }
  }
  
  setTime(totalSeconds) {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'set-time',
        data: { totalSeconds }
      })
      
      console.log(`⏱️ Set time command sent: ${totalSeconds} seconds via API`)
      const result = { success: true, message: 'Set time command sent', totalSeconds }
      
      // Broadcast to all connected clients
      this.broadcastToAll('time-set-requested', { totalSeconds })
      
      return result
    } catch (error) {
      console.error('🚨 Set time error:', error)
      return { success: false, error: error.message }
    }
  }
  
  createPreset(name, duration, category = 'custom', settings = {}) {
    try {
      const preset = {
        id: Date.now().toString(),
        name,
        duration,
        category,
        settings,
        createdAt: new Date().toISOString()
      }
      
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'create-preset',
        data: preset
      })
      
      console.log(`📋 Preset create command sent: ${name} (${duration}s)`)
      return { success: true, message: 'Preset create command sent', data: preset }
    } catch (error) {
      console.error('🚨 Create preset error:', error)
      return { success: false, error: error.message }
    }
  }
  
  loadPreset(presetId) {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'load-preset',
        data: { presetId }
      })
      
      console.log(`📋 Preset load command sent: ${presetId}`)
      const result = { success: true, message: 'Preset load command sent', presetId }
      
      // Broadcast to all connected clients
      this.broadcastToAll('preset-load-requested', { presetId })
      
      return result
    } catch (error) {
      console.error('🚨 Load preset error:', error)
      return { success: false, error: error.message }
    }
  }
  
  updateSettings(newSettings) {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'update-settings',
        data: newSettings
      })
      
      console.log('⚙️ Settings update command sent via API')
      return { success: true, message: 'Settings update command sent', data: newSettings }
    } catch (error) {
      console.error('🚨 Update settings error:', error)
      return { success: false, error: error.message }
    }
  }
  
  triggerFlash(cycles = 3, duration = 500) {
    try {
      // Send command to renderer
      this.mainWindow.webContents.send('api-command', {
        action: 'trigger-flash',
        data: { cycles, duration }
      })
      
      console.log(`⚡ Flash command sent: ${cycles} cycles, ${duration}ms each`)
      const result = { success: true, message: 'Flash command sent', cycles, duration }
      
      // Broadcast to all connected clients
      this.broadcastToAll('flash-requested', { cycles, duration })
      
      return result
    } catch (error) {
      console.error('🚨 Trigger flash error:', error)
      return { success: false, error: error.message }
    }
  }
  
  updateTimerState(newState) {
    // Update internal state from renderer
    this.timerState = { ...this.timerState, ...newState }
    
    // Broadcast updates to all connected clients
    const formattedState = this.getFormattedTimerState()
    this.broadcastToAll('timer-update', formattedState)
    
    // Also broadcast to renderer for progress bar color updates
    this.mainWindow.webContents.send('api-timer-state-update', formattedState)
  }

  getWarningColor(warningLevel, customColors = {}) {
    // Map warning levels to settings progress colors exactly
    const colors = {
      'normal': customColors.progressSuccess || '#4ade80',      // Normal = Success color
      'warning': customColors.progressWarning || '#f59e0b',     // Warning = Warning color
      'critical': customColors.progressDanger || '#ef4444',     // Critical = Danger color
      'overtime': customColors.progressOvertime || '#991b1b'    // Overtime = Dark red (negative time)
    }
    return colors[warningLevel] || colors.normal
  }

  getFormattedTimerState() {
    const timer = this.timerState.timer || {}
    const totalTime = timer.totalTime || 0
    const remainingTime = timer.remainingTime || 0
    const elapsedTime = Math.max(0, totalTime - remainingTime)
    const elapsedPercentage = totalTime > 0 ? (elapsedTime / totalTime) * 100 : 0
    const remainingPercentage = Math.max(0, 100 - elapsedPercentage)
    
    // Use warning level from renderer (single source of truth)
    const warningLevel = timer.warningLevel || 'normal'
    const customColors = this.timerState.settings?.colors || this.config.colors || {}
    const warningColor = this.getWarningColor(warningLevel, customColors)
    
    return {
      id: this.timerState.id || 'main-timer',
      name: this.timerState.name || 'Main Timer',
      totalTime: totalTime,
      remainingTime: remainingTime,
      elapsedTime: elapsedTime,
      isRunning: timer.running || false,
      isPaused: timer.paused || false,
      startTime: timer.startTime || null,
      endTime: timer.endTime || null,
      endTimeFormatted: timer.endTimeFormatted || '--:--',
      warningLevel: warningLevel,
      warningColor: warningColor,
      formattedTime: timer.formattedTime || '00:00:00',
      formattedElapsed: this.formatTime(elapsedTime),
      percentage: Math.max(0, Math.min(100, elapsedPercentage)),
      remainingPercentage: Math.max(0, Math.min(100, remainingPercentage)),
      isOvertime: remainingTime < 0,
      timestamp: Date.now()
    }
  }
  
  formatTime(seconds) {
    const isNegative = seconds < 0
    const absSeconds = Math.abs(seconds)
    const hours = Math.floor(absSeconds / 3600)
    const minutes = Math.floor((absSeconds % 3600) / 60)
    const secs = Math.floor(absSeconds % 60)
    
    const formatted = hours > 0 
      ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    
    return isNegative ? `-${formatted}` : formatted
  }
  
  // ===== BROADCASTING =====
  broadcastToAll(event, data) {
    // Broadcast to WebSocket clients
    this.broadcastWebSocket(event, data)
    
    // Broadcast to OSC clients
    this.broadcastOSCUpdate(event, data)
    
    // Emit for internal listeners
    this.emit(event, data)
  }
  
  broadcastWebSocket(event, data) {
    const message = JSON.stringify({
      type: event,
      data,
      timestamp: Date.now()
    })
    
    this.clients.websocket.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message)
        } catch (error) {
          console.error('🚨 WebSocket broadcast error:', error)
          this.clients.websocket.delete(ws)
        }
      }
    })
  }
  
  // ===== API DOCUMENTATION =====
  getAPIDocumentation() {
    return {
      version: '2.0.0',
      title: 'Countdown Timer Unified API',
      description: 'Professional timer control via REST, WebSocket, and OSC protocols',
      protocols: {
        rest: {
          baseUrl: `http://localhost:${this.config.restPort}/api`,
          endpoints: {
            'GET /timer/state': 'Get current timer state',
            'GET /timer': 'Get timer state (legacy format)',
            'POST /timer/start': 'Start the timer',
            'POST /timer/stop': 'Stop the timer',
            'POST /timer/pause': 'Pause the timer',
            'POST /timer/resume': 'Resume the timer',
            'POST /timer/reset': 'Reset the timer',
            'POST /timer/adjust': 'Adjust time (body: {seconds: number})',
            'POST /timer/set-time': 'Set total time (body: {totalSeconds: number})',
            'GET /presets': 'Get all presets',
            'POST /presets': 'Create preset (body: {name, duration, category})',
            'POST /presets/:id/load': 'Load preset by ID',
            'GET /settings': 'Get settings',
            'PUT /settings': 'Update settings',
            'POST /timer/flash': 'Trigger flash effect',
            'GET /health': 'Health check and API info'
          }
        },
        websocket: {
          url: `ws://localhost:${this.config.wsPort}`,
          events: {
            send: [
              'timer-start', 'timer-stop', 'timer-pause', 'timer-resume',
              'adjust-time', 'set-time', 'load-preset', 'get-state',
              'trigger-flash', 'ping'
            ],
            receive: [
              'connection-established', 'timer-update', 'timer-start-requested',
              'timer-stop-requested', 'timer-pause-requested', 'timer-resume-requested',
              'time-adjust-requested', 'time-set-requested', 'preset-load-requested',
              'flash-requested', 'command-response'
            ]
          }
        },
        osc: {
          port: this.config.oscPort,
          remotePort: this.config.oscRemotePort,
          addresses: {
            send: [
              '/timer/start', '/timer/stop', '/timer/pause', '/timer/resume',
              '/timer/reset', '/timer/adjust', '/timer/set-time',
              '/timer/get-state', '/timer/load-preset', '/timer/flash'
            ],
            receive: [
              '/timer/started', '/timer/stopped', '/timer/paused',
              '/timer/resumed', '/timer/state', '/timer/update',
              '/timer/event/*', '/error'
            ]
          }
        }
      },
      examples: {
        rest: {
          'Start timer': 'curl -X POST http://localhost:9999/api/timer/start',
          'Adjust +30s': 'curl -X POST http://localhost:9999/api/timer/adjust -H "Content-Type: application/json" -d \'{"seconds": 30}\'',
          'Set 10 minutes': 'curl -X POST http://localhost:9999/api/timer/set-time -H "Content-Type: application/json" -d \'{"totalSeconds": 600}\''
        },
        websocket: {
          'Start timer': '{"type": "timer-start"}',
          'Adjust time': '{"type": "adjust-time", "data": {"seconds": 30}}',
          'Get state': '{"type": "get-state"}'
        },
        osc: {
          'Start timer': '/timer/start',
          'Adjust +30s': '/timer/adjust 30',
          'Set 10 min': '/timer/set-time 600'
        }
      },
      clientLibraries: {
        javascript: 'UnifiedTimerAPIClient class available',
        curl: 'Standard HTTP REST calls',
        companion: 'Bitfocus Companion module compatible',
        touchOSC: 'OSC address support',
        qlab: 'OSC cue integration ready'
      }
    }
  }
  
  // ===== SETTINGS UPDATES =====
  updateColors(newColors) {
    console.log('🎨 Updating API server colors:', newColors);
    this.config.colors = { ...this.config.colors, ...newColors };
    
    // Broadcast updated state with new colors
    const formattedState = this.getFormattedTimerState();
    this.broadcastToAll('colors-updated', formattedState);
  }

  // ===== LIFECYCLE =====
  start(config = {}) {
    // Update config
    this.config = { ...this.config, ...config }
    
    console.log('🚀 Starting Unified Timer API Server...')
    
    try {
      // Start all API protocols
      this.setupRESTAPI()
      this.setupWebSocketAPI()
      this.setupOSCAPI()
      
      console.log('✅ All API protocols started successfully!')
      console.log(`📱 REST API: http://localhost:${this.config.restPort}/api`)
      console.log(`🔌 WebSocket: ws://localhost:${this.config.wsPort}`)
      console.log(`🎛️ OSC: osc://localhost:${this.config.oscPort}`)
      
      this.started = true
      this.emit('server-started', this.config)
      
      return {
        running: true,
        port: this.config.restPort,
        error: null
      }
    } catch (error) {
      console.error('🚨 Failed to start API server:', error)
      this.emit('server-error', error)
      
      return {
        running: false,
        port: null,
        error: error.message
      }
    }
  }
  
  stop() {
    console.log('🛑 Stopping Unified Timer API Server...')
    
    try {
      // Close REST server
      if (this.servers.rest) {
        this.servers.rest.close()
        this.servers.rest = null
      }
      
      // Close WebSocket server
      if (this.servers.ws) {
        this.servers.ws.close()
        this.servers.ws = null
      }
      
      // Close OSC server
      if (this.servers.osc) {
        this.servers.osc.close()
        this.servers.osc = null
      }
      
      // Clear client connections
      this.clients.websocket.clear()
      this.clients.osc.clear()
      
      // Reset started flag
      this.started = false
      
      console.log('✅ All API servers stopped successfully')
      this.emit('server-stopped')
      
      return { success: true }
    } catch (error) {
      console.error('🚨 Error stopping API server:', error)
      return { success: false, error: error.message }
    }
  }
  
  getStatus() {
    return {
      running: this.started && !!(this.servers.rest && this.servers.ws),
      port: this.config.restPort,
      wsPort: this.config.wsPort,
      oscPort: this.config.oscPort,
      clients: {
        websocket: this.clients.websocket.size,
        rest: 'N/A',
        osc: 'N/A'
      },
      config: this.config
    }
  }
}

module.exports = { UnifiedTimerAPIServer }