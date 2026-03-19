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

      <SettingsGroup title="Rendering Quality">
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
          description="Higher frame rates use more CPU/GPU"
        >
          <Select id="frameRate" className="w-48">
            <option value="30">30 FPS (Battery Saver)</option>
            <option value="60">60 FPS (Recommended)</option>
            <option value="120">120 FPS (High Performance)</option>
          </Select>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Optimization">
        <SettingsItem
          title="Hardware Acceleration"
          description="Use GPU for rendering (recommended, requires restart)"
        >
          <Switch id="hardwareAcceleration" checked />
        </SettingsItem>

        <SettingsItem
          title="Reduce Motion"
          description="Minimize animations for better performance"
        >
          <Switch id="reduceMotion" />
        </SettingsItem>

        <SettingsItem
          title="Low Power Mode"
          description="Reduce resource usage for battery saving (caps at 30 FPS)"
        >
          <Switch id="lowPowerMode" />
        </SettingsItem>
      </SettingsGroup>
      
      <SettingsGroup title="Performance Monitoring">
        <SettingsItem
          block
          title="Current Performance"
          description="Real-time rendering statistics"
        >
          <div id="performanceStats" className="mt-2 p-3 rounded-lg bg-[var(--bg-surface-raised)] font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">FPS:</span>
              <span id="statFPS" className="text-[var(--text-primary)]">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Render Time:</span>
              <span id="statRenderTime" className="text-[var(--text-primary)]">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Dropped Frames:</span>
              <span id="statDroppedFrames" className="text-[var(--text-primary)]">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Cache Size:</span>
              <span id="statCacheSize" className="text-[var(--text-primary)]">--</span>
            </div>
          </div>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default PerformanceSection;
