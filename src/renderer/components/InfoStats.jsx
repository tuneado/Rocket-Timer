/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { Card } from './ui';

export function InfoStats() {
  return (
    <Card className="px-[clamp(0.5rem,1.2vh,0.75rem)] py-[clamp(0.375rem,0.8vh,0.5rem)] mb-0">
      <div className="grid grid-cols-4 gap-0">
        {/* Clock */}
        <div className="text-center p-[clamp(0.25rem,0.6vh,0.5rem)]">
          <div className="text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary">Clock</div>
          <div id="clockTime" className="text-[clamp(1.25rem,3vh,1.5rem)] font-semibold text-text-primary">--:--:--</div>
        </div>

        {/* Timer */}
        <div className="text-center p-[clamp(0.25rem,0.6vh,0.5rem)]">
          <div className="text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary">Timer</div>
          <div id="timerValue" className="text-[clamp(1.25rem,3vh,1.5rem)] font-semibold text-text-primary">--:--</div>
        </div>

        {/* Elapsed */}
        <div className="text-center p-[clamp(0.25rem,0.6vh,0.5rem)]">
          <div className="text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary">Elapsed</div>
          <div id="elapsedTime" className="text-[clamp(1.25rem,3vh,1.5rem)] font-semibold text-text-primary">--:--</div>
        </div>

        {/* Ends At */}
        <div className="text-center p-[clamp(0.25rem,0.6vh,0.5rem)]">
          <div className="text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary">Ends At</div>
          <div id="endsAtTime" className="text-[clamp(1.25rem,3vh,1.5rem)] font-semibold text-text-primary">--:--:--</div>
        </div>
      </div>
    </Card>
  );
}
