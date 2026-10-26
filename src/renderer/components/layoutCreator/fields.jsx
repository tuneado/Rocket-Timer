/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Creator inspector form controls.
 * Rendered with the Layout Creator's own lc-* styles (layoutCreator.css).
 */
import { h } from 'preact';
import { useState, useEffect, useLayoutEffect, useRef } from 'preact/hooks';

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

/**
 * Call `fn` once input has paused for `delay` ms
 */
function useDebounced(fn, delay) {
  const timer = useRef(null);
  const latest = useRef(fn);
  latest.current = fn;
  return (...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => latest.current(...args), delay);
  };
}

/**
 * Local copy of a value that follows the prop, except while the field has focus
 * (so typing isn't overwritten by a re-render with the not-yet-saved value)
 */
export function useFieldValue(value) {
  const [local, setLocal] = useState(value);
  const focused = useRef(false);
  // Layout effect: update before paint, so a reset/undo never shows the old value
  useLayoutEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);
  const focusProps = {
    onFocus: () => { focused.current = true; },
    onBlur: () => { focused.current = false; setLocal(value); }
  };
  return [local, setLocal, focusProps];
}

export function Section({ title }) {
  return <div className="lc-prop-section">{title}</div>;
}

export function PropRow({ label, className = '', children }) {
  return (
    <div className={`lc-prop-row ${className}`}>
      <label className="lc-prop-label">{label}</label>
      {children}
    </div>
  );
}

/**
 * Text input that saves once typing pauses
 */
export function TextInput({ value, onChange, placeholder, className = 'lc-input' }) {
  const [local, setLocal, focusProps] = useFieldValue(value);
  const commit = useDebounced(onChange, 300);
  return (
    <input
      type="text"
      className={className}
      value={local}
      placeholder={placeholder}
      {...focusProps}
      onInput={(e) => { setLocal(e.target.value); commit(e.target.value); }}
    />
  );
}

export function TextField({ label, value, onChange, placeholder }) {
  return (
    <PropRow label={label}>
      <TextInput value={value} onChange={onChange} placeholder={placeholder} />
    </PropRow>
  );
}

export function NumberField({ label, value, min, max, step, onChange }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <PropRow label={label}>
      <div className="lc-number-wrapper">
        <button className="lc-stepper-btn" onClick={() => set((parseFloat(value) || 0) - step)}>
          <i className="bi bi-dash"></i>
        </button>
        <input
          type="number"
          className="lc-input lc-input-number"
          value={value}
          min={min}
          max={max}
          step={step}
          onInput={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
        />
        <button className="lc-stepper-btn" onClick={() => set((parseFloat(value) || 0) + step)}>
          <i className="bi bi-plus"></i>
        </button>
      </div>
    </PropRow>
  );
}

export function RangeField({ label, value, min, max, step, onChange }) {
  return (
    <PropRow label={label}>
      <div className="lc-range-wrapper">
        <input
          type="range"
          className="lc-range"
          value={value}
          min={min}
          max={max}
          step={step}
          onInput={(e) => onChange(parseFloat(e.target.value))}
        />
        <span className="lc-range-value">{Number(value).toFixed(2)}</span>
      </div>
    </PropRow>
  );
}

/**
 * options: [{ value, label }]
 */
export function SelectField({ label, value, options, onChange }) {
  return (
    <PropRow label={label}>
      <select className="lc-input lc-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </PropRow>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <PropRow label={label}>
      <label className="lc-toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="lc-toggle-slider"></span>
      </label>
    </PropRow>
  );
}

/**
 * Row of preset buttons; presets are { value, label, title? }
 */
export function PresetButtons({ presets, active, onPick }) {
  return (
    <div className="lc-preset-bar">
      {presets.map(p => (
        <button
          key={p.value}
          className={`lc-preset-btn${p.value === active ? ' active' : ''}`}
          title={p.title}
          onClick={() => onPick(p)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function ActionButton({ label, onClick }) {
  return (
    <div className="lc-prop-row lc-prop-row-btn">
      <button className="lc-btn lc-btn-secondary" onClick={onClick}>{label}</button>
    </div>
  );
}

// ============================================================================
// COLOR
// ============================================================================

let colorCtx = null;

/**
 * Parse any CSS color into { r, g, b, a }, or null if it isn't one
 */
export function parseColor(str) {
  if (!str || !window.CSS.supports('color', str)) return null;
  if (!colorCtx) colorCtx = document.createElement('canvas').getContext('2d');
  colorCtx.fillStyle = '#000';
  colorCtx.fillStyle = str;
  const v = colorCtx.fillStyle; // '#rrggbb' or 'rgba(r, g, b, a)'
  if (v.startsWith('#')) {
    return { r: parseInt(v.slice(1, 3), 16), g: parseInt(v.slice(3, 5), 16), b: parseInt(v.slice(5, 7), 16), a: 1 };
  }
  const [r, g, b, a] = v.match(/[\d.]+/g).map(Number);
  return { r, g, b, a: a ?? 1 };
}

const toHex = ({ r, g, b }) => '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
const toCss = ({ r, g, b, a }) => `rgba(${r},${g},${b},${+a.toFixed(2)})`;

/**
 * Color control: swatch (native picker), text value, alpha slider and quick presets.
 * Emits colors as rgba() strings.
 */
export function ColorField({ label, value, onChange }) {
  const [color, setColor] = useState(() => parseColor(value) || { r: 0, g: 0, b: 0, a: 1 });
  const [text, setText, focusProps] = useFieldValue(value);
  const [invalid, setInvalid] = useState(false);
  const commit = useDebounced(onChange, 150);

  // Follow outside changes (undo, another element selected)
  useEffect(() => {
    const parsed = parseColor(value);
    if (parsed) setColor(parsed);
  }, [value]);

  const apply = (next, { updateText = true } = {}) => {
    setColor(next);
    if (updateText) setText(toCss(next));
    commit(toCss(next));
  };

  return (
    <PropRow label={label}>
      <div className="lc-prop-stack">
        <div className="lc-color-field">
          <label className="lc-color-swatch">
            <span style={{ background: toCss(color) }}></span>
            <input
              type="color"
              value={toHex(color)}
              onInput={(e) => apply({ ...parseColor(e.target.value), a: color.a })}
            />
          </label>
          <input
            type="text"
            className={`lc-input${invalid ? ' invalid' : ''}`}
            spellcheck={false}
            value={text}
            {...focusProps}
            onInput={(e) => {
              const raw = e.target.value;
              setText(raw);
              const parsed = parseColor(raw.trim());
              setInvalid(!parsed);
              if (parsed) apply(parsed, { updateText: false });
            }}
          />
        </div>
        <div className="lc-range-wrapper">
          <input
            type="range"
            className="lc-range"
            min={0}
            max={1}
            step={0.05}
            title="Opacity"
            value={color.a}
            onInput={(e) => apply({ ...color, a: parseFloat(e.target.value) })}
          />
          <span className="lc-range-value">{`${Math.round(color.a * 100)}%`}</span>
        </div>
        <div className="lc-color-presets">
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset}
              className="lc-color-preset"
              title={preset}
              onClick={() => { setInvalid(false); apply(parseColor(preset)); }}
            >
              <span style={{ background: preset }}></span>
            </button>
          ))}
        </div>
      </div>
    </PropRow>
  );
}
