import { h } from 'preact';
import { Card, Button } from './ui';

export function Presets() {
  const presetTimes = [
    [5, 10, 15, 20],
    [25, 30, 45, 60]
  ];

  // Detect platform for displaying correct modifier key
  const isMac = typeof navigator !== 'undefined' && 
                navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  return (
    <Card>
      <Card.Header
        icon={<i className="bi bi-lightning-fill" />}
        title="Quick Presets"
        action={
          <button id="resetPresets" className="text-text-secondary hover:text-text-primary flex items-center gap-1 text-sm transition-colors">
            <i className="bi bi-arrow-counterclockwise" />
            <span>Reset</span>
          </button>
        }
      />
      <Card.Content>
        <p className="text-[clamp(0.625rem,1.1vh,0.7rem)] mb-2" style={{ color: 'var(--text-muted)' }}>
          {modifierKey} + Click to save preset
        </p>
        {presetTimes.map((row, rowIndex) => (
          <div key={rowIndex} className={`grid grid-cols-4 gap-[clamp(0.375rem,0.8vh,0.5rem)] ${rowIndex > 0 ? 'mt-[clamp(0.375rem,0.8vh,0.5rem)]' : ''}`}>
            {row.map((minutes) => (
              <Button
                key={minutes}
                variant="secondary"
                size="md"
                className="preset"
                data-minutes={minutes}
                aria-label={`Set timer to ${minutes} minutes`}
                title="Click to set, hold to save"
              >
                {minutes < 60 ? `${String(minutes).padStart(2, '0')}:00` : '60:00'}
              </Button>
            ))}
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
