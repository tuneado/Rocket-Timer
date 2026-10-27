/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { Card, Button } from './ui';
import { useAppState } from './useAppState.js';
import { shortcutProps } from './ShortcutTooltip.jsx';
import actions from '../js/mainActions.js';

const ICON_TEXT = 'text-[clamp(0.75rem,1.5vh,0.875rem)]';
const TOOL_SIZE = 'h-[clamp(3rem,6vh,4rem)] w-[clamp(3rem,6vh,4rem)]';
const TOOL_ICON = 'text-[clamp(1rem,2.5vh,1.25rem)]';

/**
 * +N / -N pair of buttons
 */
function AdjustPair({ minutes, upId, downId, label, disabled, shortcuts, modifier }) {
  const keyFor = (arrow) => (modifier ? `${modifier}+${arrow}` : arrow);
  const button = (id, sign, icon, aria) => (
    <Button
      id={id}
      variant="secondary"
      className={`flex-1 px-[clamp(0.75rem,1.2vw,1rem)] ${disabled ? 'muted' : ''}`}
      disabled={disabled}
      aria-label={aria}
      {...shortcutProps(shortcuts, keyFor(sign > 0 ? 'arrowup' : 'arrowdown'), aria)}
      onClick={() => actions.adjust(sign * minutes)}
    >
      <i className={`bi ${icon} ${ICON_TEXT}`} />
      <span className={`${ICON_TEXT} font-semibold`}>{sign > 0 ? '+' : '-'}{minutes}</span>
    </Button>
  );
  return (
    <div className="flex flex-col gap-[clamp(0.125rem,0.4vh,0.25rem)] h-[clamp(3rem,6vh,4rem)]">
      {button(upId, 1, 'bi-caret-up-fill', `Add ${label}`)}
      {button(downId, -1, 'bi-caret-down-fill', `Subtract ${label}`)}
    </div>
  );
}

export function ControlsRow() {
  const running = useAppState('timer.running');
  const stoppedAtZero = useAppState('timer.stoppedAtZero');
  const flashing = useAppState('ui.flashing');
  const soundEnabled = useAppState('settings.soundEnabled');
  const coverEnabled = useAppState('coverImage.enabled');
  const shortcuts = useAppState('ui.shortcuts');

  return (
    <Card className="mb-[clamp(0.5rem,1.2vh,0.75rem)]">
      <Card.Content className="p-[clamp(0.5rem,1.2vh,0.75rem)]">
        {/* Responsive row: wraps naturally at smaller widths */}
        <div className="flex flex-wrap justify-center items-center gap-[clamp(0.5rem,1.2vh,0.75rem)]">
          <Button
            id="startStop"
            variant="success"
            size="xl"
            icon={running ? 'bi-pause-fill' : 'bi-play-fill'}
            aria-label={running ? 'Stop timer' : 'Start timer'}
            {...shortcutProps(shortcuts, 'space', running ? 'Stop timer' : 'Start timer')}
            onClick={(e) => { e.currentTarget.blur(); actions.toggle(); }}
          >
            {running ? 'Stop' : 'Start'}
          </Button>
          <Button
            id="reset"
            variant="danger"
            size="xl"
            icon="bi-arrow-clockwise"
            aria-label="Reset timer"
            {...shortcutProps(shortcuts, 'r', 'Reset timer')}
            onClick={(e) => { e.currentTarget.blur(); actions.reset(); }}
          >
            Reset
          </Button>
          <AdjustPair minutes={1} upId="addMinute" downId="subtractMinute" label="one minute" disabled={stoppedAtZero} shortcuts={shortcuts} />
          <AdjustPair minutes={5} upId="addFive" downId="subtractFive" label="five minutes" disabled={stoppedAtZero} shortcuts={shortcuts} modifier="shift" />
          <AdjustPair minutes={10} upId="addTen" downId="subtractTen" label="ten minutes" disabled={stoppedAtZero} shortcuts={shortcuts} modifier="ctrl" />
          <div className="flex items-stretch">
            <div className="w-0.5 h-[clamp(3rem,6vh,4rem)] bg-border-strong mx-[clamp(0.375rem,0.8vw,0.5rem)]" />
          </div>
          <Button
            id="flashButton"
            variant={flashing ? 'danger' : 'secondary'}
            size="icon"
            className={TOOL_SIZE}
            {...shortcutProps(shortcuts, 'f', 'Flash screen')}
            onClick={() => actions.flash()}
          >
            <i className={`bi bi-lightning-fill ${TOOL_ICON}`} />
          </Button>
          <Button
            id="muteSounds"
            variant={soundEnabled ? 'secondary' : 'danger'}
            size="icon"
            className={TOOL_SIZE}
            {...shortcutProps(shortcuts, 'm', soundEnabled ? 'Mute sounds' : 'Unmute sounds')}
            aria-pressed={!soundEnabled}
            onClick={() => actions.toggleMute()}
          >
            <i className={`bi ${soundEnabled ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'} ${TOOL_ICON}`} />
          </Button>
          <Button
            id="coverImage"
            variant={coverEnabled ? 'success' : 'secondary'}
            size="icon"
            className={TOOL_SIZE}
            {...shortcutProps(shortcuts, 'i', coverEnabled ? 'Hide cover image' : 'Show cover image')}
            aria-pressed={coverEnabled}
            onClick={() => actions.toggleCoverImage()}
          >
            <i className={`bi ${coverEnabled ? 'bi-image-fill' : 'bi-image'} ${TOOL_ICON}`} />
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
