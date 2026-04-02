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
import { ColorPicker } from '../../ui/ColorPicker.jsx';

/**
 * AppearanceSection - Theme and color settings
 */
export function AppearanceSection() {
  return (
    <div className="settings-section" id="section-appearance">
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
          <Select id="appearanceTheme" className="w-40">
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
            {/* Timer color picker */}
            <div className="color-picker-group grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ColorPickerItem id="countdownColor" label="Timer" defaultValue="#ffffff" />
            </div>
            
            {/* Match timer color toggle */}
            <div className="flex items-center justify-between py-3 border-y border-[var(--border-muted)]">
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">Match Timer Color</div>
                <div className="text-xs text-[var(--text-secondary)]">Make countdown timer color match the progress bar color</div>
              </div>
              <Switch id="matchTimerColor" />
            </div>
            
            {/* Other color pickers */}
            <div id="otherColorPickers" className="color-picker-group grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ColorPickerItem id="clockColor" label="Clock" defaultValue="#808080" />
              <ColorPickerItem id="elapsedColor" label="Elapsed" defaultValue="#808080" />
              <ColorPickerItem id="messageColor" label="Message" defaultValue="#ffffff" />
              <ColorPickerItem id="messageBackgroundColor" label="Message Background" defaultValue="#000000" />
              <ColorPickerItem id="separatorColor" label="Separator" defaultValue="#333333" />
              <ColorPickerItem id="backgroundColor" label="Background" defaultValue="#000000" />
            </div>
            
            <Button
              id="resetDisplayColors"
              variant="ghost"
              icon="bi-arrow-clockwise"
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
              <ColorPickerItem id="progressSuccess" label="Normal (30-100% remaining)" defaultValue="#4ade80" />
              <ColorPickerItem id="progressWarning" label="Warning (5-30% remaining)" defaultValue="#f59e0b" />
              <ColorPickerItem id="progressDanger" label="Critical (0-5% remaining)" defaultValue="#ef4444" />
              <ColorPickerItem id="progressOvertime" label="Overtime (negative time)" defaultValue="#991b1b" />
            </div>
            
            <Button
              id="resetProgressColors"
              variant="ghost"
              icon="bi-arrow-clockwise"
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
          <div className="feature-image-controls space-y-3">
            <div 
              id="coverImagePreview"
              className="feature-image-preview aspect-video w-full max-w-sm rounded-lg bg-[var(--bg-inset)] flex items-center justify-center overflow-hidden"
            >
              <div className="feature-image-placeholder text-center p-4">
                <i className="bi bi-image text-4xl text-[var(--border)]" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">No image selected</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                id="selectCoverImage"
                variant="ghost"
                icon="bi-folder-open"
              >
                Select Image
              </Button>
              <Button
                id="clearCoverImage"
                variant="ghost"
                icon="bi-trash"
                disabled
              >
                Clear Image
              </Button>
            </div>
          </div>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Background Image">
        <SettingsItem
          block
          title="Background Image"
          description="Display a background image that is always visible (lowest layer, behind all elements)"
        >
          <div className="feature-image-controls space-y-3">
            <div 
              id="backgroundImagePreview"
              className="feature-image-preview aspect-video w-full max-w-sm rounded-lg bg-[var(--bg-inset)] flex items-center justify-center overflow-hidden"
            >
              <div className="feature-image-placeholder text-center p-4">
                <i className="bi bi-image text-4xl text-[var(--border)]" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">No image selected</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                id="selectBackgroundImage"
                variant="ghost"
                icon="bi-folder-open"
              >
                Select Image
              </Button>
              <Button
                id="clearBackgroundImage"
                variant="ghost"
                icon="bi-trash"
                disabled
              >
                Clear Image
              </Button>
            </div>
          </div>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

/**
 * ColorPickerItem - Helper component for color picker with label
 */
function ColorPickerItem({ id, label, defaultValue }) {
  return (
    <div className="color-picker-item">
      <label className="block text-xs text-[var(--text-secondary)] mb-1.5">{label}</label>
      <div className="color-input-wrapper">
        <input 
          type="color" 
          id={id} 
          defaultValue={defaultValue}
          className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--border-default)] bg-transparent"
        />
      </div>
    </div>
  );
}

export default AppearanceSection;
