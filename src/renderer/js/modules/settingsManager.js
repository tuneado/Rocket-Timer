/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Settings Manager Module
 * Manages application settings including:
 * - Loading and applying settings from the settings store
 * - Applying canvas color customizations
 * - Setting default time, layout, and theme
 * /
 */
/**
 * Load settings and apply the ones the main window keeps outside appState
 * (theme, canvas colors, and values other modules read from localStorage)
 */
export async function loadAndApplySettings() {
  try {
    const settings = await window.electron.settings.getAll();

    // (The default time is applied by the timer engine in the main process)

    // The default layout wins over the last one used
    if (settings.defaultLayout) {
      localStorage.setItem('canvasLayout', settings.defaultLayout);
    }

    if (settings.defaultTheme) {
      const theme = settings.defaultTheme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.defaultTheme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }

    if (settings.colors) {
      applyCanvasColors(settings.colors);
    }

    if (typeof settings.matchTimerColor !== 'undefined') {
      localStorage.setItem('matchTimerColor', settings.matchTimerColor.toString());
    }
    localStorage.setItem('clockFormat', settings.clockFormat || '24h');
    if (settings.showWatermark !== undefined) {
      localStorage.setItem('showWatermark', settings.showWatermark.toString());
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

let lastAppliedColors = null;

/**
 * Applies canvas color customizations from settings
 * @param {Object} colors - Color settings object
 * @param {Object} [options] - Options
 * @param {boolean} [options.force] - Force re-application even if colors haven't changed
 */
export function applyCanvasColors(colors, options = {}) {
  if (!options.force && lastAppliedColors && JSON.stringify(colors) === JSON.stringify(lastAppliedColors)) {
    return;
  }
  lastAppliedColors = { ...colors };

  const root = document.documentElement;
  
  if (colors.countdown) root.style.setProperty('--canvas-countdown-color', colors.countdown);
  if (colors.clock) root.style.setProperty('--canvas-clock-color', colors.clock);
  if (colors.elapsed) root.style.setProperty('--canvas-elapsed-color', colors.elapsed);
  if (colors.message) root.style.setProperty('--canvas-message-color', colors.message);
  if (colors.messageBackground) root.style.setProperty('--canvas-message-background-color', colors.messageBackground);
  if (colors.separator) root.style.setProperty('--canvas-separator-color', colors.separator);
  if (colors.background) root.style.setProperty('--canvas-background', colors.background);
  if (colors.progressSuccess) {
    root.style.setProperty('--canvas-progress-success-start', colors.progressSuccess);
    root.style.setProperty('--canvas-progress-success-end', colors.progressSuccess);
  }
  if (colors.progressWarning) {
    root.style.setProperty('--canvas-progress-warning-start', colors.progressWarning);
    root.style.setProperty('--canvas-progress-warning-end', colors.progressWarning);
  }
  if (colors.progressDanger) {
    root.style.setProperty('--canvas-progress-danger-start', colors.progressDanger);
    root.style.setProperty('--canvas-progress-danger-end', colors.progressDanger);
  }
  
}
