import { h, Fragment } from 'preact';
import { TimePicker } from './TimePicker.jsx';
import { Presets } from './Presets.jsx';
import { MessageCard } from './MessageCard.jsx';
import { LayoutSelector } from './LayoutSelector.jsx';
import { StatusFooter } from './StatusFooter.jsx';

export function LeftPanel() {
  return (
    <>
      <TimePicker />
      <Presets />
      <MessageCard />
      <LayoutSelector />
      <div className="mt-auto">
        <StatusFooter />
      </div>
    </>
  );
}
