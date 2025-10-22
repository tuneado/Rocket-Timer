/**
 * Video Input Manager
 * Handles HDMI capture cards and video input devices
 * Allows live video feed as canvas background with timer overlay
 */

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
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Get all devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');
      
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
      
      // Request video stream from specific device
      // When deviceId is provided, use 'exact' to ensure we get the right device
      const constraints = {
        video: deviceId ? {
          deviceId: { exact: deviceId }
        } : true,
        audio: false // No audio needed for timer overlay
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
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

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.VideoInputManager = VideoInputManager;
}
