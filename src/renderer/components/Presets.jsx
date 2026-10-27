/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';
import { Card, Button } from './ui';
import { useAppState } from './useAppState.js';
import { shortcutProps } from './Tooltip.jsx';
import actions from '../js/mainActions.js';
import { DEFAULT_PRESETS, formatPresetDisplay } from '../js/modules/presetManager.js';

const LONG_PRESS_MS = 800;
const FEEDBACK_MS = 300;

// Detect platform for displaying correct modifier key
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
const modifierKey = isMac ? '⌘' : 'Ctrl';

function PresetButton({ index, preset, disabled, shortcuts }) {
  const [holding, setHolding] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);
  const longPressed = useRef(false);

  const save = async () => {
    if (await actions.savePreset(index)) {
      setSaved(true);
      setTimeout(() => setSaved(false), FEEDBACK_MS);
    }
  };

  const startPress = (e) => {
    if (e.button !== 0) return;
    longPressed.current = false;
    setHolding(true);
    timer.current = setTimeout(() => {
      longPressed.current = true;
      setHolding(false);
      save();
    }, LONG_PRESS_MS);
  };

  const endPress = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };

  const onClick = (e) => {
    // The long press already saved
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (e.metaKey || e.ctrlKey) save();
    else actions.loadPreset(index);
  };

  const minutes = Math.floor(preset.time / 60);
  return (
    <Button
      variant="secondary"
      size="md"
      className={`preset ${holding ? 'holding' : ''} ${disabled ? 'muted' : ''}`}
      style={saved ? { backgroundColor: 'var(--countdown)', color: 'white', transform: 'scale(1.1)' } : undefined}
      disabled={disabled}
      data-minutes={minutes}
      aria-label={`Set timer to ${formatPresetDisplay(preset.time)}`}
      {...shortcutProps(shortcuts, String(index + 1), 'Click to set, hold to save')}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
      onClick={onClick}
    >
      {formatPresetDisplay(preset.time)}
    </Button>
  );
}

export function Presets() {
  const stored = useAppState('ui.presets');
  const running = useAppState('timer.running');
  const shortcuts = useAppState('ui.shortcuts');
  const presets = DEFAULT_PRESETS.map((preset, i) => stored[i] || preset);

  return (
    <Card>
      <Card.Header
        icon={<i className="bi bi-lightning-fill" />}
        title="Quick Presets"
        action={
          <button
            id="resetPresets"
            className="text-text-secondary hover:text-text-primary flex items-center gap-1 text-sm transition-colors"
            onClick={() => actions.resetPresets()}
          >
            <i className="bi bi-arrow-counterclockwise" />
            <span>Reset</span>
          </button>
        }
      />
      <Card.Content>
        <p className="text-[clamp(0.625rem,1.1vh,0.7rem)] mb-2" style={{ color: 'var(--text-muted)' }}>
          {modifierKey} + Click to save preset
        </p>
        <div className="grid grid-cols-4 gap-[clamp(0.375rem,0.8vh,0.5rem)]">
          {presets.map((preset, index) => (
            <PresetButton key={index} index={index} preset={preset} disabled={running} shortcuts={shortcuts} />
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
