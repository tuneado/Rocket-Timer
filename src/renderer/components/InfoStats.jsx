/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { Card } from './ui';
import { useAppState } from './useAppState.js';

function Stat({ id, label, value }) {
  return (
    <div className="text-center p-[clamp(0.25rem,0.6vh,0.5rem)]">
      <div className="text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary">{label}</div>
      <div id={id} className="text-[clamp(1.25rem,3vh,1.5rem)] font-semibold text-text-primary">{value}</div>
    </div>
  );
}

export function InfoStats() {
  const clock = useAppState('ui.clockTime');
  const timer = useAppState('timer.formattedTime');
  const elapsed = useAppState('timer.elapsedFormatted');
  const endsAt = useAppState('timer.endTimeFormatted');

  return (
    <Card className="px-[clamp(0.5rem,1.2vh,0.75rem)] py-[clamp(0.375rem,0.8vh,0.5rem)] mb-0">
      <div className="grid grid-cols-4 gap-0">
        <Stat id="clockTime" label="Clock" value={clock} />
        <Stat id="timerValue" label="Timer" value={timer} />
        <Stat id="elapsedTime" label="Elapsed" value={elapsed} />
        <Stat id="endsAtTime" label="Ends At" value={endsAt} />
      </div>
    </Card>
  );
}
