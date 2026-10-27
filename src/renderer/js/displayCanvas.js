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
import { createFlashAnimation } from '../../core/display/canvasEffects.js';
import UnifiedCanvasRenderer from '../../core/display/UnifiedCanvasRenderer.js';
import { createDisplayStateApplier } from '../../core/display/displayState.js';
import { createVideoInput } from './videoInputManager.js';

const { ipcRenderer } = window.electron;

let renderer = null;

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
  renderer = new UnifiedCanvasRenderer(width, height, { createVideoInput });
  renderer.addOutput('external', document.getElementById('displayCanvas'), {
    scale: 1.0,
    enabled: true,
    aspectRatio: 16 / 9
  });
  renderer.start();
  console.log(`📺 Display renderer created at ${width}x${height}`);
  return renderer;
}

const applyDisplayState = createDisplayStateApplier(createRenderer);

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
