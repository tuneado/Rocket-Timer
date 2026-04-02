/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import './previewPanel.js';
import './controlsPanel.js';
import './infoStatsCard.js';

// Mount components side-by-side for verification
export function mountComponents() {
  const root = document.getElementById('component-root');
  if (!root) return;
  root.innerHTML = `
    <div class="panel-right">
      <preview-panel></preview-panel>
      <controls-panel></controls-panel>
      <info-stats-card></info-stats-card>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  mountComponents();
});
