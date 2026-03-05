/**
 * High-Resolution Precision Timer
 * Provides drift-compensated timing for accurate countdown operations
 * Updates every 100ms with sub-millisecond accuracy
 */

export class PrecisionTimer {
  constructor(callback, interval = 100) {
    this.callback = callback
    this.interval = interval
    this.timeout = null
    this.startTime = 0
    this.expectedTime = 0
    this.drift = 0
    this.isRunning = false
  }

  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.startTime = performance.now()
    this.expectedTime = this.startTime + this.interval
    this.drift = 0
    
    // Schedule first tick instead of calling immediately
    // This prevents the timer from decrementing before the display updates
    this.timeout = setTimeout(() => this.tick(), this.interval)
  }

  tick() {
    if (!this.isRunning) return

    const now = performance.now()
    this.drift = now - this.expectedTime

    // Execute callback
    try {
      this.callback()
    } catch (error) {
      console.error('Timer callback error:', error)
    }

    // Calculate next expected time
    this.expectedTime += this.interval

    // Compensate for drift - ensure we don't go below 1ms
    const nextInterval = Math.max(1, this.interval - this.drift)
    
    // Log only significant drift compensation
    if (Math.abs(this.drift) > 50) {
      console.log(`⏱️ Significant drift: ${this.drift.toFixed(2)}ms`)
    }

    this.timeout = setTimeout(() => this.tick(), nextInterval)
  }

  stop() {
    if (!this.isRunning) return
    
    this.isRunning = false
    
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  pause() {
    this.stop()
  }

  resume() {
    if (this.isRunning) return
    
    this.start()
  }

  getDrift() {
    return this.drift
  }

  getRuntime() {
    if (!this.isRunning) return 0
    return performance.now() - this.startTime
  }

  isActive() {
    return this.isRunning
  }
}

export default PrecisionTimer