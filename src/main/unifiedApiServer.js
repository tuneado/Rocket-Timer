/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
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
      presets: this.config.presets || [],
      settings: {},
      message: {
        visible: false,
        text: ''
      },
      coverImage: {
        enabled: false
      },
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

    // Listen for presets updates from settings/project changes
    ipcMain.on('settings-presets-updated', (event, presets) => {
      this.timerState.presets = presets || []
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
    
    // Individual Time Component Setters
    this.app.post('/api/timer/hours/:value', (req, res) => {
      const hours = parseInt(req.params.value)
      if (isNaN(hours) || hours < 0 || hours > 99) {
        return res.status(400).json({
          success: false,
          error: 'Hours must be between 0 and 99'
        })
      }
      const result = this.setHours(hours)
      res.json(result)
    })
    
    this.app.post('/api/timer/minutes/:value', (req, res) => {
      const minutes = parseInt(req.params.value)
      if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        return res.status(400).json({
          success: false,
          error: 'Minutes must be between 0 and 59'
        })
      }
      const result = this.setMinutes(minutes)
      res.json(result)
    })
    
    this.app.post('/api/timer/seconds/:value', (req, res) => {
      const seconds = parseInt(req.params.value)
      if (isNaN(seconds) || seconds < 0 || seconds > 59) {
        return res.status(400).json({
          success: false,
          error: 'Seconds must be between 0 and 59'
        })
      }
      const result = this.setSeconds(seconds)
      res.json(result)
    })
    
    // Quick Time Adjustments
    this.app.post('/api/timer/add-minute', (req, res) => {
      const result = this.addMinute()
      res.json(result)
    })
    
    this.app.post('/api/timer/subtract-minute', (req, res) => {
      const result = this.subtractMinute()
      res.json(result)
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
      const { cycles, duration } = req.body || {}
      const result = this.triggerFlash(cycles, duration)
      res.json(result)
    })
    
    // Sound Control Endpoints
    this.app.post('/api/sound/mute', (req, res) => {
      const result = this.muteSound()
      res.json(result)
    })
    
    this.app.post('/api/sound/unmute', (req, res) => {
      const result = this.unmuteSound()
      res.json(result)
    })
    
    this.app.post('/api/sound/toggle', (req, res) => {
      const result = this.toggleSound()
      res.json(result)
    })
    
    // Display Control Endpoints
    this.app.post('/api/display/toggle-feature-image', (req, res) => {
      const result = this.toggleFeatureImage()
      res.json(result)
    })
    
    this.app.post('/api/display/feature-image', (req, res) => {
      const { enabled } = req.body
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'enabled must be a boolean value'
        })
      }
      const result = this.setFeatureImage(enabled)
      res.json(result)
    })
    
    this.app.post('/api/display/flash', (req, res) => {
      const { cycles, duration } = req.body || {}
      const result = this.triggerFlash(cycles, duration)
      res.json(result)
    })
    
    // Layout Management Endpoints
    this.app.get('/api/layouts', async (req, res) => {
      const result = await this.getLayouts()
      res.json(result)
    })
    
    this.app.post('/api/layout', async (req, res) => {
      const { layoutId } = req.body
      if (!layoutId || typeof layoutId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'layoutId is required and must be a string'
        })
      }
      const result = await this.setLayout(layoutId)
      if (!result.success) {
        return res.status(400).json(result)
      }
      res.json(result)
    })
    
    // Message Overlay Endpoints
    this.app.post('/api/message', (req, res) => {
      const { text, duration } = req.body
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'text is required and must be a string'
        })
      }
      const result = this.sendMessage(text, duration)
      res.json(result)
    })

    this.app.post('/api/message/set-text', (req, res) => {
      const { text } = req.body
      if (typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'text is required and must be a string'
        })
      }
      const result = this.setMessageText(text)
      res.json(result)
    })
    
    this.app.post('/api/message/show', (req, res) => {
      const { text } = req.body
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'text is required and must be a string'
        })
      }
      const result = this.sendMessage(text)
      res.json(result)
    })
    
    this.app.post('/api/message/hide', (req, res) => {
      const result = this.hideMessage()
      res.json(result)
    })
    
    this.app.post('/api/message/toggle', (req, res) => {
      const result = this.toggleMessage()
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
          formatted_elapsed: state.formattedElapsed,
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
      // Normalize args: wrap plain values as typed OSC args (metadata: true mode)
      const typedArgs = args.map(a => {
        if (a !== null && typeof a === 'object' && 'type' in a) return a
        if (typeof a === 'string') return { type: 's', value: a }
        if (typeof a === 'number' && Number.isInteger(a)) return { type: 'i', value: a }
        if (typeof a === 'number') return { type: 'f', value: a }
        return { type: 'i', value: Number(a) || 0 }
      })
      this.servers.osc.send({
        address,
        args: typedArgs
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
  
  setHours(hours) {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'set-hours',
        data: { hours }
      })
      
      console.log(`🕐 Set hours command sent: ${hours}`)
      const result = { success: true, message: `Hours set to ${hours}`, data: { hours } }
      
      this.broadcastToAll('time-component-set', { component: 'hours', value: hours })
      
      return result
    } catch (error) {
      console.error('🚨 Set hours error:', error)
      return { success: false, error: error.message }
    }
  }
  
  setMinutes(minutes) {
    try {
      this.mainWindow.webContents.send('api-command',{
        action: 'set-minutes',
        data: { minutes }
      })
      
      console.log(`🕐 Set minutes command sent: ${minutes}`)
      const result = { success: true, message: `Minutes set to ${minutes}`, data: { minutes } }
      
      this.broadcastToAll('time-component-set', { component: 'minutes', value: minutes })
      
      return result
    } catch (error) {
      console.error('🚨 Set minutes error:', error)
      return { success: false, error: error.message }
    }
  }
  
  setSeconds(seconds) {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'set-seconds',
        data: { seconds }
      })
      
      console.log(`🕐 Set seconds command sent: ${seconds}`)
      const result = { success: true, message: `Seconds set to ${seconds}`, data: { seconds } }
      
      this.broadcastToAll('time-component-set', { component: 'seconds', value: seconds })
      
      return result
    } catch (error) {
      console.error('🚨 Set seconds error:', error)
      return { success: false, error: error.message }
    }
  }
  
  addMinute() {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'add-minute'
      })
      
      console.log('⏱️ Add minute command sent')
      const result = { success: true, message: 'Added 1 minute', data: { adjustment: 60 } }
      
      this.broadcastToAll('time-adjusted', { adjustment: 60 })
      
      return result
    } catch (error) {
      console.error('🚨 Add minute error:', error)
      return { success: false, error: error.message }
    }
  }
  
  subtractMinute() {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'subtract-minute'
      })
      
      console.log('⏱️ Subtract minute command sent')
      const result = { success: true, message: 'Subtracted 1 minute', data: { adjustment: -60 } }
      
      this.broadcastToAll('time-adjusted', { adjustment: -60 })
      
      return result
    } catch (error) {
      console.error('🚨 Subtract minute error:', error)
      return { success: false, error: error.message }
    }
  }
  
  muteSound() {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'mute-sound'
      })
      
      console.log('🔇 Mute sound command sent')
      const result = { success: true, message: 'Sound muted' }
      
      this.broadcastToAll('sound-muted', { soundMuted: true })
      
      return result
    } catch (error) {
      console.error('🚨 Mute sound error:', error)
      return { success: false, error: error.message }
    }
  }
  
  unmuteSound() {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'unmute-sound'
      })
      
      console.log('🔊 Unmute sound command sent')
      const result = { success: true, message: 'Sound unmuted' }
      
      this.broadcastToAll('sound-unmuted', { soundMuted: false })
      
      return result
    } catch (error) {
      console.error('🚨 Unmute sound error:', error)
      return { success: false, error: error.message }
    }
  }
  
  toggleSound() {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'toggle-sound'
      })
      
      console.log('🔊 Toggle sound command sent')
      const result = { success: true, message: 'Sound toggled' }
      
      this.broadcastToAll('sound-toggled', {})
      
      return result
    } catch (error) {
      console.error('🚨 Toggle sound error:', error)
      return { success: false, error: error.message }
    }
  }
  
  toggleFeatureImage() {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'toggle-feature-image'
      })
      
      console.log('🖼️ Toggle feature image command sent')
      const result = { success: true, message: 'Feature image toggled' }
      
      this.broadcastToAll('feature-image-toggled', {})
      
      return result
    } catch (error) {
      console.error('🚨 Toggle feature image error:', error)
      return { success: false, error: error.message }
    }
  }
  
  setFeatureImage(enabled) {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'set-feature-image',
        data: { enabled }
      })
      
      console.log(`🖼️ Set feature image command sent: ${enabled ? 'enabled' : 'disabled'}`)
      const result = { success: true, message: `Feature image ${enabled ? 'enabled' : 'disabled'}`, data: { enabled } }
      
      this.broadcastToAll('feature-image-set', { enabled })
      
      return result
    } catch (error) {
      console.error('🚨 Set feature image error:', error)
      return { success: false, error: error.message }
    }
  }
  
  async getLayouts() {
    try {
      // Query LayoutRegistry in the renderer process for all layouts (built-in + custom)
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        const layouts = await this.mainWindow.webContents.executeJavaScript(
          `window.LayoutRegistry ? window.LayoutRegistry.getAllLayouts() : []`
        )
        return {
          success: true,
          data: layouts
        }
      }

      // Fallback if renderer is not available
      return {
        success: true,
        data: [
          { id: 'classic', name: 'Classic', type: 'builtin' },
          { id: 'minimal', name: 'Minimal', type: 'builtin' },
          { id: 'modern', name: 'Modern', type: 'builtin' },
          { id: 'compact', name: 'Compact', type: 'builtin' },
          { id: 'video', name: 'Video', type: 'builtin' }
        ]
      }
    } catch (error) {
      console.error('🚨 Get layouts error:', error)
      return { success: false, error: error.message }
    }
  }
  
  async setLayout(layoutId) {
    try {
      // Validate layout exists via LayoutRegistry in the renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        const exists = await this.mainWindow.webContents.executeJavaScript(
          `window.LayoutRegistry ? window.LayoutRegistry.hasLayout(${JSON.stringify(layoutId)}) : false`
        )
        if (!exists) {
          return { success: false, error: `Layout '${layoutId}' not found` }
        }
      }

      this.mainWindow.webContents.send('api-command', {
        action: 'change-layout',
        data: { layout: layoutId }
      })
      
      console.log(`🎨 Set layout command sent: ${layoutId}`)
      const result = { success: true, message: `Layout changed to ${layoutId}`, data: { layoutId } }
      
      this.broadcastToAll('layout-changed', { layoutId })
      
      return result
    } catch (error) {
      console.error('🚨 Set layout error:', error)
      return { success: false, error: error.message }
    }
  }
  
  sendMessage(text, duration) {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'set-message',
        data: { message: text, duration }
      })
      
      console.log(`💬 Send message command sent: "${text}" (${duration || 'no timeout'}ms)`)
      const result = { success: true, message: 'Message sent', data: { text, duration } }
      
      this.broadcastToAll('message-sent', { text, duration })
      
      return result
    } catch (error) {
      console.error('🚨 Send message error:', error)
      return { success: false, error: error.message }
    }
  }

  setMessageText(text) {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'set-message-text',
        data: { message: text }
      })

      console.log(`💬 Set message text command sent: "${text}"`)

      // Keep API state in sync even when message visibility does not change.
      this.timerState = {
        ...this.timerState,
        message: {
          ...(this.timerState.message || {}),
          text
        }
      }

      this.broadcastToAll('timer-update', this.getFormattedTimerState())

      return { success: true, message: 'Message text set', data: { text } }
    } catch (error) {
      console.error('🚨 Set message text error:', error)
      return { success: false, error: error.message }
    }
  }
  
  hideMessage() {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'hide-message'
      })
      
      console.log('💬 Hide message command sent')
      const result = { success: true, message: 'Message hidden' }
      
      this.broadcastToAll('message-hidden', {})
      
      return result
    } catch (error) {
      console.error('🚨 Hide message error:', error)
      return { success: false, error: error.message }
    }
  }
  
  toggleMessage() {
    try {
      this.mainWindow.webContents.send('api-command', {
        action: 'toggle-message'
      })
      
      console.log('💬 Toggle message command sent')
      const result = { success: true, message: 'Message toggled' }
      
      this.broadcastToAll('message-toggled', {})
      
      return result
    } catch (error) {
      console.error('🚨 Toggle message error:', error)
      return { success: false, error: error.message }
    }
  }
  
  updateTimerState(newState) {
    // Update internal state from renderer
    this.timerState = { ...this.timerState, ...newState }
    
    // Broadcast updates to all connected clients (WebSocket, OSC)
    const formattedState = this.getFormattedTimerState()
    this.broadcastToAll('timer-update', formattedState)
    
    // Send only warning color info back to renderer (avoid sending time/progress to prevent jitter)
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('api-timer-state-update', {
        warningLevel: formattedState.warningLevel,
        warningColor: formattedState.warningColor,
      })
    }
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
    const message = this.timerState.message || {}
    const coverImage = this.timerState.coverImage || {}
    // appState sends values in milliseconds - convert to seconds
    const rawTotal = timer.totalTime || 0
    const rawRemaining = timer.remainingTime || 0
    const totalTime = rawTotal > 86400 ? Math.floor(rawTotal / 1000) : rawTotal
    const remainingTime = rawRemaining > 86400 ? Math.floor(rawRemaining / 1000) : rawRemaining
    // Use real elapsed time from renderer when available (unaffected by time adjustments)
    const elapsedTime = typeof timer.elapsedTime === 'number' && timer.elapsedTime >= 0
      ? timer.elapsedTime
      : Math.max(0, totalTime - remainingTime)
    // Progress bar: use remainingTime/totalTime (matches canvas calculation)
    // This correctly updates when time is adjusted via add/subtract buttons
    const remainingPercentage = totalTime > 0 ? Math.max(0, Math.min(100, (remainingTime / totalTime) * 100)) : 100
    const elapsedPercentage = Math.max(0, 100 - remainingPercentage)
    
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
      endTimeFormatted: timer.endTimeFormatted || '--:--:--',
      warningLevel: warningLevel,
      warningColor: warningColor,
      formattedTime: timer.formattedTime || '00:00:00',
      formattedElapsed: this.formatTime(elapsedTime),
      percentage: Math.max(0, Math.min(100, elapsedPercentage)),
      remainingPercentage: Math.max(0, Math.min(100, remainingPercentage)),
      isOvertime: remainingTime < 0,
      messageVisible: message.visible === true,
      messageText: typeof message.text === 'string' ? message.text : '',
      featureImageEnabled: coverImage.enabled === true,
      soundMuted: this.timerState.settings?.soundEnabled === false,
      timestamp: Date.now()
    }
  }
  
  formatTime(seconds) {
    const isNegative = seconds < 0
    const absSeconds = Math.abs(seconds)
    const hours = Math.floor(absSeconds / 3600)
    const minutes = Math.floor((absSeconds % 3600) / 60)
    const secs = Math.floor(absSeconds % 60)
    
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    
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
      title: 'Rocket Timer Unified API',
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
            'POST /timer/adjust': 'Adjust time (body: {seconds: number, minutes: number})',
            'POST /timer/set-time': 'Set total time (body: {totalSeconds: number} or {hours, minutes, seconds})',
            'POST /timer/hours/:value': 'Set hours component (0-99)',
            'POST /timer/minutes/:value': 'Set minutes component (0-59)',
            'POST /timer/seconds/:value': 'Set seconds component (0-59)',
            'POST /timer/add-minute': 'Add 1 minute to timer',
            'POST /timer/subtract-minute': 'Subtract 1 minute from timer',
            'POST /timer/flash': 'Trigger flash effect (body: {cycles: number, duration: number})',
            'GET /presets': 'Get all presets',
            'POST /presets': 'Create preset (body: {name, duration, category})',
            'POST /presets/:id/load': 'Load preset by ID',
            'GET /settings': 'Get settings',
            'PUT /settings': 'Update settings (body: settings object)',
            'POST /sound/mute': 'Mute sound',
            'POST /sound/unmute': 'Unmute sound',
            'POST /sound/toggle': 'Toggle sound mute state',
            'POST /display/toggle-feature-image': 'Toggle background/feature image',
            'POST /display/feature-image': 'Set feature image state (body: {enabled: boolean})',
            'POST /display/flash': 'Trigger flash effect (same as /timer/flash)',
            'GET /layouts': 'Get available layouts',
            'POST /layout': 'Change layout (body: {layoutId: string})',
            'POST /message': 'Send message overlay (body: {text: string, duration?: number})',
            'POST /message/set-text': 'Set message text only (body: {text: string})',
            'POST /message/show': 'Show message (body: {text: string})',
            'POST /message/hide': 'Hide message overlay',
            'POST /message/toggle': 'Toggle message visibility',
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