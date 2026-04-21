/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Video Input Manager
 * Handles HDMI capture cards and video input devices
 * Allows live video feed as canvas background with timer overlay
 * /
 */
import appState from './modules/appState.js';

class VideoInputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.videoElement = null;
    this.stream = null;
    this.devices = [];
    this.selectedDeviceId = null;
    this.enabled = false;
    this.opacity = 1.0; // Video opacity (0-1)
    this.animationFrameId = null;
    
    // Video settings
    this.videoSettings = {
      width: 1920,
      height: 1080,
      frameRate: 30
    };
  }

  /**
   * Initialize and enumerate available video input devices
   */
  async initialize() {
    try {
      // First, try to enumerate devices without opening a probe stream.
      // If labels are already available (permission previously granted),
      // we can skip getUserMedia entirely — this avoids the Windows
      // "AbortError: Timeout starting video source" cold-start issue.
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoInputs = devices.filter(d => d.kind === 'videoinput');
      const hasLabels = videoInputs.some(d => d.label && d.label.length > 0);

      if (!hasLabels && videoInputs.length > 0) {
        // Labels missing → need a probe stream to trigger permission/labels.
        // Use progressive constraints: default → 720p@30 → 480p@15.
        const attempts = [
          { video: true },
          { video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } },
          { video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } }
        ];
        let probeStream = null;
        let lastErr;
        for (let i = 0; i < attempts.length; i++) {
          try {
            probeStream = await navigator.mediaDevices.getUserMedia(attempts[i]);
            if (i > 0) console.log('[videoInputManager] probe succeeded with relaxed constraints #' + i);
            break;
          } catch (err) {
            lastErr = err;
            console.warn('[videoInputManager] probe attempt', i, 'failed:', err.name, err.message);
            const transient = err && (err.name === 'AbortError' || err.name === 'NotReadableError');
            if (!transient) throw err;
            await new Promise(r => setTimeout(r, 400));
          }
        }
        if (!probeStream) {
          // All attempts failed — still return the (unlabeled) device list so
          // callers can attempt deviceId-specific starts which sometimes work.
          console.warn('[videoInputManager] all probe attempts failed, returning unlabeled devices:', lastErr && lastErr.name);
        } else {
          // Release the probe stream immediately.
          probeStream.getTracks().forEach(t => t.stop());
          // Re-enumerate to pick up labels now that permission is granted.
          devices = await navigator.mediaDevices.enumerateDevices();
          videoInputs = devices.filter(d => d.kind === 'videoinput');
        }
      }

      this.devices = videoInputs;
      console.log('📹 Available video input devices:', this.devices);

      return this.devices.map(device => ({
        id: device.deviceId,
        label: device.label || `Camera ${device.deviceId.substring(0, 8)}`,
        groupId: device.groupId
      }));

    } catch (error) {
      console.error('Error enumerating video devices:', error);
      throw error;
    }
  }

  /**
   * Start video input from selected device
   */
  async startVideoInput(deviceId) {
    try {
      // Stop existing stream if any
      this.stopVideoInput();

      this.selectedDeviceId = deviceId;

      // Create video element
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true; // Prevent audio feedback

      // Progressive constraint fallback: Windows capture engine frequently
      // times out on the default (max-resolution) request. Try lower
      // resolutions before giving up.
      const baseDevice = deviceId ? { deviceId: { exact: deviceId } } : {};
      const attempts = [
        { video: { ...baseDevice }, audio: false },
        { video: { ...baseDevice, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: false },
        { video: { ...baseDevice, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } }, audio: false }
      ];

      let lastErr;
      for (let i = 0; i < attempts.length; i++) {
        try {
          this.stream = await navigator.mediaDevices.getUserMedia(attempts[i]);
          if (i > 0) console.log('[videoInputManager] startVideoInput: relaxed constraints #' + i + ' succeeded');
          break;
        } catch (err) {
          lastErr = err;
          console.warn('[videoInputManager] startVideoInput attempt', i, 'failed:', err.name, err.message);
          const transient = err && (err.name === 'AbortError' || err.name === 'NotReadableError' || err.name === 'OverconstrainedError');
          if (!transient) throw err;
          await new Promise(r => setTimeout(r, 400));
        }
      }
      if (!this.stream) throw lastErr;

      this.videoElement.srcObject = this.stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          console.log('✅ Video input started:', {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight,
            device: deviceId
          });
          resolve();
        };
      });
      
      this.enabled = true;
      
      // Update appState (automatically updates status bar)
      appState.update({
        'camera.active': true,
        'camera.deviceId': deviceId,
        'camera.deviceLabel': this.devices.find(d => d.deviceId === deviceId)?.label || 'Unknown Device'
      });
      
      return {
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight
      };
      
    } catch (error) {
      console.error('Error starting video input:', error);
      throw error;
    }
  }

  /**
   * Stop video input
   */
  stopVideoInput() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    this.enabled = false;
    this.selectedDeviceId = null;
    
    // Update appState (automatically updates status bar)
    appState.update({
      'camera.active': false,
      'camera.deviceId': null,
      'camera.deviceLabel': null
    });
    
    console.log('⏹️ Video input stopped');
  }

  /**
   * Draw video frame to canvas (called before drawing overlays)
   */
  drawVideoFrame() {
    if (!this.enabled || !this.videoElement || this.videoElement.readyState < 2 || !this.ctx) {
      return false;
    }
    
    try {
      // Save current context state
      this.ctx.save();
      
      // Set video opacity
      this.ctx.globalAlpha = this.opacity;
      
      // Draw video frame to fill canvas
      this.ctx.drawImage(
        this.videoElement,
        0, 0,
        this.canvas.width,
        this.canvas.height
      );
      
      // Restore context state
      this.ctx.restore();
      
      return true;
      
    } catch (error) {
      console.error('Error drawing video frame:', error);
      return false;
    }
  }

  /**
   * Set video opacity (0-1)
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
    appState.set('camera.opacity', this.opacity);
  }

  /**
   * Get current video opacity
   */
  getOpacity() {
    return this.opacity;
  }

  /**
   * Check if video input is active
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get current device info
   */
  getCurrentDevice() {
    if (!this.selectedDeviceId) return null;
    
    const device = this.devices.find(d => d.deviceId === this.selectedDeviceId);
    return device ? {
      id: device.deviceId,
      label: device.label
    } : null;
  }

  /**
   * Get video element (for advanced usage)
   */
  getVideoElement() {
    return this.videoElement;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopVideoInput();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

// Export as ES6 module (for import statements)
export default VideoInputManager;

// Make available globally (for backward compatibility)
if (typeof window !== 'undefined') {
  window.VideoInputManager = VideoInputManager;
}
