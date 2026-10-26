/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Creator app: owns the editor state, the canvas preview, pointer and keyboard
 * interaction, and the save / export / import / new / clone actions.
 * Uses the LayoutEditorState, CanvasPreview, LayoutRegistry and UnifiedCanvasRenderer
 * globals loaded by layoutCreator.html.
 */
import { h } from 'preact';
import { useState, useRef, useEffect, useLayoutEffect, useReducer } from 'preact/hooks';
import { Toolbar } from './Toolbar.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Inspector } from './Inspector.jsx';
import { Overlays } from './Overlays.jsx';

// Arrow key → [dx, dy]
const NUDGE_KEYS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1]
};

/**
 * Editor state for the layout in the URL (?edit=<id>), or a new layout
 */
function createInitialState() {
  const state = new window.LayoutEditorState();
  const editId = new URLSearchParams(window.location.search).get('edit');
  if (editId && window.LayoutRegistry.hasLayout(editId)) {
    state.loadLayout(editId, window.LayoutRegistry.getLayout(editId));
    return { state, editingId: editId };
  }
  state.createNew();
  return { state, editingId: null };
}

/**
 * Apply { 'size.width': '50%', ... } to an element without recording history
 */
function setPaths(target, updates) {
  for (const [path, value] of Object.entries(updates)) {
    const parts = path.split('.');
    let obj = target;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  }
}

function generateLayoutId(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'custom';
  // Ensure unique
  let id = `custom-${base}`;
  let counter = 1;
  while (window.LayoutRegistry.hasLayout(id)) {
    id = `custom-${base}-${counter++}`;
  }
  return id;
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'layout';
}

export function App() {
  const [initial] = useState(createInitialState);
  const state = initial.state;
  const editingId = useRef(initial.editingId); // null = new layout, string = editing a saved custom layout

  const previewRef = useRef(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [, rerender] = useReducer(n => n + 1, 0);

  // ==========================================================================
  // VIEW STATE (grid, modals, menu, toast)
  // ==========================================================================

  const [ui, setUiState] = useState({
    gridOn: false,
    shortcutsOpen: false,
    cloneOpen: false,
    shapeMenuOpen: false,
    toast: null
  });
  const uiRef = useRef(ui);
  uiRef.current = ui;
  const toastTimer = useRef(null);

  const api = {
    setUi: (patch) => setUiState(u => ({ ...u, ...patch })),
    toggleGrid: () => api.setUi({ gridOn: previewRef.current.toggleGrid() }),
    toggleShortcuts: () => setUiState(u => ({ ...u, shortcutsOpen: !u.shortcutsOpen })),
    /**
     * Close the topmost open modal or menu
     * @returns {boolean} true if something was closed
     */
    closeOverlay: () => {
      const open = ['shortcutsOpen', 'cloneOpen', 'shapeMenuOpen'].find(k => uiRef.current[k]);
      if (open) api.setUi({ [open]: false });
      return !!open;
    },
    toast: (message, type = 'info') => {
      clearTimeout(toastTimer.current);
      api.setUi({ toast: { message, type } });
      toastTimer.current = setTimeout(() => api.setUi({ toast: null }), 3000);
    }
  };

  // ==========================================================================
  // STATE → PREVIEW
  // ==========================================================================

  useEffect(() => state.subscribe(() => {
    const preview = previewRef.current;
    if (!preview) return;
    if (draggingRef.current) {
      // During drag: just redraw the canvas
      preview.updateLayoutRef(state.layout);
      preview.render();
      return;
    }
    preview.setLayout(state.getLayout());
    preview.setSelectedElement(state.selectedElement);
    rerender();
  }), [state]);

  const onPreviewReady = (preview) => {
    previewRef.current = preview;
    preview.setLayout(state.getLayout());
    rerender();
  };

  // ==========================================================================
  // FILE ACTIONS
  // ==========================================================================

  const actions = {
    save() {
      const layout = state.getLayout();
      const validation = window.LayoutRegistry.validateLayout(layout);
      if (!validation.isValid) {
        api.toast(`Validation errors:\n${validation.errors.join('\n')}`, 'error');
        return;
      }

      const id = editingId.current || generateLayoutId(layout.name);
      if (!window.LayoutRegistry.addCustomLayout(id, layout)) {
        api.toast('Failed to save layout', 'error');
        return;
      }
      editingId.current = id;
      state.markSaved(id);
      api.toast('Layout saved!', 'success');

      // Main and settings windows refresh their layout lists
      window.electron?.ipcRenderer?.send('layout-creator:saved', { id, name: layout.name });
    },

    exportLayout() {
      const layout = state.getLayout();
      const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFilename(layout.name || 'layout')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      api.toast('Layout exported!', 'success');
    },

    importFile(file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        let data;
        try {
          data = JSON.parse(ev.target.result);
        } catch {
          api.toast('Failed to parse JSON file', 'error');
          return;
        }
        const validation = window.LayoutRegistry.validateLayout(data);
        if (!validation.isValid) {
          api.toast(`Invalid layout:\n${validation.errors.join('\n')}`, 'error');
          return;
        }
        state.loadLayout(null, data);
        editingId.current = null;
        api.toast(`Imported "${data.name}"`, 'success');
      };
      reader.readAsText(file);
    },

    newLayout() {
      if (state.dirty && !window.confirm('You have unsaved changes. Create new layout?')) return;
      state.createNew();
      editingId.current = null;
    },

    cloneFrom(info) {
      state.cloneFrom(window.LayoutRegistry.getLayout(info.id), `${info.name} (Copy)`);
      editingId.current = null;
      api.toast(`Cloned from "${info.name}"`, 'success');
    }
  };

  // Listeners below are registered once; they read the latest versions through refs
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const apiRef = useRef(api);
  apiRef.current = api;

  // ==========================================================================
  // CANVAS: DRAG AND RESIZE
  // ==========================================================================

  const onCanvasMouseDown = (e) => {
    const preview = previewRef.current;
    if (!preview) return;

    // Resize handle takes priority
    const handleEl = e.target.closest('[data-handle]');
    if (handleEl) {
      e.stopPropagation();
      const key = handleEl.dataset.element || handleEl.closest('[data-element]')?.dataset.element;
      if (key) preview.startResize(key, handleEl.dataset.handle, e.clientX, e.clientY);
      return;
    }

    // Element drag
    const overlayTarget = e.target.closest('[data-element]');
    const key = overlayTarget ? overlayTarget.dataset.element : preview.hitTest(e.clientX, e.clientY);
    if (key) {
      state.selectElement(key);
      preview.startDrag(key, e.clientX, e.clientY);
      draggingRef.current = true;
      setDragging(true);
    } else {
      state.selectElement(null);
    }
  };

  useEffect(() => {
    const onMove = (e) => {
      const preview = previewRef.current;
      if (!preview) return;

      // Resize: Shift keeps the aspect ratio (video, shapes, linear bar); Alt skips snapping
      if (preview.resizeState) {
        e.preventDefault();
        const result = preview.moveResize(e.clientX, e.clientY, e.shiftKey, !e.altKey);
        if (result) {
          setPaths(state.layout[result.elementKey], result.updates);
          state.dirty = true;
          preview.updateLayoutRef(state.layout);
          preview.render();
          preview.syncHighlight(result.elementKey);
          rerender();
        }
        return;
      }

      // Drag: Alt moves without snapping
      if (!preview.dragState) return;
      e.preventDefault();
      const result = preview.moveDrag(e.clientX, e.clientY, !e.altKey);
      if (result && state.layout[result.elementKey]) {
        state.layout[result.elementKey].position.x = result.x;
        state.layout[result.elementKey].position.y = result.y;
        state.dirty = true;
        preview.updateLayoutRef(state.layout);
        preview.render();
        preview.syncHighlight(result.elementKey);
        rerender();
      }
    };

    const onUp = () => {
      const preview = previewRef.current;
      if (!preview) return;
      if (preview.resizeState) {
        const key = preview.resizeState.elementKey;
        preview.endResize();
        if (key && state.layout[key]) state.commitDrag(key);
        preview.updateHighlights();
        return;
      }
      if (preview.dragState) {
        const key = preview.dragState.elementKey;
        preview.endDrag();
        draggingRef.current = false;
        setDragging(false);
        if (key && state.layout[key]) state.commitDrag(key);
        preview.updateHighlights();
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [state]);

  // ==========================================================================
  // KEYBOARD
  // ==========================================================================

  useEffect(() => {
    let nudgeTimer = null;
    let nudgeKey = null;

    // Commit a burst of nudges as one undo step
    const flushNudge = () => {
      if (!nudgeTimer) return;
      clearTimeout(nudgeTimer);
      nudgeTimer = null;
      if (state.layout[nudgeKey]) state.commitDrag(nudgeKey);
    };

    // Move the selected element by canvas pixels
    const nudgeSelected = (dx, dy) => {
      const preview = previewRef.current;
      const key = state.selectedElement;
      const config = key && state.layout[key];
      if (!preview || !config || !config.enabled || !config.position) return;

      const { width, height } = state.layout.resolution;
      const { parsePosition } = window.UnifiedCanvasRenderer.prototype;
      const toPct = (px, dim) => `${((px / dim) * 100).toFixed(2)}%`;

      // Separator is always centred horizontally
      if (dx && key !== 'separator') {
        config.position.x = toPct(parsePosition(config.position.x, 'x', width) + dx, width);
      }
      if (dy) {
        config.position.y = toPct(parsePosition(config.position.y, 'y', height) + dy, height);
      }

      state.dirty = true;
      preview.updateLayoutRef(state.layout);
      preview.render();
      preview.updateHighlights();
      rerender();

      clearTimeout(nudgeTimer);
      nudgeKey = key;
      nudgeTimer = setTimeout(flushNudge, 400);
    };

    const onKeyDown = (e) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const inField = !!e.target.closest?.('input, textarea, select');
      const key = e.key.toLowerCase();
      const ui = apiRef.current;
      const act = actionsRef.current;

      // Undo / redo (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
      if (isMeta && !e.shiftKey && key === 'z') {
        e.preventDefault();
        flushNudge();
        state.undo();
      }
      if ((isMeta && e.shiftKey && key === 'z') || (isMeta && key === 'y')) {
        e.preventDefault();
        flushNudge();
        state.redo();
      }
      // Arrows → nudge selected element (Shift = 10px)
      if (NUDGE_KEYS[e.key] && !isMeta && !inField && state.selectedElement) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        nudgeSelected(NUDGE_KEYS[e.key][0] * step, NUDGE_KEYS[e.key][1] * step);
      }
      // ? → keyboard shortcuts
      if (e.key === '?' && !inField) ui.toggleShortcuts();
      // Ctrl+S → save, Ctrl+E → export
      if (isMeta && key === 's') {
        e.preventDefault();
        flushNudge();
        act.save();
      }
      if (isMeta && key === 'e') {
        e.preventDefault();
        act.exportLayout();
      }
      // Escape → close a modal or menu, else deselect
      if (e.key === 'Escape' && !ui.closeOverlay()) state.selectElement(null);
      // G → toggle grid
      if (key === 'g' && !isMeta && !inField) ui.toggleGrid();
      // Delete → delete a shape, hide any other element
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElement && !inField) {
        e.preventDefault();
        if (!state.removeShape(state.selectedElement)) state.toggleElement(state.selectedElement);
      }
      // Ctrl+D → duplicate selected shape
      if (isMeta && key === 'd' && state.selectedElement && !inField) {
        e.preventDefault();
        state.duplicateShape(state.selectedElement);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(nudgeTimer);
    };
  }, [state]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const props = { state, preview: previewRef.current, ui, api, actions };
  const res = state.layout?.resolution || {};

  return (
    <div className="lc-app">
      <div className="lc-toolbar">
        <Toolbar {...props} />
      </div>

      <div className="lc-main">
        <aside className="lc-sidebar">
          <Sidebar {...props} />
        </aside>

        <main className="lc-canvas-area">
          <CanvasView dragging={dragging} onReady={onPreviewReady} onMouseDown={onCanvasMouseDown} />
          <div className="lc-canvas-info">
            <span>{`${res.width || 1920} × ${res.height || 1080}`}</span>
            {state.dirty && <span className="lc-dirty-dot" title="Unsaved changes"></span>}
          </div>
        </main>

        <aside className="lc-inspector">
          <Inspector {...props} />
        </aside>
      </div>

      <Overlays {...props} />
    </div>
  );
}

/**
 * Canvas and highlight overlay. CanvasPreview draws into both and manages the
 * overlay's children itself, so Preact never renders children there.
 */
function CanvasView({ dragging, onReady, onMouseDown }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  useLayoutEffect(() => {
    onReady(new window.CanvasPreview(canvasRef.current, overlayRef.current));
  }, []);

  return (
    <div className={`lc-canvas-wrapper${dragging ? ' dragging' : ''}`} onMouseDown={onMouseDown}>
      <canvas id="previewCanvas" ref={canvasRef}></canvas>
      <div ref={overlayRef} className="lc-highlight-overlay"></div>
    </div>
  );
}
