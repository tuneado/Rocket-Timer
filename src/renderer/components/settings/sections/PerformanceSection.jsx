import { h } from 'preact';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Switch } from '../../ui/Switch.jsx';

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

      <SettingsGroup title="Optimization">
        <SettingsItem
          title="Hardware Acceleration"
          description="Use GPU for rendering (recommended)"
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
          description="Reduce resource usage for battery saving"
        >
          <Switch id="lowPowerMode" />
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default PerformanceSection;
