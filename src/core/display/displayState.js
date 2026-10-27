/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Display state: everything an external display needs to draw what the preview
 * renderer draws. The preview side reads it (getDisplayState) and sends only the
 * keys that changed (diffDisplayState); the display side applies those patches
 * to its own renderer (createDisplayStateApplier). How patches travel between
 * the two is up to the shell (desktop: IPC through the main process).
 */
import { CANVAS_STYLE_VARS } from './UnifiedCanvasRenderer.js';

/**
 * Everything the external display needs to draw what the preview draws
 */
export function getDisplayState(r) {
  const styles = getComputedStyle(document.documentElement);
  const video = r.getVideoInputManager();
  const { theme, ...frame } = r.state;

  return {
    resolution: { width: r.masterCanvas.width, height: r.masterCanvas.height },
    frame,
    theme,
    layout: r.layout,
    styleVars: Object.fromEntries(CANVAS_STYLE_VARS.map(name => [name, styles.getPropertyValue(name).trim()])),
    thresholds: { ...r.timerThresholds },
    performance: { ...r.performanceSettings },
    watermark: r.watermark.enabled,
    matchTimerColor: localStorage.getItem('matchTimerColor') === 'true',
    // Fading out counts as off
    coverImage: { enabled: r.coverImage.enabled && r.coverImage.targetOpacity > 0, path: r.coverImage.path },
    backgroundImage: { enabled: r.backgroundImage.enabled, path: r.backgroundImage.path, opacity: r.backgroundImage.opacity },
    video: {
      enabled: Boolean(video?.isEnabled()),
      deviceId: video?.selectedDeviceId || null,
      opacity: video ? video.getOpacity() : 1,
      mirror: r.videoMirror,
      scaling: r.videoScaling
    }
  };
}

/**
 * The keys of a display state that changed since the last call
 * @param {object} state - from getDisplayState
 * @param {object} sentJson - key → JSON last sent; updated in place
 * @returns {object|null} patch, or null when nothing changed
 */
export function diffDisplayState(state, sentJson) {
  const patch = {};
  for (const [key, value] of Object.entries(state)) {
    const json = JSON.stringify(value);
    if (sentJson[key] !== json) {
      sentJson[key] = json;
      patch[key] = value;
    }
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

/**
 * Applies display state patches to a renderer, which it creates from the first
 * full state (that one carries the resolution). Apply patches in order: images
 * and video load asynchronously.
 * @param {(resolution: {width: number, height: number}) => object} createRenderer
 * @returns {(patch: object) => Promise<void>}
 */
export function createDisplayStateApplier(createRenderer) {
  let renderer = null;
  // Last applied value per key (images and video are only redone when they change)
  const applied = {};
  const same = (key, value) => JSON.stringify(applied[key]) === JSON.stringify(value);

  async function applyCoverImage({ enabled, path }) {
    if (enabled && path) await renderer.enableCoverImage(path);
    else if (renderer.coverImage.enabled) renderer.disableCoverImage();
  }

  async function applyBackgroundImage({ enabled, path, opacity }) {
    if (enabled && path) await renderer.enableBackgroundImage(path, opacity);
    else renderer.disableBackgroundImage();
  }

  async function applyVideo(video, previous) {
    renderer.setVideoMirror(video.mirror);
    renderer.setVideoScaling(video.scaling);
    renderer.setVideoOpacity(video.opacity);

    const deviceChanged = video.enabled !== previous?.enabled || video.deviceId !== previous?.deviceId;
    if (!deviceChanged) return;
    if (video.enabled && video.deviceId) {
      await renderer.enableVideoInput(video.deviceId);
    } else {
      renderer.disableVideoInput();
    }
  }

  return async function applyDisplayState(patch) {
    if (!renderer) {
      // Wait for the full state: it carries the resolution
      if (!patch.resolution) return;
      renderer = createRenderer(patch.resolution);
    }

    if (patch.styleVars) {
      const root = document.documentElement;
      for (const [name, value] of Object.entries(patch.styleVars)) {
        if (value) root.style.setProperty(name, value);
        else root.style.removeProperty(name);
      }
    }
    if (patch.theme) {
      document.documentElement.classList.toggle('dark', patch.theme === 'dark');
      document.documentElement.setAttribute('data-theme', patch.theme);
      renderer.updateTheme(patch.theme);
    }
    if (patch.styleVars) renderer.updateStyleCache();

    if (patch.layout) renderer.setLayout(patch.layout);
    if (patch.frame) renderer.setState(patch.frame);
    if (patch.thresholds) Object.assign(renderer.timerThresholds, patch.thresholds);
    if (patch.performance) renderer.applyPerformanceSettings(patch.performance);
    if (patch.watermark !== undefined) renderer.setWatermarkEnabled(patch.watermark);

    try {
      if (patch.coverImage && !same('coverImage', patch.coverImage)) {
        applied.coverImage = patch.coverImage;
        await applyCoverImage(patch.coverImage);
      }
      if (patch.backgroundImage && !same('backgroundImage', patch.backgroundImage)) {
        applied.backgroundImage = patch.backgroundImage;
        await applyBackgroundImage(patch.backgroundImage);
      }
      if (patch.video && !same('video', patch.video)) {
        const previous = applied.video;
        applied.video = patch.video;
        await applyVideo(patch.video, previous);
      }
    } catch (error) {
      console.error('Error applying display state:', error);
    }

    // Read from (shared) localStorage while drawing: redraw to pick it up
    if (patch.matchTimerColor !== undefined) renderer.renderFrame();
  };
}
