import { h } from 'preact';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Select } from '../../ui/Select.jsx';
import { Switch } from '../../ui/Switch.jsx';
import { Button } from '../../ui/Button.jsx';

/**
 * VideoInputSection - Video capture device settings
 */
export function VideoInputSection() {
  return (
    <div className="settings-section" id="section-video-input">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Video Input
        </h1>
        <span 
          id="videoStatus" 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-surface-raised)] text-[var(--text-secondary)]"
        >
          <i className="bi bi-circle-fill text-[8px]" />
          <span>Inactive</span>
        </span>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Configure HDMI capture card settings
      </p>

      <SettingsGroup title="Device">
        <SettingsItem
          title="Capture Device"
          description="Select your HDMI capture card"
        >
          <div className="flex items-center gap-2">
            <Select id="videoDeviceSelector" className="w-56" disabled>
              <option value="">No devices detected</option>
            </Select>
            <Button
              id="detectDevices"
              variant="secondary"
              icon="bi-arrow-clockwise"
            >
              Detect
            </Button>
          </div>
        </SettingsItem>

        <SettingsItem
          block
          id="videoPreviewSection"
          className="hidden"
          title="Live Preview"
          description=""
        >
          <Button
            id="togglePreview"
            variant="success"
            size="sm"
            icon="bi-play-circle-fill"
            className="mb-3"
          >
            Start Preview
          </Button>
          <div 
            className="video-preview w-full aspect-video bg-[var(--bg-inset)] rounded-lg flex items-center justify-center text-[var(--text-secondary)]"
            id="videoPreview"
          >
            <span>Click "Start Preview" to view device</span>
          </div>
        </SettingsItem>

        <SettingsItem
          title="Release Camera When Not in Use"
          description="Free camera resources on non-video layouts"
        >
          <Switch id="releaseCameraIdle" checked />
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Quality">
        <SettingsItem
          title="Video Resolution"
          description="Preferred capture resolution"
        >
          <Select id="videoResolution" className="w-48">
            <option value="1920x1080">1920×1080 (1080p)</option>
            <option value="1280x720">1280×720 (720p)</option>
            <option value="auto">Auto</option>
          </Select>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default VideoInputSection;
