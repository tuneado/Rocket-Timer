/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { Card } from './ui';

export function TimePicker() {
  return (
    <Card id="duration-card">
      <Card.Header
        icon={<i className="bi bi-stopwatch-fill" />}
        title="Set Duration"
      />
      <Card.Content>
        <div id="time-inputs-wrapper" className="flex items-center justify-center gap-[clamp(0.25rem,0.8vw,0.5rem)]">
          <div className="flex flex-col items-center">
            <input 
              className="w-[clamp(4rem,8vw,5rem)] h-[clamp(2.5rem,5vh,4rem)] text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-center bg-bg-elevated rounded-lg focus:outline-none text-text-primary" 
              style={{ border: '2px solid #4a4a4a' }}
              type="number" 
              id="hours" 
              defaultValue="0" 
              min="0" 
              max="99"
              aria-label="Hours" 
              aria-describedby="hours-desc"
            />
            <label className="mt-[clamp(0.125rem,0.5vh,0.25rem)] text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary" id="hours-desc">Hours</label>
          </div>
          <div className="text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-text-muted pb-[clamp(0.75rem,2vh,1.25rem)]">:</div>
          <div className="flex flex-col items-center">
            <input 
              className="w-[clamp(4rem,8vw,5rem)] h-[clamp(2.5rem,5vh,4rem)] text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-center bg-bg-elevated rounded-lg focus:outline-none text-text-primary" 
              style={{ border: '2px solid #4a4a4a' }}
              type="number" 
              id="minutes" 
              defaultValue="5" 
              min="0" 
              max="59"
              aria-label="Minutes" 
              aria-describedby="minutes-desc"
            />
            <label className="mt-[clamp(0.125rem,0.5vh,0.25rem)] text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary" id="minutes-desc">Minutes</label>
          </div>
          <div className="text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-text-muted pb-[clamp(0.75rem,2vh,1.25rem)]">:</div>
          <div className="flex flex-col items-center">
            <input 
              className="w-[clamp(4rem,8vw,5rem)] h-[clamp(2.5rem,5vh,4rem)] text-[clamp(1.25rem,3vh,1.875rem)] font-mono text-center bg-bg-elevated rounded-lg focus:outline-none text-text-primary" 
              style={{ border: '2px solid #4a4a4a' }}
              type="number" 
              id="seconds" 
              defaultValue="0" 
              min="0" 
              max="59"
              aria-label="Seconds" 
              aria-describedby="seconds-desc"
            />
            <label className="mt-[clamp(0.125rem,0.5vh,0.25rem)] text-[clamp(0.625rem,1.2vh,0.75rem)] text-text-secondary" id="seconds-desc">Seconds</label>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
