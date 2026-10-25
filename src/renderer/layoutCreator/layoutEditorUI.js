/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Editor UI - Inspector Panel Builder
 * Builds dynamic property-editing panels for each layout element.
 * Isolated module for Layout Creator feature.
 * /
 */
const VIDEO_FRAME_PRESETS = [
  { value: 'full', label: 'Full' },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
  { value: '4:3', label: '4:3', ratio: 4 / 3 },
  { value: '1:1', label: '1:1', ratio: 1 },
  { value: '9:16', label: '9:16', ratio: 9 / 16 }
];

const COLOR_PRESETS = [
  'rgba(0,0,0,0.7)',
  'rgba(0,0,0,0.4)',
  'rgba(255,255,255,0.15)',
  'rgba(255,255,255,1)',
  'rgba(255,71,87,1)',
  'rgba(255,149,0,1)',
  'rgba(76,175,80,1)',
  'rgba(59,130,246,1)'
];

class LayoutEditorUI {
  /**
   * @param {HTMLElement} container - Inspector panel mount point
   * @param {LayoutEditorState} state - Editor state instance
   * @param {CanvasPreview} preview - Used to align element boxes to the canvas
   */
  constructor(container, state, preview) {
    this.container = container;
    this.state = state;
    this.preview = preview;
    this._inputDebounces = {};
  }

  /**
   * Render the inspector for the currently selected element
   */
  render() {
    const key = this.state.selectedElement;
    this.container.innerHTML = '';

    if (!key) {
      this.container.innerHTML = `
        <div class="lc-empty-inspector">
          <i class="bi bi-cursor-fill" style="font-size: 2rem; opacity:.3"></i>
          <p style="opacity:.5; margin-top:.5rem">Select an element to edit its properties</p>
        </div>`;
      return;
    }

    const el = this.state.layout[key];
    if (!el) return;
    const meta = LayoutEditorState.getMetaFor(this.state.layout, key);

    // Header (shape names are user text)
    const header = document.createElement('div');
    header.className = 'lc-inspector-header';
    header.innerHTML = `<i class="bi ${meta.icon}"></i> <span></span>`;
    header.querySelector('span').textContent = meta.label;
    this.container.appendChild(header);

    // Enabled toggle
    this._addToggle('Visible', el.enabled, (v) => {
      this.state.toggleElement(key);
    });

    if (!el.enabled) {
      const note = document.createElement('p');
      note.className = 'lc-disabled-note';
      note.textContent = 'Enable this element to edit properties';
      this.container.appendChild(note);
      return;
    }

    // Build sections based on element type
    // For video with fitToCanvas: skip position section (position is auto-filled)
    if (key === 'video' && el.fitToCanvas) {
      // no position section
    } else if (key === 'separator') {
      this._addSection('Position');
      this._addPositionInput(key, el, 'y');
    } else {
      this._addSection('Position');
      this._addPositionInput(key, el, 'x');
      this._addPositionInput(key, el, 'y');
    }

    // Element-specific properties
    switch (key) {
      case 'progressBar':
        this._buildProgressBarProps(key, el);
        break;
      case 'countdown':
      case 'clock':
        this._buildTextProps(key, el);
        this._buildBackgroundProps(key, el);
        break;
      case 'elapsed':
        this._buildTextProps(key, el);
        this._buildElapsedProps(key, el);
        this._buildBackgroundProps(key, el);
        break;
      case 'endTime':
        this._buildTextProps(key, el);
        this._buildEndTimeProps(key, el);
        this._buildBackgroundProps(key, el);
        break;
      case 'separator':
        this._buildSeparatorProps(key, el);
        break;
      case 'message':
        this._buildMessageProps(key, el);
        break;
      case 'video':
        this._buildVideoProps(key, el);
        break;
      default:
        if (LayoutEditorState.isShape(el)) this._buildShapeProps(key, el);
    }
  }

  // ============================================================================
  // ELEMENT-SPECIFIC PROPERTY BUILDERS
  // ============================================================================

  _buildProgressBarProps(key, el) {
    this._addSection('Size');

    this._addSelect('Type', el.type || 'linear', [
      { value: 'linear', label: 'Linear Bar' },
      { value: 'circular', label: 'Circular Ring' }
    ], (v) => {
      this.state.updateElement(key, 'type', v);
    });

    if (el.type === 'circular') {
      // Single diameter field — width & height stay interlocked (it's a circle)
      this._addTextInput('Diameter', el.size?.width || '83%', (v) => {
        this.state.updateElement(key, 'size.width', v);
        this.state.updateElement(key, 'size.height', v);
      });
      this._addSection('Style');
      this._addNumber('Ring Thickness', el.thickness ?? 40, 5, 200, 1, (v) => {
        this.state.updateElement(key, 'thickness', v);
      });
      this._addNumber('Start Angle', el.startAngle ?? -90, -360, 360, 5, (v) => {
        this.state.updateElement(key, 'startAngle', v);
      });
    } else {
      this._addTextInput('Width', el.size?.width || '90%', (v) => {
        this.state.updateElement(key, 'size.width', v);
      });
      this._addTextInput('Height', el.size?.height || '4%', (v) => {
        this.state.updateElement(key, 'size.height', v);
      });
      this._addSection('Style');
      this._addNumber('Corner Radius', el.cornerRadius ?? 25, 0, 100, 1, (v) => {
        this.state.updateElement(key, 'cornerRadius', v);
      });
    }
  }

  _buildTextProps(key, el) {
    this._addSection('Typography');
    this._addNumber('Font Size', el.fontSize ?? 60, 10, 500, 5, (v) => {
      this.state.updateElement(key, 'fontSize', v);
    });
    this._addSelect('Alignment', el.alignment || 'center', [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' }
    ], (v) => {
      this.state.updateElement(key, 'alignment', v);
    });
    this._addRange('Opacity', el.opacity ?? 1, 0, 1, 0.05, (v) => {
      this.state.updateElement(key, 'opacity', v);
    });
  }

  _buildElapsedProps(key, el) {
    this._addSection('Elapsed Options');
    this._addSelect('Format', el.format || 'HH:MM:SS', [
      { value: 'HH:MM:SS', label: 'HH:MM:SS' },
      { value: 'HH:MM', label: 'HH:MM' },
      { value: 'MM:SS', label: 'MM:SS' }
    ], (v) => {
      this.state.updateElement(key, 'format', v);
    });
    this._addToggle('Show Label', el.showLabel ?? false, (v) => {
      this.state.updateElement(key, 'showLabel', v);
    });
    if (el.showLabel) {
      this._addTextInput('Label', el.label || 'Elapsed:', (v) => {
        this.state.updateElement(key, 'label', v);
      });
      this._addNumber('Label Size', el.labelSize ?? 20, 10, 100, 1, (v) => {
        this.state.updateElement(key, 'labelSize', v);
      });
      this._addLabelLineHeight(key, el);
    }
  }

  _buildEndTimeProps(key, el) {
    this._addSection('End Time Options');
    this._addSelect('Format', el.format || 'HH:MM:SS', [
      { value: 'HH:MM:SS', label: 'HH:MM:SS' },
      { value: 'HH:MM', label: 'HH:MM' }
    ], (v) => {
      this.state.updateElement(key, 'format', v);
    });
    this._addToggle('Show Label', el.showLabel ?? false, (v) => {
      this.state.updateElement(key, 'showLabel', v);
    });
    if (el.showLabel) {
      this._addTextInput('Label', el.label || 'Ends at:', (v) => {
        this.state.updateElement(key, 'label', v);
      });
      this._addNumber('Label Size', el.labelSize ?? 35, 10, 100, 1, (v) => {
        this.state.updateElement(key, 'labelSize', v);
      });
      this._addLabelLineHeight(key, el);
    }
  }

  /**
   * Spacing between a time label and the time, like CSS line-height.
   * Layouts without a value show the spacing they already render with.
   */
  _addLabelLineHeight(key, el) {
    const fontSize = el.fontSize ?? 60;
    const labelSize = el.labelSize || fontSize * 0.5;
    const current = el.labelLineHeight ?? (1.4 * fontSize) / (fontSize + labelSize);
    this._addRange('Line Height', current, 0.5, 2.5, 0.05, (v) => {
      this.state.updateElement(key, 'labelLineHeight', v);
    });
  }

  _buildSeparatorProps(key, el) {
    this._addSection('Separator Style');
    this._addTextInput('Width', el.width || '90%', (v) => {
      this.state.updateElement(key, 'width', v);
    });
    this._addNumber('Thickness', el.thickness ?? 3, 1, 20, 1, (v) => {
      this.state.updateElement(key, 'thickness', v);
    });
  }

  _buildMessageProps(key, el) {
    this._addSection('Typography');
    this._addNumber('Font Size', el.fontSize ?? 60, 10, 300, 5, (v) => {
      this.state.updateElement(key, 'fontSize', v);
    });
    this._addSelect('Alignment', el.alignment || 'center', [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' }
    ], (v) => {
      this.state.updateElement(key, 'alignment', v);
    });
    this._addRange('Opacity', el.opacity ?? 1, 0, 1, 0.05, (v) => {
      this.state.updateElement(key, 'opacity', v);
    });

    this._addSection('Message Options');
    this._addNumber('Max Lines', el.maxLines ?? 2, 1, 5, 1, (v) => {
      this.state.updateElement(key, 'maxLines', v);
    });
    this._addRange('Line Height', el.lineHeight ?? 1.3, 0.8, 2.5, 0.1, (v) => {
      this.state.updateElement(key, 'lineHeight', v);
    });
    this._addToggle('Show Background', el.showBackground ?? false, (v) => {
      this.state.updateElement(key, 'showBackground', v);
    });
  }

  _buildVideoProps(key, el) {
    this._addSection('Frame');
    this._addPresetButtons('Shape', VIDEO_FRAME_PRESETS, this._getVideoFramePreset(el), (preset) => {
      this._applyVideoFramePreset(key, el, preset);
    });
    this._addTextInput('Width', el.size?.width || '100%', (v) => {
      this.state.updateElement(key, 'size.width', v);
    });
    this._addTextInput('Height', el.size?.height || '100%', (v) => {
      this.state.updateElement(key, 'size.height', v);
    });

    this._addSection('Video');
    this._addSelect('Scaling', el.scaling || '', [
      { value: '', label: 'App setting' },
      { value: 'contain', label: 'Fit (show whole image)' },
      { value: 'cover', label: 'Fill (crop to frame)' },
      { value: 'stretch', label: 'Stretch' },
      { value: 'none', label: 'Original size' }
    ], (v) => {
      this.state.updateElementProps(key, { scaling: v || undefined }, 'scaling');
    });
    this._addRange('Opacity', el.opacity ?? 1, 0, 1, 0.05, (v) => {
      this.state.updateElement(key, 'opacity', v);
    });
  }

  _buildShapeProps(key, el) {
    const isLine = el.shape === 'line';

    this._addSection('Size');
    this._addTextInput('Width', el.size?.width || '20%', (v) => {
      this.state.updateElement(key, 'size.width', v);
    });
    this._addTextInput('Height', el.size?.height || '20%', (v) => {
      this.state.updateElement(key, 'size.height', v);
    });

    this._addSection('Shape');
    this._addTextInput('Name', el.name || '', (v) => {
      this.state.updateElement(key, 'name', v);
    });
    this._addSelect('Type', el.shape || 'rect', Object.entries(LayoutEditorState.getShapeTypes())
      .map(([value, m]) => ({ value, label: m.label })), (v) => {
      // Lines are drawn in the stroke colour; give them one and a visible thickness
      const updates = { shape: v };
      if (v === 'line' && !el.strokeWidth) updates.strokeWidth = 4;
      this.state.updateElementProps(key, updates, 'type');
    });
    if (el.shape === 'rect') {
      this._addNumber('Corner Radius', el.cornerRadius ?? 0, 0, 1000, 1, (v) => {
        this.state.updateElement(key, 'cornerRadius', v);
      });
    }
    if (!isLine) {
      this._addColor('Fill', el.fill || 'rgba(0,0,0,0)', (v) => {
        this.state.updateElement(key, 'fill', v);
      });
    }
    this._addColor(isLine ? 'Color' : 'Stroke', el.stroke || 'rgba(255,255,255,1)', (v) => {
      this.state.updateElement(key, 'stroke', v);
    });
    this._addNumber(isLine ? 'Thickness' : 'Stroke Width', el.strokeWidth ?? 0, isLine ? 1 : 0, 200, 1, (v) => {
      this.state.updateElement(key, 'strokeWidth', v);
    });
    this._addRange('Opacity', el.opacity ?? 1, 0, 1, 0.05, (v) => {
      this.state.updateElement(key, 'opacity', v);
    });

    this._addSection('Actions');
    this._addButton('Duplicate', () => this.state.duplicateShape(key));
    this._addButton('Delete Shape', () => this.state.removeShape(key));
  }

  /**
   * Which frame preset matches the current video size, if any
   */
  _getVideoFramePreset(el) {
    const res = this.state.layout.resolution;
    const { parsePosition, parseSize } = UnifiedCanvasRenderer.prototype;
    const w = parseSize(el.size?.width || '100%', res.width);
    const h = parseSize(el.size?.height || '100%', res.height);
    const x = parsePosition(el.position?.x ?? 0, 'x', res.width);
    const y = parsePosition(el.position?.y ?? 0, 'y', res.height);

    if (Math.abs(w - res.width) < 1 && Math.abs(h - res.height) < 1 && Math.abs(x) < 1 && Math.abs(y) < 1) {
      return 'full';
    }
    const match = VIDEO_FRAME_PRESETS.find(p => p.ratio && Math.abs(w / h - p.ratio) / p.ratio < 0.01);
    return match ? match.value : null;
  }

  /**
   * Resize the video frame to a preset shape.
   * Ratio presets keep the frame centred and as large as fits the current frame.
   */
  _applyVideoFramePreset(key, el, preset) {
    if (preset.value === 'full') {
      this.state.updateElementProps(key, {
        'position.x': 0, 'position.y': 0, 'size.width': '100%', 'size.height': '100%'
      }, 'frame');
      return;
    }

    const res = this.state.layout.resolution;
    const { parsePosition, parseSize } = UnifiedCanvasRenderer.prototype;
    const curW = parseSize(el.size?.width || '100%', res.width);
    const curH = parseSize(el.size?.height || '100%', res.height);
    const curX = parsePosition(el.position?.x ?? 0, 'x', res.width);
    const curY = parsePosition(el.position?.y ?? 0, 'y', res.height);

    let w = curW;
    let h = w / preset.ratio;
    if (h > curH) { h = curH; w = h * preset.ratio; }

    // Centre on the old frame, then keep it on the canvas
    const x = Math.min(Math.max(0, curX + (curW - w) / 2), res.width - w);
    const y = Math.min(Math.max(0, curY + (curH - h) / 2), res.height - h);
    const pct = (v, dim) => `${((v / dim) * 100).toFixed(1)}%`;

    this.state.updateElementProps(key, {
      'position.x': pct(x, res.width),
      'position.y': pct(y, res.height),
      'size.width': pct(w, res.width),
      'size.height': pct(h, res.height)
    }, 'frame');
  }

  _buildBackgroundProps(key, el) {
    if (!el.background) return;
    this._addSection('Background');
    this._addToggle('Enabled', el.background.enabled ?? false, (v) => {
      this.state.updateElement(key, 'background.enabled', v);
    });
    if (el.background.enabled) {
      this._addColor('Color', el.background.color || 'rgba(0,0,0,0.7)', (v) => {
        this.state.updateElement(key, 'background.color', v);
      });
      this._addNumber('Padding', el.background.padding ?? 20, 0, 100, 1, (v) => {
        this.state.updateElement(key, 'background.padding', v);
      });
      this._addNumber('Border Radius', el.background.borderRadius ?? 15, 0, 50, 1, (v) => {
        this.state.updateElement(key, 'background.borderRadius', v);
      });
    }
  }

  // ============================================================================
  // FORM CONTROL HELPERS
  // ============================================================================

  _addSection(title) {
    const div = document.createElement('div');
    div.className = 'lc-prop-section';
    div.textContent = title;
    this.container.appendChild(div);
  }

  _addPositionInput(key, el, axis) {
    const label = axis === 'x' ? 'X Position' : 'Y Position';
    const posValue = el.position?.[axis] ?? (axis === 'x' ? 'center' : 'middle');

    const row = this._createRow(label);
    const stack = document.createElement('div');
    stack.className = 'lc-prop-stack';

    // Manual input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'lc-input';
    input.value = posValue;
    input.placeholder = 'e.g., 50%, center, 960';

    // Preset buttons align the element's box to the canvas edge or centre
    const presets = axis === 'x'
      ? [['start', 'Left'], ['center', 'Center'], ['end', 'Right']]
      : [['start', 'Top'], ['center', 'Middle'], ['end', 'Bottom']];

    const presetBar = document.createElement('div');
    presetBar.className = 'lc-preset-bar';

    const syncActive = () => {
      const aligned = this.preview?.getAlignment(key, axis);
      for (const btn of presetBar.children) {
        btn.classList.toggle('active', aligned === btn.dataset.align);
      }
    };

    for (const [align, text] of presets) {
      const btn = document.createElement('button');
      btn.className = 'lc-preset-btn';
      btn.dataset.align = align;
      btn.textContent = text;
      btn.title = `Align to canvas ${text.toLowerCase()}`;
      btn.onclick = () => {
        const value = this.preview?.getAlignedPosition(key, axis, align);
        if (value === null || value === undefined) return;
        input.value = value;
        this.state.updateElement(key, `position.${axis}`, value);
        syncActive();
      };
      presetBar.appendChild(btn);
    }

    input.oninput = () => {
      this._debounce(`pos.${key}.${axis}`, () => {
        const v = input.value.trim();
        const num = parseFloat(v);
        if (!isNaN(num) && !v.includes('%')) {
          this.state.updateElement(key, `position.${axis}`, num);
        } else {
          this.state.updateElement(key, `position.${axis}`, v);
        }
        syncActive();
      }, 300);
    };

    syncActive();
    stack.appendChild(presetBar);
    stack.appendChild(input);
    row.appendChild(stack);
    this.container.appendChild(row);
  }

  /**
   * Row of preset buttons; presets are { value, label }
   */
  _addPresetButtons(label, presets, activeValue, onPick) {
    const row = this._createRow(label);
    const bar = document.createElement('div');
    bar.className = 'lc-preset-bar';
    for (const preset of presets) {
      const btn = document.createElement('button');
      btn.className = `lc-preset-btn${preset.value === activeValue ? ' active' : ''}`;
      btn.textContent = preset.label;
      btn.onclick = () => onPick(preset);
      bar.appendChild(btn);
    }
    row.appendChild(bar);
    this.container.appendChild(row);
  }

  /**
   * Color control: swatch (native picker), text value, alpha slider and quick presets.
   * Emits colors as rgba() strings.
   */
  _addColor(label, value, onChange) {
    const row = this._createRow(label);
    const stack = document.createElement('div');
    stack.className = 'lc-prop-stack';

    const field = document.createElement('div');
    field.className = 'lc-color-field';

    const swatch = document.createElement('label');
    swatch.className = 'lc-color-swatch';
    const swatchFill = document.createElement('span');
    const picker = document.createElement('input');
    picker.type = 'color';
    swatch.appendChild(swatchFill);
    swatch.appendChild(picker);

    const text = document.createElement('input');
    text.type = 'text';
    text.className = 'lc-input';
    text.spellcheck = false;

    field.appendChild(swatch);
    field.appendChild(text);

    const alphaWrap = document.createElement('div');
    alphaWrap.className = 'lc-range-wrapper';
    const alpha = document.createElement('input');
    alpha.type = 'range';
    alpha.className = 'lc-range';
    alpha.min = 0;
    alpha.max = 1;
    alpha.step = 0.05;
    alpha.title = 'Opacity';
    const alphaValue = document.createElement('span');
    alphaValue.className = 'lc-range-value';
    alphaWrap.appendChild(alpha);
    alphaWrap.appendChild(alphaValue);

    const presetRow = document.createElement('div');
    presetRow.className = 'lc-color-presets';

    let color = this._parseColor(value) || { r: 0, g: 0, b: 0, a: 1 };

    // Update every control except the one the change came from, then emit
    const apply = (next, source, emit = true) => {
      color = next;
      const css = `rgba(${color.r},${color.g},${color.b},${+color.a.toFixed(2)})`;
      swatchFill.style.background = css;
      if (source !== picker) picker.value = this._toHex(color);
      if (source !== text) text.value = css;
      if (source !== alpha) alpha.value = color.a;
      alphaValue.textContent = `${Math.round(color.a * 100)}%`;
      if (emit) this._debounce(`color.${label}`, () => onChange(css), 150);
    };

    picker.oninput = () => {
      const rgb = this._parseColor(picker.value);
      apply({ ...rgb, a: color.a }, picker);
    };
    alpha.oninput = () => apply({ ...color, a: parseFloat(alpha.value) }, alpha);
    text.oninput = () => {
      const parsed = this._parseColor(text.value.trim());
      text.classList.toggle('invalid', !parsed);
      if (parsed) apply(parsed, text);
    };

    for (const preset of COLOR_PRESETS) {
      const btn = document.createElement('button');
      btn.className = 'lc-color-preset';
      btn.title = preset;
      const fill = document.createElement('span');
      fill.style.background = preset;
      btn.appendChild(fill);
      btn.onclick = () => apply(this._parseColor(preset), null);
      presetRow.appendChild(btn);
    }

    apply(color, null, false);
    text.value = value;

    stack.appendChild(field);
    stack.appendChild(alphaWrap);
    stack.appendChild(presetRow);
    row.appendChild(stack);
    this.container.appendChild(row);
  }

  _addTextInput(label, value, onChange) {
    const row = this._createRow(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'lc-input';
    input.value = value;
    input.oninput = () => {
      this._debounce(`text.${label}`, () => onChange(input.value), 300);
    };
    row.appendChild(input);
    this.container.appendChild(row);
  }

  _addButton(label, onClick) {
    const row = document.createElement('div');
    row.className = 'lc-prop-row lc-prop-row-btn';
    const btn = document.createElement('button');
    btn.className = 'lc-btn lc-btn-secondary';
    btn.textContent = label;
    btn.onclick = onClick;
    row.appendChild(btn);
    this.container.appendChild(row);
  }

  _addNumber(label, value, min, max, step, onChange) {
    const row = this._createRow(label);
    const wrapper = document.createElement('div');
    wrapper.className = 'lc-number-wrapper';

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'lc-input lc-input-number';
    input.value = value;
    input.min = min;
    input.max = max;
    input.step = step;
    input.oninput = () => {
      const v = parseFloat(input.value);
      if (!isNaN(v)) onChange(v);
    };

    const decBtn = document.createElement('button');
    decBtn.className = 'lc-stepper-btn';
    decBtn.innerHTML = '<i class="bi bi-dash"></i>';
    decBtn.onclick = () => {
      const cur = parseFloat(input.value) || 0;
      const next = Math.max(min, cur - step);
      input.value = next;
      onChange(next);
    };

    const incBtn = document.createElement('button');
    incBtn.className = 'lc-stepper-btn';
    incBtn.innerHTML = '<i class="bi bi-plus"></i>';
    incBtn.onclick = () => {
      const cur = parseFloat(input.value) || 0;
      const next = Math.min(max, cur + step);
      input.value = next;
      onChange(next);
    };

    wrapper.appendChild(decBtn);
    wrapper.appendChild(input);
    wrapper.appendChild(incBtn);
    row.appendChild(wrapper);
    this.container.appendChild(row);
  }

  _addRange(label, value, min, max, step, onChange) {
    const row = this._createRow(label);
    const wrapper = document.createElement('div');
    wrapper.className = 'lc-range-wrapper';

    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'lc-range';
    range.value = value;
    range.min = min;
    range.max = max;
    range.step = step;

    const valueLabel = document.createElement('span');
    valueLabel.className = 'lc-range-value';
    valueLabel.textContent = Number(value).toFixed(2);

    range.oninput = () => {
      const v = parseFloat(range.value);
      valueLabel.textContent = v.toFixed(2);
      onChange(v);
    };

    wrapper.appendChild(range);
    wrapper.appendChild(valueLabel);
    row.appendChild(wrapper);
    this.container.appendChild(row);
  }

  _addSelect(label, value, options, onChange) {
    const row = this._createRow(label);
    const select = document.createElement('select');
    select.className = 'lc-input lc-select';
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === value) option.selected = true;
      select.appendChild(option);
    }
    select.onchange = () => onChange(select.value);
    row.appendChild(select);
    this.container.appendChild(row);
  }

  _addToggle(label, value, onChange) {
    const row = this._createRow(label);
    const toggle = document.createElement('label');
    toggle.className = 'lc-toggle';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    input.onchange = () => onChange(input.checked);

    const slider = document.createElement('span');
    slider.className = 'lc-toggle-slider';

    toggle.appendChild(input);
    toggle.appendChild(slider);
    row.appendChild(toggle);
    this.container.appendChild(row);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  _createRow(label) {
    const row = document.createElement('div');
    row.className = 'lc-prop-row';
    const lbl = document.createElement('label');
    lbl.className = 'lc-prop-label';
    lbl.textContent = label;
    row.appendChild(lbl);
    return row;
  }

  /**
   * Parse any CSS color into { r, g, b, a }, or null if it isn't one
   */
  _parseColor(str) {
    if (!str || !window.CSS.supports('color', str)) return null;
    if (!this._colorCtx) this._colorCtx = document.createElement('canvas').getContext('2d');
    const ctx = this._colorCtx;
    ctx.fillStyle = '#000';
    ctx.fillStyle = str;
    const v = ctx.fillStyle; // '#rrggbb' or 'rgba(r, g, b, a)'
    if (v.startsWith('#')) {
      return { r: parseInt(v.slice(1, 3), 16), g: parseInt(v.slice(3, 5), 16), b: parseInt(v.slice(5, 7), 16), a: 1 };
    }
    const [r, g, b, a] = v.match(/[\d.]+/g).map(Number);
    return { r, g, b, a: a ?? 1 };
  }

  _toHex({ r, g, b }) {
    return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
  }

  _debounce(id, fn, delay) {
    if (this._inputDebounces[id]) clearTimeout(this._inputDebounces[id]);
    this._inputDebounces[id] = setTimeout(fn, delay);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayoutEditorUI;
}
if (typeof window !== 'undefined') {
  window.LayoutEditorUI = LayoutEditorUI;
}
