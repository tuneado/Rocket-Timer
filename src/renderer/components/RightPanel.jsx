import { h, Fragment } from 'preact';
import { PreviewCanvas } from './PreviewCanvas.jsx';
import { ControlsRow } from './ControlsRow.jsx';
import { InfoStats } from './InfoStats.jsx';

export function RightPanel() {
  return (
    <>
      <div id="preview-container" className="flex-1 mb-3 flex flex-col">
        <PreviewCanvas />
      </div>
      <ControlsRow />
      <InfoStats />
    </>
  );
}
