/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { LeftPanel } from './LeftPanel.jsx';
import { RightPanel } from './RightPanel.jsx';

export function App() {
  return (
    <main className="grid grid-cols-3 gap-[clamp(0.5rem,1.5vh,1rem)] p-[clamp(0.5rem,1.5vh,1rem)] h-screen max-h-screen overflow-hidden" role="main" aria-label="Countdown Timer Interface">
      <div className="flex flex-col gap-[clamp(0.375rem,1.2vh,0.75rem)] h-full">
        <LeftPanel />
      </div>
      <div className="col-span-2 flex flex-col h-full">
        <RightPanel />
      </div>
    </main>
  );
}
