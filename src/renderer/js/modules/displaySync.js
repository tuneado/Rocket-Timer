/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * External display mirror. The preview renderer is the single source of truth:
 * whenever it reports a change, the parts of its display state that changed are
 * sent as 'display-state'. The main process keeps the merged state for displays
 * that open later; displayCanvas.js applies it.
 */
import { CANVAS_STYLE_VARS } from '../UnifiedCanvasRenderer.js';

let renderer = null;
let ipc = null;
let queued = false;
const sentJson = {}; // key → JSON last sent

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

function publish() {
  queued = false;
  const patch = {};
  for (const [key, value] of Object.entries(getDisplayState(renderer))) {
    const json = JSON.stringify(value);
    if (sentJson[key] !== json) {
      sentJson[key] = json;
      patch[key] = value;
    }
  }
  if (Object.keys(patch).length > 0) {
    ipc.send('display-state', patch);
  }
}

/**
 * Mirror a renderer to the external display (batched: one message per burst of changes)
 */
export function mirrorToDisplay(canvasRenderer, ipcRenderer) {
  renderer = canvasRenderer;
  ipc = ipcRenderer;
  renderer.onChange = () => {
    if (queued) return;
    queued = true;
    Promise.resolve().then(publish);
  };
  publish();
}
