/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { useState, useEffect } from 'preact/hooks';
import appState from '../js/modules/appState.js';

/**
 * Current value at an appState path (e.g. 'timer.running'); re-renders when it changes.
 * Subscribe to leaf paths: appState notifies the exact path that was set.
 */
export function useAppState(path) {
  const [value, setValue] = useState(() => appState.get(path));

  useEffect(() => {
    setValue(appState.get(path));
    return appState.subscribe(path, () => setValue(appState.get(path)));
  }, [path]);

  return value;
}
