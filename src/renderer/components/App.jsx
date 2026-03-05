import { h } from 'preact';
import { LeftPanel } from './LeftPanel.jsx';
import { RightPanel } from './RightPanel.jsx';

export function App() {
  return (
    <main className="grid lg:grid-cols-3 gap-4 p-4 h-screen" role="main" aria-label="Countdown Timer Interface">
      <div className="flex flex-col gap-3 overflow-y-auto">
        <LeftPanel />
      </div>
      <div className="lg:col-span-2 flex flex-col">
        <RightPanel />
      </div>
    </main>
  );
}
