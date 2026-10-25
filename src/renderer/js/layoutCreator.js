/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Creator – Main Orchestration
 * Wires together LayoutEditorState, CanvasPreview, and LayoutEditorUI.
 * This file is the entry point loaded by layoutCreator.html.
 * /
 */
(function () {
  'use strict';

  // ===========================
  // GLOBALS
  // ===========================
  let state, preview, inspectorUI;
  let editingId = null; // null = new layout, string = editing existing custom layout

  // DOM refs
  const $ = (id) => document.getElementById(id);

  // ===========================
  // INITIALISATION
  // ===========================

  function init() {
    // State
    state = new LayoutEditorState();

    // Canvas Preview
    const canvas = $('previewCanvas');
    const overlay = $('highlightOverlay');
    preview = new CanvasPreview(canvas, overlay);

    // Inspector
    inspectorUI = new LayoutEditorUI($('inspectorPanel'), state, preview);

    // Check if we received edit data via query params or IPC
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');

    if (editId && LayoutRegistry.hasLayout(editId)) {
      const data = LayoutRegistry.getLayout(editId);
      state.loadLayout(editId, data);
      editingId = editId;
    } else {
      state.createNew();
    }

    // Push initial layout to preview
    preview.setLayout(state.getLayout());
    updateDOM();

    // Wire up events
    bindToolbar();
    bindCanvasInteraction();
    bindKeyboard();
    bindResolution();

    // Subscribe to state changes
    state.subscribe((event, ...args) => {
      onStateChange(event, ...args);
    });

    // Build element list
    renderElementList();
  }

  // ===========================
  // STATE → UI SYNC
  // ===========================

  let _isDragging = false;

  // Properties whose change requires a full inspector rebuild (they show/hide other fields)
  const STRUCTURAL_PROPS = new Set(['showLabel', 'type', 'background.enabled', 'showBackground', 'frame', 'scaling']);

  function onStateChange(event, ...args) {
    if (_isDragging) {
      // During drag: lightweight update — just re-render canvas, skip DOM rebuilds
      preview.updateLayoutRef(state.layout);
      preview.render();
      return;
    }

    // Full canvas + overlay refresh
    preview.setLayout(state.getLayout());
    preview.setSelectedElement(state.selectedElement);

    // Rebuild inspector only when the event is not a simple property edit,
    // or when the changed property affects the inspector's structure
    const propPath = args[1]; // args = [elementKey, propPath]
    const needsInspectorRebuild = event !== 'element' || STRUCTURAL_PROPS.has(propPath);
    if (needsInspectorRebuild) {
      inspectorUI.render();
    }

    // Refresh DOM state
    updateDOM();

    // Refresh element list active/enabled indicators
    renderElementList();
  }

  function updateDOM() {
    const layout = state.layout;
    if (!layout) return;

    // Name
    const nameInput = $('layoutName');
    if (document.activeElement !== nameInput) nameInput.value = layout.name || '';

    // Resolution
    const wInput = $('resWidth');
    const hInput = $('resHeight');
    if (document.activeElement !== wInput) wInput.value = layout.resolution?.width || 1920;
    if (document.activeElement !== hInput) hInput.value = layout.resolution?.height || 1080;

    // Description
    const descInput = $('layoutDesc');
    if (document.activeElement !== descInput) descInput.value = layout.description || '';

    // Undo/Redo buttons
    $('btnUndo').disabled = !state.canUndo();
    $('btnRedo').disabled = !state.canRedo();

    // Dirty indicator
    $('dirtyIndicator').style.display = state.dirty ? '' : 'none';

    // Canvas info
    $('canvasInfo').textContent = `${layout.resolution?.width || 1920} × ${layout.resolution?.height || 1080}`;
  }

  // ===========================
  // ELEMENT LIST (left sidebar)
  // ===========================

  function renderElementList() {
    const container = $('elementListItems');
    container.innerHTML = '';

    const keys = state.getElementOrder(); // respects drag-reordered z-order

    for (const key of keys) {
      const m = LayoutEditorState.getMetaFor(state.layout, key);
      const el = state.layout?.[key];
      if (!m || !el) continue;
      const shape = LayoutEditorState.isShape(el);
      const enabled = el?.enabled ?? false;

      const item = document.createElement('div');
      item.className = `lc-element-item${state.selectedElement === key ? ' active' : ''}${!enabled ? ' disabled' : ''}`;
      item.dataset.element = key;

      item.innerHTML = `
        <span class="lc-drag-handle" title="Drag to reorder"><i class="bi bi-grip-vertical"></i></span>
        <i class="bi ${m.icon}"></i>
        <span class="lc-el-name"></span>
        ${shape ? '<button class="lc-el-delete" title="Delete shape"><i class="bi bi-trash3"></i></button>' : ''}
        <button class="lc-el-toggle" title="${enabled ? 'Hide' : 'Show'}">
          <i class="bi ${enabled ? 'bi-eye-fill' : 'bi-eye-slash'}"></i>
        </button>
      `;

      // Shape names are user text
      item.querySelector('.lc-el-name').textContent = m.label;

      // --- Drag handle: only make draggable when handle is grabbed ---
      const handle = item.querySelector('.lc-drag-handle');
      handle.addEventListener('mousedown', () => { item.draggable = true; });

      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', key);
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.draggable = false;
        item.classList.remove('dragging');
        container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!item.classList.contains('dragging')) item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const draggedKey = e.dataTransfer.getData('text/plain');
        if (draggedKey && draggedKey !== key) {
          const order = state.getElementOrder();
          const newIndex = order.indexOf(key);
          state.reorderElement(draggedKey, newIndex);
        }
      });

      // Click → select
      item.addEventListener('click', (e) => {
        if (e.target.closest('.lc-el-toggle, .lc-el-delete, .lc-drag-handle')) return;
        state.selectElement(key);
      });

      if (shape) {
        item.querySelector('.lc-el-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          state.removeShape(key);
        });
      }

      // Toggle visibility
      item.querySelector('.lc-el-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        state.toggleElement(key);
      });

      container.appendChild(item);
    }
  }

  // ===========================
  // TOOLBAR ACTIONS
  // ===========================

  function bindToolbar() {
    // New
    $('btnNew').addEventListener('click', () => {
      if (state.dirty && !confirm('You have unsaved changes. Create new layout?')) return;
      state.createNew();
      editingId = null;
    });

    // Clone
    $('btnClone').addEventListener('click', openCloneModal);

    // Import
    $('btnImport').addEventListener('click', () => $('importInput').click());
    $('importInput').addEventListener('change', handleImport);

    // Export
    $('btnExport').addEventListener('click', handleExport);

    // Save
    $('btnSave').addEventListener('click', handleSave);

    // Undo / Redo
    $('btnUndo').addEventListener('click', () => state.undo());
    $('btnRedo').addEventListener('click', () => state.redo());

    // Add shape menu
    const shapeMenu = $('addShapeMenu');
    const closeShapeMenu = () => { shapeMenu.style.display = 'none'; };
    $('btnAddShape').addEventListener('click', (e) => {
      e.stopPropagation();
      shapeMenu.style.display = shapeMenu.style.display === 'none' ? '' : 'none';
    });
    shapeMenu.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-shape]');
      if (!btn) return;
      closeShapeMenu();
      state.addShape(btn.dataset.shape);
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lc-add-shape')) closeShapeMenu();
    });

    // Grid toggle
    $('btnGrid').addEventListener('click', () => {
      const on = preview.toggleGrid();
      $('btnGrid').classList.toggle('active', on);
    });

    // Layout name
    $('layoutName').addEventListener('input', (e) => {
      state.updateMeta('name', e.target.value);
    });

    // Description
    $('layoutDesc').addEventListener('input', (e) => {
      state.updateMeta('description', e.target.value);
    });
  }

  // ===========================
  // RESOLUTION
  // ===========================

  function bindResolution() {
    $('resWidth').addEventListener('change', (e) => {
      const val = parseInt(e.target.value) || 1920;
      state.updateMeta('resolution', { width: val });
    });
    $('resHeight').addEventListener('change', (e) => {
      const val = parseInt(e.target.value) || 1080;
      state.updateMeta('resolution', { height: val });
    });
  }

  // ===========================
  // CANVAS INTERACTION
  // ===========================

  function bindCanvasInteraction() {
    const wrapper = $('canvasWrapper');

    wrapper.addEventListener('mousedown', (e) => {
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
      const key = overlayTarget
        ? overlayTarget.dataset.element
        : preview.hitTest(e.clientX, e.clientY);

      if (key) {
        state.selectElement(key);
        preview.startDrag(key, e.clientX, e.clientY);
        _isDragging = true;
        wrapper.classList.add('dragging');
      } else {
        state.selectElement(null);
      }
    });

    window.addEventListener('mousemove', (e) => {
      // Resize
      if (preview.resizeState) {
        e.preventDefault();
        // Shift keeps the aspect ratio (video, shapes, linear progress bar); Alt skips snapping
        const result = preview.moveResize(e.clientX, e.clientY, e.shiftKey, !e.altKey);
        if (result) {
          for (const [prop, val] of Object.entries(result.updates)) {
            const parts = prop.split('.');
            let obj = state.layout[result.elementKey];
            for (let i = 0; i < parts.length - 1; i++) {
              if (!obj[parts[i]]) obj[parts[i]] = {};
              obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = val;
          }
          state.dirty = true;
          preview.updateLayoutRef(state.layout);
          preview.render();
          preview.syncHighlight(result.elementKey);
          inspectorUI.render();
        }
        return;
      }

      // Drag
      if (!preview.dragState) return;
      e.preventDefault();
      // Alt/Option drags without snapping
      const result = preview.moveDrag(e.clientX, e.clientY, !e.altKey);
      if (result && state.layout[result.elementKey]) {
        state.layout[result.elementKey].position.x = result.x;
        state.layout[result.elementKey].position.y = result.y;
        state.dirty = true;
        preview.updateLayoutRef(state.layout);
        preview.render();
        preview.syncHighlight(result.elementKey);
        inspectorUI.render();
      }
    });

    window.addEventListener('mouseup', () => {
      // End resize
      if (preview.resizeState) {
        const key = preview.resizeState.elementKey;
        preview.endResize();
        if (key && state.layout[key]) state.commitDrag(key);
        preview.updateHighlights();
        return;
      }
      // End drag
      if (preview.dragState) {
        const key = preview.dragState.elementKey;
        preview.endDrag();
        _isDragging = false;
        wrapper.classList.remove('dragging');
        if (key && state.layout[key]) state.commitDrag(key);
        preview.updateHighlights();
      }
    });
  }

  // ===========================
  // KEYBOARD SHORTCUTS
  // ===========================

  // Arrow key → [dx, dy]
  const NUDGE_KEYS = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1]
  };

  let _nudgeCommit = null;
  let _nudgeKey = null;

  /**
   * Move the selected element by canvas pixels.
   * Repeated presses are grouped into one undo step.
   */
  function nudgeSelected(dx, dy) {
    const key = state.selectedElement;
    const config = key && state.layout[key];
    if (!config || !config.enabled || !config.position) return;

    const { width, height } = state.layout.resolution;
    const { parsePosition } = UnifiedCanvasRenderer.prototype;
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
    inspectorUI.render();
    updateDOM();

    clearTimeout(_nudgeCommit);
    _nudgeKey = key;
    _nudgeCommit = setTimeout(flushNudge, 400);
  }

  function flushNudge() {
    if (!_nudgeCommit) return;
    clearTimeout(_nudgeCommit);
    _nudgeCommit = null;
    if (state.layout[_nudgeKey]) state.commitDrag(_nudgeKey);
  }

  function toggleShortcuts(show) {
    const modal = $('shortcutsModal');
    modal.style.display = (show ?? modal.style.display === 'none') ? '' : 'none';
  }

  function bindKeyboard() {
    // Show the platform's modifier key in the shortcuts list
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    document.querySelectorAll('.lc-kbd-mod').forEach(el => { el.textContent = isMac ? '⌘' : 'Ctrl'; });
    document.querySelectorAll('.lc-kbd-alt').forEach(el => { el.textContent = isMac ? '⌥' : 'Alt'; });
    $('btnShortcuts').addEventListener('click', () => toggleShortcuts(true));
    $('shortcutsClose').addEventListener('click', () => toggleShortcuts(false));
    $('shortcutsModal').addEventListener('click', (e) => {
      if (e.target === $('shortcutsModal')) toggleShortcuts(false);
    });

    document.addEventListener('keydown', (e) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const inField = e.target.closest('input, textarea, select');
      const key = e.key.toLowerCase();

      // Ctrl+Z → Undo
      if (isMeta && !e.shiftKey && key === 'z') {
        e.preventDefault();
        flushNudge();
        state.undo();
      }
      // Ctrl+Shift+Z or Ctrl+Y → Redo
      if ((isMeta && e.shiftKey && key === 'z') || (isMeta && key === 'y')) {
        e.preventDefault();
        flushNudge();
        state.redo();
      }
      // Arrows → Nudge selected element (Shift = 10px)
      if (NUDGE_KEYS[e.key] && !isMeta && !inField && state.selectedElement) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        nudgeSelected(NUDGE_KEYS[e.key][0] * step, NUDGE_KEYS[e.key][1] * step);
      }
      // ? → Keyboard shortcuts
      if (e.key === '?' && !inField) {
        toggleShortcuts();
      }
      // Ctrl+S → Save
      if (isMeta && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+E → Export
      if (isMeta && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
      // Escape → Close shortcuts, else deselect
      if (e.key === 'Escape') {
        if ($('shortcutsModal').style.display !== 'none') toggleShortcuts(false);
        else if ($('addShapeMenu').style.display !== 'none') $('addShapeMenu').style.display = 'none';
        else state.selectElement(null);
      }
      // G → Toggle Grid
      if (e.key === 'g' && !e.target.closest('input, textarea, select')) {
        const on = preview.toggleGrid();
        $('btnGrid').classList.toggle('active', on);
      }
      // Delete → Delete a shape, hide any other element
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElement && !inField) {
        e.preventDefault();
        if (!state.removeShape(state.selectedElement)) state.toggleElement(state.selectedElement);
      }
      // Ctrl+D → Duplicate selected shape
      if (isMeta && key === 'd' && state.selectedElement && !inField) {
        e.preventDefault();
        state.duplicateShape(state.selectedElement);
      }
    });
  }

  // ===========================
  // SAVE
  // ===========================

  function handleSave() {
    const layout = state.getLayout();

    // Validate
    const validation = LayoutRegistry.validateLayout(layout);
    if (!validation.isValid) {
      showToast(`Validation errors:\n${validation.errors.join('\n')}`, 'error');
      return;
    }

    // Generate ID
    const id = editingId || generateLayoutId(layout.name);

    // Save via LayoutRegistry
    const success = LayoutRegistry.addCustomLayout(id, layout);
    if (success) {
      editingId = id;
      state.markSaved(id);
      showToast('Layout saved!', 'success');

      // Notify main window via IPC if available
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('layout-creator:saved', { id, name: layout.name });
      }
    } else {
      showToast('Failed to save layout', 'error');
    }
  }

  // ===========================
  // EXPORT
  // ===========================

  function handleExport() {
    const layout = state.getLayout();
    const json = JSON.stringify(layout, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(layout.name || 'layout')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Layout exported!', 'success');
  }

  // ===========================
  // IMPORT
  // ===========================

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const validation = LayoutRegistry.validateLayout(data);
        if (!validation.isValid) {
          showToast(`Invalid layout:\n${validation.errors.join('\n')}`, 'error');
          return;
        }
        state.loadLayout(null, data);
        editingId = null;
        showToast(`Imported "${data.name}"`, 'success');
      } catch (err) {
        showToast('Failed to parse JSON file', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = '';
  }

  // ===========================
  // CLONE MODAL
  // ===========================

  function openCloneModal() {
    const list = $('cloneLayoutList');
    list.innerHTML = '';

    const allLayouts = LayoutRegistry.getAllLayouts();
    for (const info of allLayouts) {
      const item = document.createElement('div');
      item.className = 'lc-clone-item';
      item.innerHTML = `
        <div>
          <strong>${info.name}</strong>
          <span class="lc-badge">${info.type}</span>
        </div>
        <small>${info.description || ''}</small>
      `;
      item.addEventListener('click', () => {
        const data = LayoutRegistry.getLayout(info.id);
        state.cloneFrom(data, `${info.name} (Copy)`);
        editingId = null;
        closeCloneModal();
        showToast(`Cloned from "${info.name}"`, 'success');
      });
      list.appendChild(item);
    }

    $('cloneModal').style.display = '';
    $('cloneCancel').onclick = closeCloneModal;
    // Close on overlay click
    $('cloneModal').addEventListener('click', (e) => {
      if (e.target === $('cloneModal')) closeCloneModal();
    });
  }

  function closeCloneModal() {
    $('cloneModal').style.display = 'none';
  }

  // ===========================
  // HELPERS
  // ===========================

  function generateLayoutId(name) {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      || 'custom';
    // Ensure unique
    let id = `custom-${base}`;
    let counter = 1;
    while (LayoutRegistry.hasLayout(id)) {
      id = `custom-${base}-${counter++}`;
    }
    return id;
  }

  function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'layout';
  }

  function showToast(message, type = 'info') {
    const toast = $('toast');
    toast.textContent = message;
    toast.className = `lc-toast lc-toast-${type}`;
    toast.style.display = '';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }

  // ===========================
  // BOOT
  // ===========================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();