/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Creator overlays: clone modal, keyboard shortcuts modal, toast.
 * Uses the LayoutRegistry global loaded by layoutCreator.html.
 */
import { h, Fragment } from 'preact';

const isMac = navigator.platform.toUpperCase().includes('MAC');
const MOD = isMac ? '⌘' : 'Ctrl';
const ALT = isMac ? '⌥' : 'Alt';

// [keys, description]; a key list renders as separate <kbd>s
const SHORTCUTS = [
  [['←', '↑', '→', '↓'], 'Nudge selected element 1px'],
  [['Shift'], '+ arrows', 'Nudge 10px'],
  [['Shift'], '+ resize', 'Keep aspect ratio (video, shapes, progress bar)'],
  [[ALT], '+ drag', 'Move or resize without snapping'],
  [[MOD, 'Z'], 'Undo'],
  [[MOD, 'Shift', 'Z'], 'Redo'],
  [[MOD, 'S'], 'Save layout'],
  [[MOD, 'E'], 'Export JSON'],
  [[MOD, 'D'], 'Duplicate selected shape'],
  [['G'], 'Toggle grid'],
  [['Delete'], 'Hide selected element, or delete a shape'],
  [['Esc'], 'Close / deselect'],
  [['?'], 'Show this list']
];

export function Overlays({ ui, api, actions }) {
  return (
    <Fragment>
      {ui.cloneOpen && <CloneModal onClose={() => api.setUi({ cloneOpen: false })} onPick={actions.cloneFrom} />}
      {ui.shortcutsOpen && <ShortcutsModal onClose={() => api.setUi({ shortcutsOpen: false })} />}
      {ui.toast && <div className={`lc-toast lc-toast-${ui.toast.type}`}>{ui.toast.message}</div>}
    </Fragment>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="lc-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lc-modal" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function CloneModal({ onClose, onPick }) {
  const layouts = window.LayoutRegistry.getAllLayouts();
  return (
    <Modal title="Clone from Layout" onClose={onClose}>
      <div className="lc-clone-list">
        {layouts.map(info => (
          <div key={info.id} className="lc-clone-item" onClick={() => { onClose(); onPick(info); }}>
            <div>
              <strong>{info.name}</strong> <span className="lc-badge">{info.type}</span>
            </div>
            <small>{info.description || ''}</small>
          </div>
        ))}
      </div>
      <div className="lc-modal-actions">
        <button className="lc-btn lc-btn-sm" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function ShortcutsModal({ onClose }) {
  return (
    <Modal title="Keyboard Shortcuts" onClose={onClose}>
      <dl className="lc-shortcuts">
        {SHORTCUTS.map(([keys, extraOrDesc, desc]) => (
          <Fragment key={keys.join('+') + (desc ? extraOrDesc : '')}>
            <dt>
              {keys.map(k => <kbd key={k}>{k}</kbd>)}
              {desc && ` ${extraOrDesc}`}
            </dt>
            <dd>{desc || extraOrDesc}</dd>
          </Fragment>
        ))}
      </dl>
      <div className="lc-modal-actions">
        <button className="lc-btn lc-btn-sm" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
