/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useState, useEffect, useRef, useLayoutEffect } from 'preact/hooks';
import { useAppState } from './useAppState.js';
import { formatShortcut } from '../js/utils/keyboardManager.js';

const SHOW_DELAY_MS = 400;
const GAP = 8;
const MARGIN = 8;

/**
 * Props for a control with a keyboard shortcut: the tooltip shows `label` and the
 * key while the shortcut is enabled; otherwise the native title shows `label`.
 */
export function shortcutProps(shortcuts, key, label) {
  const enabled = Boolean(shortcuts[key]);
  return {
    'data-shortcut': key,
    'data-tooltip': label,
    title: enabled ? undefined : label,
    'aria-keyshortcuts': enabled ? ariaKeys(key) : undefined
  };
}

const ARIA_KEY_NAMES = { ctrl: 'Control', shift: 'Shift', alt: 'Alt', meta: 'Meta', space: 'Space', arrowup: 'ArrowUp', arrowdown: 'ArrowDown' };

/**
 * 'shift+arrowup' → 'Shift+ArrowUp' (aria-keyshortcuts format)
 */
function ariaKeys(key) {
  return key.split('+').map(k => ARIA_KEY_NAMES[k] || k.toUpperCase()).join('+');
}

/**
 * One tooltip for the whole window, positioned over the hovered [data-shortcut]
 * control. Fixed positioning keeps it clear of the cards' overflow clipping.
 */
export function ShortcutTooltip() {
  const shortcuts = useAppState('ui.shortcuts');
  const [tip, setTip] = useState(null); // { key, label, rect }
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const enabledRef = useRef(shortcuts);
  enabledRef.current = shortcuts;

  useEffect(() => {
    let timer = null;
    let target = null;

    const hide = () => {
      clearTimeout(timer);
      target = null;
      setTip(null);
    };

    const onOver = (e) => {
      const el = e.target.closest?.('[data-shortcut]');
      if (el === target) return;
      hide();
      if (!el || !enabledRef.current[el.dataset.shortcut]) return;
      target = el;
      timer = setTimeout(() => {
        setTip({ key: el.dataset.shortcut, label: el.dataset.tooltip, rect: el.getBoundingClientRect() });
      }, SHOW_DELAY_MS);
    };

    const onOut = (e) => {
      // Still inside the control (moving between its children)
      if (target && target.contains(e.relatedTarget)) return;
      hide();
    };

    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('keydown', hide, true);
    window.addEventListener('blur', hide);
    window.addEventListener('resize', hide);
    return () => {
      hide();
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('keydown', hide, true);
      window.removeEventListener('blur', hide);
      window.removeEventListener('resize', hide);
    };
  }, []);

  // Above the control, or below if there's no room; kept inside the window
  useLayoutEffect(() => {
    if (!tip || !ref.current) {
      setPos(null);
      return;
    }
    const { width, height } = ref.current.getBoundingClientRect();
    const { rect } = tip;
    let top = rect.top - height - GAP;
    if (top < MARGIN) top = rect.bottom + GAP;
    const left = Math.min(
      Math.max(MARGIN, rect.left + rect.width / 2 - width / 2),
      window.innerWidth - width - MARGIN
    );
    setPos({ top, left });
  }, [tip]);

  // Shortcut turned off in settings while showing
  const visible = tip && shortcuts[tip.key];
  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="tooltip"
      className="shortcut-tooltip fixed z-50 pointer-events-none flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap font-medium shadow-lg bg-[var(--text-primary)] text-[var(--bg-base)]"
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
    >
      {tip.label && <span>{tip.label}</span>}
      <kbd className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded font-mono text-xs border border-current/30">
        {formatShortcut(tip.key)}
      </kbd>
    </div>
  );
}
