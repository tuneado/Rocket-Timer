/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Switch } from '../../ui/Switch.jsx';
import { Select } from '../../ui/Select.jsx';
import { useSettings, useIpc } from '../settingsContext.jsx';

/**
 * PerformanceSection - Rendering options and live renderer statistics
 */
export function PerformanceSection() {
  const { settings, save } = useSettings();
  // Sent by the main window's renderer
  const [stats, setStats] = useState(null);
  useIpc('performance-stats-update', setStats);

  return (
    <div className="settings-section">
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
          <Select className="w-48" value={settings.canvasQuality} onChange={(e) => save('canvasQuality', e.target.value)}>
            <option value="high">High — Best quality, smooth anti-aliasing</option>
            <option value="balanced">Balanced — Good quality, moderate resources</option>
            <option value="performance">Performance — Fastest, minimal anti-aliasing</option>
          </Select>
        </SettingsItem>

        <SettingsItem
          title="Frame Rate"
          description="Target rendering speed for canvas output"
        >
          <Select className="w-48" value={String(settings.frameRate)} onChange={(e) => save('frameRate', parseInt(e.target.value, 10))}>
            <option value="15">15 FPS — Low Power</option>
            <option value="30">30 FPS — Balanced</option>
            <option value="60">60 FPS — Smooth</option>
          </Select>
        </SettingsItem>

        <SettingsItem
          title="Hardware Acceleration"
          description="Use GPU for rendering (recommended, requires restart)"
        >
          <Switch
            checked={settings.hardwareAcceleration !== false}
            onChange={(e) => {
              save('hardwareAcceleration', e.target.checked);
              window.electron.ipcRenderer.send('show-restart-notification');
            }}
          />
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Monitor">
        <SettingsItem
          block
          title="Renderer Status"
          description="Real-time rendering statistics"
        >
          <RendererStats stats={stats} />
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

function StatRow({ label, children }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="text-[var(--text-primary)]">{children}</span>
    </div>
  );
}

const loadColor = (pct) => (pct > 80 ? 'text-red-500' : pct > 50 ? 'text-yellow-500' : 'text-green-500');

function RendererStats({ stats }) {
  const box = 'mt-2 p-3 rounded-lg bg-[var(--bg-surface-raised)] font-mono text-xs space-y-1';
  if (!stats) {
    return (
      <div className={box}>
        <StatRow label="Status:">--</StatRow>
        <StatRow label="FPS:">--</StatRow>
        <StatRow label="Render Time:">--</StatRow>
        <StatRow label="Frames Rendered:">--</StatRow>
      </div>
    );
  }

  const load = Math.round((parseFloat(stats.averageRenderTime) / (1000 / stats.targetFPS)) * 100);
  const currentFPS = parseFloat(stats.currentFPS);
  let fpsColor = 'text-green-500';
  if (!stats.isIdle) {
    if (currentFPS < stats.targetFPS * 0.7) fpsColor = 'text-red-500';
    else if (currentFPS < stats.targetFPS * 0.9) fpsColor = 'text-yellow-500';
  }

  const skipped = stats.skippedFrames || 0;
  const total = stats.totalLoopIterations || 0;
  const rendered = total - skipped;
  const skippedPct = total > 0 ? Math.round((skipped / total) * 100) : 0;

  return (
    <div className={box}>
      <StatRow label="Status:">
        {stats.isIdle
          ? <span className="text-blue-400">Idle — nothing to render</span>
          : <span className={loadColor(load)}>Active — {load}% render load</span>}
      </StatRow>
      <StatRow label="FPS:">
        <span className={fpsColor}>{stats.currentFPS}</span> / {stats.targetFPS} target
      </StatRow>
      <StatRow label="Render Time:">
        {`${stats.averageRenderTime}ms avg (${stats.minRenderTime}–${stats.maxRenderTime}ms)`}
      </StatRow>
      <StatRow label="Frames Rendered:">
        {skippedPct > 0
          ? `${rendered}/s rendered, ${skipped}/s skipped (${skippedPct}% saved)`
          : `${rendered}/s rendered`}
      </StatRow>
    </div>
  );
}

export default PerformanceSection;
