/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Desktop platform for the shared code (see src/core/platform.js), backed by
 * the preload bridge. Import it first in every page entry so it is set before
 * any other module runs.
 */
import { setPlatform } from '../../core/platform.js';

/**
 * @param {object} [bridge] - window.electron from the preload script
 * @returns {import('../../core/platform.js').Platform}
 */
export function createElectronPlatform(bridge) {
  if (!bridge) return {};
  return {
    settings: { getAll: () => bridge.settings.getAll() },
    getAssetUrl: async (path) => 'file://' + await bridge.getResourcePath(path),
    layouts: bridge.layouts
  };
}

setPlatform(createElectronPlatform(typeof window !== 'undefined' ? window.electron : undefined));
