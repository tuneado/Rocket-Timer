/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Platform services: the few things shared code needs from the app shell
 * (desktop: Electron's preload bridge). Each shell calls setPlatform() once,
 * before anything else runs. Every member is optional; without one, callers
 * fall back to plain browser behavior.
 *
 * @typedef {object} Platform
 * @property {{ getAll: () => Promise<object> }} [settings] - app settings
 * @property {(path: string) => Promise<string>} [getAssetUrl] - URL for a bundled
 *   asset, given its path from the src folder (e.g. 'renderer/assets/icon.png')
 * @property {{
 *   getAll: () => object,
 *   save: (id: string, layout: object) => boolean,
 *   remove: (id: string) => boolean,
 *   clear: () => boolean,
 *   importLegacy: (layouts: object) => boolean,
 *   onChanged: (callback: (layouts: object) => void) => void
 * }} [layouts] - custom layout store (synchronous)
 */

/** @type {Platform} */
let platform = {};

/** @param {Platform} services */
export function setPlatform(services) {
  platform = services || {};
}

/** @returns {Platform} */
export function getPlatform() {
  return platform;
}
