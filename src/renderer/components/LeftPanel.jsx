/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
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
