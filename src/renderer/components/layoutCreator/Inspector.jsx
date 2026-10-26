/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Creator inspector: property panel for the selected element.
 * Reads LayoutEditorState directly and is re-rendered after every state change.
 * Uses the LayoutEditorState and UnifiedCanvasRenderer globals loaded by layoutCreator.html.
 */
import { h } from 'preact';
import {
  Section, PropRow, TextInput, TextField, NumberField, RangeField, SelectField,
  Toggle, PresetButtons, ActionButton, ColorField
} from './fields.jsx';

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

const VIDEO_FRAME_PRESETS = [
  { value: 'full', label: 'Full' },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
  { value: '4:3', label: '4:3', ratio: 4 / 3 },
  { value: '1:1', label: '1:1', ratio: 1 },
  { value: '9:16', label: '9:16', ratio: 9 / 16 }
];

const pct = (v, dim) => `${((v / dim) * 100).toFixed(1)}%`;

/**
 * @param {{ state: LayoutEditorState, preview: CanvasPreview }} props
 */
export function Inspector({ state, preview }) {
  const key = state.selectedElement;
  const el = key && state.layout?.[key];

  if (!el) {
    return (
      <div className="lc-empty-inspector">
        <i className="bi bi-cursor-fill" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
        <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Select an element to edit its properties</p>
      </div>
    );
  }

  // Keyed by element so field state resets when the selection changes
  return <ElementInspector key={key} elementKey={key} el={el} state={state} preview={preview} />;
}

function ElementInspector({ elementKey: key, el, state, preview }) {
  const meta = window.LayoutEditorState.getMetaFor(state.layout, key);
  const update = (path, value) => state.updateElement(key, path, value);

  return (
    <div>
      <div className="lc-inspector-header">
        <i className={`bi ${meta.icon}`}></i> <span>{meta.label}</span>
      </div>

      <Toggle label="Visible" checked={el.enabled} onChange={() => state.toggleElement(key)} />

      {!el.enabled ? (
        <p className="lc-disabled-note">Enable this element to edit properties</p>
      ) : (
        <div>
          {/* Video with fitToCanvas: position is auto-filled */}
          {!(key === 'video' && el.fitToCanvas) && (
            <div>
              <Section title="Position" />
              {key !== 'separator' && <PositionField axis="x" elementKey={key} el={el} state={state} preview={preview} />}
              <PositionField axis="y" elementKey={key} el={el} state={state} preview={preview} />
            </div>
          )}
          <ElementProps elementKey={key} el={el} state={state} update={update} />
        </div>
      )}
    </div>
  );
}

function ElementProps({ elementKey: key, el, state, update }) {
  switch (key) {
    case 'progressBar':
      return <ProgressBarProps el={el} update={update} state={state} elementKey={key} />;
    case 'countdown':
    case 'clock':
      return (
        <div>
          <TextProps el={el} update={update} />
          <BackgroundProps el={el} update={update} />
        </div>
      );
    case 'elapsed':
    case 'endTime':
      return (
        <div>
          <TextProps el={el} update={update} />
          <TimeLabelProps elementKey={key} el={el} update={update} />
          <BackgroundProps el={el} update={update} />
        </div>
      );
    case 'separator':
      return (
        <div>
          <Section title="Separator Style" />
          <TextField label="Width" value={el.width || '90%'} onChange={(v) => update('width', v)} />
          <NumberField label="Thickness" value={el.thickness ?? 3} min={1} max={20} step={1} onChange={(v) => update('thickness', v)} />
        </div>
      );
    case 'message':
      return <MessageProps el={el} update={update} />;
    case 'video':
      return <VideoProps elementKey={key} el={el} state={state} update={update} />;
    default:
      return window.LayoutEditorState.isShape(el)
        ? <ShapeProps elementKey={key} el={el} state={state} update={update} />
        : null;
  }
}

// ============================================================================
// POSITION
// ============================================================================

/**
 * Preset buttons align the element's box to the canvas edge or centre
 * (every element type stores a different point, so this works from the drawn box),
 * plus a free-form value: %, px, or a keyword.
 */
function PositionField({ axis, elementKey: key, el, state, preview }) {
  const value = el.position?.[axis] ?? (axis === 'x' ? 'center' : 'middle');
  const names = axis === 'x' ? ['Left', 'Center', 'Right'] : ['Top', 'Middle', 'Bottom'];
  const presets = ['start', 'center', 'end'].map((align, i) => ({
    value: align,
    label: names[i],
    title: `Align to canvas ${names[i].toLowerCase()}`
  }));

  const setPosition = (v) => {
    const num = parseFloat(v);
    state.updateElement(key, `position.${axis}`, !isNaN(num) && !String(v).includes('%') ? num : v);
  };

  return (
    <PropRow label={axis === 'x' ? 'X Position' : 'Y Position'}>
      <div className="lc-prop-stack">
        <PresetButtons
          presets={presets}
          active={preview?.getAlignment(key, axis)}
          onPick={(p) => {
            const aligned = preview?.getAlignedPosition(key, axis, p.value);
            if (aligned !== null && aligned !== undefined) state.updateElement(key, `position.${axis}`, aligned);
          }}
        />
        <TextInput value={String(value)} onChange={(v) => setPosition(v.trim())} placeholder="e.g., 50%, center, 960" />
      </div>
    </PropRow>
  );
}

// ============================================================================
// ELEMENT SECTIONS
// ============================================================================

function TextProps({ el, update }) {
  return (
    <div>
      <Section title="Typography" />
      <NumberField label="Font Size" value={el.fontSize ?? 60} min={10} max={500} step={5} onChange={(v) => update('fontSize', v)} />
      <SelectField label="Alignment" value={el.alignment || 'center'} options={ALIGNMENT_OPTIONS} onChange={(v) => update('alignment', v)} />
      <RangeField label="Opacity" value={el.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v) => update('opacity', v)} />
    </div>
  );
}

function TimeLabelProps({ elementKey: key, el, update }) {
  const isElapsed = key === 'elapsed';
  const formats = isElapsed ? ['HH:MM:SS', 'HH:MM', 'MM:SS'] : ['HH:MM:SS', 'HH:MM'];
  const fontSize = el.fontSize ?? 60;
  const labelSize = el.labelSize || fontSize * 0.5;
  // Layouts without a value show the spacing they already render with
  const lineHeight = el.labelLineHeight ?? (1.4 * fontSize) / (fontSize + labelSize);

  return (
    <div>
      <Section title={isElapsed ? 'Elapsed Options' : 'End Time Options'} />
      <SelectField label="Format" value={el.format || 'HH:MM:SS'} options={formats.map(f => ({ value: f, label: f }))} onChange={(v) => update('format', v)} />
      <Toggle label="Show Label" checked={el.showLabel ?? false} onChange={(v) => update('showLabel', v)} />
      {el.showLabel && (
        <div>
          <TextField label="Label" value={el.label || (isElapsed ? 'Elapsed:' : 'Ends at:')} onChange={(v) => update('label', v)} />
          <NumberField label="Label Size" value={el.labelSize ?? (isElapsed ? 20 : 35)} min={10} max={100} step={1} onChange={(v) => update('labelSize', v)} />
          <RangeField label="Line Height" value={lineHeight} min={0.5} max={2.5} step={0.05} onChange={(v) => update('labelLineHeight', v)} />
        </div>
      )}
    </div>
  );
}

function BackgroundProps({ el, update }) {
  if (!el.background) return null;
  return (
    <div>
      <Section title="Background" />
      <Toggle label="Enabled" checked={el.background.enabled ?? false} onChange={(v) => update('background.enabled', v)} />
      {el.background.enabled && (
        <div>
          <ColorField label="Color" value={el.background.color || 'rgba(0,0,0,0.7)'} onChange={(v) => update('background.color', v)} />
          <NumberField label="Padding" value={el.background.padding ?? 20} min={0} max={100} step={1} onChange={(v) => update('background.padding', v)} />
          <NumberField label="Border Radius" value={el.background.borderRadius ?? 15} min={0} max={50} step={1} onChange={(v) => update('background.borderRadius', v)} />
        </div>
      )}
    </div>
  );
}

function ProgressBarProps({ elementKey: key, el, state, update }) {
  const circular = el.type === 'circular';
  return (
    <div>
      <Section title="Size" />
      <SelectField
        label="Type"
        value={el.type || 'linear'}
        options={[{ value: 'linear', label: 'Linear Bar' }, { value: 'circular', label: 'Circular Ring' }]}
        onChange={(v) => update('type', v)}
      />
      {circular ? (
        <div>
          {/* Single diameter field: width & height stay interlocked (it's a circle) */}
          <TextField
            label="Diameter"
            value={el.size?.width || '83%'}
            onChange={(v) => state.updateElementProps(key, { 'size.width': v, 'size.height': v }, 'size')}
          />
          <Section title="Style" />
          <NumberField label="Ring Thickness" value={el.thickness ?? 40} min={5} max={200} step={1} onChange={(v) => update('thickness', v)} />
          <NumberField label="Start Angle" value={el.startAngle ?? -90} min={-360} max={360} step={5} onChange={(v) => update('startAngle', v)} />
        </div>
      ) : (
        <div>
          <TextField label="Width" value={el.size?.width || '90%'} onChange={(v) => update('size.width', v)} />
          <TextField label="Height" value={el.size?.height || '4%'} onChange={(v) => update('size.height', v)} />
          <Section title="Style" />
          <NumberField label="Corner Radius" value={el.cornerRadius ?? 25} min={0} max={100} step={1} onChange={(v) => update('cornerRadius', v)} />
        </div>
      )}
    </div>
  );
}

function MessageProps({ el, update }) {
  return (
    <div>
      <Section title="Typography" />
      <NumberField label="Font Size" value={el.fontSize ?? 60} min={10} max={300} step={5} onChange={(v) => update('fontSize', v)} />
      <SelectField label="Alignment" value={el.alignment || 'center'} options={ALIGNMENT_OPTIONS} onChange={(v) => update('alignment', v)} />
      <RangeField label="Opacity" value={el.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v) => update('opacity', v)} />

      <Section title="Message Options" />
      <NumberField label="Max Lines" value={el.maxLines ?? 2} min={1} max={5} step={1} onChange={(v) => update('maxLines', v)} />
      <RangeField label="Line Height" value={el.lineHeight ?? 1.3} min={0.8} max={2.5} step={0.1} onChange={(v) => update('lineHeight', v)} />
      <Toggle label="Show Background" checked={el.showBackground ?? false} onChange={(v) => update('showBackground', v)} />
    </div>
  );
}

function VideoProps({ elementKey: key, el, state, update }) {
  return (
    <div>
      <Section title="Frame" />
      <PropRow label="Shape">
        <PresetButtons
          presets={VIDEO_FRAME_PRESETS}
          active={getVideoFramePreset(el, state.layout.resolution)}
          onPick={(preset) => applyVideoFramePreset(state, key, el, preset)}
        />
      </PropRow>
      <TextField label="Width" value={el.size?.width || '100%'} onChange={(v) => update('size.width', v)} />
      <TextField label="Height" value={el.size?.height || '100%'} onChange={(v) => update('size.height', v)} />

      <Section title="Video" />
      <SelectField
        label="Scaling"
        value={el.scaling || ''}
        options={[
          { value: '', label: 'App setting' },
          { value: 'contain', label: 'Fit (show whole image)' },
          { value: 'cover', label: 'Fill (crop to frame)' },
          { value: 'stretch', label: 'Stretch' },
          { value: 'none', label: 'Original size' }
        ]}
        onChange={(v) => state.updateElementProps(key, { scaling: v || undefined }, 'scaling')}
      />
      <RangeField label="Opacity" value={el.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v) => update('opacity', v)} />
    </div>
  );
}

function ShapeProps({ elementKey: key, el, state, update }) {
  const isLine = el.shape === 'line';
  const types = Object.entries(window.LayoutEditorState.getShapeTypes()).map(([value, m]) => ({ value, label: m.label }));
  return (
    <div>
      <Section title="Size" />
      <TextField label="Width" value={el.size?.width || '20%'} onChange={(v) => update('size.width', v)} />
      <TextField label="Height" value={el.size?.height || '20%'} onChange={(v) => update('size.height', v)} />

      <Section title="Shape" />
      <TextField label="Name" value={el.name || ''} onChange={(v) => update('name', v)} />
      <SelectField
        label="Type"
        value={el.shape || 'rect'}
        options={types}
        onChange={(v) => {
          // Lines are drawn in the stroke colour; give them a visible thickness
          const updates = { shape: v };
          if (v === 'line' && !el.strokeWidth) updates.strokeWidth = 4;
          state.updateElementProps(key, updates, 'type');
        }}
      />
      {el.shape === 'rect' && (
        <NumberField label="Corner Radius" value={el.cornerRadius ?? 0} min={0} max={1000} step={1} onChange={(v) => update('cornerRadius', v)} />
      )}
      {!isLine && <ColorField label="Fill" value={el.fill || 'rgba(0,0,0,0)'} onChange={(v) => update('fill', v)} />}
      <ColorField label={isLine ? 'Color' : 'Stroke'} value={el.stroke || 'rgba(255,255,255,1)'} onChange={(v) => update('stroke', v)} />
      <NumberField
        label={isLine ? 'Thickness' : 'Stroke Width'}
        value={el.strokeWidth ?? 0}
        min={isLine ? 1 : 0}
        max={200}
        step={1}
        onChange={(v) => update('strokeWidth', v)}
      />
      <RangeField label="Opacity" value={el.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v) => update('opacity', v)} />

      <Section title="Actions" />
      <ActionButton label="Duplicate" onClick={() => state.duplicateShape(key)} />
      <ActionButton label="Delete Shape" onClick={() => state.removeShape(key)} />
    </div>
  );
}

// ============================================================================
// VIDEO FRAME PRESETS
// ============================================================================

function frameInPixels(el, res) {
  const { parsePosition, parseSize } = window.UnifiedCanvasRenderer.prototype;
  return {
    w: parseSize(el.size?.width || '100%', res.width),
    h: parseSize(el.size?.height || '100%', res.height),
    x: parsePosition(el.position?.x ?? 0, 'x', res.width),
    y: parsePosition(el.position?.y ?? 0, 'y', res.height)
  };
}

/**
 * Which frame preset matches the current video size, if any
 */
function getVideoFramePreset(el, res) {
  const { w, h, x, y } = frameInPixels(el, res);
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
function applyVideoFramePreset(state, key, el, preset) {
  if (preset.value === 'full') {
    state.updateElementProps(key, {
      'position.x': 0, 'position.y': 0, 'size.width': '100%', 'size.height': '100%'
    }, 'frame');
    return;
  }

  const res = state.layout.resolution;
  const cur = frameInPixels(el, res);
  let w = cur.w;
  let h = w / preset.ratio;
  if (h > cur.h) { h = cur.h; w = h * preset.ratio; }

  // Centre on the old frame, then keep it on the canvas
  const x = Math.min(Math.max(0, cur.x + (cur.w - w) / 2), res.width - w);
  const y = Math.min(Math.max(0, cur.y + (cur.h - h) / 2), res.height - h);

  state.updateElementProps(key, {
    'position.x': pct(x, res.width),
    'position.y': pct(y, res.height),
    'size.width': pct(w, res.width),
    'size.height': pct(h, res.height)
  }, 'frame');
}
