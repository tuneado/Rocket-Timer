import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';

const DEFAULT_SHORTCUTS = {
  'space': { enabled: true, key: 'space', description: 'Start/Stop timer' },
  'r': { enabled: true, key: 'r', description: 'Reset timer' },
  'arrowup': { enabled: true, key: 'arrowup', description: 'Add one minute' },
  'arrowdown': { enabled: true, key: 'arrowdown', description: 'Subtract one minute' },
  'shift+arrowup': { enabled: true, key: 'shift+arrowup', description: 'Add 5 minutes' },
  'shift+arrowdown': { enabled: true, key: 'shift+arrowdown', description: 'Subtract 5 minutes' },
  'ctrl+arrowup': { enabled: true, key: 'ctrl+arrowup', description: 'Add 10 minutes' },
  'ctrl+arrowdown': { enabled: true, key: 'ctrl+arrowdown', description: 'Subtract 10 minutes' },
  'f': { enabled: true, key: 'f', description: 'Flash screen' },
  'm': { enabled: true, key: 'm', description: 'Toggle sound mute' },
  'i': { enabled: true, key: 'i', description: 'Toggle feature image' },
  '1': { enabled: true, key: '1', description: 'Activate preset 1' },
  '2': { enabled: true, key: '2', description: 'Activate preset 2' },
  '3': { enabled: true, key: '3', description: 'Activate preset 3' },
  '4': { enabled: true, key: '4', description: 'Activate preset 4' },
  '5': { enabled: true, key: '5', description: 'Activate preset 5' },
  '6': { enabled: true, key: '6', description: 'Activate preset 6' },
  '7': { enabled: true, key: '7', description: 'Activate preset 7' },
  '8': { enabled: true, key: '8', description: 'Activate preset 8' },
};

const SHORTCUT_GROUPS = [
  {
    title: 'Timer Controls',
    keys: ['space', 'r', 'arrowup', 'arrowdown', 'shift+arrowup', 'shift+arrowdown', 'ctrl+arrowup', 'ctrl+arrowdown']
  },
  {
    title: 'Actions',
    keys: ['f', 'm', 'i']
  },
  {
    title: 'Presets',
    keys: ['1', '2', '3', '4', '5', '6', '7', '8']
  }
];

function formatKey(key) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return key
    .split('+')
    .map(k => {
      if (isMac && k === 'ctrl') return '\u2303';
      if (isMac && k === 'alt') return '\u2325';
      if (isMac && k === 'shift') return '\u21E7';
      if (isMac && k === 'meta') return '\u2318';
      if (k === 'arrowup') return '\u2191';
      if (k === 'arrowdown') return '\u2193';
      if (k === 'arrowleft') return '\u2190';
      if (k === 'arrowright') return '\u2192';
      if (k === 'space') return 'Space';
      return k.charAt(0).toUpperCase() + k.slice(1);
    })
    .join(' ');
}

function ShortcutRow({ shortcutKey, config, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-5 border-b border-[var(--border-muted)] last:border-b-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <kbd className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md text-xs font-mono text-[var(--text-primary)] shadow-sm">
          {formatKey(shortcutKey)}
        </kbd>
        <span className={`text-sm ${config.enabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {config.description}
        </span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={() => onToggle(shortcutKey)}
          className="sr-only"
          role="switch"
        />
        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${config.enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-muted)]'}`}>
          <div
            className="w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"
            style={{
              transform: config.enabled ? 'translate(21px, 2px)' : 'translate(2px, 2px)',
            }}
          />
        </div>
      </label>
    </div>
  );
}

export function ShortcutsSection() {
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS);

  useEffect(() => {
    loadShortcuts();
  }, []);

  async function loadShortcuts() {
    try {
      if (window.electron && window.electron.settings) {
        const settings = await window.electron.settings.getAll();
        if (settings.keyboardShortcuts) {
          setShortcuts({ ...DEFAULT_SHORTCUTS, ...settings.keyboardShortcuts });
        }
      }
    } catch (error) {
      console.warn('Could not load shortcut settings:', error);
    }
  }

  async function handleToggle(key) {
    const updated = {
      ...shortcuts,
      [key]: { ...shortcuts[key], enabled: !shortcuts[key].enabled }
    };
    setShortcuts(updated);

    try {
      if (window.electron && window.electron.settings) {
        await window.electron.settings.save('keyboardShortcuts', updated);
      }
    } catch (error) {
      console.error('Error saving shortcut settings:', error);
    }
  }

  async function handleEnableAll() {
    const updated = {};
    for (const [key, config] of Object.entries(shortcuts)) {
      updated[key] = { ...config, enabled: true };
    }
    setShortcuts(updated);
    try {
      if (window.electron && window.electron.settings) {
        await window.electron.settings.save('keyboardShortcuts', updated);
      }
    } catch (error) {
      console.error('Error saving shortcut settings:', error);
    }
  }

  async function handleDisableAll() {
    const updated = {};
    for (const [key, config] of Object.entries(shortcuts)) {
      updated[key] = { ...config, enabled: false };
    }
    setShortcuts(updated);
    try {
      if (window.electron && window.electron.settings) {
        await window.electron.settings.save('keyboardShortcuts', updated);
      }
    } catch (error) {
      console.error('Error saving shortcut settings:', error);
    }
  }

  const enabledCount = Object.values(shortcuts).filter(s => s.enabled).length;
  const totalCount = Object.keys(shortcuts).length;

  return (
    <div className="settings-section" id="section-shortcuts">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Keyboard Shortcuts
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Configure keyboard shortcuts for the timer controls. {enabledCount}/{totalCount} shortcuts enabled.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={handleEnableAll}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
        >
          Enable All
        </button>
        <button
          onClick={handleDisableAll}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
        >
          Disable All
        </button>
      </div>

      {SHORTCUT_GROUPS.map(group => (
        <SettingsGroup key={group.title} title={group.title}>
          {group.keys.map(key => (
            shortcuts[key] && (
              <ShortcutRow
                key={key}
                shortcutKey={key}
                config={shortcuts[key]}
                onToggle={handleToggle}
              />
            )
          ))}
        </SettingsGroup>
      ))}
    </div>
  );
}

export default ShortcutsSection;
