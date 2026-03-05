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
