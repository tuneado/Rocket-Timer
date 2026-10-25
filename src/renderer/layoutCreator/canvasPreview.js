/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Canvas Preview for Layout Creator
 * Renders a live preview of the layout being edited.
 * Draws through UnifiedCanvasRenderer with mock data, plus editor-only grid,
 * video placeholder and element highlights.
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

    // Drag state
    this.dragState = null;

    // Draw with the same renderer as the main preview and external display,
    // so the editor always matches the real output
    this.renderer = new UnifiedCanvasRenderer(this.width, this.height);
    this.renderer.watermark.enabled = false;
    this.renderer.setState({
      countdown: this.mockState.countdown,
      clock: this.mockState.clock,
      elapsed: this.mockState.elapsed,
      endTime: this.mockState.endTime,
      message: this.mockState.message,
      showMessage: true,
      showClock: true,
      progress: this.mockState.progress,
      remainingTime: 5 * 60 * 1000
    });
    // Skip the progress bar's ease-in animation; each preview frame is a single render
    this.renderer.progressAnimation.current = this.mockState.progress;

    // Editor-only layer: placeholder for the video feed
    const renderer = this.renderer;
    renderer.drawVideoFrame = () => {
      this._drawVideoLayer(renderer.ctx, renderer.layout.videoFrame || renderer.layout.video);
    };

    // Setup canvas dimensions
    this.canvas.width = this.width;
    this.canvas.height = this.height;
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
    const renderer = this.renderer;

    // Keep the renderer's canvas in sync with the layout resolution
    if (renderer.width !== this.width || renderer.height !== this.height) {
      renderer.width = this.width;
      renderer.height = this.height;
      renderer.masterCanvas.width = this.width;
      renderer.masterCanvas.height = this.height;
    }

    // Assigned directly: setLayout() logs on every call, and this runs on every drag move
    renderer.layout = this.layout;
    renderer.renderFrame();

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(renderer.masterCanvas, 0, 0);

    // Grid on top of the frame so elements and the video layer can't hide it
    if (this.showGrid) this._drawGrid(this.ctx);
    if (this.guides) this._drawGuides();
  }

  /**
   * Snap guides shown while dragging (canvas coordinates)
   */
  _drawGuides() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    // ~1 screen pixel, whatever the preview zoom
    ctx.save();
    ctx.lineWidth = rect.width ? Math.max(1, this.width / rect.width) : 2;
    ctx.strokeStyle = '#ff3bd4';
    for (const x of this.guides.x) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (const y of this.guides.y) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ============================================================================
  // DRAWING HELPERS
  // ============================================================================

  _parsePos(value, axis, dim) {
    return this.renderer.parsePosition(value, axis, dim);
  }

  _parseSize(value, dim) {
    return this.renderer.parseSize(value, dim);
  }

  _drawGrid(ctx) {
    const step = this.width / 12;
    const rect = this.canvas.getBoundingClientRect();
    // ~1 screen pixel, whatever the preview zoom
    const lineWidth = rect.width ? Math.max(1, this.width / rect.width) : 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = lineWidth;

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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = lineWidth * 1.5;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2, this.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(this.width, this.height / 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw video layer placeholder (stands in for the live camera feed)
   */
  _drawVideoLayer(ctx, config) {
    if (!config) return;
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

    // Where a 16:9 source lands with the chosen scaling
    const scaling = config.scaling || this.renderer.videoScaling;
    const src = this.renderer.getVideoDrawRect(1920, 1080, x, y, w, h, scaling);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(src.dx, src.dy, src.dw, src.dh);
    ctx.setLineDash([12, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(src.dx + 1, src.dy + 1, src.dw - 2, src.dh - 2);
    ctx.setLineDash([]);

    // Centre label
    const iconSize = Math.min(w, h) * 0.06;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `bold ${iconSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶  VIDEO LAYER', x + w / 2, y + h / 2);
    ctx.font = `${iconSize * 0.55}px sans-serif`;
    ctx.fillText(CanvasPreview.SCALING_LABELS[scaling] || scaling, x + w / 2, y + h / 2 + iconSize * 1.1);

    ctx.restore();
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

    const elements = LayoutEditorState.getAllKeys(this.layout);
    // First in elementOrder = top layer, so clicks reach the element drawn on top
    const order = this.layout.elementOrder || elements;

    for (const key of elements) {
      const config = this.layout[key];
      if (!config || !config.enabled) continue;

      if (!this._getElementBounds(key, config)) continue;

      const div = document.createElement('div');
      div.className = `lc-element-highlight${this.selectedElement === key ? ' selected' : ''}`;
      div.dataset.element = key;
      div.style.zIndex = order.length - order.indexOf(key);

      const label = document.createElement('span');
      label.className = 'lc-el-label';
      label.textContent = LayoutEditorState.getMetaFor(this.layout, key).label;
      div.appendChild(label);

      // Resize handles and position marker — only on selected element
      if (this.selectedElement === key) {
        const anchor = document.createElement('div');
        anchor.className = 'lc-anchor';
        anchor.title = 'Position point (what X/Y set)';
        div.appendChild(anchor);

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
      this.syncHighlight(key);
    }
  }

  /**
   * Move one highlight box to its element's current bounds (cheap; used while dragging)
   */
  syncHighlight(key) {
    const div = this.highlights[key];
    const config = this.layout?.[key];
    if (!div || !config) return;
    const bounds = this._getElementBounds(key, config);
    if (!bounds) return;

    // Canvas offset within the wrapper (accounts for centering/padding)
    const canvasRect = this.canvas.getBoundingClientRect();
    const overlayRect = this.overlay.getBoundingClientRect();
    const scaleX = canvasRect.width / this.width;
    const scaleY = canvasRect.height / this.height;
    div.style.left = `${canvasRect.left - overlayRect.left + bounds.x * scaleX}px`;
    div.style.top = `${canvasRect.top - overlayRect.top + bounds.y * scaleY}px`;
    div.style.width = `${bounds.w * scaleX}px`;
    div.style.height = `${bounds.h * scaleY}px`;

    // Marker at the element's position point (what X/Y refer to)
    const anchor = div.querySelector('.lc-anchor');
    if (anchor) {
      const ax = key === 'separator' ? bounds.x + bounds.w / 2 : this._parsePos(config.position.x, 'x', this.width);
      const ay = this._parsePos(config.position.y, 'y', this.height);
      anchor.style.left = `${(ax - bounds.x) * scaleX}px`;
      anchor.style.top = `${(ay - bounds.y) * scaleY}px`;
    }
  }

  /**
   * Extent of an element along one axis, as used for aligning it
   */
  _getAlignExtent(key, config, axis) {
    const dim = axis === 'x' ? this.width : this.height;
    // The separator's hit box is padded; align the line itself
    if (key === 'separator' && axis === 'y') {
      const t = config.thickness || 3;
      return { start: this._parsePos(config.position.y, 'y', dim) - t / 2, size: t };
    }
    const b = this._getElementBounds(key, config);
    if (!b) return null;
    return axis === 'x' ? { start: b.x, size: b.w } : { start: b.y, size: b.h };
  }

  /**
   * Position value that places the element's box at the canvas start, centre or end.
   * Every element type stores a different point (text: alignment point, bar/video:
   * top-left corner, ring: centre), so this works from the drawn box instead.
   * @param {'x'|'y'} axis
   * @param {'start'|'center'|'end'} where
   */
  getAlignedPosition(key, axis, where) {
    const config = this.layout?.[key];
    const extent = config && this._getAlignExtent(key, config, axis);
    if (!extent) return null;

    const dim = axis === 'x' ? this.width : this.height;
    const anchor = this._parsePos(config.position[axis], axis, dim);
    const target = where === 'start' ? 0 : where === 'center' ? (dim - extent.size) / 2 : dim - extent.size;
    const value = anchor + (target - extent.start);

    // Keep the resolution-independent keyword when it lands exactly
    const keywords = axis === 'x' ? ['left', 'center', 'right'] : ['top', 'middle', 'bottom'];
    const k = [0, dim / 2, dim].findIndex(v => Math.abs(v - value) < 0.5);
    return k !== -1 ? keywords[k] : `${((value / dim) * 100).toFixed(2)}%`;
  }

  /**
   * Which of start/center/end the element's box is currently aligned to, if any
   */
  getAlignment(key, axis) {
    const config = this.layout?.[key];
    const extent = config && this._getAlignExtent(key, config, axis);
    if (!extent) return null;
    const dim = axis === 'x' ? this.width : this.height;
    const targets = { start: 0, center: (dim - extent.size) / 2, end: dim - extent.size };
    return Object.keys(targets).find(k => Math.abs(targets[k] - extent.start) < 1) || null;
  }

  /**
   * Get bounding box for an element (in canvas coordinates)
   */
  _getElementBounds(key, config) {
    const w = this.width;
    const h = this.height;

    // Video and shapes: position is the box's top-left corner
    if (key === 'video' || LayoutEditorState.isShape(config)) {
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
      // Linear: position is the bar's top-left corner, as in UnifiedCanvasRenderer
      const bw = this._parseSize(config.size?.width || '90%', w);
      const bh = this._parseSize(config.size?.height || '4%', h);
      const bx = this._parsePos(config.position.x, 'x', w);
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

    const textContent = this.mockState[key] || 'Sample';

    // Same box maths as the renderer's text backgrounds, with the label above the time
    const renderer = this.renderer;
    const styles = renderer.styles;
    const weight = {
      countdown: styles.countdownWeight,
      clock: styles.clockWeight,
      elapsed: styles.elapsedWeight,
      endTime: styles.clockWeight,
      message: styles.messageWeight
    }[key];
    const label = (key === 'elapsed' || key === 'endTime') && config.showLabel
      ? renderer.getTimeLabel(config, key === 'elapsed' ? 'ELAPSED' : 'ENDS AT')
      : null;
    renderer.ctx.font = `${weight} ${fontSize}px ${styles.fontFamily}`;
    const box = renderer.getTextBlockBox(posX, posY, textContent, fontSize, alignment, label);

    // Include the background box when it's drawn
    const bg = config.background;
    if (bg && bg.enabled) {
      const pad = bg.padding !== undefined ? bg.padding : fontSize * 0.3;
      return { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
    }
    return box;
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
      startBounds: this._getElementBounds(elementKey, config),
      scaleX,
      scaleY
    };
  }

  /**
   * Move drag
   * @returns {{ x: string, y: string }|null} New position values (as percentages) or null
   */
  moveDrag(mouseX, mouseY, snap = true) {
    if (!this.dragState) return null;

    const { elementKey, startMouseX, startMouseY, startPosX, startPosY, startBounds, scaleX, scaleY } = this.dragState;
    let dx = (mouseX - startMouseX) * scaleX;
    let dy = (mouseY - startMouseY) * scaleY;

    // Snap the element's edges/centre to the canvas and other elements
    this.guides = null;
    if (snap && startBounds) {
      const threshold = 6 * scaleX; // ~6 screen pixels
      const targets = this._getSnapTargets(elementKey);
      const b = startBounds;
      const snapX = elementKey === 'separator'
        ? null // always centred horizontally
        : this._findSnap([b.x + dx, b.x + dx + b.w / 2, b.x + dx + b.w], targets.x, threshold);
      const snapY = this._findSnap([b.y + dy, b.y + dy + b.h / 2, b.y + dy + b.h], targets.y, threshold);
      if (snapX) dx += snapX.offset;
      if (snapY) dy += snapY.offset;
      if (snapX || snapY) {
        this.guides = { x: snapX ? [snapX.target] : [], y: snapY ? [snapY.target] : [] };
      }
    }

    let newX = startPosX + dx;
    let newY = startPosY + dy;

    // Clamp to canvas bounds
    newX = Math.max(0, Math.min(this.width, newX));
    newY = Math.max(0, Math.min(this.height, newY));

    // Convert to percentage strings (2 decimals keeps snapped positions within a fraction of a pixel)
    const xPercent = `${((newX / this.width) * 100).toFixed(2)}%`;
    const yPercent = `${((newY / this.height) * 100).toFixed(2)}%`;

    return { x: xPercent, y: yPercent, elementKey };
  }

  /**
   * End drag
   */
  endDrag() {
    this.dragState = null;
    this.guides = null;
  }

  /**
   * Snap lines: canvas edges and centre, plus edges and centres of other visible elements
   */
  _getSnapTargets(excludeKey) {
    const x = [0, this.width / 2, this.width];
    const y = [0, this.height / 2, this.height];
    for (const key of LayoutEditorState.getAllKeys(this.layout)) {
      const config = this.layout[key];
      if (key === excludeKey || !config || !config.enabled) continue;
      const b = this._getElementBounds(key, config);
      if (!b) continue;
      x.push(b.x, b.x + b.w / 2, b.x + b.w);
      y.push(b.y, b.y + b.h / 2, b.y + b.h);
    }
    return { x, y };
  }

  /**
   * Closest (point, target) pair within threshold, as the offset to apply
   */
  _findSnap(points, targets, threshold) {
    let best = null;
    for (const p of points) {
      for (const t of targets) {
        const d = t - p;
        if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.offset))) {
          best = { offset: d, target: t };
        }
      }
    }
    return best;
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

  moveResize(mouseX, mouseY, keepRatio = false, snap = true) {
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
    const pct = (v, dim) => `${((v / dim) * 100).toFixed(2)}%`;

    this.guides = null;
    const threshold = 6 * scaleX; // ~6 screen pixels
    const targets = snap ? this._getSnapTargets(elementKey) : null;
    const guides = { x: [], y: [] };
    const snapTo = (value, axis) => {
      if (!targets) return value;
      const hit = this._findSnap([value], targets[axis], threshold);
      if (!hit) return value;
      guides[axis].push(hit.target);
      return hit.target;
    };
    const finish = (updates) => {
      if (guides.x.length || guides.y.length) this.guides = guides;
      return { elementKey, updates };
    };

    // Video, shapes and the linear bar: edges move freely
    const isBox = elementKey === 'video' || LayoutEditorState.isShape(config) ||
      (elementKey === 'progressBar' && config.type !== 'circular');

    if (isBox) {
      let left = startBounds.x;
      let top = startBounds.y;
      let right = startBounds.x + startBounds.w;
      let bottom = startBounds.y + startBounds.h;
      if (handle.includes('e')) right = Math.max(left + 10, snapTo(right + dx, 'x'));
      if (handle.includes('w')) left = Math.min(right - 10, snapTo(left + dx, 'x'));
      if (handle.includes('s')) bottom = Math.max(top + 10, snapTo(bottom + dy, 'y'));
      if (handle.includes('n')) top = Math.min(bottom - 10, snapTo(top + dy, 'y'));

      // Keep the starting aspect ratio, anchored at the opposite edge/corner
      if (keepRatio && startBounds.w > 0 && startBounds.h > 0) {
        const ratio = startBounds.w / startBounds.h;
        let w = right - left;
        let h = bottom - top;
        const snappedX = guides.x.length > 0;
        const snappedY = guides.y.length > 0;
        const followWidth = handle === 'e' || handle === 'w' ||
          (handle.length === 2 && (snappedX && !snappedY || (snappedX === snappedY && w / startBounds.w > h / startBounds.h)));
        if (followWidth) { h = w / ratio; guides.y = []; } else { w = h * ratio; guides.x = []; }
        if (handle.includes('w')) left = right - w; else right = left + w;
        if (handle.includes('n')) top = bottom - h; else bottom = top + h;
      }

      const updates = {
        'size.width': pct(right - left, this.width),
        'size.height': pct(bottom - top, this.height)
      };
      if (handle.includes('w')) updates['position.x'] = pct(left, this.width);
      if (handle.includes('n')) updates['position.y'] = pct(top, this.height);
      return finish(updates);
    }

    // Ring, separator and text grow around a fixed point; scale so the dragged edge
    // follows the cursor (and its snap target)
    let pivotX = startBounds.x + startBounds.w / 2;
    let pivotY = startBounds.y + startBounds.h / 2;
    if (elementKey !== 'progressBar' && elementKey !== 'separator') {
      pivotX = this._parsePos(config.position.x, 'x', this.width);
      pivotY = this._parsePos(config.position.y, 'y', this.height);
    }
    const scaleFor = (axis) => {
      const side = axis === 'x' ? (handle.includes('e') ? 'end' : handle.includes('w') ? 'start' : null)
        : (handle.includes('s') ? 'end' : handle.includes('n') ? 'start' : null);
      if (!side) return null;
      const start = axis === 'x' ? startBounds.x : startBounds.y;
      const size = axis === 'x' ? startBounds.w : startBounds.h;
      const pivot = axis === 'x' ? pivotX : pivotY;
      const edge0 = side === 'end' ? start + size : start;
      if (Math.abs(edge0 - pivot) < 1) return null; // edge sits on the pivot; can't scale from it
      const edge = snapTo(edge0 + (axis === 'x' ? dx : dy), axis);
      return Math.max(0.05, (edge - pivot) / (edge0 - pivot));
    };

    if (elementKey === 'separator') {
      const s = scaleFor('x');
      return finish(s ? { width: pct(startBounds.w * s, this.width) } : {});
    }

    // Text and ring: one scale for both axes; a corner follows the axis that moved more
    const sx = scaleFor('x');
    const sy = scaleFor('y');
    let scale = sy ?? sx;
    if (sx && sy) scale = Math.abs(sx - 1) > Math.abs(sy - 1) ? sx : sy;
    if (!scale) return finish({});
    // Only keep the guide for the axis that drove the scale
    if (scale === sx) guides.y = []; else guides.x = [];

    if (elementKey === 'progressBar') {
      const outer = startBounds.w / 2 * scale;
      const diameter = Math.max(20, (outer - startThickness / 2) * 2);
      const size = pct(diameter, this.height);
      return finish({ 'size.width': size, 'size.height': size });
    }

    // Text: font size scales with the box. Always from startFontSize (snapshotted at
    // drag start), not the live config value, so the scale doesn't compound each frame.
    return finish({ fontSize: Math.max(8, Math.round(startFontSize * scale)) });
  }

  endResize() {
    this.resizeState = null;
    this.guides = null;
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

// Video scaling modes, as named in the inspector
CanvasPreview.SCALING_LABELS = {
  contain: 'Fit',
  cover: 'Fill',
  stretch: 'Stretch',
  none: 'Original size'
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasPreview;
}
if (typeof window !== 'undefined') {
  window.CanvasPreview = CanvasPreview;
}
