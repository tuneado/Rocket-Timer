import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

// Minimal reactive store
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

// React hook for components
export function useStore() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const unsub = subscribe(() => forceUpdate({}));
    return unsub;
  }, []);
  
  return state;
}

// Bridge from existing appState
if (typeof window !== 'undefined' && window.appState && typeof window.appState.subscribe === 'function') {
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
