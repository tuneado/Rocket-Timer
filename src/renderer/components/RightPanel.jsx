/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h, Fragment } from 'preact';
import { PreviewCanvas } from './PreviewCanvas.jsx';
import { ControlsRow } from './ControlsRow.jsx';
import { InfoStats } from './InfoStats.jsx';

export function RightPanel() {
  return (
    <>
      <div id="preview-container" className="flex-1 mb-[clamp(0.5rem,1.2vh,0.75rem)] flex flex-col min-h-0">
        <PreviewCanvas />
      </div>
      <ControlsRow />
      <InfoStats />
    </>
  );
}
