/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Select } from '../../ui/Select.jsx';
import { Switch } from '../../ui/Switch.jsx';
import { Button } from '../../ui/Button.jsx';
import { useSettings, useIpc } from '../settingsContext.jsx';

// Status badge colors
const TONES = {
  gray: 'bg-gray-500/10 text-gray-500',
  blue: 'bg-blue-500/10 text-blue-500',
  green: 'bg-green-500/10 text-green-500',
  red: 'bg-red-500/10 text-red-500',
  amber: 'bg-amber-500/10 text-amber-500'
};

function loadCachedDevices() {
  try {
    return JSON.parse(localStorage.getItem('detectedVideoDevices') || '[]') || [];
  } catch {
    return [];
  }
}

const idleStatus = (count) => (count > 0
  ? { tone: 'blue', text: `${count} Found` }
  : { tone: 'gray', text: 'Inactive' });

/**
 * Try progressively relaxed constraints. On Windows the default `{ video: true }`
 * request can time out in the MediaFoundation capture engine ("AbortError: Timeout
 * starting video source"); lower resolutions usually succeed.
 */
async function acquireProbeStream() {
  const attempts = [
    { video: true },
    { video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } },
    { video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } }
  ];
  let lastErr;
  for (let i = 0; i < attempts.length; i++) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(attempts[i]);
      if (i > 0) console.log('[detect-camera] probe succeeded with relaxed constraints #' + i);
      return stream;
    } catch (err) {
      lastErr = err;
      const transient = err && (err.name === 'AbortError' || err.name === 'NotReadableError');
      console.warn('[detect-camera] probe attempt', i, 'failed:', err.name, err.message);
      if (!transient) throw err;
      await new Promise(r => setTimeout(r, 400)); // brief back-off
    }
  }
  throw lastErr;
}

/**
 * VideoInputSection - Video capture device settings
 */
export function VideoInputSection() {
  const { settings, save, notify } = useSettings();
  const [devices, setDevices] = useState(loadCachedDevices);       // [{ id, label }]
  const [selected, setSelected] = useState(() => localStorage.getItem('selectedVideoDevice') || '');
  const [status, setStatus] = useState(() => idleStatus(loadCachedDevices().length));
  const [showPreview, setShowPreview] = useState(() => loadCachedDevices().length > 0);
  const [previewState, setPreviewState] = useState('idle');           // idle | loading | active | error
  const [detecting, setDetecting] = useState(false);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const devicesRef = useRef(devices);
  devicesRef.current = devices;

  const mirrored = !!settings.mirrorVideo;
  const selectedId = devices.some(d => d.id === selected) ? selected : (devices[0]?.id || '');

  const stopPreview = (hideSection = true) => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (hideSection) setShowPreview(false);
    setPreviewState('idle');
    setStatus(idleStatus(devicesRef.current.length));
  };

  // Release the camera when leaving this section or closing the window
  useEffect(() => {
    const onUnload = () => stopPreview();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startPreview = async (deviceId) => {
    stopPreview(false);
    setShowPreview(true);
    setPreviewState('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = stream;
      setPreviewState('active');
      setStatus({ tone: 'green', text: 'Preview Active' });
      console.log('✅ Preview started for device:', deviceId);
    } catch (error) {
      console.error('Error starting preview:', error);
      setPreviewState('error');
      setStatus({ tone: 'red', text: 'Preview Error' });
    }
  };

  // Attach the stream once the <video> element is rendered
  useEffect(() => {
    if (previewState === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [previewState]);

  // The main window reports whether video input is live
  useIpc('video-input-live', (data) => {
    if (previewState === 'active') return;
    const isLive = typeof data === 'object' ? data.isLive : data;
    const liveDeviceId = typeof data === 'object' ? data.deviceId : null;
    const matching = !liveDeviceId || liveDeviceId === selectedId;
    if (isLive && matching) setStatus({ tone: 'red', text: 'Live' });
    else if (isLive) setStatus({ tone: 'amber', text: 'Live (Other Device)' });
    else setStatus(idleStatus(devicesRef.current.length));
  });

  const selectDevice = (deviceId) => {
    if (previewState === 'active') stopPreview(false);
    setSelected(deviceId);
    if (!deviceId) return;
    localStorage.setItem('selectedVideoDevice', deviceId);
    save('defaultVideoDevice', deviceId);
    window.electron.ipcRenderer.send('video-device-selected', deviceId);
  };

  const detect = async () => {
    setDetecting(true);
    try {
      notify('Requesting camera permission...', 'info');

      // Fully release any preview first (Windows often refuses concurrent opens)
      if (previewState === 'active') stopPreview(true);

      // Enumerate before probing so there is something to log even if the probe times out
      let preEnum = [];
      try {
        preEnum = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
        console.log('[detect-camera] pre-probe videoinput count:', preEnum.length);
      } catch (e) {
        console.warn('[detect-camera] pre-probe enumerateDevices failed:', e);
      }

      try {
        const probe = await acquireProbeStream();
        probe.getTracks().forEach(track => track.stop());
        notify('Permission granted. Detecting devices...', 'info');
      } catch (err) {
        console.error('Camera permission denied:', err);
        if (err.name === 'NotAllowedError') {
          notify('Camera permission denied. Please allow camera access and try again.', 'error');
          return;
        }
        if (err.name === 'NotFoundError') {
          notify('No camera devices found on this system.', 'warning');
          return;
        }
        if (err.name === 'AbortError' || err.name === 'NotReadableError') {
          // Capture engine timed out. If devices with labels were listed, permission was
          // granted before and a specific device often still starts from the preview.
          if (preEnum.length > 0 && preEnum.some(d => d.label)) {
            notify(`Camera probe timed out, but ${preEnum.length} device(s) were detected. Select one and click Start Preview.`, 'warning');
          } else {
            notify('Camera could not start (timeout). Likely causes on Windows: the camera is in use by another app, ' +
              'or a driver issue. Close other camera apps, reconnect the device, or try a different USB port.', 'error');
            return;
          }
        } else {
          notify('Error accessing camera: ' + err.message, 'error');
          return;
        }
      }

      const found = (await navigator.mediaDevices.enumerateDevices())
        .filter(d => d.kind === 'videoinput')
        .map(d => ({ id: d.deviceId, label: d.label || `Camera ${d.deviceId.substring(0, 8)}...` }));
      setDevices(found);
      devicesRef.current = found;

      if (found.length === 0) {
        setStatus({ tone: 'gray', text: 'No Devices' });
        notify('No video devices detected. Make sure cameras are connected.', 'warning');
        stopPreview();
        return;
      }

      localStorage.setItem('detectedVideoDevices', JSON.stringify(found));

      // Keep the saved device selected, and make sure it is in the persistent settings
      const savedId = localStorage.getItem('selectedVideoDevice');
      if (savedId && found.some(d => d.id === savedId) && settings.defaultVideoDevice !== savedId) {
        save('defaultVideoDevice', savedId);
        window.electron.ipcRenderer.send('video-device-selected', savedId);
      }

      setStatus({ tone: 'blue', text: `${found.length} Found` });
      setShowPreview(true);
      notify(`Found ${found.length} video device(s). Ready to start video input.`, 'success');
      console.log(`📹 Detected ${found.length} video devices`);
    } catch (error) {
      console.error('Error detecting devices:', error);
      setStatus({ tone: 'red', text: 'Error' });
      notify('Unexpected error detecting video devices: ' + error.message, 'error');
    } finally {
      setDetecting(false);
    }
  };

  const togglePreview = () => {
    if (!selectedId) {
      notify('Please select a device first', 'warning');
      return;
    }
    if (previewState === 'active') stopPreview(false);
    else startPreview(selectedId);
  };

  const previewActive = previewState === 'active';

  return (
    <div className="settings-section">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Video Input
        </h1>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${TONES[status.tone]}`}>
          <i className="bi bi-circle-fill text-[8px]" />
          <span>{status.text}</span>
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
            <Select className="w-56" disabled={devices.length === 0} value={selectedId} onChange={(e) => selectDevice(e.target.value)}>
              {devices.length === 0
                ? <option value="">No devices detected</option>
                : devices.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </Select>
            <Button
              variant="secondary"
              icon="bi-arrow-clockwise"
              disabled={detecting}
              className={detecting ? 'opacity-50 cursor-wait' : ''}
              onClick={detect}
            >
              Detect
            </Button>
          </div>
        </SettingsItem>

        {showPreview && (
          <SettingsItem block title="Live Preview" description="">
            <Button
              variant={previewActive ? 'danger' : 'success'}
              size="sm"
              icon={previewActive ? 'bi-stop-circle-fill' : 'bi-play-circle-fill'}
              className="mb-3"
              onClick={togglePreview}
            >
              {previewActive ? 'Stop Preview' : 'Start Preview'}
            </Button>
            <div className="video-preview w-full aspect-video bg-[var(--bg-inset)] rounded-lg flex items-center justify-center text-[var(--text-secondary)]">
              {previewState === 'active' && (
                <video ref={videoRef} autoplay playsInline muted className={mirrored ? 'mirrored' : ''} />
              )}
              {previewState === 'loading' && <span>Loading preview...</span>}
              {previewState === 'error' && <span>Error starting preview</span>}
              {previewState === 'idle' && <span>Click "Start Preview" to view device</span>}
            </div>
          </SettingsItem>
        )}

        <SettingsItem
          title="Release Camera When Not in Use"
          description="Free camera resources on non-video layouts"
        >
          <Switch checked={settings.releaseCameraIdle !== false} onChange={(e) => save('releaseCameraIdle', e.target.checked)} />
        </SettingsItem>

        <SettingsItem
          title="Mirror Video"
          description="Flip video horizontally (useful for webcams)"
        >
          <Switch
            checked={mirrored}
            onChange={(e) => {
              save('mirrorVideo', e.target.checked);
              window.electron.ipcRenderer.send('video-mirror-changed', e.target.checked);
            }}
          />
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Quality">
        <SettingsItem
          title="Video Resolution"
          description="Preferred capture resolution"
        >
          <Select className="w-48" value={settings.videoResolution} onChange={(e) => save('videoResolution', e.target.value)}>
            <option value="1920x1080">1920×1080 (1080p)</option>
            <option value="1280x720">1280×720 (720p)</option>
            <option value="auto">Auto</option>
          </Select>
        </SettingsItem>

        <SettingsItem
          title="Video Scaling"
          description="How video fits the display area"
        >
          <Select
            className="w-48"
            value={settings.videoScaling}
            onChange={(e) => {
              save('videoScaling', e.target.value);
              window.electron.ipcRenderer.send('video-scaling-changed', e.target.value);
            }}
          >
            <option value="contain">Contain (fit inside)</option>
            <option value="cover">Cover (fill, may crop)</option>
            <option value="stretch">Stretch (fill exactly)</option>
            <option value="none">None (original size)</option>
          </Select>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default VideoInputSection;
