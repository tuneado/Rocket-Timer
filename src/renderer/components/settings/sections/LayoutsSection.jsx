/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useState, useReducer } from 'preact/hooks';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { FileUpload } from '../../ui/FileUpload.jsx';
import { Button } from '../../ui/Button.jsx';
import { useSettings, useIpc } from '../settingsContext.jsx';

// Main window refreshes its layout selector on this message
const announceLayoutChange = () => window.electron.ipcRenderer.send('layout-list-updated');

export function LayoutsSection() {
  const { settings, save, notify } = useSettings();
  const registry = window.LayoutRegistry;
  // Layouts can change from other windows (e.g. the Layout Creator)
  const [, refresh] = useReducer(n => n + 1, 0);
  useIpc('layout-list-updated', refresh);

  const hidden = settings.hiddenBuiltinLayouts || [];
  const builtin = registry.getBuiltinLayouts();
  const custom = registry.getCustomLayouts();

  const setHidden = (layoutId, isHidden) => {
    const next = isHidden ? [...new Set([...hidden, layoutId])] : hidden.filter(id => id !== layoutId);
    save('hiddenBuiltinLayouts', next).then(announceLayoutChange);
  };

  const deleteLayout = (layout) => {
    if (!window.confirm(`Delete custom layout "${layout.name}"?`)) return;
    if (registry.removeCustomLayout(layout.id)) {
      notify(`Layout "${layout.name}" deleted successfully`, 'success');
      announceLayoutChange();
      refresh();
    } else {
      notify('Failed to delete layout', 'error');
    }
  };

  const clearAll = () => {
    if (!window.confirm(`Delete all ${custom.length} custom layouts? This action cannot be undone.`)) return;
    if (registry.clearAllCustomLayouts()) {
      notify('All custom layouts cleared successfully', 'success');
      announceLayoutChange();
      refresh();
    } else {
      notify('Failed to clear custom layouts', 'error');
    }
  };

  return (
    <div className="settings-section">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Layouts
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Manage custom canvas layouts
      </p>

      <SettingsGroup title="Layout Creator">
        <SettingsItem
          block
          title="Visual Layout Editor"
          description="Create and customize layouts with a visual drag-and-drop editor"
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon="bi-easel" onClick={() => window.electron.ipcRenderer.send('open-layout-creator')}>
              Open Layout Creator
            </Button>
          </div>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Available Layouts">
        <SettingsItem
          block
          title="Built-in Layouts"
          description="Default layouts included with the application"
        >
          <div className="layout-list">
            {builtin.map(layout => (
              <BuiltinLayoutItem
                key={layout.id}
                layout={layout}
                hidden={hidden.includes(layout.id)}
                onHiddenChange={(isHidden) => setHidden(layout.id, isHidden)}
              />
            ))}
          </div>
        </SettingsItem>

        <SettingsItem
          block
          title="Custom Layouts"
          description="User-uploaded custom layout files"
        >
          <div className="layout-list">
            {custom.length === 0 ? (
              <div className="p-4 rounded-lg bg-[var(--bg-surface-raised)] text-sm text-[var(--text-secondary)] flex items-center gap-2">
                <i className="bi bi-info-circle" />
                No custom layouts uploaded yet
              </div>
            ) : custom.map(layout => (
              <CustomLayoutItem key={layout.id} layout={layout} onDelete={() => deleteLayout(layout)} />
            ))}
          </div>
          {custom.length > 0 && (
            <div className="mt-3 flex">
              <Button variant="danger" icon="bi-trash" onClick={clearAll}>
                Clear All Custom Layouts
              </Button>
            </div>
          )}
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Upload Custom Layout">
        <SettingsItem
          block
          title="Import Layout"
          description="Upload a custom layout JSON file"
        >
          <LayoutUpload onAdded={refresh} />
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

function IdBadge({ id }) {
  return (
    <span className="inline-block ml-1.5 px-1.5 py-px text-[9px] font-mono rounded bg-white/5 text-[var(--text-muted)] opacity-70">
      ID: {id}
    </span>
  );
}

const resolutionOf = (layout) =>
  layout.resolution ? `${layout.resolution.width}×${layout.resolution.height}` : 'Unknown';

function BuiltinLayoutItem({ layout, hidden, onHiddenChange }) {
  return (
    <div className={`layout-item layout-item-compact${hidden ? ' layout-hidden' : ''}`}>
      <div className="layout-item-info">
        <div className="layout-item-name text-sm">{layout.name} <IdBadge id={layout.id} /></div>
        <div className="layout-item-description text-xs">{layout.description}</div>
      </div>
      <div className="layout-item-actions">
        <span className="layout-item-resolution text-xs">{resolutionOf(layout)}</span>
        <label className="hide-layout-toggle flex items-center gap-1.5 cursor-pointer text-xs text-[var(--text-secondary)]" title="Hide from layout selector">
          <input type="checkbox" className="hide-layout-checkbox" checked={hidden} onChange={(e) => onHiddenChange(e.target.checked)} />
          <span>Hide</span>
        </label>
      </div>
    </div>
  );
}

function CustomLayoutItem({ layout, onDelete }) {
  return (
    <div className="layout-item">
      <div className="layout-item-info">
        <div className="layout-item-name">{layout.name} <IdBadge id={layout.id} /></div>
        <div className="layout-item-description">{layout.description}</div>
        <div className="layout-item-resolution">{resolutionOf(layout)}</div>
      </div>
      <div className="layout-item-actions">
        <span className={`layout-item-type ${layout.type}`}>{layout.type}</span>
        <button
          className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
          title="Delete Layout"
          onClick={onDelete}
        >
          <i className="bi bi-trash" />
        </button>
      </div>
    </div>
  );
}

/**
 * Pick a layout JSON file, validate it, and add it as a custom layout
 */
function LayoutUpload({ onAdded }) {
  const { notify } = useSettings();
  const registry = window.LayoutRegistry;
  const [file, setFile] = useState(null);       // { name, data } — data null if unparseable
  const [validation, setValidation] = useState(null);
  const [inputKey, setInputKey] = useState(0);  // remount FileUpload to clear it

  const reset = () => {
    setFile(null);
    setValidation(null);
    setInputKey(k => k + 1);
  };

  const onFile = async (picked) => {
    setValidation(null);
    try {
      setFile({ name: picked.name, data: JSON.parse(await picked.text()) });
    } catch (error) {
      notify(`Invalid JSON file: ${error.message}`, 'error');
      setFile({ name: picked.name, data: null });
    }
  };

  const validate = () => {
    if (!file?.data) {
      setValidation({ isValid: false, errors: ['No layout data to validate'] });
      return null;
    }
    const result = registry.validateLayout(file.data);
    setValidation(result);
    return result;
  };

  const add = () => {
    const result = validate();
    if (!result?.isValid) {
      notify('Please fix validation errors before uploading', 'error');
      return;
    }
    // ID from the file name, without extension
    const layoutId = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (registry.hasLayout(layoutId) && !window.confirm(`A layout with ID "${layoutId}" already exists. Replace it?`)) {
      return;
    }
    if (registry.addCustomLayout(layoutId, file.data)) {
      notify(`Layout "${file.data.name}" uploaded successfully!`, 'success');
      announceLayoutChange();
      reset();
      onAdded();
    } else {
      notify('Failed to upload layout', 'error');
    }
  };

  const downloadSample = () => {
    const blob = new Blob([JSON.stringify(registry.getLayout('classic'), null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-layout.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 layout-upload-controls">
      <FileUpload
        key={inputKey}
        accept=".json"
        buttonText="Choose layout file..."
        icon="bi-upload"
        fileName={file?.name || ''}
        onChange={onFile}
        onClear={reset}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon="bi-plus-circle" disabled={!file?.data} onClick={add}>
          Add Layout
        </Button>
        <Button variant="ghost" icon="bi-check-circle" disabled={!file} onClick={validate}>
          Validate
        </Button>
        <Button variant="ghost" icon="bi-download" onClick={downloadSample}>
          Download Sample
        </Button>
      </div>

      {validation && (
        <div className={`layout-validation ${validation.isValid ? 'valid' : 'invalid'}`}>
          <div className="layout-validation-title">
            <i className={`bi ${validation.isValid ? 'bi-check-circle' : 'bi-x-circle'}`} />
            {validation.isValid ? 'Layout validation passed' : 'Layout validation failed'}
          </div>
          {validation.isValid
            ? <p>The layout file is valid and ready to upload.</p>
            : (
              <ul className="layout-validation-errors">
                {validation.errors.map((error, i) => <li key={i}>{error}</li>)}
              </ul>
            )}
        </div>
      )}
    </div>
  );
}

export default LayoutsSection;
