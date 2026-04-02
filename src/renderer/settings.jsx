/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Settings Page Entry Point
 * Renders the Preact settings app.
 * /
 */
import { h, render } from 'preact';
import { SettingsApp } from './components/settings/SettingsApp.jsx';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  const root = document.getElementById('settings-root');
  if (root) {
    render(<SettingsApp />, root);
    
    // Dispatch event to notify settings.js that Preact has rendered
    // Use setTimeout to ensure render is complete
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('preact-settings-ready'));
    }, 0);
  }
}
