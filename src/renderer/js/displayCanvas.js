/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * External display window. Mirrors the main window's preview: it applies the
 * display state the preview publishes ('display-state', see
 * modules/displaySync.js) and keeps no state or settings of its own. The
 * camera is the one thing it opens itself, following the state's device.
 */
// Must be first: sets the platform before any other module runs
import './electronPlatform.js';
import { createFlashAnimation } from './canvas/canvasEffects.js';
import UnifiedCanvasRenderer from './UnifiedCanvasRenderer.js';

const { ipcRenderer } = window.electron;

let renderer = null;
// Last applied value per key (images and video are only redone when they change)
const applied = {};

async function loadFonts() {
  try {
    const fonts = ['"JetBrains Mono"', '"SF Mono"', 'Consolas', 'Monaco'];
    await Promise.all(fonts.flatMap(font => ['400', 'bold', '600'].map(weight =>
      document.fonts.load(`${weight} 16px ${font}`)
    ))).catch(() => {
      console.log('Some fonts failed to load, using system fallbacks');
    });
    await document.fonts.ready;
  } catch (error) {
    console.warn('Font loading encountered an issue, continuing:', error);
  }
}

function createRenderer({ width, height }) {
  renderer = new UnifiedCanvasRenderer(width, height);
  renderer.addOutput('external', document.getElementById('displayCanvas'), {
    scale: 1.0,
    enabled: true,
    aspectRatio: 16 / 9
  });
  renderer.start();
  console.log(`📺 Display renderer created at ${width}x${height}`);
}

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

/**
 * Apply (part of) the preview's display state
 */
async function applyDisplayState(patch) {
  if (!renderer) {
    // Wait for the full state: it carries the resolution
    if (!patch.resolution) return;
    createRenderer(patch.resolution);
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
}

// Apply in order: images and video load asynchronously
let applying = Promise.resolve();
ipcRenderer.on('display-state', (patch) => {
  applying = applying.then(() => applyDisplayState(patch));
});

ipcRenderer.on('flash-at-zero', () => {
  if (renderer) createFlashAnimation(renderer);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadFonts();
  // The main process answers with the full current state
  ipcRenderer.send('request-display-sync');
});

window.addEventListener('beforeunload', () => {
  if (renderer) renderer.destroy();
});
