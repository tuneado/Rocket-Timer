/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
// Minimal reactive store without external deps
const listeners = new Set();
const state = {
  timer: {
    remainingTime: 0,
    totalTime: 0,
    formattedTime: '00:00:00'
  },
  theme: document.documentElement.getAttribute('data-theme') || 'dark',
  clock: {
    visible: false,
    time: '--:--:--'
  }
};

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(patch) {
  // shallow merge per top-level keys
  Object.keys(patch).forEach((k) => {
    const cur = state[k];
    const val = patch[k];
    if (cur && typeof cur === 'object' && typeof val === 'object') {
      Object.assign(cur, val);
    } else {
      state[k] = val;
    }
  });
  listeners.forEach((fn) => fn(state));
}

// Bridge from existing appState if present
if (window.appState && typeof window.appState.subscribe === 'function') {
  window.appState.subscribe('*', () => {
    try {
      const s = window.appState.getState();
      update({
        timer: {
          remainingTime: s['timer.remainingTime'] ?? state.timer.remainingTime,
          totalTime: s['timer.totalTime'] ?? state.timer.totalTime,
          formattedTime: s['timer.formattedTime'] ?? state.timer.formattedTime
        },
        theme: s['theme'] ?? state.theme,
        clock: {
          visible: s['clock.visible'] ?? state.clock.visible
        }
      });
    } catch (e) {
      // no-op
    }
  });
}
