import { h } from 'preact';
import { Card } from './ui';

export function TimePicker() {
  return (
    <Card>
      <Card.Header
        icon={<i className="bi bi-stopwatch-fill" />}
        title="Set Duration"
      />
      <Card.Content>
        <div className="flex items-center justify-center gap-2">
          <div className="flex flex-col items-center">
            <input 
              className="w-20 h-16 text-3xl font-mono text-center bg-bg-elevated border-2 border-border-default rounded-lg focus:border-accent-primary focus:outline-none text-text-primary" 
              type="number" 
              id="hours" 
              defaultValue="0" 
              min="0" 
              max="99"
              aria-label="Hours" 
              aria-describedby="hours-desc"
            />
            <label className="mt-1 text-xs text-text-secondary" id="hours-desc">Hours</label>
          </div>
          <div className="text-3xl font-mono text-text-muted pb-5">:</div>
          <div className="flex flex-col items-center">
            <input 
              className="w-20 h-16 text-3xl font-mono text-center bg-bg-elevated border-2 border-border-default rounded-lg focus:border-accent-primary focus:outline-none text-text-primary" 
              type="number" 
              id="minutes" 
              defaultValue="5" 
              min="0" 
              max="59"
              aria-label="Minutes" 
              aria-describedby="minutes-desc"
            />
            <label className="mt-1 text-xs text-text-secondary" id="minutes-desc">Minutes</label>
          </div>
          <div className="text-3xl font-mono text-text-muted pb-5">:</div>
          <div className="flex flex-col items-center">
            <input 
              className="w-20 h-16 text-3xl font-mono text-center bg-bg-elevated border-2 border-border-default rounded-lg focus:border-accent-primary focus:outline-none text-text-primary" 
              type="number" 
              id="seconds" 
              defaultValue="0" 
              min="0" 
              max="59"
              aria-label="Seconds" 
              aria-describedby="seconds-desc"
            />
            <label className="mt-1 text-xs text-text-secondary" id="seconds-desc">Seconds</label>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
