/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useReducer } from 'preact/hooks';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Select } from '../../ui/Select.jsx';
import { Switch } from '../../ui/Switch.jsx';
import { useSettings, useIpc } from '../settingsContext.jsx';

/**
 * DisplaySection - Display settings configuration
 */
export function DisplaySection() {
  const { settings, save } = useSettings();
  // Layouts can be added or removed from other windows
  const [, refresh] = useReducer(n => n + 1, 0);
  useIpc('layout-list-updated', refresh);

  const layouts = window.LayoutRegistry.getAllLayouts();
  const defaultLayout = window.LayoutRegistry.hasLayout(settings.defaultLayout)
    ? settings.defaultLayout
    : window.LayoutRegistry.getDefaultLayout();

  return (
    <div className="settings-section">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Display
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Configure display and layout preferences
      </p>

      <SettingsGroup title="General">
        <SettingsItem
          block
          title="Default Layout"
          description="Layout shown when app starts"
        >
          <Select fullWidth value={defaultLayout} onChange={(e) => save('defaultLayout', e.target.value)}>
            {layouts.map(layout => (
              <option key={layout.id} value={layout.id}>{`${layout.name} - ${layout.description}`}</option>
            ))}
          </Select>
        </SettingsItem>

        <SettingsItem
          title="Default Theme"
          description="Color scheme preference"
        >
          <Select className="w-48" value={settings.defaultTheme} onChange={(e) => save('defaultTheme', e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto (System)</option>
          </Select>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Canvas Resolution">
        <SettingsItem
          title="Output Resolution"
          description="Canvas rendering resolution (affects output quality and performance)"
        >
          <Select className="w-56" value={settings.canvasResolution} onChange={(e) => save('canvasResolution', e.target.value)}>
            <option value="1920x1080">1920×1080 (Full HD)</option>
            <option value="1280x720">1280×720 (HD)</option>
            <option value="2560x1440">2560×1440 (2K)</option>
            <option value="3840x2160">3840×2160 (4K)</option>
            <option value="custom">Custom...</option>
          </Select>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Watermark">
        <SettingsItem
          title="Show Watermark"
          description="we still love you anyway"
        >
          <Switch checked={settings.showWatermark !== false} onChange={(e) => save('showWatermark', e.target.checked)} />
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="External Display">
        <SettingsItem
          title="Auto-Open at Startup"
          description="Automatically open fullscreen timer on external display if available"
        >
          <Switch checked={!!settings.autoOpenDisplay} onChange={(e) => save('autoOpenDisplay', e.target.checked)} />
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default DisplaySection;
