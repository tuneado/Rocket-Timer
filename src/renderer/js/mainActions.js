/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Main window actions. countdown.js registers them at startup; the Preact
 * components, keyboard shortcuts and IPC handlers call them. Components only
 * call them from event handlers, so registration order doesn't matter.
 */
const actions = {};

export function registerActions(fns) {
  Object.assign(actions, fns);
}

export default actions;
