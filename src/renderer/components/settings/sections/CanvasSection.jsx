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

/**
 * CanvasSection - Canvas output settings
 */
export function CanvasSection() {
  return (
    <div className="settings-section" id="section-canvas">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Canvas
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Configure canvas output settings
      </p>

      <SettingsGroup title="Resolution & Quality">
        <SettingsItem
          title="Output Resolution"
          description="Canvas rendering resolution"
        >
          <Select id="canvasResolution" className="w-56">
            <option value="1920x1080">1920×1080 (Full HD)</option>
            <option value="1280x720">1280×720 (HD)</option>
            <option value="2560x1440">2560×1440 (2K)</option>
            <option value="3840x2160">3840×2160 (4K)</option>
            <option value="custom">Custom...</option>
          </Select>
        </SettingsItem>

        <SettingsItem
          title="Canvas Quality"
          description="Rendering quality vs performance"
        >
          <Select id="canvasQuality" className="w-48">
            <option value="high">High Quality</option>
            <option value="balanced">Balanced</option>
            <option value="performance">Performance</option>
          </Select>
        </SettingsItem>

        <SettingsItem
          title="Frame Rate"
          description="Target refresh rate"
        >
          <Select id="frameRate" className="w-32">
            <option value="60">60 FPS</option>
            <option value="30">30 FPS</option>
            <option value="24">24 FPS</option>
          </Select>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default CanvasSection;
