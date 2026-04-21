/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Canvas Preview for Layout Creator
 * Renders a live preview of the layout being edited.
 * Mirrors UnifiedCanvasRenderer drawing logic but with mock data and element highlights.
 * /
 */
class CanvasPreview {
  constructor(canvas, overlayEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.overlay = overlayEl; // DOM element for interactive highlights
    this.width = 1920;
    this.height = 1080;
    this.layout = null;
    this.selectedElement = null;
    this.showGrid = false;
    this.highlights = {};

    // Mock state for preview
    this.mockState = {
      countdown: '00:05:00',
      clock: '14:32:08',
      elapsed: '00:02:15',
      endTime: '14:37:08',
      message: 'Sample message text',
      progress: 72
    };

    // Styles (dark theme defaults for preview)
    this.styles = {
      background: '#1a1a1a',
      countdownColor: '#ffffff',
      clockColor: '#cccccc',
      messageColor: '#ffffff',
      messageBackgroundColor: 'rgba(0, 0, 0, 0.6)',
      elapsedColor: '#cccccc',
      separatorColor: '#444444',
      progressBg: '#333333',
      fontFamily: 'Inter, sans-serif',
      countdownWeight: '700',
      clockWeight: '400',
      messageWeight: '400',
      elapsedWeight: '400',
      progressSuccess: { start: '#22c55e', end: '#16a34a' },
      progressWarning: { start: '#f59e0b', end: '#d97706' },
      progressDanger: { start: '#ef4444', end: '#dc2626' }
    };

    // Drag state
    this.dragState = null;

    // Try to read CSS variables from current page
    this._loadStyles();

    // Setup canvas dimensions
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  /**
   * Load CSS variable styles from the document
   */
  _loadStyles() {
    try {
      const s = getComputedStyle(document.documentElement);
      const get = (prop) => s.getPropertyValue(prop).trim();
      
      if (get('--canvas-background')) this.styles.background = get('--canvas-background');
      if (get('--canvas-countdown-color')) this.styles.countdownColor = get('--canvas-countdown-color');
      if (get('--canvas-clock-color')) this.styles.clockColor = get('--canvas-clock-color');
      if (get('--canvas-message-color')) this.styles.messageColor = get('--canvas-message-color');
      if (get('--canvas-message-background-color')) this.styles.messageBackgroundColor = get('--canvas-message-background-color');
      if (get('--canvas-elapsed-color')) this.styles.elapsedColor = get('--canvas-elapsed-color');
      if (get('--canvas-separator-color')) this.styles.separatorColor = get('--canvas-separator-color');
      if (get('--canvas-progress-bg')) this.styles.progressBg = get('--canvas-progress-bg');
      if (get('--canvas-font-family')) this.styles.fontFamily = get('--canvas-font-family');
      if (get('--canvas-countdown-weight')) this.styles.countdownWeight = get('--canvas-countdown-weight');
      if (get('--canvas-clock-weight')) this.styles.clockWeight = get('--canvas-clock-weight');
      if (get('--canvas-message-weight')) this.styles.messageWeight = get('--canvas-message-weight');
      if (get('--canvas-elapsed-weight')) this.styles.elapsedWeight = get('--canvas-elapsed-weight');
      if (get('--canvas-progress-success-start')) this.styles.progressSuccess.start = get('--canvas-progress-success-start');
      if (get('--canvas-progress-success-end')) this.styles.progressSuccess.end = get('--canvas-progress-success-end');
      if (get('--canvas-progress-warning-start')) this.styles.progressWarning.start = get('--canvas-progress-warning-start');
      if (get('--canvas-progress-warning-end')) this.styles.progressWarning.end = get('--canvas-progress-warning-end');
      if (get('--canvas-progress-danger-start')) this.styles.progressDanger.start = get('--canvas-progress-danger-start');
      if (get('--canvas-progress-danger-end')) this.styles.progressDanger.end = get('--canvas-progress-danger-end');
    } catch (e) {
      // Use defaults
    }
  }

  /**
   * Set the layout to preview
   */
  setLayout(layout) {
    this.layout = layout;
    if (layout && layout.resolution) {
      this.width = layout.resolution.width || 1920;
      this.height = layout.resolution.height || 1080;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
    this.render();
    this.updateHighlights();
  }

  /**
   * Set the selected element key (for highlight)
   */
  setSelectedElement(key) {
    this.selectedElement = key;
    this.render();
    this.updateHighlights();
  }

  /**
   * Toggle grid overlay
   */
  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.render();
    return this.showGrid;
  }

  /**
   * Render a full preview frame
   */
  render() {
    if (!this.layout) return;
    const { width, height } = this;
    const ctx = this.ctx;

    // Clear background
    ctx.fillStyle = this.styles.background;
    ctx.fillRect(0, 0, width, height);

    // Draw grid if enabled
    if (this.showGrid) {
      this._drawGrid();
    }

    // Draw elements in reverse elementOrder (last = bottom, first = top)
    // Sidebar: top of list = top layer, bottom of list = bottom layer
    const defaultOrder = ['progressBar', 'separator', 'countdown', 'clock', 'elapsed', 'endTime', 'message', 'video'];
    const elementOrder = (this.layout.elementOrder || defaultOrder).slice().reverse();
    for (const key of elementOrder) {
      this._drawElement(key);
    }
  }

  // ============================================================================
  // DRAWING HELPERS
  // ============================================================================

  /**
   * Dispatch a single element to its draw method
   */
  _drawElement(key) {
    const l = this.layout;
    switch (key) {
      case 'video':
        if (l.video?.enabled) this._drawVideoLayer(l.video);
        break;
      case 'progressBar':
        if (l.progressBar?.enabled) this._drawProgressBar(l.progressBar);
        break;
      case 'separator':
        if (l.separator?.enabled) this._drawSeparator(l.separator);
        break;
      case 'countdown':
        if (l.countdown?.enabled)
          this._drawText(l.countdown, this.mockState.countdown, this.styles.countdownColor, this.styles.countdownWeight);
        break;
      case 'clock':
        if (l.clock?.enabled)
          this._drawText(l.clock, this.mockState.clock, this.styles.clockColor, this.styles.clockWeight);
        break;
      case 'elapsed':
        if (l.elapsed?.enabled) this._drawElapsedElement(l.elapsed);
        break;
      case 'endTime':
        if (l.endTime?.enabled) this._drawEndTimeElement(l.endTime);
        break;
      case 'message':
        if (l.message?.enabled) this._drawMessage(l.message);
        break;
    }
  }

  _parsePos(value, axis, dim) {
    // Match UnifiedCanvasRenderer.parsePosition exactly
    const named = {
      x: { left: 0, center: 0.5, right: 1 },
      y: { top: 0, middle: 0.5, bottom: 1 }
    };
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (named[axis] && named[axis][lower] !== undefined) return dim * named[axis][lower];
      if (value.includes('%')) return dim * parseFloat(value) / 100;
      // Numeric strings: < 1 = fraction, >= 1 = pixels
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed >= 1 ? parsed : dim * parsed;
      }
      return 0;
    }
    if (typeof value === 'number') {
      // < 1 = fraction of dimension, >= 1 = absolute pixels
      return value >= 1 ? value : dim * value;
    }
    return dim * 0.5; // Default to center like UnifiedCanvasRenderer
  }

  _parseSize(value, dim) {
    // Match UnifiedCanvasRenderer.parseSize exactly
    if (typeof value === 'string' && value.includes('%')) {
      return dim * parseFloat(value) / 100;
    }
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    return numValue >= 1 ? numValue : dim * numValue;
  }

  _drawGrid() {
    const ctx = this.ctx;
    const step = this.width / 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = step; x < this.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    // Horizontal lines (same step)
    for (let y = step; y < this.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    // Center cross
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2, this.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(this.width, this.height / 2);
    ctx.stroke();
  }

  /**
   * Draw video layer placeholder
   */
  _drawVideoLayer(config) {
    const ctx = this.ctx;
    const w = this._parseSize(config.size?.width || '100%', this.width);
    const h = this._parseSize(config.size?.height || '100%', this.height);
    const x = this._parsePos(config.position?.x ?? 0, 'x', this.width);
    const y = this._parsePos(config.position?.y ?? 0, 'y', this.height);
    const opacity = config.opacity !== undefined ? config.opacity : 1;

    ctx.save();
    ctx.globalAlpha = opacity;

    // Clip to bounds so stripes don't overflow
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Dark background fill
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(x, y, w, h);

    // Subtle diagonal lines to indicate video area
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    const step = 80;
    for (let i = -h; i < w + h; i += step) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + h, y + h);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);

    // Centre label
    const iconSize = Math.min(w, h) * 0.06;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `bold ${iconSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶  VIDEO LAYER', x + w / 2, y + h / 2);

    ctx.restore();
  }

  _drawProgressBar(pb) {
    // Circular type → separate draw method
    if (pb.type === 'circular') {
      this._drawCircularProgress(pb);
      return;
    }

    const ctx = this.ctx;
    const w = this._parseSize(pb.size?.width || '90%', this.width);
    const h = this._parseSize(pb.size?.height || '4%', this.height);
    // Named anchors for x: 'center' → bar centred, 'right' → right-aligned, 'left' / % → left edge
    let x = this._parsePos(pb.position.x, 'x', this.width);
    if (typeof pb.position.x === 'string') {
      const lx = pb.position.x.toLowerCase();
      if (lx === 'center') x -= w / 2;
      else if (lx === 'right') x -= w;
    }
    const y = this._parsePos(pb.position.y, 'y', this.height);
    const r = pb.cornerRadius || 0;
    const progress = this.mockState.progress / 100;

    // Background track
    ctx.fillStyle = this.styles.progressBg;
    this._roundRect(x, y, w, h, r);

    // Progress fill
    const fillW = w * progress;
    if (fillW > 0) {
      const gradient = ctx.createLinearGradient(x, y, x + fillW, y);
      gradient.addColorStop(0, this.styles.progressSuccess.start);
      gradient.addColorStop(1, this.styles.progressSuccess.end);
      ctx.fillStyle = gradient;
      
      ctx.save();
      ctx.beginPath();
      this._roundRectPath(x, y, w, h, r);
      ctx.clip();
      ctx.fillRect(x, y, fillW, h);
      ctx.restore();
    }
  }

  _drawCircularProgress(pb) {
    const ctx = this.ctx;
    const centerX = this._parsePos(pb.position.x, 'x', this.width);
    const centerY = this._parsePos(pb.position.y, 'y', this.height);
    // Derive radius from size (diameter), anchored to canvas height so % feels intuitive
    const diameter = this._parseSize(pb.size?.width || '83%', this.height);
    const radius = diameter / 2;
    const thickness = pb.thickness || 30;
    const startAngle = pb.startAngle !== undefined ? pb.startAngle : -90;
    const startRad = (startAngle * Math.PI) / 180;
    const progress = this.mockState.progress / 100;

    // Background ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = this.styles.progressBg;
    ctx.stroke();

    // Progress arc (counterclockwise)
    if (progress > 0) {
      const endRad = startRad - (2 * Math.PI * progress);
      const gx1 = centerX + radius * Math.cos(startRad);
      const gy1 = centerY + radius * Math.sin(startRad);
      const gx2 = centerX + radius * Math.cos(endRad);
      const gy2 = centerY + radius * Math.sin(endRad);
      const gradient = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
      gradient.addColorStop(0, this.styles.progressSuccess.start);
      gradient.addColorStop(1, this.styles.progressSuccess.end);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startRad, endRad, true);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = gradient;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  _drawSeparator(sep) {
    const ctx = this.ctx;
    const y = this._parsePos(sep.position.y, 'y', this.height);
    const w = this._parseSize(sep.width, this.width);
    const startX = (this.width - w) / 2;

    ctx.strokeStyle = this.styles.separatorColor;
    ctx.lineWidth = sep.thickness || 2;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + w, y);
    ctx.stroke();
  }

  _drawText(config, text, color, weight) {
    const ctx = this.ctx;
    const x = this._parsePos(config.position.x, 'x', this.width);
    const y = this._parsePos(config.position.y, 'y', this.height);
    const fontSize = config.fontSize || 60;
    const alignment = config.alignment || 'center';
    const opacity = config.opacity !== undefined ? config.opacity : 1;

    ctx.save();
    ctx.globalAlpha = opacity;

    // Background
    if (config.background && config.background.enabled) {
      const bg = config.background;
      ctx.font = `${weight || '400'} ${fontSize}px ${this.styles.fontFamily}`;
      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const textH = fontSize;
      const pad = bg.padding || 10;
      const br = bg.borderRadius || 0;

      let bgX = x - pad;
      if (alignment === 'center') bgX = x - textW / 2 - pad;
      else if (alignment === 'right') bgX = x - textW - pad;
      const bgY = y - textH / 2 - pad;

      ctx.fillStyle = bg.color || 'rgba(0,0,0,0.6)';
      this._roundRect(bgX, bgY, textW + pad * 2, textH + pad * 2, br);
    }

    // Text
    ctx.font = `${weight || '400'} ${fontSize}px ${this.styles.fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';

    if (alignment === 'center') {
      ctx.textAlign = 'center';
    } else if (alignment === 'right') {
      ctx.textAlign = 'right';
    } else {
      ctx.textAlign = 'left';
    }

    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * Draw elapsed time — label above, time below (mirrors UnifiedCanvasRenderer.drawElapsed)
   */
  _drawElapsedElement(config) {
    const ctx = this.ctx;
    const fontSize = config.fontSize || 60;
    const x = this._parsePos(config.position.x, 'x', this.width);
    const y = this._parsePos(config.position.y, 'y', this.height);
    const alignment = config.alignment || 'center';
    const opacity = config.opacity !== undefined ? config.opacity : 1;
    const label = config.label || 'ELAPSED';
    const labelSize = config.labelSize || Math.round(fontSize * 0.5);

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = alignment === 'right' ? 'right' : alignment === 'left' ? 'left' : 'center';

    if (config.showLabel) {
      ctx.globalAlpha = opacity * 0.7;
      ctx.font = `normal ${labelSize}px ${this.styles.fontFamily}`;
      ctx.fillStyle = this.styles.elapsedColor;
      ctx.fillText(label, x, y - fontSize * 0.7);
    }

    ctx.globalAlpha = opacity;
    ctx.font = `${this.styles.elapsedWeight} ${fontSize}px ${this.styles.fontFamily}`;
    ctx.fillStyle = this.styles.elapsedColor;
    ctx.fillText(this.mockState.elapsed, x, y);
    ctx.restore();
  }

  /**
   * Draw end time — label above, time below (mirrors UnifiedCanvasRenderer.drawEndTime)
   */
  _drawEndTimeElement(config) {
    const ctx = this.ctx;
    const fontSize = config.fontSize || 60;
    const x = this._parsePos(config.position.x, 'x', this.width);
    const y = this._parsePos(config.position.y, 'y', this.height);
    const alignment = config.alignment || 'center';
    const opacity = config.opacity !== undefined ? config.opacity : 0.8;
    const label = config.label || 'ENDS AT';
    const labelSize = config.labelSize || Math.round(fontSize * 0.5);

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = alignment === 'right' ? 'right' : alignment === 'left' ? 'left' : 'center';

    if (config.showLabel) {
      ctx.globalAlpha = opacity * 0.7;
      ctx.font = `normal ${labelSize}px ${this.styles.fontFamily}`;
      ctx.fillStyle = this.styles.elapsedColor;
      ctx.fillText(label, x, y - fontSize * 0.7);
    }

    ctx.globalAlpha = opacity;
    ctx.font = `${this.styles.clockWeight} ${fontSize}px ${this.styles.fontFamily}`;
    ctx.fillStyle = this.styles.elapsedColor;
    ctx.fillText(this.mockState.endTime, x, y);
    ctx.restore();
  }

  _drawMessage(msg) {
    const ctx = this.ctx;
    const x = this._parsePos(msg.position.x, 'x', this.width);
    const y = this._parsePos(msg.position.y, 'y', this.height);
    const fontSize = msg.fontSize || 60;
    const alignment = msg.alignment || 'center';
    const opacity = msg.opacity !== undefined ? msg.opacity : 1;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `${this.styles.messageWeight} ${fontSize}px ${this.styles.fontFamily}`;
    ctx.fillStyle = this.styles.messageColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = alignment;

    // Background
    if (msg.showBackground) {
      const metrics = ctx.measureText(this.mockState.message);
      const pad = 20;
      let bgX = alignment === 'center' ? x - metrics.width / 2 - pad : alignment === 'right' ? x - metrics.width - pad : x - pad;
      ctx.fillStyle = this.styles.messageBackgroundColor;
      this._roundRect(bgX, y - fontSize / 2 - pad, metrics.width + pad * 2, fontSize + pad * 2, 10);
      ctx.fillStyle = this.styles.messageColor;
    }

    ctx.fillText(this.mockState.message, x, y);
    ctx.restore();
  }

  _roundRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this._roundRectPath(x, y, w, h, r);
    this.ctx.fill();
  }

  _roundRectPath(x, y, w, h, r) {
    const ctx = this.ctx;
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ============================================================================
  // INTERACTIVE HIGHLIGHTS (DOM overlays on top of canvas)
  // ============================================================================

  /**
   * Update element highlight boxes (overlay DOM)
   */
  updateHighlights() {
    if (!this.overlay || !this.layout) return;
    // Skip highlight updates while dragging to avoid DOM churn
    if (this.dragState) return;

    this.overlay.innerHTML = '';
    this.highlights = {};

    // Calculate canvas offset within the wrapper (accounts for centering/padding)
    const canvasRect = this.canvas.getBoundingClientRect();
    const overlayRect = this.overlay.getBoundingClientRect();
    const offsetX = canvasRect.left - overlayRect.left;
    const offsetY = canvasRect.top - overlayRect.top;
    const scaleX = canvasRect.width / this.width;
    const scaleY = canvasRect.height / this.height;

    const elements = LayoutEditorState.getElementKeys();
    
    for (const key of elements) {
      const config = this.layout[key];
      if (!config || !config.enabled) continue;

      const bounds = this._getElementBounds(key, config);
      if (!bounds) continue;

      const div = document.createElement('div');
      div.className = `lc-element-highlight${this.selectedElement === key ? ' selected' : ''}`;
      div.style.left = `${offsetX + bounds.x * scaleX}px`;
      div.style.top = `${offsetY + bounds.y * scaleY}px`;
      div.style.width = `${bounds.w * scaleX}px`;
      div.style.height = `${bounds.h * scaleY}px`;
      div.dataset.element = key;

      const label = document.createElement('span');
      label.className = 'lc-el-label';
      label.textContent = LayoutEditorState.getElementMeta()[key].label;
      div.appendChild(label);

      // Resize handles — only on selected element
      if (this.selectedElement === key) {
        const handles = key === 'separator'
          ? ['e', 'w']                          // separator: width only
          : ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        for (const pos of handles) {
          const h = document.createElement('div');
          h.className = `lc-resize-handle lc-resize-${pos}`;
          h.dataset.handle = pos;
          h.dataset.element = key;
          div.appendChild(h);
        }
      }

      this.overlay.appendChild(div);
      this.highlights[key] = div;
    }
  }

  /**
   * Get bounding box for an element (in canvas coordinates)
   */
  _getElementBounds(key, config) {
    const w = this.width;
    const h = this.height;

    if (key === 'video') {
      const vw = this._parseSize(config.size?.width || '100%', this.width);
      const vh = this._parseSize(config.size?.height || '100%', this.height);
      const vx = this._parsePos(config.position?.x ?? 0, 'x', this.width);
      const vy = this._parsePos(config.position?.y ?? 0, 'y', this.height);
      return { x: vx, y: vy, w: vw, h: vh };
    }

    if (key === 'progressBar') {
      if (config.type === 'circular') {
        const cx = this._parsePos(config.position.x, 'x', w);
        const cy = this._parsePos(config.position.y, 'y', h);
        const diameter = this._parseSize(config.size?.width || '83%', h);
        const r = diameter / 2;
        const half = (config.thickness || 30) / 2;
        const outer = r + half;
        return { x: cx - outer, y: cy - outer, w: outer * 2, h: outer * 2 };
      }
      // Linear: apply same named-anchor logic as _drawProgressBar
      const bw = this._parseSize(config.size?.width || '90%', w);
      const bh = this._parseSize(config.size?.height || '4%', h);
      let bx = this._parsePos(config.position.x, 'x', w);
      if (typeof config.position.x === 'string') {
        const lx = config.position.x.toLowerCase();
        if (lx === 'center') bx -= bw / 2;
        else if (lx === 'right') bx -= bw;
      }
      const by = this._parsePos(config.position.y, 'y', h);
      return { x: bx, y: by, w: bw, h: bh };
    }

    if (key === 'separator') {
      const y = this._parsePos(config.position.y, 'y', h);
      const sw = this._parseSize(config.width, w);
      const startX = (w - sw) / 2;
      return { x: startX, y: y - 8, w: sw, h: 16 };
    }

    // Text elements (countdown, clock, elapsed, endTime, message)
    const fontSize = config.fontSize || 60;
    const posX = this._parsePos(config.position.x, 'x', w);
    const posY = this._parsePos(config.position.y, 'y', h);
    const alignment = config.alignment || 'center';

    // Estimate text width based on font size and content length
    let textContent = this.mockState[key] || 'Sample';
    if (key === 'message') textContent = this.mockState.message;
    // For elapsed/endTime label is drawn ABOVE — don't add it to width estimate
    if (key === 'endTime') textContent = this.mockState.endTime;
    if (key === 'elapsed') textContent = this.mockState.elapsed;

    const approxCharWidth = fontSize * 0.55;
    const textW = textContent.length * approxCharWidth;

    // When a label is shown above the time, extend bounding box upward
    const showLabel = (key === 'elapsed' || key === 'endTime') && config.showLabel;
    const labelSize = config.labelSize || Math.round(fontSize * 0.5);
    const labelExtra = showLabel ? (fontSize * 0.7 + labelSize * 0.5) : 0;
    const textH = fontSize * 1.2 + labelExtra;

    let x = posX;
    if (alignment === 'center') x = posX - textW / 2;
    else if (alignment === 'right') x = posX - textW;

    // y is the top of the bounding box; posY is the vertical center of the time text
    const y = posY - fontSize * 0.6 - labelExtra;
    return { x, y, w: textW, h: textH };
  }

  // ============================================================================
  // DRAG HANDLING
  // ============================================================================

  /**
   * Initiate drag on an element
   */
  startDrag(elementKey, mouseX, mouseY) {
    const config = this.layout[elementKey];
    if (!config) return;

    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / canvasRect.width;
    const scaleY = this.height / canvasRect.height;

    this.dragState = {
      elementKey,
      startMouseX: mouseX,
      startMouseY: mouseY,
      startPosX: this._parsePos(config.position.x, 'x', this.width),
      startPosY: this._parsePos(config.position.y, 'y', this.height),
      scaleX,
      scaleY
    };
  }

  /**
   * Move drag
   * @returns {{ x: string, y: string }|null} New position values (as percentages) or null
   */
  moveDrag(mouseX, mouseY) {
    if (!this.dragState) return null;

    const { elementKey, startMouseX, startMouseY, startPosX, startPosY, scaleX, scaleY } = this.dragState;
    const dx = (mouseX - startMouseX) * scaleX;
    const dy = (mouseY - startMouseY) * scaleY;

    let newX = startPosX + dx;
    let newY = startPosY + dy;

    // Clamp to canvas bounds
    newX = Math.max(0, Math.min(this.width, newX));
    newY = Math.max(0, Math.min(this.height, newY));

    // Convert to percentage strings
    const xPercent = `${((newX / this.width) * 100).toFixed(1)}%`;
    const yPercent = `${((newY / this.height) * 100).toFixed(1)}%`;

    return { x: xPercent, y: yPercent, elementKey };
  }

  /**
   * End drag
   */
  endDrag() {
    this.dragState = null;
  }

  // ============================================================================
  // RESIZE HANDLING
  // ============================================================================

  startResize(elementKey, handle, mouseX, mouseY) {
    const config = this.layout[elementKey];
    if (!config) return;
    const canvasRect = this.canvas.getBoundingClientRect();
    this.resizeState = {
      elementKey,
      handle,
      startMouseX: mouseX,
      startMouseY: mouseY,
      startBounds: { ...this._getElementBounds(elementKey, config) },
      scaleX: this.width / canvasRect.width,
      scaleY: this.height / canvasRect.height,
      // Snapshot original values so moveResize never reads the live (already mutated) config
      startFontSize:   config.fontSize   || 60,
      startSizeWidth:  config.size?.width,
      startSizeHeight: config.size?.height,
      startSepWidth:   config.width,
      startThickness:  config.thickness  || 30
    };
  }

  moveResize(mouseX, mouseY) {
    if (!this.resizeState) return null;
    const {
      elementKey, handle,
      startMouseX, startMouseY,
      startBounds, scaleX, scaleY,
      startFontSize, startThickness
    } = this.resizeState;
    const config = this.layout[elementKey];
    const dx = (mouseX - startMouseX) * scaleX;
    const dy = (mouseY - startMouseY) * scaleY;

    // Compute new bounds based on which handle is dragged
    let { x, y, w, h } = startBounds;
    if (handle.includes('e')) w = Math.max(10, startBounds.w + dx);
    if (handle.includes('w')) { x = startBounds.x + dx; w = Math.max(10, startBounds.w - dx); }
    if (handle.includes('s')) h = Math.max(10, startBounds.h + dy);
    if (handle.includes('n')) { y = startBounds.y + dy; h = Math.max(10, startBounds.h - dy); }

    const updates = {};

    if (elementKey === 'video') {
      updates['size.width']  = `${((w / this.width)  * 100).toFixed(1)}%`;
      updates['size.height'] = `${((h / this.height) * 100).toFixed(1)}%`;
      if (handle.includes('w')) updates['position.x'] = `${((x / this.width)  * 100).toFixed(1)}%`;
      if (handle.includes('n')) updates['position.y'] = `${((y / this.height) * 100).toFixed(1)}%`;
    } else if (elementKey === 'progressBar') {
      if (config.type === 'circular') {
        const newOuter = handle === 'n' || handle === 's'
          ? h / 2
          : handle === 'e' || handle === 'w'
            ? w / 2
            : Math.max(w, h) / 2;
        const newDiameter = Math.max(20, (newOuter - startThickness / 2) * 2);
        const pct = `${((newDiameter / this.height) * 100).toFixed(1)}%`;
        updates['size.width'] = pct;
        updates['size.height'] = pct;
      } else {
        updates['size.width']  = `${((w / this.width)  * 100).toFixed(1)}%`;
        updates['size.height'] = `${((h / this.height) * 100).toFixed(1)}%`;
        if (handle.includes('w')) {
          updates['position.x'] = `${((x / this.width) * 100).toFixed(1)}%`;
        }
      }
    } else if (elementKey === 'separator') {
      updates['width'] = `${((w / this.width) * 100).toFixed(1)}%`;
    } else {
      // Text elements: derive fontSize directly from startFontSize * ratio.
      // Always use startFontSize (snapshotted at drag start) — NOT the live config value,
      // which would cause the ratio to compound each frame.
      const ratio = h / startBounds.h;
      updates['fontSize'] = Math.max(8, Math.round(startFontSize * ratio));
    }

    return { elementKey, updates };
  }

  endResize() {
    this.resizeState = null;
  }

  /**
   * Update the layout reference in-place (avoids full re-clone during drag)
   */
  updateLayoutRef(layout) {
    this.layout = layout;
  }

  /**
   * Hit-test: which element is at this canvas-relative position?
   */
  hitTest(clientX, clientY) {
    const canvasRect = this.canvas.getBoundingClientRect();
    const x = ((clientX - canvasRect.left) / canvasRect.width) * this.width;
    const y = ((clientY - canvasRect.top) / canvasRect.height) * this.height;

    // Check elements in elementOrder (first = topmost, so check first)
    const defaultOrder = ['progressBar', 'separator', 'countdown', 'clock', 'elapsed', 'endTime', 'message', 'video'];
    const elements = this.layout?.elementOrder || defaultOrder;
    for (const key of elements) {
      const config = this.layout[key];
      if (!config || !config.enabled) continue;
      const bounds = this._getElementBounds(key, config);
      if (!bounds) continue;
      if (x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h) {
        return key;
      }
    }
    return null;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasPreview;
}
if (typeof window !== 'undefined') {
  window.CanvasPreview = CanvasPreview;
}
