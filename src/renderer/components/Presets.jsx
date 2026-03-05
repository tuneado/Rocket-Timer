import { h } from 'preact';
import { Card, Button } from './ui';

export function Presets() {
  const presetTimes = [
    [5, 10, 15, 20],
    [25, 30, 45, 60]
  ];

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
        {presetTimes.map((row, rowIndex) => (
          <div key={rowIndex} className={`grid grid-cols-4 gap-2 ${rowIndex > 0 ? 'mt-2' : ''}`}>
            {row.map((minutes) => (
              <Button
                key={minutes}
                variant="secondary"
                size="sm"
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
