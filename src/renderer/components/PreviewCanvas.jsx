import { h } from 'preact';

export function PreviewCanvas() {
  return (
    <div className="h-full flex items-center justify-center">
      <canvas id="timerCanvas" style="display: block; width: 100%; height: auto; max-height: 100%; aspect-ratio: 16 / 9;"></canvas>
    </div>
  );
}
