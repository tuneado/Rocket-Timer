/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Creator toolbar: file actions, layout name, undo/redo, view toggles, save.
 */
import { h, Fragment } from 'preact';
import { useRef } from 'preact/hooks';
import { TextInput } from './fields.jsx';

/**
 * @param {{ state: LayoutEditorState, ui: object, api: object, actions: object }} props
 */
export function Toolbar({ state, ui, api, actions }) {
  const fileInput = useRef(null);

  return (
    <Fragment>
      <div className="lc-toolbar-left">
        <button className="lc-btn lc-btn-sm" title="New Layout" onClick={actions.newLayout}>
          <i className="bi bi-file-earmark-plus"></i> New
        </button>
        <button className="lc-btn lc-btn-sm" title="Clone from existing layout" onClick={() => api.setUi({ cloneOpen: true })}>
          <i className="bi bi-copy"></i> Clone
        </button>
        <button className="lc-btn lc-btn-sm" title="Import layout from JSON" onClick={() => fileInput.current.click()}>
          <i className="bi bi-box-arrow-in-down"></i> Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) actions.importFile(file);
            e.target.value = ''; // so the same file can be imported again
          }}
        />
      </div>

      <div className="lc-toolbar-center">
        <TextInput
          className="lc-name-input"
          placeholder="Layout Name"
          value={state.layout?.name || ''}
          onChange={(v) => state.updateMeta('name', v)}
        />
      </div>

      <div className="lc-toolbar-right">
        <button className="lc-btn lc-btn-icon" title="Undo" disabled={!state.canUndo()} onClick={() => state.undo()}>
          <i className="bi bi-arrow-counterclockwise"></i>
        </button>
        <button className="lc-btn lc-btn-icon" title="Redo" disabled={!state.canRedo()} onClick={() => state.redo()}>
          <i className="bi bi-arrow-clockwise"></i>
        </button>
        <span className="lc-toolbar-sep"></span>
        <button className={`lc-btn lc-btn-icon${ui.gridOn ? ' active' : ''}`} title="Toggle Grid" onClick={api.toggleGrid}>
          <i className="bi bi-grid-3x3"></i>
        </button>
        <button className="lc-btn lc-btn-icon" title="Keyboard shortcuts (?)" onClick={() => api.setUi({ shortcutsOpen: true })}>
          <i className="bi bi-keyboard"></i>
        </button>
        <span className="lc-toolbar-sep"></span>
        <button className="lc-btn lc-btn-sm" title="Export layout as JSON" onClick={actions.exportLayout}>
          <i className="bi bi-box-arrow-up"></i> Export
        </button>
        <button className="lc-btn lc-btn-sm lc-btn-primary" title="Save layout" onClick={actions.save}>
          <i className="bi bi-check-lg"></i> Save
        </button>
      </div>
    </Fragment>
  );
}
