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
class LayoutEditorUI {
  /**
   * @param {HTMLElement} container - Inspector panel mount point
   * @param {LayoutEditorState} state - Editor state instance
   */
  constructor(container, state) {
    this.container = container;
    this.state = state;
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

    const meta = LayoutEditorState.getElementMeta()[key];
    const el = this.state.layout[key];
    if (!el) return;

    // Header
    const header = document.createElement('div');
    header.className = 'lc-inspector-header';
    header.innerHTML = `<i class="bi ${meta.icon}"></i> <span>${meta.label}</span>`;
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
    }
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
    this._addSection('Visibility');
    this._addToggle('Enabled', el.enabled ?? false, (v) => {
      this.state.updateElement(key, 'enabled', v);
    });
    this._addSection('Video Options');
    this._addTextInput('Width', el.size?.width || '100%', (v) => {
      this.state.updateElement(key, 'size.width', v);
    });
    this._addTextInput('Height', el.size?.height || '100%', (v) => {
      this.state.updateElement(key, 'size.height', v);
    });
    this._addButton('Fit to Canvas', () => {
      this.state.updateElement(key, 'position.x', 0);
      this.state.updateElement(key, 'position.y', 0);
      this.state.updateElement(key, 'size.width', '100%');
      this.state.updateElement(key, 'size.height', '100%');
    });
    this._addRange('Opacity', el.opacity ?? 1, 0, 1, 0.05, (v) => {
      this.state.updateElement(key, 'opacity', v);
    });
  }

  _buildBackgroundProps(key, el) {
    if (!el.background) return;
    this._addSection('Background');
    this._addToggle('Enabled', el.background.enabled ?? false, (v) => {
      this.state.updateElement(key, 'background.enabled', v);
    });
    if (el.background.enabled) {
      this._addTextInput('Color', el.background.color || 'rgba(0,0,0,0.7)', (v) => {
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

    // Preset buttons
    const presets = axis === 'x'
      ? ['left', 'center', 'right']
      : ['top', 'middle', 'bottom'];

    const presetBar = document.createElement('div');
    presetBar.className = 'lc-preset-bar';

    for (const preset of presets) {
      const btn = document.createElement('button');
      btn.className = `lc-preset-btn${String(posValue).toLowerCase() === preset ? ' active' : ''}`;
      btn.textContent = preset.charAt(0).toUpperCase() + preset.slice(1);
      btn.onclick = () => {
        this.state.updateElement(key, `position.${axis}`, preset);
      };
      presetBar.appendChild(btn);
    }
    row.appendChild(presetBar);

    // Manual input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'lc-input';
    input.value = posValue;
    input.placeholder = 'e.g., 50%, center, 960';
    input.oninput = () => {
      this._debounce(`pos.${key}.${axis}`, () => {
        const v = input.value.trim();
        const num = parseFloat(v);
        if (!isNaN(num) && !v.includes('%')) {
          this.state.updateElement(key, `position.${axis}`, num);
        } else {
          this.state.updateElement(key, `position.${axis}`, v);
        }
      }, 300);
    };
    row.appendChild(input);

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
