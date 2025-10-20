/**
 * Canvas Renderer for Countdown Timer Display
 * Renders timer display on canvas with 16:9 aspect ratio
 * Uses requestAnimationFrame for smooth animations
 * Supports multiple layouts with CSS-based styling
 */

class CanvasRenderer {
  constructor(canvasId, layout = null) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas element not found:', canvasId);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.animationId = null;
    
    // Load layout or use default
    this.layout = layout || this.getDefaultLayout();
    
    // State that mirrors the current timer state
    // Default: 45 minutes (matches initializeDefaultTime in countdown.js)
    this.state = {
      countdown: '00:45:00',
      clock: '--:--:--',
      message: '',
      progress: 100,
      elapsed: '00:00:00',
      showClock: true,
      showMessage: false,
      theme: 'dark'
    };
    
    // Cache CSS variables for performance
    this.updateStyleCache();
    
    // 16:9 aspect ratio (matches external display)
    this.aspectRatio = 16 / 9;
    
    // Initialize canvas with proper dimensions
    this.setupCanvas();
    
    // Setup media stream for external display
    this.setupStream();
    
    // Start animation loop
    this.startAnimation();
    
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }
  
  /**
   * Get default layout configuration
   * @returns {object} Default layout
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
   * Update cached CSS variables
   * Call this when theme changes
   */
  updateStyleCache() {
    const styles = getComputedStyle(document.documentElement);
    
    this.styles = {
      // Colors
      countdownColor: styles.getPropertyValue('--canvas-countdown-color').trim(),
      clockColor: styles.getPropertyValue('--canvas-clock-color').trim(),
      messageColor: styles.getPropertyValue('--canvas-message-color').trim(),
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
   * @param {string|number} value - Position value
   * @param {string} axis - 'x' or 'y'
   * @param {number} dimension - Canvas width or height
   * @returns {number} Absolute pixel position
   */
  parsePosition(value, axis, dimension) {
    // Named positions
    const namedPositions = {
      x: {
        'left': 0,
        'center': 0.5,
        'right': 1
      },
      y: {
        'top': 0,
        'middle': 0.5,
        'bottom': 1
      }
    };
    
    // Check if it's a named position
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      
      // Check named positions for this axis
      if (namedPositions[axis] && namedPositions[axis][lowerValue] !== undefined) {
        return dimension * namedPositions[axis][lowerValue];
      }
      
      // Check if it's a percentage string (e.g., "50%", "25.5%")
      if (value.includes('%')) {
        const percent = parseFloat(value) / 100;
        return dimension * percent;
      }
      
      // Try to parse as a number string
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        // If >= 1, treat as pixels; if < 1, treat as normalized
        return parsed >= 1 ? parsed : dimension * parsed;
      }
    }
    
    // If it's already a number
    if (typeof value === 'number') {
      // If >= 1, treat as pixels; if < 1, treat as normalized (0-1)
      return value >= 1 ? value : dimension * value;
    }
    
    // Default to center/middle
    return dimension * 0.5;
  }

  /**
   * Parse size value (supports percentages and decimals)
   * @param {string|number} value - Size value
   * @param {number} dimension - Canvas width or height
   * @returns {number} Absolute pixel size
   */
  parseSize(value, dimension) {
    // Check if it's a percentage string
    if (typeof value === 'string' && value.includes('%')) {
      const percent = parseFloat(value) / 100;
      return dimension * percent;
    }
    
    // If it's a number
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    
    // If >= 1, treat as pixels; if < 1, treat as normalized
    return numValue >= 1 ? numValue : dimension * numValue;
  }

  /**
   * Setup canvas with proper 16:9 dimensions
   * Canvas resolution: 1920x1080 (Full HD)
   * Display size: Scales to container while maintaining aspect ratio
   */
  setupCanvas() {
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Set canvas internal resolution (higher for crisp rendering)
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    
    // Check if this is a fullscreen display (body is parent)
    const isFullscreen = container.tagName === 'BODY';
    
    if (isFullscreen) {
      // Fullscreen mode - fill entire viewport
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
    } else {
      // Preview mode - calculate dimensions maintaining 16:9 aspect ratio
      let width = containerWidth;
      let height = width / this.aspectRatio;
      
      if (height > containerHeight) {
        height = containerHeight;
        width = height * this.aspectRatio;
      }
      
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';
    }
  }

  /**
   * Setup canvas stream for external display
   * Captures at 30fps for smooth video streaming
   */
  setupStream() {
    try {
      // Capture canvas stream at 30fps
      this.stream = this.canvas.captureStream(30);
      
      // Make stream available globally for external window
      window.canvasStream = this.stream;
      
      console.log('Canvas stream created successfully');
    } catch (error) {
      console.error('Failed to create canvas stream:', error);
    }
  }

  /**
   * Update renderer state
   * Called by countdown.js when timer state changes
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  /**
   * Main animation loop using requestAnimationFrame
   * Provides smooth 60fps rendering
   */
  startAnimation() {
    const animate = () => {
      this.draw();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Stop animation loop
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Set a new layout and trigger redraw
   * @param {object} layout - Layout configuration object
   */
  setLayout(layout) {
    this.layout = layout;
    // Redraw will happen automatically via animation loop
  }

  /**
   * Main draw function - renders entire canvas each frame
   * Uses layout configuration for positioning and sizing
   */
  draw() {
    const { width, height } = this.canvas;
    
    // Clear canvas with theme-appropriate background
    this.clearCanvas();
    
    // Draw progress bar if enabled in layout
    if (this.layout.progressBar.enabled) {
      const pb = this.layout.progressBar;
      
      if (pb.type === 'circular') {
        // Circular progress bar
        const centerX = this.parsePosition(pb.position.x, 'x', width);
        const centerY = this.parsePosition(pb.position.y, 'y', height);
        this.drawCircularProgress(centerX, centerY, pb.radius, pb.thickness, pb.startAngle || -90);
      } else {
        // Linear progress bar
        const x = this.parsePosition(pb.position.x, 'x', width);
        const y = this.parsePosition(pb.position.y, 'y', height);
        const barWidth = this.parseSize(pb.size.width, width);
        const barHeight = this.parseSize(pb.size.height, height);
        this.drawProgressBar(x, y, barWidth, barHeight, pb.cornerRadius);
      }
    }
    
    // Draw countdown timer if enabled in layout
    if (this.layout.countdown.enabled) {
      const countdownX = this.parsePosition(this.layout.countdown.position.x, 'x', width);
      const countdownY = this.parsePosition(this.layout.countdown.position.y, 'y', height);
      this.drawCountdown(countdownX, countdownY);
    }
    
    // Draw clock if visible and enabled in layout
    if (this.state.showClock && this.layout.clock.enabled) {
      const clockX = this.parsePosition(this.layout.clock.position.x, 'x', width);
      const clockY = this.parsePosition(this.layout.clock.position.y, 'y', height);
      this.drawClock(clockX, clockY);
    }
    
    // Draw elapsed time if enabled in layout
    if (this.layout.elapsed && this.layout.elapsed.enabled) {
      const elapsedX = this.parsePosition(this.layout.elapsed.position.x, 'x', width);
      const elapsedY = this.parsePosition(this.layout.elapsed.position.y, 'y', height);
      this.drawElapsed(elapsedX, elapsedY);
    }
    
    // Draw separator if enabled in layout
    if (this.layout.separator.enabled) {
      const sep = this.layout.separator;
      const sepY = this.parsePosition(sep.position.y, 'y', height);
      const sepWidth = this.parseSize(sep.width, width);
      const startX = (width - sepWidth) / 2;
      this.drawSeparator(startX, sepY, sepWidth, sep.thickness);
    }
    
    // Draw message if visible and enabled in layout
    if (this.state.showMessage && this.state.message && this.layout.message.enabled) {
      const msgX = this.parsePosition(this.layout.message.position.x, 'x', width);
      const msgY = this.parsePosition(this.layout.message.position.y, 'y', height);
      this.drawMessage(msgX, msgY);
    }
  }

  /**
   * Clear canvas with theme-appropriate background
   */
  clearCanvas() {
    this.ctx.fillStyle = this.styles.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw progress bar with gradient and color based on percentage
   */
  drawProgressBar(x, y, width, height, cornerRadius) {
    // Draw background (rounded rectangle)
    this.ctx.fillStyle = this.styles.progressBg;
    this.roundRect(x, y, width, height, cornerRadius);
    this.ctx.fill();
    
    // Draw progress value with gradient
    const filledWidth = (width * this.state.progress) / 100;
    
    if (filledWidth > 0) {
      const gradient = this.ctx.createLinearGradient(x, 0, x + filledWidth, 0);
      
      // Determine color based on progress percentage using CSS variables
      if (this.state.progress >= 30) {
        gradient.addColorStop(0, this.styles.progressSuccess.start);
        gradient.addColorStop(1, this.styles.progressSuccess.end);
      } else if (this.state.progress >= 10) {
        gradient.addColorStop(0, this.styles.progressWarning.start);
        gradient.addColorStop(1, this.styles.progressWarning.end);
      } else {
        gradient.addColorStop(0, this.styles.progressDanger.start);
        gradient.addColorStop(1, this.styles.progressDanger.end);
      }
      
      this.ctx.fillStyle = gradient;
      this.roundRect(x, y, filledWidth, height, cornerRadius);
      this.ctx.fill();
    }
  }

  /**
   * Draw circular progress bar around a center point
   * Progress depletes counterclockwise from top
   */
  drawCircularProgress(centerX, centerY, radius, thickness, startAngle = -90) {
    const ctx = this.ctx;
    
    // Convert start angle to radians
    const startRad = (startAngle * Math.PI) / 180;
    const progressPercent = this.state.progress / 100;
    
    // Draw background circle (full ring)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = this.styles.progressBg;
    ctx.stroke();
    
    // Draw progress arc with gradient color based on percentage
    if (this.state.progress > 0) {
      // Determine color based on progress percentage
      let color1, color2;
      if (this.state.progress >= 30) {
        color1 = this.styles.progressSuccess.start;
        color2 = this.styles.progressSuccess.end;
      } else if (this.state.progress >= 10) {
        color1 = this.styles.progressWarning.start;
        color2 = this.styles.progressWarning.end;
      } else {
        color1 = this.styles.progressDanger.start;
        color2 = this.styles.progressDanger.end;
      }
      
      // Handle full circle (100%) specially
      if (this.state.progress >= 99.9) {
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
        const endRad = startRad - (2 * Math.PI * progressPercent);
        
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
   * Draw countdown timer (large, centered, monospace font)
   */
  drawCountdown(x, y) {
    const fontSize = this.layout.countdown.fontSize;
    this.ctx.font = `${this.styles.countdownWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.fillStyle = this.styles.countdownColor;
    this.ctx.textAlign = this.layout.countdown.alignment;
    this.ctx.textBaseline = 'middle';
    
    // Add subtle shadow for depth
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 4;
    
    this.ctx.fillText(this.state.countdown, x, y);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;
  }

  /**
   * Draw clock display (smaller, below countdown)
   */
  drawClock(x, y) {
    const fontSize = this.layout.clock.fontSize;
    this.ctx.font = `${this.styles.clockWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.fillStyle = this.styles.clockColor;
    this.ctx.textAlign = this.layout.clock.alignment || 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillText(this.state.clock, x, y);
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw elapsed time display
   */
  drawElapsed(x, y) {
    const fontSize = this.layout.elapsed.fontSize;
    this.ctx.font = `${this.styles.elapsedWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.fillStyle = this.styles.elapsedColor;
    this.ctx.textAlign = this.layout.elapsed.alignment || 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw label
    this.ctx.globalAlpha = 0.7;
    this.ctx.font = `normal ${fontSize * 0.5}px ${this.styles.fontFamily}`;
    this.ctx.fillText('ELAPSED', x, y - fontSize * 0.7);
    
    // Draw time
    this.ctx.globalAlpha = 1.0;
    this.ctx.font = `${this.styles.elapsedWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.fillText(this.state.elapsed, x, y);
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
    const fontSize = this.layout.message.fontSize;
    const lineHeight = this.layout.message.lineHeight;
    const maxLines = this.layout.message.maxLines;
    
    this.ctx.font = `${this.styles.messageWeight} ${fontSize}px ${this.styles.fontFamily}`;
    this.ctx.fillStyle = this.styles.messageColor;
    this.ctx.textAlign = this.layout.message.alignment;
    this.ctx.textBaseline = 'middle';
    
    // Word wrap to multiple lines based on layout config
    const maxWidth = this.canvas.width * 0.85;
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
    
    // Draw lines with proper spacing based on lineHeight
    const lineSpacing = fontSize * lineHeight;
    const totalHeight = (lines.length - 1) * lineSpacing;
    const startY = y - totalHeight / 2;
    
    lines.forEach((line, index) => {
      this.ctx.fillText(line, x, startY + index * lineSpacing);
    });
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

  /**
   * Handle window resize - maintain 16:9 aspect ratio
   */
  handleResize() {
    this.setupCanvas();
  }

  /**
   * Update theme and refresh cached CSS variables
   * @param {string} theme - 'dark' or 'light'
   */
  updateTheme(theme) {
    this.state.theme = theme;
    // Wait for CSS to update before reading computed styles
    setTimeout(() => {
      this.updateStyleCache();
    }, 0);
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
    this.stopAnimation();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    window.removeEventListener('resize', () => this.handleResize());
  }
}

// Make available globally
window.CanvasRenderer = CanvasRenderer;
