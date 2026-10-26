/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Select } from '../../ui/Select.jsx';
import { Switch } from '../../ui/Switch.jsx';
import { Input } from '../../ui/Input.jsx';
import { FileUpload } from '../../ui/FileUpload.jsx';
import { useSettings } from '../settingsContext.jsx';

const int = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
};
const mmss = (m, s) => `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

/**
 * TimerSection - Timer behavior settings
 */
export function TimerSection() {
  const { settings, save, notify } = useSettings();
  const time = settings.defaultTime || { hours: 0, minutes: 45, seconds: 0 };
  const thresholdType = settings.timerThresholdType || 'percentage';

  const warningPct = settings.warningPercentage ?? 30;
  const criticalPct = settings.criticalPercentage ?? 5;
  const warnM = settings.warningTimeMinutes ?? 2;
  const warnS = settings.warningTimeSeconds ?? 0;
  const critM = settings.criticalTimeMinutes ?? 0;
  const critS = settings.criticalTimeSeconds ?? 30;

  // State preview dots use the progress bar colors
  const colors = settings.colors || {};
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--preview-normal-color', colors.progressSuccess || '#4ade80');
    root.setProperty('--preview-warning-color', colors.progressWarning || '#f59e0b');
    root.setProperty('--preview-critical-color', colors.progressDanger || '#ef4444');
    root.setProperty('--preview-overtime-color', colors.progressOvertime || '#991b1b');
  }, [colors.progressSuccess, colors.progressWarning, colors.progressDanger, colors.progressOvertime]);

  const saveTime = (part, value) => save('defaultTime', { ...time, [part]: int(value) });

  // Critical must stay below warning; keep it one step under when they cross
  const savePercentages = (warning, critical) => {
    save('warningPercentage', warning);
    save('criticalPercentage', critical >= warning ? Math.max(1, warning - 1) : critical);
  };
  const saveTimes = (wm, ws, cm, cs) => {
    const warningTotal = wm * 60 + ws;
    let criticalTotal = cm * 60 + cs;
    if (criticalTotal >= warningTotal) criticalTotal = Math.max(1, warningTotal - 1);
    save('warningTimeMinutes', wm);
    save('warningTimeSeconds', ws);
    save('criticalTimeMinutes', Math.floor(criticalTotal / 60));
    save('criticalTimeSeconds', criticalTotal % 60);
  };

  const onSoundFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      await save('customSoundFile', event.target.result);
      await save('customSoundFileName', file.name);
      notify('Custom sound uploaded successfully', 'success');
    };
    reader.onerror = () => notify('Failed to upload sound file', 'error');
    reader.readAsDataURL(file);
  };

  const ranges = thresholdType === 'percentage'
    ? {
      normal: `Above ${warningPct}%`,
      warning: `${criticalPct}% - ${warningPct}%`,
      critical: `0% - ${criticalPct}%`
    }
    : {
      normal: `Above ${mmss(warnM, warnS)}`,
      warning: `${mmss(critM, critS)} - ${mmss(warnM, warnS)}`,
      critical: `00:00 - ${mmss(critM, critS)}`
    };

  return (
    <div className="settings-section">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Timer
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Configure default timer behavior
      </p>

      <SettingsGroup title="Defaults">
        <SettingsItem
          title="Default Countdown Time"
          description="Starting time when app opens"
        >
          <div className="flex items-center gap-1">
            <Input type="number" min="0" max="23" className="w-16 text-center"
              value={time.hours ?? 0} onChange={(e) => saveTime('hours', e.target.value)} />
            <span className="text-[var(--text-secondary)]">:</span>
            <Input type="number" min="0" max="59" className="w-16 text-center"
              value={time.minutes ?? 45} onChange={(e) => saveTime('minutes', e.target.value)} />
            <span className="text-[var(--text-secondary)]">:</span>
            <Input type="number" min="0" max="59" className="w-16 text-center"
              value={time.seconds ?? 0} onChange={(e) => saveTime('seconds', e.target.value)} />
          </div>
        </SettingsItem>

        <SettingsItem
          title="Auto-Stop at Zero"
          description="Stop timer when reaching 00:00:00 (if disabled, timer continues into negative time)"
        >
          <Switch checked={settings.autoStopAtZero !== false} onChange={(e) => save('autoStopAtZero', e.target.checked)} />
        </SettingsItem>

        <SettingsItem
          title="Auto-Reset After Completion"
          description="Automatically reset to default time"
        >
          <Switch checked={!!settings.autoReset} onChange={(e) => save('autoReset', e.target.checked)} />
        </SettingsItem>

        <SettingsItem
          title="Sound on Timer End"
          description="Play notification sound when timer reaches 00:00"
        >
          <Switch checked={!!settings.soundNotification} onChange={(e) => save('soundNotification', e.target.checked)} />
        </SettingsItem>

        <SettingsItem
          block
          title="Custom Sound File"
          description="Upload a custom sound file (MP3, WAV, OGG) - Leave empty for default beep"
        >
          <FileUpload
            accept="audio/*"
            buttonText="Choose sound file..."
            icon="bi-volume-up-fill"
            fileName={settings.customSoundFileName || ''}
            onChange={onSoundFile}
            onClear={async () => {
              await save('customSoundFile', null);
              await save('customSoundFileName', null);
              notify('Custom sound cleared', 'info');
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Flash at Zero"
          description="Flash red background with black text when timer reaches 00:00"
        >
          <Switch checked={!!settings.flashAtZero} onChange={(e) => save('flashAtZero', e.target.checked)} />
        </SettingsItem>

        <SettingsItem
          title="Clock Format"
          description="Display clock in 12-hour or 24-hour format"
        >
          <Select className="w-48" value={settings.clockFormat || '24h'} onChange={(e) => save('clockFormat', e.target.value)}>
            <option value="24h">24-Hour (15:30:45)</option>
            <option value="12h">12-Hour (3:30:45 PM)</option>
          </Select>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Warning & Critical States">
        <SettingsItem
          title="Threshold Type"
          description="Define thresholds by percentage of total time or specific time values"
        >
          <Select className="w-48" value={thresholdType} onChange={(e) => save('timerThresholdType', e.target.value)}>
            <option value="percentage">Percentage Based</option>
            <option value="time">Time Based</option>
          </Select>
        </SettingsItem>

        {thresholdType === 'percentage' ? (
          <div>
            <SettingsItem
              title="Warning Threshold"
              description="Show warning state when remaining time falls below this percentage"
            >
              <div className="flex items-center gap-2">
                <Input type="number" min="1" max="99" step="1" className="w-20"
                  value={warningPct} onChange={(e) => savePercentages(int(e.target.value, 30), criticalPct)} />
                <span className="text-sm text-[var(--text-secondary)]">%</span>
              </div>
            </SettingsItem>

            <SettingsItem
              title="Critical Threshold"
              description="Show critical state when remaining time falls below this percentage"
            >
              <div className="flex items-center gap-2">
                <Input type="number" min="1" max="99" step="1" className="w-20"
                  value={criticalPct} onChange={(e) => savePercentages(warningPct, int(e.target.value, 5))} />
                <span className="text-sm text-[var(--text-secondary)]">%</span>
              </div>
            </SettingsItem>
          </div>
        ) : (
          <div>
            <SettingsItem
              title="Warning Threshold"
              description="Show warning state when remaining time falls below this time"
            >
              <MinSecInputs minutes={warnM} seconds={warnS}
                onChange={(m, s) => saveTimes(m, s, critM, critS)} />
            </SettingsItem>

            <SettingsItem
              title="Critical Threshold"
              description="Show critical state when remaining time falls below this time"
            >
              <MinSecInputs minutes={critM} seconds={critS}
                onChange={(m, s) => saveTimes(warnM, warnS, m, s)} />
            </SettingsItem>
          </div>
        )}

        <SettingsItem
          block
          title="State Preview"
          description="How timer states will appear based on your thresholds"
        >
          <div className="timer-state-preview flex gap-3 flex-wrap">
            <StatePreview state="normal" label="Normal" range={ranges.normal} />
            <StatePreview state="warning" label="Warning" range={ranges.warning} />
            <StatePreview state="critical" label="Critical" range={ranges.critical} />
            <StatePreview state="overtime" label="Overtime" range="Negative time" />
          </div>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

function MinSecInputs({ minutes, seconds, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Input type="number" min="0" max="59" className="w-16"
        value={minutes} onChange={(e) => onChange(int(e.target.value), seconds)} />
      <span className="text-xs text-[var(--text-muted)]">Mm</span>
      <span className="text-[var(--text-secondary)]">:</span>
      <Input type="number" min="0" max="59" className="w-16"
        value={seconds} onChange={(e) => onChange(minutes, int(e.target.value))} />
      <span className="text-xs text-[var(--text-muted)]">Ss</span>
    </div>
  );
}

// Dot color comes from settings.css (.state-indicator.<state> .state-color → --preview-*-color)
function StatePreview({ state, label, range }) {
  return (
    <div className={`state-indicator ${state} flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface-raised)]`}>
      <span className="state-color w-3 h-3 rounded-full" />
      <div className="state-info text-sm">
        <span className="block font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-xs text-[var(--text-secondary)]">{range}</span>
      </div>
    </div>
  );
}

export default TimerSection;
