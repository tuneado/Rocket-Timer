/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';

export function PreviewCanvas() {
  return (
    <div className="h-full flex items-center justify-center">
      <canvas id="timerCanvas" style="display: block; width: 100%; height: auto; max-height: 100%; aspect-ratio: 16 / 9;"></canvas>
    </div>
  );
}
