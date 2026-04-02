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
import { Input } from '../../ui/Input.jsx';
import { FileUpload } from '../../ui/FileUpload.jsx';
import { Button } from '../../ui/Button.jsx';

/**
 * TimerSection - Timer behavior settings
 */
export function TimerSection() {
  return (
    <div className="settings-section" id="section-timer">
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
            <Input 
              type="number" 
              id="defaultHours" 
              min="0" 
              max="23" 
              defaultValue="0"
              className="w-16 text-center"
            />
            <span className="text-[var(--text-secondary)]">:</span>
            <Input 
              type="number" 
              id="defaultMinutes" 
              min="0" 
              max="59" 
              defaultValue="45"
              className="w-16 text-center"
            />
            <span className="text-[var(--text-secondary)]">:</span>
            <Input 
              type="number" 
              id="defaultSeconds" 
              min="0" 
              max="59" 
              defaultValue="0"
              className="w-16 text-center"
            />
          </div>
        </SettingsItem>

        <SettingsItem
          title="Auto-Stop at Zero"
          description="Stop timer when reaching 00:00:00 (if disabled, timer continues into negative time)"
        >
          <Switch id="autoStopAtZero" checked />
        </SettingsItem>

        <SettingsItem
          title="Auto-Reset After Completion"
          description="Automatically reset to default time"
        >
          <Switch id="autoReset" />
        </SettingsItem>

        <SettingsItem
          title="Sound on Timer End"
          description="Play notification sound when timer reaches 00:00"
        >
          <Switch id="soundNotification" />
        </SettingsItem>

        <SettingsItem
          block
          title="Custom Sound File"
          description="Upload a custom sound file (MP3, WAV, OGG) - Leave empty for default beep"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <FileUpload
                id="customSoundFile"
                accept="audio/*"
                buttonText="Choose sound file..."
                icon="bi-volume-up-fill"
                className="flex-1"
              />
              <Button
                id="clearCustomSound"
                variant="ghost"
                icon="bi-x-circle"
                style="display: none;"
              >
                Clear
              </Button>
            </div>
            <div id="customSoundFileName" className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
              <i className="bi bi-music-note-beamed" />
              <span>No file selected</span>
            </div>
          </div>
        </SettingsItem>

        <SettingsItem
          title="Flash at Zero"
          description="Flash red background with black text when timer reaches 00:00"
        >
          <Switch id="flashAtZero" />
        </SettingsItem>

        <SettingsItem
          title="Clock Format"
          description="Display clock in 12-hour or 24-hour format"
        >
          <Select id="clockFormat" className="w-48">
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
          <Select id="timerThresholdType" className="w-48">
            <option value="percentage">Percentage Based</option>
            <option value="time">Time Based</option>
          </Select>
        </SettingsItem>

        {/* Percentage-based thresholds */}
        <SettingsItem
          title="Warning Threshold"
          description="Show warning state when remaining time falls below this percentage"
          className="threshold-percentage"
        >
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              id="warningPercentage" 
              defaultValue="30"
              min="1" 
              max="99" 
              step="1"
              className="w-20"
            />
            <span className="text-sm text-[var(--text-secondary)]">%</span>
          </div>
        </SettingsItem>

        <SettingsItem
          title="Critical Threshold"
          description="Show critical state when remaining time falls below this percentage"
          className="threshold-percentage"
        >
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              id="criticalPercentage" 
              defaultValue="5"
              min="1" 
              max="99" 
              step="1"
              className="w-20"
            />
            <span className="text-sm text-[var(--text-secondary)]">%</span>
          </div>
        </SettingsItem>

        {/* Time-based thresholds (hidden by default) */}
        <SettingsItem
          title="Warning Threshold"
          description="Show warning state when remaining time falls below this time"
          className="threshold-time hidden"
        >
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              id="warningMinutes" 
              defaultValue="2"
              min="0" 
              max="59" 
              className="w-16"
            />
            <span className="text-xs text-[var(--text-muted)]">Mm</span>
            <span className="text-[var(--text-secondary)]">:</span>
            <Input 
              type="number" 
              id="warningSeconds" 
              defaultValue="0"
              min="0" 
              max="59" 
              className="w-16"
            />
            <span className="text-xs text-[var(--text-muted)]">Ss</span>
          </div>
        </SettingsItem>

        <SettingsItem
          title="Critical Threshold"
          description="Show critical state when remaining time falls below this time"
          className="threshold-time hidden"
        >
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              id="criticalMinutes" 
              defaultValue="0"
              min="0" 
              max="59" 
              className="w-16"
            />
            <span className="text-xs text-[var(--text-muted)]">Mm</span>
            <span className="text-[var(--text-secondary)]">:</span>
            <Input 
              type="number" 
              id="criticalSeconds" 
              defaultValue="30"
              min="0" 
              max="59" 
              className="w-16"
            />
            <span className="text-xs text-[var(--text-muted)]">Ss</span>
          </div>
        </SettingsItem>

        <SettingsItem
          block
          title="State Preview"
          description="How timer states will appear based on your thresholds"
        >
          <div className="timer-state-preview flex gap-3 flex-wrap">
            <div className="state-indicator normal flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface-raised)]">
              <span className="state-color w-3 h-3 rounded-full bg-[var(--color-success)]" />
              <div className="state-info text-sm">
                <span className="block font-medium text-[var(--text-primary)]">Normal</span>
                <span id="normalRange" className="text-xs text-[var(--text-secondary)]">Above 30%</span>
              </div>
            </div>
            <div className="state-indicator warning flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface-raised)]">
              <span className="state-color w-3 h-3 rounded-full bg-[var(--color-warning)]" />
              <div className="state-info text-sm">
                <span className="block font-medium text-[var(--text-primary)]">Warning</span>
                <span id="warningRange" className="text-xs text-[var(--text-secondary)]">5% - 30%</span>
              </div>
            </div>
            <div className="state-indicator critical flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface-raised)]">
              <span className="state-color w-3 h-3 rounded-full bg-[var(--color-danger)]" />
              <div className="state-info text-sm">
                <span className="block font-medium text-[var(--text-primary)]">Critical</span>
                <span id="criticalRange" className="text-xs text-[var(--text-secondary)]">0% - 5%</span>
              </div>
            </div>
            <div className="state-indicator overtime flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface-raised)]">
              <span className="state-color w-3 h-3 rounded-full bg-[var(--color-overtime)]" />
              <div className="state-info text-sm">
                <span className="block font-medium text-[var(--text-primary)]">Overtime</span>
                <span className="text-xs text-[var(--text-secondary)]">Negative time</span>
              </div>
            </div>
          </div>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default TimerSection;
