/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Preset Manager Module
 * Presets live in settings (single source of truth) and are mirrored into
 * appState 'ui.presets' for the preset buttons.
 * Preset format: { id: <number>, name: <string>, time: <seconds> }
 */
import appState from './appState.js';

export const DEFAULT_PRESETS = [300, 600, 900, 1200, 1500, 1800, 2700, 3600]
  .map((time, i) => ({ id: i + 1, name: `Preset ${i + 1}`, time }));

/**
 * Format seconds as MM:SS, or HH:MM:SS from one hour
 */
export function formatPresetDisplay(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Show presets from settings on the buttons
 */
export function applyPresets(presets) {
  if (Array.isArray(presets) && presets.length > 0) {
    appState.set('ui.presets', presets.slice());
  }
}

export async function loadPresets() {
  try {
    const settings = await window.electron.settings.getAll();
    applyPresets(settings.presets);
  } catch (error) {
    console.warn('Failed to load presets from settings:', error);
  }
}

/**
 * Save a time to preset slot `index`
 * @param {number} index
 * @param {number} seconds
 * @param {Object} statusBar
 * @returns {Promise<boolean>} true if saved
 */
export async function savePreset(index, seconds, statusBar) {
  if (!(seconds > 0)) {
    statusBar.warning('Please set a time before updating the preset!', 5000);
    return false;
  }
  try {
    const settings = await window.electron.settings.getAll();
    const presets = (settings.presets && settings.presets.length ? settings.presets : DEFAULT_PRESETS).slice();
    presets[index] = { id: index + 1, name: `Preset ${index + 1}`, time: seconds };
    await window.electron.settings.save('presets', presets);
    applyPresets(presets);
    statusBar.success(`Preset saved: ${formatPresetDisplay(seconds)}`, 3000);
    return true;
  } catch (error) {
    console.warn('Failed to save preset to settings:', error);
    return false;
  }
}

/**
 * Reset all presets to the defaults
 */
export async function resetPresets() {
  applyPresets(DEFAULT_PRESETS);
  try {
    await window.electron.settings.save('presets', DEFAULT_PRESETS);
  } catch (error) {
    console.warn('Failed to save default presets to settings:', error);
  }
}
