/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Select } from '../../ui/Select.jsx';
import { Switch } from '../../ui/Switch.jsx';
import { Button } from '../../ui/Button.jsx';
import { useSettings } from '../settingsContext.jsx';

const DEFAULT_DISPLAY_COLORS = {
  countdown: '#ffffff',
  clock: '#808080',
  elapsed: '#808080',
  message: '#ffffff',
  messageBackground: '#000000',
  separator: '#333333',
  background: '#000000'
};

const DEFAULT_PROGRESS_COLORS = {
  progressSuccess: '#4ade80',
  progressWarning: '#f59e0b',
  progressDanger: '#ef4444',
  progressOvertime: '#991b1b'
};

const OTHER_DISPLAY_COLORS = [
  ['clock', 'Clock'],
  ['elapsed', 'Elapsed / End At'],
  ['message', 'Message'],
  ['messageBackground', 'Message Background'],
  ['separator', 'Separator'],
  ['background', 'Background']
];

const PROGRESS_COLORS = [
  ['progressSuccess', 'Normal (30-100% remaining)'],
  ['progressWarning', 'Warning (5-30% remaining)'],
  ['progressDanger', 'Critical (0-5% remaining)'],
  ['progressOvertime', 'Overtime (negative time)']
];

/**
 * AppearanceSection - Theme and color settings
 */
export function AppearanceSection() {
  const { settings, save, saveColors, notify } = useSettings();
  const colors = { ...DEFAULT_DISPLAY_COLORS, ...DEFAULT_PROGRESS_COLORS, ...(settings.colors || {}) };
  const matchTimerColor = !!settings.matchTimerColor;

  const colorPicker = ([key, label], extra = {}) => (
    <ColorPickerItem
      key={key}
      label={label}
      value={colors[key]}
      onChange={(value) => saveColors({ [key]: value })}
      {...extra}
    />
  );

  return (
    <div className="settings-section">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Appearance
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Customize colors and theme
      </p>

      <SettingsGroup title="Theme">
        <SettingsItem
          title="Color Theme"
          description="Choose light or dark appearance"
        >
          <Select className="w-40" value={settings.appearanceTheme || 'dark'} onChange={(e) => save('appearanceTheme', e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto (System)</option>
          </Select>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Canvas Colors">
        <SettingsItem
          block
          title="Text & Element Colors"
          description="Customize timer display colors"
        >
          <div className="space-y-4">
            {/* Timer color picker: locked while it follows the progress bar */}
            <div className="color-picker-group grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colorPicker(['countdown', 'Timer'], { locked: matchTimerColor })}
            </div>

            <div className="flex items-center justify-between py-3 border-y border-[var(--border-muted)]">
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">Match Timer Color</div>
                <div className="text-xs text-[var(--text-secondary)]">Make countdown timer color match the progress bar color</div>
              </div>
              <Switch checked={matchTimerColor} onChange={(e) => save('matchTimerColor', e.target.checked)} />
            </div>

            <div className="color-picker-group grid grid-cols-2 sm:grid-cols-3 gap-3">
              {OTHER_DISPLAY_COLORS.map(entry => colorPicker(entry))}
            </div>

            <Button
              variant="ghost"
              icon="bi-arrow-clockwise"
              onClick={() => {
                saveColors(DEFAULT_DISPLAY_COLORS);
                notify('Display colors reset to default', 'success');
              }}
            >
              Reset to Default
            </Button>
          </div>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Progress Bar Colors">
        <SettingsItem
          block
          title="Progress & Warning Colors"
          description="Colors for progress bar and warning levels based on time remaining. Timer colors will match these when 'Match Timer Color' is enabled."
        >
          <div className="space-y-4">
            <div className="color-picker-group grid grid-cols-2 gap-3">
              {PROGRESS_COLORS.map(entry => colorPicker(entry))}
            </div>

            <Button
              variant="ghost"
              icon="bi-arrow-clockwise"
              onClick={() => {
                saveColors(DEFAULT_PROGRESS_COLORS);
                notify('Progress colors reset to default', 'success');
              }}
            >
              Reset to Default
            </Button>
          </div>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Cover Image">
        <SettingsItem
          block
          title="Cover Image Overlay"
          description="Display a custom image that covers the entire display (highest layer, toggle via main UI button)"
        >
          <ImagePicker
            path={settings.coverImage?.path}
            alt="Cover Image"
            onSelect={async () => {
              const path = await pickImage('select-cover-image');
              // Not enabled automatically: the main window's cover button controls it
              if (path) save('coverImage', { ...settings.coverImage, path, enabled: false });
            }}
            onClear={() => save('coverImage', { enabled: false, path: '' })}
          />
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Background Image">
        <SettingsItem
          block
          title="Background Image"
          description="Display a background image that is always visible (lowest layer, behind all elements)"
        >
          <ImagePicker
            path={settings.backgroundImage?.path}
            alt="Background Image"
            onSelect={async () => {
              const path = await pickImage('select-background-image');
              if (!path) return;
              const backgroundImage = { ...settings.backgroundImage, path, enabled: true, opacity: 1.0 };
              await save('backgroundImage', backgroundImage);
              window.electron.ipcRenderer.send('sync-background-image-update', { enabled: true, path, opacity: 1.0 });
            }}
            onClear={async () => {
              const backgroundImage = { enabled: false, path: '', opacity: 1.0 };
              await save('backgroundImage', backgroundImage);
              window.electron.ipcRenderer.send('sync-background-image-update', backgroundImage);
            }}
          />
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

/**
 * Open the main-process image picker; returns the chosen path or null
 */
async function pickImage(channel) {
  try {
    const result = await window.electron.ipcRenderer.invoke(channel);
    return result && !result.canceled && result.filePaths.length > 0 ? result.filePaths[0] : null;
  } catch (error) {
    console.error(`Error selecting image (${channel}):`, error);
    return null;
  }
}

function ImagePicker({ path, alt, onSelect, onClear }) {
  return (
    <div className="feature-image-controls space-y-3">
      <div className="feature-image-preview aspect-video w-full max-w-sm rounded-lg bg-[var(--bg-inset)] flex items-center justify-center overflow-hidden">
        {path ? (
          <img src={`file://${path}`} alt={alt} />
        ) : (
          <div className="feature-image-placeholder text-center p-4">
            <i className="bi bi-image text-4xl text-[var(--border)]" />
            <p className="mt-2 text-sm text-[var(--text-secondary)]">No image selected</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" icon="bi-folder-open" onClick={onSelect}>
          Select Image
        </Button>
        <Button variant="ghost" icon="bi-trash" disabled={!path} onClick={onClear}>
          Clear Image
        </Button>
      </div>
    </div>
  );
}

/**
 * Color picker with label; `locked` disables it and shows a lock badge
 */
function ColorPickerItem({ label, value, onChange, locked = false }) {
  return (
    <div className="color-picker-item">
      <label className="block text-xs text-[var(--text-secondary)] mb-1.5">{label}</label>
      <div className="color-input-wrapper" style={{ position: 'relative' }}>
        <input
          type="color"
          value={value}
          disabled={locked}
          style={{ opacity: locked ? 0.5 : 1 }}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--border-default)] bg-transparent"
        />
        {locked && (
          <span
            className="match-indicator"
            title="Locked to progress bar color"
            style={{
              position: 'absolute', top: '-5px', right: '-5px', background: 'var(--progress-bg)', color: 'white',
              borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
            }}
          >
            <i className="bi bi-lock-fill" />
          </span>
        )}
      </div>
    </div>
  );
}

export default AppearanceSection;
