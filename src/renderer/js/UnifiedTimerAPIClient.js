/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Unified Timer API Client
 * Client-side library for connecting to the Countdown Timer API
 * Supports REST, WebSocket, and OSC protocols
 * /
 */
class UnifiedTimerAPIClient {
  constructor(options = {}) {
    this.options = {
      restBaseUrl: options.restBaseUrl || 'http://localhost:9999/api',
      wsUrl: options.wsUrl || 'ws://localhost:8080',
      oscPort: options.oscPort || 7000,
      autoConnect: options.autoConnect !== false,
      reconnectInterval: options.reconnectInterval || 5000,
      ...options
    }
    
    this.ws = null
    this.wsConnected = false
    this.wsReconnectTimer = null
    this.eventListeners = new Map()
    
    if (this.options.autoConnect) {
      this.connectWebSocket()
    }
  }
  
  // ===== EVENT HANDLING =====
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event).add(callback)
  }
  
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback)
    }
  }
  
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Event callback error for ${event}:`, error)
        }
      })
    }
  }
  
  // ===== REST API METHODS =====
  async makeRESTRequest(endpoint, options = {}) {
    const url = `${this.options.restBaseUrl}${endpoint}`
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }
    
    if (options.body && typeof options.body === 'object') {
      requestOptions.body = JSON.stringify(options.body)
    }
    
    try {
      const response = await fetch(url, requestOptions)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }
      
      return data
    } catch (error) {
      console.error(`REST API Error (${endpoint}):`, error)
      throw error
    }
  }
  
  // Timer Control Methods
  async startTimer() {
    return await this.makeRESTRequest('/timer/start', { method: 'POST' })
  }
  
  async stopTimer() {
    return await this.makeRESTRequest('/timer/stop', { method: 'POST' })
  }
  
  async pauseTimer() {
    return await this.makeRESTRequest('/timer/pause', { method: 'POST' })
  }
  
  async resumeTimer() {
    return await this.makeRESTRequest('/timer/resume', { method: 'POST' })
  }
  
  async resetTimer() {
    return await this.makeRESTRequest('/timer/reset', { method: 'POST' })
  }
  
  // Time Management Methods
  async adjustTime(seconds) {
    return await this.makeRESTRequest('/timer/adjust', {
      method: 'POST',
      body: { seconds }
    })
  }
  
  async setTime(totalSeconds) {
    return await this.makeRESTRequest('/timer/set-time', {
      method: 'POST',
      body: { totalSeconds }
    })
  }
  
  async setTimeFromMinutes(minutes) {
    return await this.setTime(minutes * 60)
  }
  
  async setTimeFromHMS(hours, minutes, seconds) {
    return await this.setTime((hours * 3600) + (minutes * 60) + seconds)
  }
  
  // State Methods
  async getTimerState() {
    return await this.makeRESTRequest('/timer/state')
  }
  
  async getTimerStateLegacy() {
    return await this.makeRESTRequest('/timer')
  }
  
  // Preset Methods
  async getPresets() {
    return await this.makeRESTRequest('/presets')
  }
  
  async createPreset(name, duration, category = 'custom', settings = {}) {
    return await this.makeRESTRequest('/presets', {
      method: 'POST',
      body: { name, duration, category, settings }
    })
  }
  
  async loadPreset(presetId) {
    return await this.makeRESTRequest(`/presets/${presetId}/load`, { method: 'POST' })
  }
  
  // Settings Methods
  async getSettings() {
    return await this.makeRESTRequest('/settings')
  }
  
  async updateSettings(settings) {
    return await this.makeRESTRequest('/settings', {
      method: 'PUT',
      body: settings
    })
  }
  
  // Flash Effect
  async triggerFlash(cycles = 3, duration = 500) {
    return await this.makeRESTRequest('/timer/flash', {
      method: 'POST',
      body: { cycles, duration }
    })
  }
  
  // Health Check
  async getHealth() {
    return await this.makeRESTRequest('/health')
  }
  
  async getAPIDocumentation() {
    return await this.makeRESTRequest('/')
  }
  
  // ===== WEBSOCKET METHODS =====
  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.wsUrl)
        
        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected to timer API')
          this.wsConnected = true
          this.clearReconnectTimer()
          this.emit('connected')
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleWebSocketMessage(message)
          } catch (error) {
            console.error('WebSocket message parse error:', error)
          }
        }
        
        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected from timer API')
          this.wsConnected = false
          this.emit('disconnected')
          
          if (this.options.autoReconnect !== false) {
            this.scheduleReconnect()
          }
        }
        
        this.ws.onerror = (error) => {
          console.error('🚨 WebSocket error:', error)
          this.emit('error', error)
          reject(error)
        }
      } catch (error) {
        console.error('🚨 WebSocket connection error:', error)
        reject(error)
      }
    })
  }
  
  disconnectWebSocket() {
    this.clearReconnectTimer()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.wsConnected = false
  }
  
  scheduleReconnect() {
    this.clearReconnectTimer()
    this.wsReconnectTimer = setTimeout(() => {
      console.log('🔄 Attempting to reconnect WebSocket...')
      this.connectWebSocket()
    }, this.options.reconnectInterval)
  }
  
  clearReconnectTimer() {
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer)
      this.wsReconnectTimer = null
    }
  }
  
  handleWebSocketMessage(message) {
    const { type, data, result, originalCommand, timestamp } = message
    
    // Emit the specific message type
    this.emit(type, { data, result, originalCommand, timestamp })
    
    // Handle specific message types
    switch (type) {
      case 'connection-established':
        this.emit('timer-state', data)
        break
        
      case 'timer-update':
        this.emit('timer-state', data)
        break
        
      case 'command-response':
        this.emit('command-response', { originalCommand, result, timestamp })
        break
        
      default:
        // Generic event emission
        this.emit('message', message)
    }
  }
  
  // WebSocket Command Methods
  sendWebSocketCommand(type, data = {}) {
    if (!this.wsConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }
    
    const command = { type, data, timestamp: Date.now() }
    this.ws.send(JSON.stringify(command))
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'))
      }, 5000)
      
      const responseHandler = (response) => {
        if (response.originalCommand === type) {
          clearTimeout(timeout)
          this.off('command-response', responseHandler)
          
          if (response.result.success) {
            resolve(response.result)
          } else {
            reject(new Error(response.result.error))
          }
        }
      }
      
      this.on('command-response', responseHandler)
    })
  }
  
  // WebSocket Timer Control
  async wsStartTimer() {
    return await this.sendWebSocketCommand('timer-start')
  }
  
  async wsStopTimer() {
    return await this.sendWebSocketCommand('timer-stop')
  }
  
  async wsPauseTimer() {
    return await this.sendWebSocketCommand('timer-pause')
  }
  
  async wsResumeTimer() {
    return await this.sendWebSocketCommand('timer-resume')
  }
  
  async wsResetTimer() {
    return await this.sendWebSocketCommand('timer-reset')
  }
  
  async wsAdjustTime(seconds) {
    return await this.sendWebSocketCommand('adjust-time', { seconds })
  }
  
  async wsSetTime(totalSeconds) {
    return await this.sendWebSocketCommand('set-time', { totalSeconds })
  }
  
  async wsLoadPreset(presetId) {
    return await this.sendWebSocketCommand('load-preset', { presetId })
  }
  
  async wsGetState() {
    return await this.sendWebSocketCommand('get-state')
  }
  
  async wsTriggerFlash(cycles = 3, duration = 500) {
    return await this.sendWebSocketCommand('trigger-flash', { cycles, duration })
  }
  
  async wsPing() {
    return await this.sendWebSocketCommand('ping')
  }
  
  // ===== UTILITY METHODS =====
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
  
  parseTimeString(timeStr) {
    // Parse formats like "1:30:45", "30:45", "45"
    const parts = timeStr.split(':').map(p => parseInt(p, 10))
    
    if (parts.length === 1) {
      return parts[0] // seconds only
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1] // minutes:seconds
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2] // hours:minutes:seconds
    }
    
    throw new Error('Invalid time format')
  }
  
  // Convenience Methods (choose protocol automatically)
  async start() {
    return this.wsConnected ? await this.wsStartTimer() : await this.startTimer()
  }
  
  async stop() {
    return this.wsConnected ? await this.wsStopTimer() : await this.stopTimer()
  }
  
  async pause() {
    return this.wsConnected ? await this.wsPauseTimer() : await this.pauseTimer()
  }
  
  async resume() {
    return this.wsConnected ? await this.wsResumeTimer() : await this.resumeTimer()
  }
  
  async reset() {
    return this.wsConnected ? await this.wsResetTimer() : await this.resetTimer()
  }
  
  async adjust(seconds) {
    return this.wsConnected ? await this.wsAdjustTime(seconds) : await this.adjustTime(seconds)
  }
  
  async setTimer(totalSeconds) {
    return this.wsConnected ? await this.wsSetTime(totalSeconds) : await this.setTime(totalSeconds)
  }
  
  async getState() {
    return this.wsConnected ? await this.wsGetState() : await this.getTimerState()
  }
  
  // Lifecycle
  destroy() {
    this.disconnectWebSocket()
    this.eventListeners.clear()
  }
  
  // Status
  isConnected() {
    return this.wsConnected
  }
  
  getConnectionStatus() {
    return {
      websocket: this.wsConnected,
      rest: true, // REST is always available if server is running
      config: this.options
    }
  }
}

// Static factory methods
UnifiedTimerAPIClient.createRESTClient = (baseUrl) => {
  return new UnifiedTimerAPIClient({
    restBaseUrl: baseUrl,
    autoConnect: false
  })
}

UnifiedTimerAPIClient.createWebSocketClient = (wsUrl) => {
  return new UnifiedTimerAPIClient({
    wsUrl: wsUrl,
    autoConnect: true
  })
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UnifiedTimerAPIClient }
} else if (typeof window !== 'undefined') {
  window.UnifiedTimerAPIClient = UnifiedTimerAPIClient
}