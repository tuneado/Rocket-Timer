import { h } from 'preact';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Select } from '../../ui/Select.jsx';
import { Switch } from '../../ui/Switch.jsx';

/**
 * DisplaySection - Display settings configuration
 */
export function DisplaySection() {
  return (
    <div className="settings-section" id="section-display">
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
          <Select id="defaultLayout" fullWidth>
            {/* Options populated dynamically from LayoutRegistry */}
          </Select>
        </SettingsItem>

        <SettingsItem
          title="Default Theme"
          description="Color scheme preference"
        >
          <Select id="defaultTheme" className="w-48">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto (System)</option>
          </Select>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="External Display">
        <SettingsItem
          title="Auto-Open at Startup"
          description="Automatically open fullscreen timer on external display if available"
        >
          <Switch id="autoOpenDisplay" />
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default DisplaySection;
