/**
 * Unified Canvas Renderer - Single render process for multiple outputs
 * Eliminates duplicate rendering between preview canvas and external display
 * Provides 50% performance improvement and perfect synchronization
 */

import VideoInputManager from './videoInputManager.js';

class UnifiedCanvasRenderer {
  constructor(width = 1920, height = 1080) {
    this.width = width;
    this.height = height;
    
    // Master canvas - where actual rendering happens
    this.masterCanvas = document.createElement('canvas');
    this.masterCanvas.width = width;
    this.masterCanvas.height = height;
    this.ctx = this.masterCanvas.getContext('2d');
    
    // Output targets
    this.outputs = new Map();
    
    // Rendering state - mirrors the current timer state
    this.state = {
      countdown: '00:00:00',
      clock: '--:--:--',
      message: '',
      progress: 100,
      elapsed: '00:00:00',
      endTime: '--:--:--',
      showClock: true,
      showMessage: false,
      theme: 'dark',
      running: false,
      paused: false
    };
    
    // Progress animation state for smooth interpolation
    this.progressAnimation = {
      current: 100,      // Current animated value
      target: 100,       // Target value to animate towards
      smoothing: 0.2     // Smoothing factor (0-1, higher = faster response)
    };
    
    // Layout configuration
    this.layout = this.getDefaultLayout();
    
    // Video Input Manager (for HDMI capture cards)
    this.videoInputManager = null;
    this.videoMirror = false; // Mirror/flip video horizontally
    this.videoScaling = 'contain'; // contain, cover, stretch, none
    
    // Cover Image (highest z-index overlay)
    this.coverImage = {
      enabled: false,
      image: null,
      path: '',
      targetOpacity: 1.0,
      currentOpacity: 0.0,
      fadeSpeed: 0.05 // Fade increment per frame
    };
    
    // Background Image (low z-index, above background color)
    this.backgroundImage = {
      enabled: false,
      image: null,
      path: '',
      opacity: 1.0
    };
    
    // Flash Overlay
    this.flashOverlay = {
      active: false,
      opacity: 0
    };
    
    // Watermark
    this.watermark = {
      enabled: true,
      image: null,
      opacity: 0.5
    };
    this._loadWatermarkImage();
    
    // Performance settings
    this.performanceSettings = {
      frameRate: 60,
      canvasQuality: 'high',
      reduceMotion: false,
      lowPowerMode: false
    };
    
    // Timer threshold settings
    this.timerThresholds = {
      type: 'percentage', // 'percentage' or 'time'
      warningPercentage: 30,
      criticalPercentage: 5,
      warningTimeSeconds: 120, // 2 minutes
      criticalTimeSeconds: 30  // 30 seconds
    };
    
    // Rendering control
    this.isRendering = false;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.performanceSettings.frameRate;
    this.animationId = null;
    
    // Performance monitoring
    this.renderTimes = [];
    this.frameTimes = []; // Track actual frame timestamps for FPS calculation
    this.maxRenderTimes = 60;
    this.maxFrameTimes = 60;
    this.droppedFrames = 0;
    this.fpsUpdateTime = 0;
    this.actualFPS = 0;
    
    // Adaptive performance
    this.adaptiveFrameRate = this.performanceSettings.frameRate;
    this.isPageVisible = !document.hidden;
    this.displayRefreshRate = 60; // Will be detected
    this.effectiveMaxFPS = 60; // Display-limited max FPS
    
    // Performance caches
    this.textMetricsCache = new Map();
    this.imageCache = new Map();
    this.styleCacheDirty = false;
    
    // Cached CSS variables for performance
    this.styles = {};
    this.updateStyleCache();
    
    // Setup visibility change listener for throttling
    this.setupVisibilityListener();
    
    // Setup canvas stream for external display
    this.setupStream();
    
    // Load performance settings
    this.loadPerformanceSettings();
    
    // Detect display refresh rate
    this.detectDisplayRefreshRate();
    
    console.log('🎬 UnifiedCanvasRenderer initialized');
  }
  
  /**
   * Get default layout configuration
   */
  getDefaultLayout() {
    return {
      name: "Classic",
      description: "Traditional centered layout",
      resolution: { width: 1920, height: 1080 },
      progressBar: {
        enabled: true,
        position: { x: 0.1, y: 0.1 },
        size: { width: 0.8, height: 0.04 },
        cornerRadius: 25
      },
      countdown: {
        enabled: true,
        position: { x: 0.5, y: 0.45 },
        fontSize: 200,
        alignment: "center"
      },
      clock: {
        enabled: true,
        position: { x: 0.5, y: 0.6 },
        fontSize: 60,
        alignment: "center"
      },
      elapsed: {
        enabled: false,
        position: { x: 0.25, y: 0.15 },
        fontSize: 40,
        alignment: "center"
      },
      separator: {
        enabled: true,
        position: { y: 0.75 },
        width: 0.9,
        thickness: 3,
        orientation: "horizontal"
      },
      message: {
        enabled: true,
        position: { x: 0.5, y: 0.85 },
        fontSize: 70,
        alignment: "center",
        maxLines: 2,
        lineHeight: 1.3
      }
    };
  }
  
  /**
   * Add an output canvas that will receive the rendered content
   */
  addOutput(id, canvas, options = {}) {
    const output = {
      canvas: canvas,
      context: canvas.getContext('2d'),
      scale: options.scale || 1,
      enabled: options.enabled !== false,
      cropArea: options.cropArea || null, // {x, y, width, height}
      transform: options.transform || null, // Custom transformation function
      aspectRatio: options.aspectRatio || (16/9) // For proper scaling
    };
    
    this.outputs.set(id, output);
    console.log(`📺 Added canvas output: ${id} (scale: ${output.scale})`);
    
    // Setup the output canvas dimensions
    this.setupOutputCanvas(output);
    
    return output;
  }
  
  /**
   * Setup output canvas dimensions maintaining aspect ratio
   */
  setupOutputCanvas(output) {
    const { canvas } = output;

    // Check if this is a fullscreen display (body is parent)
    const isFullscreen = canvas.parentElement?.tagName === 'BODY';

    // Set internal resolution (high quality rendering)
    canvas.width = this.width;
    canvas.height = this.height;

    if (isFullscreen) {
      // Fullscreen mode - maintain aspect ratio with letterboxing
      // object-fit doesn't work on <canvas>, so we calculate dimensions manually
      const canvasAspect = this.width / this.height;

      const resizeCanvas = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const viewportAspect = vw / vh;

        let cssWidth, cssHeight;
        if (viewportAspect > canvasAspect) {
          // Viewport is wider — fit to height, letterbox sides
          cssHeight = vh;
          cssWidth = vh * canvasAspect;
        } else {
          // Viewport is taller — fit to width, letterbox top/bottom
          cssWidth = vw;
          cssHeight = vw / canvasAspect;
        }

        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    } else {
      // Preview mode - let CSS handle sizing with aspect ratio
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.maxHeight = '100%';
      canvas.style.display = 'block';
    }
  }
  
  /**
   * Remove an output canvas
   */
  removeOutput(id) {
    if (this.outputs.delete(id)) {
      console.log(`📺 Removed canvas output: ${id}`);
    }
  }
  
  /**
   * Enable/disable a specific output
   */
  setOutputEnabled(id, enabled) {
    const output = this.outputs.get(id);
    if (output) {
      output.enabled = enabled;
      console.log(`📺 Output ${id}: ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
  
  /**
   * Set the layout for rendering
   */
  setLayout(layout) {
    this.layout = layout;
    console.log(`🎨 Layout set: ${layout.name}`);
    
    // Force immediate render to show layout change
    if (this.isRendering) {
      this.renderFrame();
      this.distributeToOutputs();
    }
  }
  
  /**
   * Update renderer state
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    
    // Update progress animation target when progress changes
    if (newState.progress !== undefined) {
      this.progressAnimation.target = newState.progress;
    }
    
    // Force immediate render for important state changes
    if (this.isRendering && (newState.countdown || newState.progress !== undefined)) {
      this.renderFrame();
      this.distributeToOutputs();
    }
  }
  
  /**
   * Setup canvas stream for external display
   */
  /**
   * Setup visibility change listener for intelligent throttling
   */
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;
      
      if (!this.isPageVisible) {
        // Throttle to 5fps when tab is hidden
        this.frameInterval = 1000 / 5;
        console.log('📉 Page hidden: throttled to 5fps');
      } else {
        // Restore normal frame rate
        this.frameInterval = 1000 / this.adaptiveFrameRate;
        console.log(`📈 Page visible: restored to ${this.adaptiveFrameRate}fps`);
      }
    });
  }
  
  setupStream() {
    try {
      // Capture master canvas stream at 30fps
      this.stream = this.masterCanvas.captureStream(30);
      
      // Make stream available globally for external window
      window.canvasStream = this.stream;
      
      console.log('📡 Canvas stream created successfully');
    } catch (error) {
      console.error('Failed to create canvas stream:', error);
    }
  }
  
  /**
   * Start the render loop
   */
  start() {
    if (this.isRendering) return;
    
    this.isRendering = true;
    this.lastFrameTime = performance.now();
    this.renderLoop();
    console.log(`🎬 Unified renderer started (${this.performanceSettings.frameRate}fps)`);
  }
  
  /**
   * Stop the render loop
   */
  stop() {
    this.isRendering = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    console.log('⏹️ Unified renderer stopped');
  }
  
  /**
   * Main render loop with proper frame rate limiting
   */
  renderLoop() {
    if (!this.isRendering) return;
    
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    
    // Only render if enough time has passed
    if (deltaTime >= this.frameInterval) {
      const renderStart = performance.now();
      
      // Render to master canvas
      this.renderFrame();
      
      // Distribute to all outputs
      this.distributeToOutputs();
      
      // Performance tracking
      const renderTime = performance.now() - renderStart;
      this.trackPerformance(renderTime);
      
      // Adaptive frame rate adjustment (only when page is visible)
      if (this.isPageVisible && !this.performanceSettings.lowPowerMode) {
        if (renderTime > this.frameInterval * 0.8) {
          // Render is taking too long, reduce target fps
          this.adaptiveFrameRate = Math.max(30, this.performanceSettings.frameRate - 10);
          this.frameInterval = 1000 / this.adaptiveFrameRate;
          this.droppedFrames++;
        } else if (renderTime < this.frameInterval * 0.3 && this.adaptiveFrameRate < this.performanceSettings.frameRate) {
          // Lots of headroom, can increase fps back toward target
          this.adaptiveFrameRate = Math.min(this.performanceSettings.frameRate, this.adaptiveFrameRate + 5);
          this.frameInterval = 1000 / this.adaptiveFrameRate;
        }
      }
      
      // Update frame time - use interval increment to avoid drift
      // If we're too far behind (>2 frames), reset to current time
      if (deltaTime > this.frameInterval * 2) {
        this.lastFrameTime = now;
      } else {
        this.lastFrameTime += this.frameInterval;
      }
      
      this.frameCount++;
    }
    
    // Always schedule next frame - RAF will sync to display refresh rate
    // The deltaTime check above ensures we only render at target FPS
    this.animationId = requestAnimationFrame(() => this.renderLoop());
  }
  
  /**
   * Render a single frame to the master canvas
   * Uses layer ordering (zIndex) to control render order
   */
  renderFrame() {
    if (!this.layout) return;
    
    // Update smooth progress animation
    this.updateProgressAnimation();
    
    const { width, height } = this.masterCanvas;
    
    // Clear canvas with theme-appropriate background
    this.clearCanvas();
    
    // Build render queue with all elements and their z-index
    const renderQueue = [];
    
    // Video frame (zIndex: 0) - supports both videoFrame and video properties
    const videoConfig = this.layout.videoFrame || this.layout.video;
    if (videoConfig && videoConfig.enabled) {
      renderQueue.push({
        zIndex: videoConfig.zIndex || 0,
        draw: () => this.drawVideoFrame()
      });
    }
    
    // Background image (zIndex: 1 - just above background color)
    if (this.backgroundImage.enabled && this.backgroundImage.image) {
      renderQueue.push({
        zIndex: 1,
        draw: () => this.drawBackgroundImage()
      });
    }
    
    // Cover image (zIndex: 100 - highest, covers everything)
    if (this.coverImage.enabled && this.coverImage.image) {
      renderQueue.push({
        zIndex: 100,
        draw: () => this.drawCoverImage()
      });
    }
    
    // Flash overlay (zIndex: 10)
    if (this.flashOverlay.active && this.flashOverlay.opacity > 0) {
      renderQueue.push({
        zIndex: 10,
        draw: () => this.drawFlashOverlay()
      });
    }
    
    // Bottom info bar (zIndex: 15)
    if (this.layout.bottomBar && this.layout.bottomBar.enabled) {
      renderQueue.push({
        zIndex: this.layout.bottomBar.zIndex || 15,
        draw: () => this.drawBottomInfoBar()
      });
    }
    
    // Progress bar (zIndex: 20)
    if (this.layout.progressBar.enabled) {
      const pb = this.layout.progressBar;
      renderQueue.push({
        zIndex: pb.zIndex || 20,
        draw: () => {
          if (pb.type === 'circular') {
            const centerX = this.parsePosition(pb.position.x, 'x', width);
            const centerY = this.parsePosition(pb.position.y, 'y', height);
            // Radius derived from size (diameter), anchored to canvas height
            const diameter = this.parseSize(pb.size?.width || '83%', height);
            const radius = diameter / 2;
            this.drawCircularProgress(centerX, centerY, radius, pb.thickness, pb.startAngle || -90);
          } else {
            const x = this.parsePosition(pb.position.x, 'x', width);
            const y = this.parsePosition(pb.position.y, 'y', height);
            const barWidth = this.parseSize(pb.size.width, width);
            const barHeight = this.parseSize(pb.size.height, height);
            this.drawProgressBar(x, y, barWidth, barHeight, pb.cornerRadius);
          }
        }
      });
    }
    
    // Separator (zIndex: 30)
    if (this.layout.separator && this.layout.separator.enabled) {
      const sep = this.layout.separator;
      renderQueue.push({
        zIndex: sep.zIndex || 30,
        draw: () => {
          const sepY = this.parsePosition(sep.position.y, 'y', height);
          const sepWidth = this.parseSize(sep.width, width);
          const startX = (width - sepWidth) / 2;
          this.drawSeparator(startX, sepY, sepWidth, sep.thickness);
        }
      });
    }
    
    // Countdown (zIndex: 40)
    if (this.layout.countdown.enabled) {
      renderQueue.push({
        zIndex: this.layout.countdown.zIndex || 40,
        draw: () => {
          const countdownX = this.parsePosition(this.layout.countdown.position.x, 'x', width);
          const countdownY = this.parsePosition(this.layout.countdown.position.y, 'y', height);
          this.drawCountdown(countdownX, countdownY);
        }
      });
    }
    
    // Clock (zIndex: 50)
    if (this.state.showClock && this.layout.clock.enabled) {
      renderQueue.push({
        zIndex: this.layout.clock.zIndex || 50,
        draw: () => {
          const clockX = this.parsePosition(this.layout.clock.position.x, 'x', width);
          const clockY = this.parsePosition(this.layout.clock.position.y, 'y', height);
          this.drawClock(clockX, clockY);
        }
      });
    }
    
    // Elapsed time (zIndex: 60)
    if (this.layout.elapsed && this.layout.elapsed.enabled) {
      renderQueue.push({
        zIndex: this.layout.elapsed.zIndex || 60,
        draw: () => {
          const elapsedX = this.parsePosition(this.layout.elapsed.position.x, 'x', width);
          const elapsedY = this.parsePosition(this.layout.elapsed.position.y, 'y', height);
          this.drawElapsed(elapsedX, elapsedY);
        }
      });
    }
    
    // End time (zIndex: 70)
    if (this.layout.endTime && this.layout.endTime.enabled) {
      renderQueue.push({
        zIndex: this.layout.endTime.zIndex || 70,
        draw: () => {
          const endTimeX = this.parsePosition(this.layout.endTime.position.x, 'x', width);
          const endTimeY = this.parsePosition(this.layout.endTime.position.y, 'y', height);
          this.drawEndTime(endTimeX, endTimeY);
        }
      });
    }
    
    // Message (zIndex: 80)
    if (this.state.showMessage && this.state.message && this.layout.message && this.layout.message.enabled) {
      renderQueue.push({
        zIndex: this.layout.message.zIndex || 80,
        draw: () => {
          const msgX = this.parsePosition(this.layout.message.position.x, 'x', width);
          const msgY = this.parsePosition(this.layout.message.position.y, 'y', height);
          this.drawMessage(msgX, msgY);
        }
      });
    }
    
    // Watermark (zIndex: 5 - above background/video, below UI elements)
    if (this.watermark.enabled && this.watermark.image) {
      renderQueue.push({
        zIndex: 5,
        draw: () => this.drawWatermark()
      });
    }
    
    // Sort by zIndex (low to high = back to front)
    renderQueue.sort((a, b) => a.zIndex - b.zIndex);
    
    // Render all elements in order
    renderQueue.forEach(item => item.draw());
  }
  
  /**
   * Distribute master canvas content to all output canvases
   */
  distributeToOutputs() {
    this.outputs.forEach((output, id) => {
      if (!output.enabled) return;
      
      try {
        const { canvas, context, scale, cropArea, transform } = output;
        
        // Clear output canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        if (cropArea) {
          // Render cropped area
          context.drawImage(
            this.masterCanvas,
            cropArea.x, cropArea.y, cropArea.width, cropArea.height,
            0, 0, canvas.width, canvas.height
          );
        } else if (transform) {
          // Apply custom transformation
          transform(context, this.masterCanvas, canvas);
        } else {
          // Standard scaling
          context.drawImage(
            this.masterCanvas,
            0, 0, this.width, this.height,
            0, 0, canvas.width, canvas.height
          );
        }
      } catch (error) {
        console.error(`Error distributing to output ${id}:`, error);
      }
    });
  }

  // ============================================================================
  // DRAWING METHODS - Copied from original CanvasRenderer for consistency
  // ============================================================================
  
  /**
   * Update cached CSS variables
   */
  /**
   * Get cached text metrics (avoids expensive measureText calls)
   */
  getCachedTextMetrics(text, font) {
    const key = `${font}::${text}`;
    if (!this.textMetricsCache.has(key)) {
      this.ctx.font = font;
      this.textMetricsCache.set(key, this.ctx.measureText(text));
    }
    return this.textMetricsCache.get(key);
  }
  
  /**
   * Clear text metrics cache (call when font settings change)
   */
  clearTextMetricsCache() {
    this.textMetricsCache.clear();
  }
  
  /**
   * Clear image cache (useful for memory management)
   */
  clearImageCache() {
    this.imageCache.clear();
  }
  
  updateStyleCache() {
    const styles = getComputedStyle(document.documentElement);
    
    this.styles = {
      // Colors
      countdownColor: styles.getPropertyValue('--canvas-countdown-color').trim(),
      clockColor: styles.getPropertyValue('--canvas-clock-color').trim(),
      messageColor: styles.getPropertyValue('--canvas-message-color').trim(),
      messageBackgroundColor: styles.getPropertyValue('--canvas-message-background-color').trim(),
      progressBg: styles.getPropertyValue('--canvas-progress-bg').trim(),
      separatorColor: styles.getPropertyValue('--canvas-separator-color').trim(),  
      background: styles.getPropertyValue('--canvas-background').trim(),
      
      // Progress bar gradients
      progressSuccess: {
        start: styles.getPropertyValue('--canvas-progress-success-start').trim(),
        end: styles.getPropertyValue('--canvas-progress-success-end').trim()
      },
      progressWarning: {
        start: styles.getPropertyValue('--canvas-progress-warning-start').trim(),
        end: styles.getPropertyValue('--canvas-progress-warning-end').trim()
      },
      progressDanger: {
        start: styles.getPropertyValue('--canvas-progress-danger-start').trim(),
        end: styles.getPropertyValue('--canvas-progress-danger-end').trim()
      },
      progressOvertime: {
        start: styles.getPropertyValue('--canvas-progress-overtime-start').trim() || '#991b1b',
        end: styles.getPropertyValue('--canvas-progress-overtime-end').trim() || '#7f1d1d'
      },
      
      // Font settings
      fontFamily: styles.getPropertyValue('--canvas-font-family').trim(),
      countdownWeight: styles.getPropertyValue('--canvas-countdown-weight').trim(),
      clockWeight: styles.getPropertyValue('--canvas-clock-weight').trim(),
      messageWeight: styles.getPropertyValue('--canvas-message-weight').trim(),
      elapsedColor: styles.getPropertyValue('--canvas-elapsed-color').trim(),
      elapsedWeight: styles.getPropertyValue('--canvas-elapsed-weight').trim()
    };
  }

  /**
   * Parse position value (supports named positions, percentages, and decimals)
   */
  parsePosition(value, axis, dimension) {
    const namedPositions = {
      x: { 'left': 0, 'center': 0.5, 'right': 1 },
      y: { 'top': 0, 'middle': 0.5, 'bottom': 1 }
    };
    
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      
      if (namedPositions[axis] && namedPositions[axis][lowerValue] !== undefined) {
        return dimension * namedPositions[axis][lowerValue];
      }
      
      if (value.includes('%')) {
        const percent = parseFloat(value) / 100;
        return dimension * percent;
      }
      
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed >= 1 ? parsed : dimension * parsed;
      }
    }
    
    if (typeof value === 'number') {
      return value >= 1 ? value : dimension * value;
    }
    
    return dimension * 0.5;
  }

  /**
   * Parse size value (supports percentages and decimals)
   */
  parseSize(value, dimension) {
    if (typeof value === 'string' && value.includes('%')) {
      const percent = parseFloat(value) / 100;
      return dimension * percent;
    }
    
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    return numValue >= 1 ? numValue : dimension * numValue;
  }

  /**
   * Clear canvas with theme-appropriate background
   */
  clearCanvas() {
    this.ctx.fillStyle = this.styles.background;
    this.ctx.fillRect(0, 0, this.masterCanvas.width, this.masterCanvas.height);
  }

  /**
   * Update smooth progress animation using spring physics
   */
  updateProgressAnimation() {
    const diff = this.progressAnimation.target - this.progressAnimation.current;
    
    // If difference is very small, snap to target to prevent endless micro-updates
    if (Math.abs(diff) < 0.001) {
      this.progressAnimation.current = this.progressAnimation.target;
      return;
    }
    
    // Linear interpolation (lerp) - smooth and consistent speed
    this.progressAnimation.current += diff * this.progressAnimation.smoothing;
  }

  /**
   * Draw progress bar with gradient and color based on percentage
   */
  drawProgressBar(x, y, width, height, cornerRadius) {
    // Round positions to prevent sub-pixel rendering
    x = Math.floor(x);
    y = Math.floor(y);
    width = Math.floor(width);
    height = Math.floor(height);
    
    // Draw background (rounded rectangle)
    this.ctx.fillStyle = this.styles.progressBg;
    this.roundRect(x, y, width, height, cornerRadius);
    this.ctx.fill();
    
    // Use animated progress value instead of direct state value
    const animatedProgress = this.progressAnimation.current;
    
    // Draw progress value with gradient
    const clampedProgress = Math.max(0, Math.min(100, animatedProgress)); // Clamp between 0-100%
    const filledWidth = Math.floor((width * clampedProgress) / 100); // Floor to prevent sub-pixel jitter

    if (filledWidth > 0) {
      // Save the current canvas state
      this.ctx.save();
      
      // Create a clipping mask with the full rounded rectangle shape
      // This ensures the progress bar is always clipped to the pill shape
      this.ctx.beginPath();
      this.roundRect(x, y, width, height, cornerRadius);
      this.ctx.clip();
      
      // Create gradient for the filled portion
      const gradient = this.ctx.createLinearGradient(x, 0, x + filledWidth, 0);      // Determine color based on dynamic timer state
      const timerState = this.getTimerState();
      
      switch (timerState) {
        case 'overtime':
          gradient.addColorStop(0, this.styles.progressOvertime?.start || '#991b1b');
          gradient.addColorStop(1, this.styles.progressOvertime?.end || '#7f1d1d');
          break;
        case 'normal':
          gradient.addColorStop(0, this.styles.progressSuccess.start);
          gradient.addColorStop(1, this.styles.progressSuccess.end);
          break;
        case 'warning':
          gradient.addColorStop(0, this.styles.progressWarning.start);
          gradient.addColorStop(1, this.styles.progressWarning.end);
          break;
        case 'critical':
          gradient.addColorStop(0, this.styles.progressDanger.start);
          gradient.addColorStop(1, this.styles.progressDanger.end);
          break;
      }
      
      this.ctx.fillStyle = gradient;
      
      // Draw a simple rectangle - it will be clipped to the rounded shape
      this.ctx.fillRect(x, y, filledWidth, height);
      
      // Restore the canvas state (removes the clipping mask)
      this.ctx.restore();
    }
  }

  /**
   * Draw circular progress bar around a center point
   */
  drawCircularProgress(centerX, centerY, radius, thickness, startAngle = -90) {
    const ctx = this.ctx;
    
    // Convert start angle to radians
    const startRad = (startAngle * Math.PI) / 180;
    const rawProgressPercent = this.state.progress / 100;
    
    // Draw background circle (full ring)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = this.styles.progressBg;
    ctx.stroke();
    
    // Draw progress arc with gradient color based on percentage
    const clampedProgress = Math.max(0, Math.min(100, this.state.progress)); // Clamp between 0-100%
    if (clampedProgress > 0) {
      // Determine color based on dynamic timer state
      const timerState = this.getTimerState();
      let color1, color2;
      
      switch (timerState) {
        case 'overtime':
          color1 = this.styles.progressOvertime?.start || '#991b1b';
          color2 = this.styles.progressOvertime?.end || '#7f1d1d';
          break;
        case 'normal':
          color1 = this.styles.progressSuccess.start;
          color2 = this.styles.progressSuccess.end;
          break;
        case 'warning':
          color1 = this.styles.progressWarning.start;
          color2 = this.styles.progressWarning.end;
          break;
        case 'critical':
          color1 = this.styles.progressDanger.start;
          color2 = this.styles.progressDanger.end;
          break;
      }
      
      // Handle full circle (100%) specially
      if (clampedProgress >= 99.9) {
        // Draw a complete circle for 100% progress
        const gradient = ctx.createLinearGradient(
          centerX - radius, centerY,
          centerX + radius, centerY
        );
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';
        ctx.stroke();
      } else {
        // Calculate end angle - going counterclockwise (subtract to reverse direction)
        const endRad = startRad - (2 * Math.PI * rawProgressPercent);
        
        // Create gradient along the arc path
        const gradientX1 = centerX + radius * Math.cos(startRad);
        const gradientY1 = centerY + radius * Math.sin(startRad);
        const gradientX2 = centerX + radius * Math.cos(endRad);
        const gradientY2 = centerY + radius * Math.sin(endRad);
        
        const gradient = ctx.createLinearGradient(gradientX1, gradientY1, gradientX2, gradientY2);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.beginPath();
        // Draw arc counterclockwise (true parameter makes it go counterclockwise)
        ctx.arc(centerX, centerY, radius, startRad, endRad, true);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
  }

  /**
   * Get dynamic countdown color based on current timer state (for timer color matching)
   */
  getDynamicCountdownColor() {
    // Check if match timer color is enabled in settings
    const matchTimerColor = localStorage.getItem('matchTimerColor') === 'true';
    
    if (!matchTimerColor) {
      return this.styles.countdownColor;
    }
    
    // Get current timer state based on thresholds
    const timerState = this.getTimerState();
    
    // Map state to progress bar colors
    switch (timerState) {
      case 'overtime':
        return this.styles.progressOvertime?.start || '#991b1b';
      case 'normal':
        return this.styles.progressSuccess.start;
      case 'warning':
        return this.styles.progressWarning.start;
      case 'critical':
        return this.styles.progressDanger.start;
      default:
        return this.styles.progressSuccess.start;
    }
  }

  /**
   * Update dynamic colors for timer color matching
   * @param {string} warningColor - Color from API warning level (deprecated - now calculated from state)
   */
  updateDynamicColors(warningColor) {
    // This method is kept for compatibility but now we calculate color from current state
    // No need to cache API color as getDynamicCountdownColor() will use current timer state
    if (localStorage.getItem('matchTimerColor') === 'true') {
      this.renderFrame(); // Re-render with current state-based color
    }
  }

  /**
   * Get the effective countdown color based on current timer state
   */
  getEffectiveCountdownColor() {
    // Always use current timer state to determine color
    return this.getDynamicCountdownColor();
  }

  /**
   * Draw text background box if element has background config
   */
  drawTextBackground(x, y, text, fontSize, alignment, bgConfig) {
    if (!bgConfig || !bgConfig.enabled) return;
    
    // Measure text
    const metrics = this.ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    // Calculate padding
    const padding = bgConfig.padding !== undefined ? bgConfig.padding : fontSize * 0.3;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = textHeight + padding * 2;
    
    // Calculate box position based on text alignment
    let boxX = x - boxWidth / 2; // default center
    if (alignment === 'left') {
      boxX = x - padding;
    } else if (alignment === 'right') {
      boxX = x - textWidth - padding;
    }
    const boxY = y - boxHeight / 2;
    
    // Draw background with optional border radius
    this.ctx.fillStyle = bgConfig.color || 'rgba(0, 0, 0, 0.7)';
    const borderRadius = bgConfig.borderRadius !== undefined ? bgConfig.borderRadius : 10;
    
    if (borderRadius > 0) {
      // Rounded rectangle
      this.ctx.beginPath();
      this.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, borderRadius);
      this.ctx.fill();
    } else {
      // Regular rectangle
      this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    }
  }

  /**
   * Draw countdown timer (large, centered, monospace font)
   */
  drawCountdown(x, y) {
    const config = this.layout.countdown;
    const fontSize = config.fontSize;
    const text = this.state.countdown;
    const alignment = config.alignment || 'center';
    
    this.ctx.font = `${this.styles.countdownWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.textAlign = alignment;
    this.ctx.textBaseline = 'middle';
    
    // Draw background if configured
    if (config.background) {
      this.drawTextBackground(x, y, text, fontSize, alignment, config.background);
    }
    
    // Set opacity
    const opacity = config.opacity !== undefined ? config.opacity : 1.0;
    this.ctx.globalAlpha = opacity;
    
    // Add subtle shadow for depth
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 4;
    
    // Draw text
    this.ctx.fillStyle = this.getEffectiveCountdownColor();
    this.ctx.fillText(text, x, y);
    
    // Reset
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw clock display (smaller, below countdown)
   */
  drawClock(x, y) {
    const config = this.layout.clock;
    const fontSize = config.fontSize;
    const text = this.state.clock;
    const alignment = config.alignment || 'center';
    
    this.ctx.font = `${this.styles.clockWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.textAlign = alignment;
    this.ctx.textBaseline = 'middle';
    
    // Draw background if configured
    if (config.background) {
      this.drawTextBackground(x, y, text, fontSize, alignment, config.background);
    }
    
    // Set opacity (default 0.8 for clock)
    const opacity = config.opacity !== undefined ? config.opacity : 0.8;
    this.ctx.globalAlpha = opacity;
    
    // Draw text
    this.ctx.fillStyle = this.styles.clockColor;
    this.ctx.fillText(text, x, y);
    
    // Reset
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw elapsed time display
   */
  drawElapsed(x, y) {
    const config = this.layout.elapsed;
    const fontSize = config.fontSize;
    const showLabel = config.showLabel !== false;
    const labelSize = config.labelSize || fontSize * 0.5;
    const label = config.label || 'ELAPSED';
    const text = this.state.elapsed;
    const alignment = config.alignment || 'center';
    
    this.ctx.font = `${this.styles.elapsedWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.textAlign = alignment;
    this.ctx.textBaseline = 'middle';
    
    // Draw background if configured
    if (config.background) {
      this.drawTextBackground(x, y, text, fontSize, alignment, config.background);
    }
    
    // Set opacity
    const opacity = config.opacity !== undefined ? config.opacity : 1.0;
    
    // Draw label if enabled
    if (showLabel) {
      this.ctx.globalAlpha = opacity * 0.7;
      this.ctx.font = `normal ${labelSize}px ${this.styles.fontFamily}`;
      this.ctx.fillStyle = this.styles.elapsedColor;
      this.ctx.fillText(label, x, y - fontSize * 0.7);
    }
    
    // Draw time
    this.ctx.globalAlpha = opacity;
    this.ctx.font = `${this.styles.elapsedWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.fillStyle = this.styles.elapsedColor;
    this.ctx.fillText(text, x, y);
    
    // Reset
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw end time display
   */
  drawEndTime(x, y) {
    const config = this.layout.endTime;
    const fontSize = config.fontSize;
    const showLabel = config.showLabel !== false;
    const labelSize = config.labelSize || fontSize * 0.5;
    const label = config.label || 'ENDS AT';
    const text = this.state.endTime;
    const alignment = config.alignment || 'center';
    
    this.ctx.font = `${this.styles.clockWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.textAlign = alignment;
    this.ctx.textBaseline = 'middle';
    
    // Draw background if configured
    if (config.background) {
      this.drawTextBackground(x, y, text, fontSize, alignment, config.background);
    }
    
    // Set opacity (default 0.8)
    const opacity = config.opacity !== undefined ? config.opacity : 0.8;
    
    // Draw label if enabled
    if (showLabel) {
      this.ctx.globalAlpha = opacity * 0.7;
      this.ctx.font = `normal ${labelSize}px ${this.styles.fontFamily}`;
      this.ctx.fillStyle = this.styles.clockColor;
      this.ctx.fillText(label, x, y - fontSize * 0.7);
    }
    
    // Draw end time
    this.ctx.globalAlpha = opacity;
    this.ctx.font = `${this.styles.clockWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.fillStyle = this.styles.clockColor;
    this.ctx.fillText(text, x, y);
    
    // Reset
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw separator line
   */
  drawSeparator(x, y, width, thickness) {
    this.ctx.strokeStyle = this.styles.separatorColor;
    this.ctx.lineWidth = thickness;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + width, y);
    this.ctx.stroke();
  }

  /**
   * Draw message text (auto-wrapped to fit width, respects layout maxLines)
   */
  drawMessage(x, y) {
    const config = this.layout.message;
    const fontSize = config.fontSize || 70;
    const lineHeight = config.lineHeight || 1.3;
    const maxLines = config.maxLines || 2;
    const opacity = config.opacity !== undefined ? config.opacity : 1.0;
    
    this.ctx.font = `${this.styles.messageWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.fillStyle = this.styles.messageColor;
    this.ctx.textAlign = config.alignment || 'center';
    this.ctx.textBaseline = 'middle';
    
    // Word wrap to multiple lines based on layout config
    const maxWidth = this.masterCanvas.width * 0.85;
    const words = this.state.message.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        // Start new line
        lines.push(currentLine.trim());
        currentLine = words[i] + ' ';
        
        // Stop if we've reached max lines
        if (lines.length >= maxLines) {
          break;
        }
      } else {
        currentLine = testLine;
      }
    }
    
    // Add final line if space available
    if (currentLine.trim() && lines.length < maxLines) {
      lines.push(currentLine.trim());
    }
    
    // Calculate dimensions for background box
    const lineSpacing = fontSize * lineHeight;
    const totalHeight = (lines.length - 1) * lineSpacing;
    const startY = y - totalHeight / 2;
    
    // Find the widest line to determine box width
    let maxLineWidth = 0;
    lines.forEach(line => {
      const lineWidth = this.ctx.measureText(line).width;
      if (lineWidth > maxLineWidth) {
        maxLineWidth = lineWidth;
      }
    });
    
    // Add padding around the text
    const padding = fontSize * 0.5;
    const boxWidth = maxLineWidth + padding * 2;
    const boxHeight = totalHeight + fontSize + padding * 2;
    
    // Draw background box with message background color (if enabled in layout)
    if (config.showBackground !== false) {
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = this.styles.messageBackgroundColor || this.styles.background;
      this.ctx.fillRect(
        x - boxWidth / 2,
        startY - fontSize / 2 - padding,
        boxWidth,
        boxHeight
      );
    }
    
    // Set opacity for text
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = this.styles.messageColor;
    
    // Draw lines with proper spacing based on lineHeight
    lines.forEach((line, index) => {
      this.ctx.fillText(line, x, startY + index * lineSpacing);
    });
    
    // Reset
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw video frame in a specific region (for video layout)
   */
  drawVideoFrame() {
    if (!this.videoInputManager || !this.videoInputManager.isEnabled()) {
      return;
    }
    
    // Support both videoFrame and video properties
    const vf = this.layout.videoFrame || this.layout.video;
    if (!vf) return;
    
    const { width, height } = this.masterCanvas;
    
    // Calculate video frame position and size
    const frameX = this.parsePosition(vf.position.x, 'x', width);
    const frameY = this.parsePosition(vf.position.y, 'y', height);
    const frameWidth = this.parseSize(vf.size.width, width);
    const frameHeight = this.parseSize(vf.size.height, height);
    
    // Save context
    this.ctx.save();
    
    // Set opacity if specified
    if (vf.opacity !== undefined) {
      this.ctx.globalAlpha = vf.opacity;
    } else {
      this.ctx.globalAlpha = this.videoInputManager.getOpacity();
    }
    
    // Draw video element to the specified frame area
    const videoElement = this.videoInputManager.getVideoElement();
    if (videoElement && videoElement.readyState >= 2) {
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      
      // Calculate draw parameters based on scaling mode
      let sx = 0, sy = 0, sw = videoWidth, sh = videoHeight;
      let dx = frameX, dy = frameY, dw = frameWidth, dh = frameHeight;
      
      switch (this.videoScaling) {
        case 'cover': {
          // Fill frame, cropping excess (like object-fit: cover)
          // Crop is centered: center,center alignment
          const videoAspect = videoWidth / videoHeight;
          const frameAspect = frameWidth / frameHeight;
          if (videoAspect > frameAspect) {
            // Video is wider - crop left/right sides equally (center horizontally)
            sw = videoHeight * frameAspect;
            sx = (videoWidth - sw) / 2; // Center crop horizontally
          } else {
            // Video is taller - crop top/bottom equally (center vertically)
            sh = videoWidth / frameAspect;
            sy = (videoHeight - sh) / 2; // Center crop vertically
          }
          break;
        }
        case 'stretch':
          // Stretch to fill exactly (distort if needed)
          // Default drawImage behavior - just use frame dimensions
          break;
        case 'none': {
          // Original size, centered
          dw = Math.min(videoWidth, frameWidth);
          dh = Math.min(videoHeight, frameHeight);
          dx = frameX + (frameWidth - dw) / 2;
          dy = frameY + (frameHeight - dh) / 2;
          sw = dw;
          sh = dh;
          sx = (videoWidth - sw) / 2;
          sy = (videoHeight - sh) / 2;
          break;
        }
        case 'contain':
        default: {
          // Fit inside frame, maintaining aspect ratio (like object-fit: contain)
          const videoAspect = videoWidth / videoHeight;
          const frameAspect = frameWidth / frameHeight;
          if (videoAspect > frameAspect) {
            // Video is wider - fit to width
            dh = frameWidth / videoAspect;
            dy = frameY + (frameHeight - dh) / 2;
          } else {
            // Video is taller - fit to height
            dw = frameHeight * videoAspect;
            dx = frameX + (frameWidth - dw) / 2;
          }
          break;
        }
      }
      
      // Apply mirror transform if enabled
      if (this.videoMirror) {
        this.ctx.translate(dx + dw, dy);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(videoElement, sx, sy, sw, sh, 0, 0, dw, dh);
      } else {
        this.ctx.drawImage(videoElement, sx, sy, sw, sh, dx, dy, dw, dh);
      }
    }
    
    // Restore context
    this.ctx.restore();
  }

  /**
   * Draw cover image overlay (covers entire canvas with highest z-index)
   */
  drawCoverImage() {
    if (!this.coverImage.enabled || !this.coverImage.image) {
      return;
    }
    
    const img = this.coverImage.image;
    
    // Check if image is loaded
    if (!img.complete || img.naturalWidth === 0) {
      return;
    }
    
    // Animate opacity for fade-in effect
    if (this.coverImage.currentOpacity < this.coverImage.targetOpacity) {
      this.coverImage.currentOpacity = Math.min(
        this.coverImage.currentOpacity + this.coverImage.fadeSpeed,
        this.coverImage.targetOpacity
      );
    } else if (this.coverImage.currentOpacity > this.coverImage.targetOpacity) {
      this.coverImage.currentOpacity = Math.max(
        this.coverImage.currentOpacity - this.coverImage.fadeSpeed,
        this.coverImage.targetOpacity
      );
    }
    
    const { width, height } = this.masterCanvas;
    
    // Save context
    this.ctx.save();
    
    // Set opacity with fade animation
    this.ctx.globalAlpha = this.coverImage.currentOpacity;
    
    // Draw image covering entire canvas
    this.ctx.drawImage(img, 0, 0, width, height);
    
    // Restore context
    this.ctx.restore();
  }

  /**
   * Draw background image (fills entire canvas, lowest layer above background color)
   */
  drawBackgroundImage() {
    if (!this.backgroundImage.enabled || !this.backgroundImage.image) {
      return;
    }
    
    const img = this.backgroundImage.image;
    
    // Check if image is loaded
    if (!img.complete || img.naturalWidth === 0) {
      return;
    }
    
    const { width, height } = this.masterCanvas;
    
    // Save context
    this.ctx.save();
    
    // Set opacity
    this.ctx.globalAlpha = this.backgroundImage.opacity;
    
    // Draw image stretched to fill entire canvas
    this.ctx.drawImage(img, 0, 0, width, height);
    
    // Restore context
    this.ctx.restore();
  }

  /**
   * Load the watermark image from renderer assets
   */
  async _loadWatermarkImage() {
    const img = new Image();
    img.onload = () => {
      this.watermark.image = img;
    };
    
    // Get the correct path for both dev and packaged app
    if (window.electron && window.electron.getResourcePath) {
      const resourcePath = await window.electron.getResourcePath('renderer/assets/rocket-icon_transparent.png');
      img.src = 'file://' + resourcePath;
    } else {
      // Fallback for browser mode or if IPC not available
      img.src = '../assets/rocket-icon_transparent.png';
    }
  }

  /**
   * Draw watermark logo in the top-right corner
   */
  drawWatermark() {
    if (!this.watermark.enabled || !this.watermark.image) return;
    
    const img = this.watermark.image;
    if (!img.complete || img.naturalWidth === 0) return;
    
    const { width, height } = this.masterCanvas;
    const size = Math.round(height * 0.18);
    const margin = Math.round(height * 0.03);
    const x = width - size - margin;
    const y = margin;

    this.ctx.save();
    this.ctx.globalAlpha = this.watermark.opacity;
    this.ctx.drawImage(img, x, y, size, size);
    this.ctx.restore();
  }

  /**
   * Draw flash overlay (red rectangle covering entire canvas)
   */
  drawFlashOverlay() {
    const { width, height } = this.masterCanvas;
    
    // Save context
    this.ctx.save();
    
    // Set opacity
    this.ctx.globalAlpha = this.flashOverlay.opacity;
    
    // Draw red rectangle covering entire canvas
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(0, 0, width, height);
    
    // Restore context
    this.ctx.restore();
  }

  /**
   * Draw bottom info bar with timer and progress (for video layout)
   */
  drawBottomInfoBar() {
    if (!this.layout.bottomBar || !this.layout.bottomBar.enabled) {
      return;
    }
    
    const bar = this.layout.bottomBar;
    const { width, height } = this.masterCanvas;
    
    // Calculate bar dimensions
    const barX = this.parsePosition(bar.position.x, 'x', width);
    const barY = this.parsePosition(bar.position.y, 'y', height);
    const barWidth = this.parseSize(bar.size.width, width);
    const barHeight = this.parseSize(bar.size.height, height);
    
    // Draw semi-transparent black background
    this.ctx.fillStyle = bar.backgroundColor || 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw border if specified
    if (bar.borderColor && bar.borderWidth) {
      this.ctx.strokeStyle = bar.borderColor;
      this.ctx.lineWidth = bar.borderWidth;
      this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  }

  /**
   * Helper function to draw rounded rectangles
   */
  roundRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  // ============================================================================
  // COMPATIBILITY & PERFORMANCE METHODS
  // ============================================================================

  /**
   * Load performance settings from settings manager
   */
  async loadPerformanceSettings() {
    try {
      if (window.electron && window.electron.settings) {
        const settings = await window.electron.settings.getAll();
        this.applyPerformanceSettings(settings);
      }
    } catch (error) {
      console.error('Error loading performance settings:', error);
    }
  }

  /**
   * Apply performance and timer threshold settings
   */
  applyPerformanceSettings(settings) {
    // Update frame rate
    if (settings.frameRate) {
      this.performanceSettings.frameRate = settings.frameRate;
      this.frameInterval = 1000 / settings.frameRate;
      console.log('Applied frame rate:', settings.frameRate);
    }

    // Update canvas quality
    if (settings.canvasQuality) {
      this.performanceSettings.canvasQuality = settings.canvasQuality;
      this.applyCanvasQuality(settings.canvasQuality);
    }

    // Update reduce motion
    if (settings.reduceMotion !== undefined) {
      this.performanceSettings.reduceMotion = settings.reduceMotion;
      // Apply to document for CSS
      document.documentElement.setAttribute('data-reduce-motion', settings.reduceMotion.toString());
      console.log('Reduce motion:', settings.reduceMotion ? 'enabled' : 'disabled');
    }

    // Update low power mode
    if (settings.lowPowerMode !== undefined) {
      this.performanceSettings.lowPowerMode = settings.lowPowerMode;
      
      // Low power mode: reduce frame rate to 30fps
      if (settings.lowPowerMode) {
        this.performanceSettings.frameRate = 30;
        this.frameInterval = 1000 / 30;
        console.log('Low power mode enabled: reduced to 30fps');
      } else if (settings.frameRate) {
        // Restore normal frame rate if low power is disabled
        this.performanceSettings.frameRate = settings.frameRate;
        this.frameInterval = 1000 / settings.frameRate;
      }
    }

    // Update timer thresholds
    this.applyTimerThresholds(settings);
  }

  /**
   * Apply timer threshold settings
   */
  applyTimerThresholds(settings) {
    if (settings.timerThresholdType) {
      this.timerThresholds.type = settings.timerThresholdType;
    }
    
    if (settings.warningPercentage !== undefined) {
      this.timerThresholds.warningPercentage = settings.warningPercentage;
    }
    
    if (settings.criticalPercentage !== undefined) {
      this.timerThresholds.criticalPercentage = settings.criticalPercentage;
    }
    
    if (settings.warningTimeMinutes !== undefined && settings.warningTimeSeconds !== undefined) {
      this.timerThresholds.warningTimeSeconds = (settings.warningTimeMinutes * 60) + settings.warningTimeSeconds;
    }
    
    if (settings.criticalTimeMinutes !== undefined && settings.criticalTimeSeconds !== undefined) {
      this.timerThresholds.criticalTimeSeconds = (settings.criticalTimeMinutes * 60) + settings.criticalTimeSeconds;
    }
    
    console.log('🎯 Timer thresholds updated:', {
      type: this.timerThresholds.type,
      warningPercentage: this.timerThresholds.warningPercentage,
      criticalPercentage: this.timerThresholds.criticalPercentage,
      warningTimeSeconds: this.timerThresholds.warningTimeSeconds,
      criticalTimeSeconds: this.timerThresholds.criticalTimeSeconds
    });
  }

  /**
   * Get timer state based on current thresholds
   * @returns {string} 'normal', 'warning', 'critical', or 'overtime'
   */
  getTimerState() {
    // Safety check
    if (!this.state || this.state.progress === undefined) {
      return 'normal';
    }
    
    // Check for overtime first - if remainingTime is negative
    if (this.state.remainingTime !== undefined && this.state.remainingTime < 0) {
      return 'overtime';
    }
    
    // Also check progress for percentage mode overtime
    if (this.state.progress < 0) {
      return 'overtime';
    }
    
    if (this.timerThresholds.type === 'percentage') {
      if (this.state.progress > this.timerThresholds.warningPercentage) {
        return 'normal';
      } else if (this.state.progress > this.timerThresholds.criticalPercentage) {
        return 'warning';
      } else {
        return 'critical';
      }
    } else {
      // Time-based thresholds
      if (this.state.remainingTime === undefined) {
        return 'normal';
      }
      
      const remainingSeconds = Math.floor(this.state.remainingTime / 1000);
      
      // Check for zero or below zero - should be critical, not overtime
      // Overtime is only when remainingTime is actually negative
      if (remainingSeconds <= 0 && this.state.remainingTime >= 0) {
        return 'critical';
      }
      
      // IMPORTANT: Use > not >= for proper threshold comparison
      // Example: If warning is 120s, show warning when remaining is 119s or less
      if (remainingSeconds > this.timerThresholds.warningTimeSeconds) {
        return 'normal';
      } else if (remainingSeconds > this.timerThresholds.criticalTimeSeconds) {
        return 'warning';
      } else {
        return 'critical';
      }
    }
  }

  /**
   * Apply canvas quality settings
   */
  applyCanvasQuality(quality) {
    const ctx = this.ctx;
    
    switch (quality) {
      case 'high':
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        console.log('Canvas quality: High (smooth rendering)');
        break;
        
      case 'balanced':
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        console.log('Canvas quality: Balanced');
        break;
        
      case 'performance':
        ctx.imageSmoothingEnabled = false;
        console.log('Canvas quality: Performance (no smoothing)');
        break;
        
      default:
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    }
  }

  /**
   * Update theme and refresh cached CSS variables
   */
  updateTheme(theme) {
    this.state.theme = theme;
    // Clear caches when theme changes
    this.clearTextMetricsCache();
    // Wait for CSS to update before reading computed styles
    setTimeout(() => {
      this.updateStyleCache();
    }, 0);
  }

  /**
   * Handle window resize - maintain aspect ratio for all outputs
   */
  handleResize() {
    this.outputs.forEach((output) => {
      this.setupOutputCanvas(output);
    });
  }

  /**
   * Track rendering performance
   */
  trackPerformance(renderTime) {
    const now = performance.now();
    
    // Track render times (how long each render takes)
    this.renderTimes.push(renderTime);
    if (this.renderTimes.length > this.maxRenderTimes) {
      this.renderTimes.shift();
    }
    
    // Track frame times (when each frame was rendered) for actual FPS calculation
    this.frameTimes.push(now);
    if (this.frameTimes.length > this.maxFrameTimes) {
      this.frameTimes.shift();
    }
    
    // Calculate actual FPS every 500ms from frame timestamps
    if (now - this.fpsUpdateTime > 500) {
      if (this.frameTimes.length >= 2) {
        const timeSpan = this.frameTimes[this.frameTimes.length - 1] - this.frameTimes[0];
        const frameCount = this.frameTimes.length - 1;
        this.actualFPS = (frameCount / timeSpan) * 1000; // Convert to frames per second
        
        // Update effective max FPS based on actual measurements
        // This helps detect display refresh rate limits
        if (this.actualFPS > 0) {
          this.effectiveMaxFPS = Math.max(this.effectiveMaxFPS, this.actualFPS);
        }
      }
      this.fpsUpdateTime = now;
    }
    
    // Performance warning (throttled to once per 5 seconds)
    if (!this.lastPerfWarning || Date.now() - this.lastPerfWarning > 5000) {
      const avgRenderTime = this.renderTimes.reduce((a, b) => a + b) / this.renderTimes.length;
      if (avgRenderTime > this.frameInterval) {
        console.warn(`⚠️ Performance: Render time (${avgRenderTime.toFixed(2)}ms) exceeds frame budget (${this.frameInterval.toFixed(2)}ms). Consider reducing quality or frame rate.`);
        this.lastPerfWarning = Date.now();
      }
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.renderTimes.length === 0) return null;
    
    const avg = this.renderTimes.reduce((a, b) => a + b) / this.renderTimes.length;
    const max = Math.max(...this.renderTimes);
    const min = Math.min(...this.renderTimes);
    
    // Calculate effective target (limited by display refresh rate)
    const effectiveTarget = Math.min(this.performanceSettings.frameRate, this.displayRefreshRate);
    const isDisplayLimited = this.performanceSettings.frameRate > this.displayRefreshRate;
    
    return {
      averageRenderTime: avg.toFixed(2),
      maxRenderTime: max.toFixed(2),
      minRenderTime: min.toFixed(2),
      currentFPS: this.actualFPS.toFixed(1), // Use actual measured FPS
      targetFPS: this.performanceSettings.frameRate,
      effectiveTargetFPS: effectiveTarget,
      displayRefreshRate: this.displayRefreshRate,
      isDisplayLimited: isDisplayLimited,
      adaptiveFPS: this.adaptiveFrameRate,
      frameCount: this.frameCount,
      droppedFrames: this.droppedFrames,
      outputCount: this.outputs.size,
      cacheSize: {
        textMetrics: this.textMetricsCache.size,
        images: this.imageCache.size
      },
      isPageVisible: this.isPageVisible
    };
  }
  
  /**
   * Detect display refresh rate by measuring RAF callback rate
   */
  detectDisplayRefreshRate() {
    let frames = 0;
    let lastTime = performance.now();
    const measurements = [];
    
    const measure = () => {
      frames++;
      const now = performance.now();
      
      if (frames >= 60) {
        const elapsed = now - lastTime;
        const fps = (frames / elapsed) * 1000;
        measurements.push(fps);
        
        if (measurements.length >= 3) {
          // Average the measurements
          const avgFPS = measurements.reduce((a, b) => a + b) / measurements.length;
          this.displayRefreshRate = Math.round(avgFPS);
          console.log(`📺 Display refresh rate detected: ${this.displayRefreshRate}Hz`);
          return; // Done
        }
        
        frames = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  }

  // ============================================================================
  // VIDEO & FEATURE IMAGE METHODS (Compatibility with existing code)
  // ============================================================================

  /**
   * Initialize video input manager (for HDMI capture cards)
   */
  initializeVideoInput() {
    if (!this.videoInputManager) {
      // Create a dummy canvas for video manager initialization
      const dummyCanvas = document.createElement('canvas');
      this.videoInputManager = new VideoInputManager(dummyCanvas);
    }
    return this.videoInputManager;
  }

  /**
   * Get video input manager
   */
  getVideoInputManager() {
    return this.videoInputManager;
  }

  /**
   * Enable video input from device
   */
  async enableVideoInput(deviceId) {
    if (!this.videoInputManager) {
      this.initializeVideoInput();
    }
    return await this.videoInputManager.startVideoInput(deviceId);
  }

  /**
   * Disable video input
   */
  disableVideoInput() {
    if (this.videoInputManager) {
      this.videoInputManager.stopVideoInput();
    }
  }

  /**
   * Set video input opacity (0-1)
   */
  setVideoOpacity(opacity) {
    if (this.videoInputManager) {
      this.videoInputManager.setOpacity(opacity);
    }
  }

  /**
   * Set video mirror/flip horizontally
   */
  setVideoMirror(enabled) {
    this.videoMirror = !!enabled;
  }

  /**
   * Set video scaling mode (contain, cover, stretch, none)
   */
  setVideoScaling(mode) {
    const validModes = ['contain', 'cover', 'stretch', 'none'];
    this.videoScaling = validModes.includes(mode) ? mode : 'contain';
  }

  /**
   * Enable cover image
   */
  async enableCoverImage(imagePath) {
    // Check cache first
    if (this.imageCache.has(imagePath)) {
      const img = this.imageCache.get(imagePath);
      this.coverImage.image = img;
      this.coverImage.path = imagePath;
      this.coverImage.targetOpacity = 1.0;
      this.coverImage.currentOpacity = 0.0;
      this.coverImage.enabled = true;
      console.log('✅ Cover image loaded from cache:', imagePath);
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.imageCache.set(imagePath, img);
        this.coverImage.image = img;
        this.coverImage.path = imagePath;
        this.coverImage.targetOpacity = 1.0;
        this.coverImage.currentOpacity = 0.0; // Start from 0 for fade-in
        this.coverImage.enabled = true;
        console.log('✅ Cover image loaded:', imagePath);
        resolve();
      };
      
      img.onerror = (error) => {
        console.error('❌ Failed to load cover image:', imagePath, error);
        reject(error);
      };
      
      img.src = `file://${imagePath}`;
    });
  }

  /**
   * Disable cover image
   */
  disableCoverImage() {
    // Fade out before disabling
    this.coverImage.targetOpacity = 0.0;
    
    // Wait for fade out to complete, then disable
    const checkFadeOut = () => {
      if (this.coverImage.currentOpacity <= 0) {
        this.coverImage.enabled = false;
        console.log('Cover image disabled');
      } else {
        setTimeout(checkFadeOut, 50);
      }
    };
    
    checkFadeOut();
  }

  /**
   * Enable background image
   */
  async enableBackgroundImage(imagePath, opacity = 1.0) {
    // Check cache first
    if (this.imageCache.has(imagePath)) {
      const img = this.imageCache.get(imagePath);
      this.backgroundImage.image = img;
      this.backgroundImage.path = imagePath;
      this.backgroundImage.opacity = opacity;
      this.backgroundImage.enabled = true;
      console.log('✅ Background image loaded from cache:', imagePath);
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.imageCache.set(imagePath, img);
        this.backgroundImage.image = img;
        this.backgroundImage.path = imagePath;
        this.backgroundImage.opacity = opacity;
        this.backgroundImage.enabled = true;
        console.log('✅ Background image loaded:', imagePath);
        resolve();
      };
      
      img.onerror = (error) => {
        console.error('❌ Failed to load background image:', imagePath, error);
        reject(error);
      };
      
      img.src = `file://${imagePath}`;
    });
  }

  /**
   * Disable background image
   */
  disableBackgroundImage() {
    this.backgroundImage.enabled = false;
    console.log('Background image disabled');
  }
  
  // Keep old method names for backwards compatibility
  async enableFeatureImage(imagePath) {
    return this.enableCoverImage(imagePath);
  }
  
  disableFeatureImage() {
    return this.disableCoverImage();
  }

  /**
   * Get the canvas media stream (for external display)
   */
  getStream() {
    return this.stream;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stop();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    if (this.videoInputManager) {
      this.videoInputManager.destroy();
    }
    
    // Clear all outputs
    this.outputs.clear();
    
    window.removeEventListener('resize', () => this.handleResize());
    
    console.log('🗑️ UnifiedCanvasRenderer destroyed');
  }
}

// Export as ES6 module (for import statements)
export default UnifiedCanvasRenderer;

// Make available globally (for backward compatibility)
window.UnifiedCanvasRenderer = UnifiedCanvasRenderer;

// CommonJS export (for Node.js compatibility)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedCanvasRenderer;
}