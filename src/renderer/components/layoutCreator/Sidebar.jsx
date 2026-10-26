/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Creator sidebar: element list (layer order), add-shape menu, layout settings.
 * Uses the LayoutEditorState global loaded by layoutCreator.html.
 */
import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { TextInput, useFieldValue } from './fields.jsx';

export function Sidebar({ state, ui, api }) {
  return (
    <Fragment>
      <div className="lc-sidebar-header">
        <h3 className="lc-sidebar-title">Elements</h3>
        <AddShapeMenu state={state} open={ui.shapeMenuOpen} setOpen={(open) => api.setUi({ shapeMenuOpen: open })} />
      </div>
      <ElementList state={state} />
      <LayoutSettings state={state} />
    </Fragment>
  );
}

function AddShapeMenu({ state, open, setOpen }) {
  const types = Object.entries(window.LayoutEditorState.getShapeTypes());
  const root = useRef(null);

  // Close when clicking anywhere else
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  return (
    <div className="lc-add-shape" ref={root}>
      <button
        className="lc-btn lc-btn-icon lc-btn-xs"
        title="Add shape"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <i className="bi bi-plus-lg"></i>
      </button>
      {open && (
        <div className="lc-menu" role="menu">
          {types.map(([type, meta]) => (
            <button
              key={type}
              role="menuitem"
              onClick={() => { setOpen(false); state.addShape(type); }}
            >
              <i className={`bi ${meta.icon}`}></i> {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Elements in layer order (top of list = top layer). Drag the grip to reorder.
 */
function ElementList({ state }) {
  const [dragKey, setDragKey] = useState(null);   // item being dragged
  const [armedKey, setArmedKey] = useState(null); // grip pressed: item may start dragging
  const [overKey, setOverKey] = useState(null);

  const endDrag = () => { setDragKey(null); setArmedKey(null); setOverKey(null); };

  return (
    <div className="lc-element-list">
      {state.getElementOrder().map((key) => {
        const el = state.layout?.[key];
        const meta = window.LayoutEditorState.getMetaFor(state.layout, key);
        if (!el || !meta) return null;
        const enabled = el.enabled ?? false;
        const isShape = window.LayoutEditorState.isShape(el);
        const classes = ['lc-element-item'];
        if (state.selectedElement === key) classes.push('active');
        if (!enabled) classes.push('disabled');
        if (dragKey === key) classes.push('dragging');
        if (overKey === key && dragKey !== key) classes.push('drag-over');

        return (
          <div
            key={key}
            className={classes.join(' ')}
            data-element={key}
            draggable={armedKey === key}
            onClick={() => state.selectElement(key)}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', key);
              setDragKey(key);
            }}
            onDragEnd={endDrag}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (overKey !== key) setOverKey(key);
            }}
            onDragLeave={() => { if (overKey === key) setOverKey(null); }}
            onDrop={(e) => {
              e.preventDefault();
              const dragged = e.dataTransfer.getData('text/plain');
              endDrag();
              if (dragged && dragged !== key) {
                state.reorderElement(dragged, state.getElementOrder().indexOf(key));
              }
            }}
          >
            {/* Only the grip starts a drag, so clicks and text selection elsewhere work normally */}
            <span
              className="lc-drag-handle"
              title="Drag to reorder"
              onMouseDown={() => setArmedKey(key)}
              onMouseUp={() => setArmedKey(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <i className="bi bi-grip-vertical"></i>
            </span>
            <i className={`bi ${meta.icon}`}></i>
            <span className="lc-el-name">{meta.label}</span>
            {isShape && (
              <button
                className="lc-el-delete"
                title="Delete shape"
                onClick={(e) => { e.stopPropagation(); state.removeShape(key); }}
              >
                <i className="bi bi-trash3"></i>
              </button>
            )}
            <button
              className="lc-el-toggle"
              title={enabled ? 'Hide' : 'Show'}
              onClick={(e) => { e.stopPropagation(); state.toggleElement(key); }}
            >
              <i className={`bi ${enabled ? 'bi-eye-fill' : 'bi-eye-slash'}`}></i>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function LayoutSettings({ state }) {
  const res = state.layout?.resolution || {};
  return (
    <div className="lc-sidebar-section" style={{ marginTop: 'auto' }}>
      <h3 className="lc-sidebar-title">Layout</h3>
      <ResolutionInput label="Width" value={res.width || 1920} min={640} max={7680} fallback={1920}
        onChange={(v) => state.updateMeta('resolution', { width: v })} />
      <ResolutionInput label="Height" value={res.height || 1080} min={360} max={4320} fallback={1080}
        onChange={(v) => state.updateMeta('resolution', { height: v })} />
      <div className="lc-prop-row" style={{ padding: '0 0.75rem' }}>
        <label className="lc-prop-label">Description</label>
        <TextInput
          placeholder="Description"
          value={state.layout?.description || ''}
          onChange={(v) => state.updateMeta('description', v)}
        />
      </div>
    </div>
  );
}

/**
 * Number input that applies on change (Enter or leaving the field), not on every keystroke
 */
function ResolutionInput({ label, value, min, max, fallback, onChange }) {
  const [local, setLocal, focusProps] = useFieldValue(value);
  return (
    <div className="lc-prop-row" style={{ padding: '0 0.75rem' }}>
      <label className="lc-prop-label">{label}</label>
      <input
        type="number"
        className="lc-input lc-input-number"
        min={min}
        max={max}
        step={10}
        value={local}
        {...focusProps}
        onInput={(e) => setLocal(e.target.value)}
        onChange={(e) => onChange(parseInt(e.target.value) || fallback)}
      />
    </div>
  );
}
