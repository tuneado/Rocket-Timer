import { h } from 'preact';
import { Card } from './ui';

export function InfoStats() {
  return (
    <Card className="px-3 py-2 mb-0">
      <div className="grid grid-cols-4 gap-0">
        {/* Clock */}
        <div className="text-center p-2">
          <div className="text-xs text-text-secondary">Clock</div>
          <div id="clockTime" className="text-base font-semibold text-text-primary">--:--:--</div>
        </div>

        {/* Timer */}
        <div className="text-center p-2">
          <div className="text-xs text-text-secondary">Timer</div>
          <div id="timerValue" className="text-base font-semibold text-text-primary">--:--</div>
        </div>

        {/* Elapsed */}
        <div className="text-center p-2">
          <div className="text-xs text-text-secondary">Elapsed</div>
          <div id="elapsedTime" className="text-base font-semibold text-text-primary">--:--</div>
        </div>

        {/* Ends At */}
        <div className="text-center p-2">
          <div className="text-xs text-text-secondary">Ends At</div>
          <div id="endsAtTime" className="text-base font-semibold text-text-primary">--:--:--</div>
        </div>
      </div>
    </Card>
  );
}
