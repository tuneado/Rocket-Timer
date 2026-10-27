/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * External display mirror. The preview renderer is the single source of truth:
 * whenever it reports a change, the parts of its display state that changed are
 * sent as 'display-state' (format: core/display/displayState.js). The main
 * process keeps the merged state for displays that open later;
 * displayCanvas.js applies it.
 */
import { getDisplayState, diffDisplayState } from '../../../core/display/displayState.js';

let renderer = null;
let ipc = null;
let queued = false;
const sentJson = {}; // key → JSON last sent

function publish() {
  queued = false;
  const patch = diffDisplayState(getDisplayState(renderer), sentJson);
  if (patch) {
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
