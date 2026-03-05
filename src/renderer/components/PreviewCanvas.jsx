import { h } from 'preact';
import { Card } from './ui';

export function PreviewCanvas() {
  return (
    <Card className="p-2 bg-black/90 border-2 border-border-strong h-full flex items-center justify-center">
      <canvas id="timerCanvas" style="display: block; width: 100%; height: auto; max-height: 100%; aspect-ratio: 16 / 9;"></canvas>
    </Card>
  );
}
