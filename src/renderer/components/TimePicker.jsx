/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Card } from './ui';
import { useAppState } from './useAppState.js';
import actions from '../js/mainActions.js';

const FIELDS = [
  { part: 'hours', label: 'Hours', max: 99 },
  { part: 'minutes', label: 'Minutes', max: 59 },
  { part: 'seconds', label: 'Seconds', max: 59 }
];

const pad = (n) => String(n).padStart(2, '0');

/**
 * Split seconds into hours/minutes/seconds
 */
function splitSeconds(total) {
  const s = Math.max(0, Math.floor(total));
  return { hours: Math.floor(s / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

export function TimePicker() {
  const lastSetMs = useAppState('timer.lastSetTime');
  const running = useAppState('timer.running');
  // Text of the field being typed in; the others show the set time
  const [editing, setEditing] = useState(null); // { part, text }

  const parts = splitSeconds(lastSetMs / 1000);

  const onInput = (part, text) => {
    setEditing({ part, text });
    // Overflowing seconds/minutes carry into the next unit
    const value = { ...parts, [part]: parseInt(text, 10) || 0 };
    actions.setTime(value.hours * 3600 + value.minutes * 60 + value.seconds);
  };

  return (
    <Card id="duration-card">
      <Card.Header
        icon={<i className="bi bi-stopwatch-fill" />}
        title="Set Duration"
      />
      <Card.Content>
        <div
          id="time-inputs-wrapper"
          className={`flex items-center justify-center gap-[clamp(0.25rem,0.8vw,0.5rem)] ${running ? 'muted' : ''}`}
        >
          {FIELDS.map(({ part, label, max }, i) => (
            <Fragment key={part}>
              {i > 0 && (
                <div className="text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-text-muted pb-[clamp(0.75rem,2vh,1.25rem)]">:</div>
              )}
              <div className="flex flex-col items-center">
                <input
                  className="w-[clamp(4rem,8vw,5rem)] h-[clamp(2.5rem,5vh,4rem)] text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-center bg-bg-elevated rounded-lg focus:outline-none text-text-primary"
                  style={{ border: '2px solid #4a4a4a' }}
                  type="number"
                  id={part}
                  min="0"
                  max={max}
                  disabled={running}
                  value={editing?.part === part && document.activeElement?.id === part ? editing.text : pad(parts[part])}
                  onInput={(e) => onInput(part, e.currentTarget.value)}
                  onBlur={() => setEditing(null)}
                  aria-label={label}
                  aria-describedby={`${part}-desc`}
                />
                <label className="mt-[clamp(0.125rem,0.5vh,0.25rem)] text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary" id={`${part}-desc`}>{label}</label>
              </div>
            </Fragment>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
