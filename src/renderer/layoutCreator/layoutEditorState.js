/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Editor State Management
 * Manages the current layout being edited, undo/redo history, and dirty state.
 * Isolated module - can be deleted to remove Layout Creator feature.
 * /
 */
const ELEMENT_DEFAULTS = {
  progressBar: {
    enabled: true,
    zIndex: 20,
    position: { x: '5%', y: '15%' },
    size: { width: '90%', height: '4%' },
    cornerRadius: 25,
    type: 'linear'
  },
  countdown: {
    enabled: true,
    zIndex: 40,
    position: { x: 'center', y: 'middle' },
    fontSize: 250,
    alignment: 'center',
    opacity: 1.0,
    background: { enabled: false, color: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 15 }
  },
  clock: {
    enabled: true,
    zIndex: 50,
    position: { x: 'center', y: '67%' },
    fontSize: 90,
    alignment: 'center',
    opacity: 0.8,
    background: { enabled: false, color: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 10 }
  },
  elapsed: {
    enabled: false,
    zIndex: 60,
    position: { x: '25%', y: '15%' },
    fontSize: 40,
    alignment: 'center',
    format: 'HH:MM:SS',
    label: 'Elapsed:',
    showLabel: false,
    labelSize: 20,
    opacity: 1.0,
    background: { enabled: false, color: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 }
  },
  endTime: {
    enabled: false,
    zIndex: 70,
    position: { x: '85%', y: '15%' },
    fontSize: 40,
    alignment: 'center',
    format: 'HH:MM:SS',
    label: 'ENDS AT',
    showLabel: false,
    labelSize: 20,
    opacity: 0.8,
    background: { enabled: false, color: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 }
  },
  separator: {
    enabled: true,
    zIndex: 30,
    position: { y: '75%' },
    width: '90%',
    thickness: 3,
    orientation: 'horizontal'
  },
  message: {
    enabled: true,
    zIndex: 80,
    position: { x: 'center', y: '85%' },
    fontSize: 60,
    alignment: 'center',
    maxLines: 2,
    lineHeight: 1.3,
    showBackground: false,
    opacity: 1.0
  },
  video: {
    enabled: false,
    position: { x: 0, y: 0 },
    size: { width: '100%', height: '100%' },
    opacity: 1.0
  }
};

const ELEMENT_META = {
  progressBar: { icon: 'bi-bar-chart-fill', label: 'Progress Bar' },
  countdown:   { icon: 'bi-stopwatch-fill', label: 'Countdown' },
  clock:       { icon: 'bi-clock-fill',     label: 'Clock' },
  elapsed:     { icon: 'bi-hourglass-split',label: 'Elapsed Time' },
  endTime:     { icon: 'bi-calendar-check', label: 'End Time' },
  separator:   { icon: 'bi-dash-lg',        label: 'Separator' },
  message:     { icon: 'bi-chat-fill',       label: 'Message' },
  video:       { icon: 'bi-camera-video-fill', label: 'Video' }
};

const SHAPE_META = {
  rect:    { icon: 'bi-square-fill', label: 'Rectangle' },
  ellipse: { icon: 'bi-circle-fill', label: 'Ellipse' },
  line:    { icon: 'bi-slash-lg',    label: 'Line' }
};

const SHAPE_DEFAULTS = {
  rect:    { size: { width: '25%', height: '25%' }, fill: 'rgba(59,130,246,1)', stroke: 'rgba(255,255,255,1)', strokeWidth: 0, cornerRadius: 0 },
  ellipse: { size: { width: '20%', height: '35.56%' }, fill: 'rgba(59,130,246,1)', stroke: 'rgba(255,255,255,1)', strokeWidth: 0 },
  line:    { size: { width: '50%', height: '2%' }, stroke: 'rgba(255,255,255,1)', strokeWidth: 4 }
};

const isShape = (config) => !!config && config.kind === 'shape';

class LayoutEditorState {
  constructor() {
    this.layout = null;
    this.layoutId = null;
    this.selectedElement = null;
    this.dirty = false;
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    this.listeners = new Set();
  }

  /**
   * Initialize with a blank layout
   */
  createNew() {
    this.layout = {
      name: 'New Layout',
      description: '',
      resolution: { width: 1920, height: 1080 },
      elementOrder: Object.keys(ELEMENT_META),
      ...this._cloneDefaults()
    };
    this.layoutId = null;
    this.dirty = false;
    this.history = [];
    this.historyIndex = -1;
    this._pushHistory();
    this._notify('init');
  }

  /**
   * Load an existing layout for editing (deep clone)
   */
  loadLayout(id, layoutData) {
    this.layout = JSON.parse(JSON.stringify(layoutData));
    // Back-compat: ensure elementOrder exists
    if (!this.layout.elementOrder) {
      this.layout.elementOrder = Object.keys(ELEMENT_META);
    }
    // Back-compat: fill in any elements added after this layout was created
    const defaults = JSON.parse(JSON.stringify(ELEMENT_DEFAULTS));
    for (const key of Object.keys(ELEMENT_META)) {
      if (!this.layout[key]) {
        this.layout[key] = defaults[key];
      } else {
        // Merge top-level defaults so existing configs gain new properties
        for (const prop of Object.keys(defaults[key])) {
          if (this.layout[key][prop] === undefined) {
            this.layout[key][prop] = defaults[key][prop];
          }
        }
      }
    }
    this.layoutId = id;
    this.dirty = false;
    this.history = [];
    this.historyIndex = -1;
    this._pushHistory();
    this._notify('init');
  }

  /**
   * Clone from an existing layout as a starting point
   */
  cloneFrom(layoutData, newName) {
    this.layout = JSON.parse(JSON.stringify(layoutData));
    this.layout.name = newName || `${layoutData.name} (Copy)`;
    this.layout.description = `Based on ${layoutData.name}`;
    this.layoutId = null; // New layout, no existing ID
    this.dirty = true;
    // Back-compat: fill in any elements added after this layout was created
    const defaults = JSON.parse(JSON.stringify(ELEMENT_DEFAULTS));
    for (const key of Object.keys(ELEMENT_META)) {
      if (!this.layout[key]) {
        this.layout[key] = defaults[key];
      } else {
        for (const prop of Object.keys(defaults[key])) {
          if (this.layout[key][prop] === undefined) {
            this.layout[key][prop] = defaults[key][prop];
          }
        }
      }
    }
    this.history = [];
    this.historyIndex = -1;
    this._pushHistory();
    this._notify('init');
  }

  /**
   * Get the current layout data (deep clone)
   */
  getLayout() {
    return JSON.parse(JSON.stringify(this.layout));
  }

  /**
   * Update a top-level layout property (name, description, resolution)
   */
  updateMeta(key, value) {
    if (!this.layout) return;
    if (key === 'resolution') {
      this.layout.resolution = { ...this.layout.resolution, ...value };
    } else {
      this.layout[key] = value;
    }
    this.dirty = true;
    this._pushHistory();
    this._notify('meta', key);
  }

  /**
   * Update an element property
   * @param {string} elementKey - e.g., 'countdown', 'clock'
   * @param {string} propPath - dot-separated path, e.g., 'position.x', 'fontSize'
   * @param {*} value - new value
   */
  updateElement(elementKey, propPath, value) {
    if (!this.layout || !this.layout[elementKey]) return;

    const parts = propPath.split('.');
    let obj = this.layout[elementKey];
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;

    this.dirty = true;
    this._pushHistory();
    this._notify('element', elementKey, propPath);
  }

  /**
   * Update several element properties as one undo step
   * @param {string} elementKey - e.g., 'video'
   * @param {Object} updates - { 'size.width': '50%', 'position.x': 0, ... }
   * @param {string} [eventProp] - propPath reported to subscribers
   */
  updateElementProps(elementKey, updates, eventProp) {
    if (!this.layout || !this.layout[elementKey]) return;

    for (const [propPath, value] of Object.entries(updates)) {
      const parts = propPath.split('.');
      let obj = this.layout[elementKey];
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    }

    this.dirty = true;
    this._pushHistory();
    this._notify('element', elementKey, eventProp);
  }

  /**
   * Add a shape centred on the canvas, on top of the layer order, and select it
   * @param {'rect'|'ellipse'|'line'} type
   */
  addShape(type) {
    if (!this.layout || !SHAPE_META[type]) return null;
    const key = `shape-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const defaults = JSON.parse(JSON.stringify(SHAPE_DEFAULTS[type]));
    const w = parseFloat(defaults.size.width);
    const h = parseFloat(defaults.size.height);
    const count = this.getElementOrder().filter(k => this.layout[k]?.shape === type).length;

    this.layout[key] = {
      kind: 'shape',
      shape: type,
      name: `${SHAPE_META[type].label} ${count + 1}`,
      enabled: true,
      position: { x: `${(50 - w / 2).toFixed(2)}%`, y: `${(50 - h / 2).toFixed(2)}%` },
      opacity: 1,
      ...defaults
    };
    this.getElementOrder().unshift(key);
    this.selectedElement = key;
    this.dirty = true;
    this._pushHistory();
    this._notify('reorder');
    this._notify('select', key);
    return key;
  }

  /**
   * Copy a shape just above the original, nudged so both stay visible
   */
  duplicateShape(key) {
    const src = this.layout?.[key];
    if (!isShape(src)) return null;
    const copyKey = `shape-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const copy = JSON.parse(JSON.stringify(src));
    copy.name = `${src.name || SHAPE_META[src.shape]?.label || 'Shape'} copy`;
    const offset = (v) => (typeof v === 'string' && v.includes('%')) ? `${(parseFloat(v) + 2).toFixed(2)}%` : v;
    copy.position = { x: offset(src.position?.x), y: offset(src.position?.y) };

    this.layout[copyKey] = copy;
    const order = this.getElementOrder();
    order.splice(order.indexOf(key), 0, copyKey);
    this.selectedElement = copyKey;
    this.dirty = true;
    this._pushHistory();
    this._notify('reorder');
    this._notify('select', copyKey);
    return copyKey;
  }

  /**
   * Delete a shape (built-in elements can only be hidden)
   */
  removeShape(key) {
    if (!isShape(this.layout?.[key])) return false;
    delete this.layout[key];
    this.layout.elementOrder = this.getElementOrder().filter(k => k !== key);
    if (this.selectedElement === key) this.selectedElement = null;
    this.dirty = true;
    this._pushHistory();
    this._notify('reorder');
    this._notify('select', null);
    return true;
  }

  /**
   * Toggle element enabled/disabled
   */
  toggleElement(elementKey) {
    if (!this.layout || !this.layout[elementKey]) return;
    this.layout[elementKey].enabled = !this.layout[elementKey].enabled;
    this.dirty = true;
    this._pushHistory();
    this._notify('toggle', elementKey);
  }

  /**
   * Select an element for editing
   */
  selectElement(elementKey) {
    this.selectedElement = elementKey;
    this._notify('select', elementKey);
  }

  /**
   * Undo the last change
   */
  undo() {
    if (this.historyIndex <= 0) return false;
    this.historyIndex--;
    this.layout = JSON.parse(this.history[this.historyIndex]);
    this.dirty = true;
    this._notify('undo');
    return true;
  }

  /**
   * Redo the last undone change
   */
  redo() {
    if (this.historyIndex >= this.history.length - 1) return false;
    this.historyIndex++;
    this.layout = JSON.parse(this.history[this.historyIndex]);
    this.dirty = true;
    this._notify('redo');
    return true;
  }

  /**
   * Check if undo/redo is possible
   */
  canUndo() { return this.historyIndex > 0; }
  canRedo() { return this.historyIndex < this.history.length - 1; }

  /**
   * Mark layout as saved (not dirty)
   */
  markSaved(id) {
    this.dirty = false;
    if (id) this.layoutId = id;
    this._notify('saved');
  }

  /**
   * Commit current state to history after a drag operation.
   * Call this once when drag ends (not during drag).
   */
  commitDrag(elementKey) {
    this.dirty = true;
    this._pushHistory();
    this._notify('element', elementKey, 'position');
  }

  /**
   * Get the current element rendering / z-order array.
   */
  getElementOrder() {
    if (!this.layout.elementOrder) {
      this.layout.elementOrder = Object.keys(ELEMENT_META);
    }
    return this.layout.elementOrder;
  }

  /**
   * Move an element to a new index in elementOrder.
   */
  reorderElement(key, newIndex) {
    const order = this.getElementOrder();
    const oldIndex = order.indexOf(key);
    if (oldIndex === -1 || oldIndex === newIndex) return;
    order.splice(oldIndex, 1);
    order.splice(newIndex, 0, key);
    this.dirty = true;
    this._pushHistory();
    this._notify('reorder');
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - (event, ...args)
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Private helpers

  _pushHistory() {
    const snapshot = JSON.stringify(this.layout);
    // Remove future states if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
  }

  _notify(event, ...args) {
    this.listeners.forEach(fn => {
      try { fn(event, ...args); } catch (e) { console.error('State listener error:', e); }
    });
  }

  _cloneDefaults() {
    return JSON.parse(JSON.stringify(ELEMENT_DEFAULTS));
  }

  /**
   * Get element metadata (icon, label) for all elements
   */
  static getElementMeta() {
    return ELEMENT_META;
  }

  static isShape(config) {
    return isShape(config);
  }

  static getShapeTypes() {
    return SHAPE_META;
  }

  /**
   * Icon and label for any element in a layout, including shapes
   */
  static getMetaFor(layout, key) {
    const config = layout?.[key];
    if (isShape(config)) {
      const m = SHAPE_META[config.shape] || SHAPE_META.rect;
      return { icon: m.icon, label: config.name || m.label };
    }
    return ELEMENT_META[key];
  }

  /**
   * Built-in element keys plus the layout's shape keys
   */
  static getAllKeys(layout) {
    const shapes = layout ? Object.keys(layout).filter(k => isShape(layout[k])) : [];
    return [...Object.keys(ELEMENT_META), ...shapes];
  }

  /**
   * Get the ordered list of element keys
   */
  static getElementKeys() {
    return Object.keys(ELEMENT_META);
  }

  /**
   * Get default element config
   */
  static getElementDefault(key) {
    return JSON.parse(JSON.stringify(ELEMENT_DEFAULTS[key]));
  }
}

// Export for both module and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayoutEditorState;
}
if (typeof window !== 'undefined') {
  window.LayoutEditorState = LayoutEditorState;
}
