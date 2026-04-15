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
import { Switch } from '../../ui/Switch.jsx';
import { Select } from '../../ui/Select.jsx';

/**
 * PerformanceSection - Performance optimization settings
 */
export function PerformanceSection() {
  return (
    <div className="settings-section" id="section-performance">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Performance
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Optimize performance and resource usage
      </p>

      <SettingsGroup title="Rendering">
        <SettingsItem
          title="Canvas Quality"
          description="Rendering quality affects GPU usage and visual smoothness"
        >
          <Select id="canvasQuality" className="w-48">
            <option value="high">High — Best quality, smooth anti-aliasing</option>
            <option value="balanced">Balanced — Good quality, moderate resources</option>
            <option value="performance">Performance — Fastest, minimal anti-aliasing</option>
          </Select>
        </SettingsItem>

        <SettingsItem
          title="Frame Rate"
          description="Target rendering speed for canvas output"
        >
          <Select id="frameRate" className="w-48">
            <option value="15">15 FPS — Low Power</option>
            <option value="30">30 FPS — Balanced</option>
            <option value="60">60 FPS — Smooth</option>
          </Select>
        </SettingsItem>

        <SettingsItem
          title="Hardware Acceleration"
          description="Use GPU for rendering (recommended, requires restart)"
        >
          <Switch id="hardwareAcceleration" checked />
        </SettingsItem>
      </SettingsGroup>
      
      <SettingsGroup title="Monitor">
        <SettingsItem
          block
          title="Renderer Status"
          description="Real-time rendering statistics"
        >
          <div id="performanceStats" className="mt-2 p-3 rounded-lg bg-[var(--bg-surface-raised)] font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Status:</span>
              <span id="statStatus" className="text-[var(--text-primary)]">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">FPS:</span>
              <span id="statFPS" className="text-[var(--text-primary)]">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Render Time:</span>
              <span id="statRenderTime" className="text-[var(--text-primary)]">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Frames Rendered:</span>
              <span id="statFramesRendered" className="text-[var(--text-primary)]">--</span>
            </div>
          </div>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default PerformanceSection;
