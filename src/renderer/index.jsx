/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h, render } from 'preact';
import { App } from './components/App.jsx';
// Main window controller: canvas, timer view, IPC, keyboard (same module graph as the UI)
import './js/countdown.js';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  const appRoot = document.getElementById('app');
  if (appRoot) {
    render(<App />, appRoot);
  }
}
