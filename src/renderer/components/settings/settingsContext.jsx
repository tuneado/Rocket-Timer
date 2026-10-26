/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Settings window state: loads settings from the main process and exposes
 * save helpers to the section components.
 */
import { h, createContext } from 'preact';
import { useState, useEffect, useRef, useContext, useCallback } from 'preact/hooks';

const SettingsContext = createContext(null);

/**
 * @returns {{ settings: object, save: (key, value) => Promise, saveColors: (patch) => void,
 *            notify: (message, type?) => void }}
 */
export function useSettings() {
  return useContext(SettingsContext);
}

/**
 * Listen to an IPC channel while the component is mounted
 */
export function useIpc(channel, handler) {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => window.electron.ipcRenderer.on(channel, (data) => latest.current(data)), [channel]);
}

// Settings other windows read from localStorage (shared origin) for fast access
const LOCAL_MIRRORS = {
  defaultLayout: (v) => localStorage.setItem('canvasLayout', v),
  matchTimerColor: (v) => localStorage.setItem('matchTimerColor', String(v)),
  autoStopAtZero: (v) => localStorage.setItem('autoStopAtZero', String(v)),
  clockFormat: (v) => localStorage.setItem('clockFormat', v),
  hiddenBuiltinLayouts: (v) => localStorage.setItem('hiddenBuiltinLayouts', JSON.stringify(v || []))
};

export function SettingsProvider({ notify, children }) {
  const [settings, setSettings] = useState(null);
  const settingsRef = useRef(null);
  settingsRef.current = settings;

  useEffect(() => {
    window.electron.settings.getAll().then((loaded) => {
      // Mirrors the main window reads before it has talked to this window
      localStorage.setItem('autoStopAtZero', String(loaded.autoStopAtZero !== false));
      localStorage.setItem('hiddenBuiltinLayouts', JSON.stringify(loaded.hiddenBuiltinLayouts || []));
      setSettings(loaded);
    }).catch((error) => console.error('Error loading settings:', error));

    // Follow changes made elsewhere (e.g. loading a project)
    const stopUpdates = window.electron.settings.onUpdate((updated) => {
      if (updated) setSettings((s) => ({ ...s, ...updated }));
    });

    // The main window applies the final settings when this window closes
    const onUnload = () => {
      window.electron.ipcRenderer.send('apply-settings', settingsRef.current);
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      stopUpdates();
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  const save = useCallback(async (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    try {
      await window.electron.settings.save(key, value);
      LOCAL_MIRRORS[key]?.(value);
    } catch (error) {
      console.error('Error saving setting:', error);
      notify(`Could not save ${key}`, 'error');
    }
  }, [notify]);

  // patch: { countdown: '#fff', ... } — several colors in one save
  const saveColors = useCallback((patch) => {
    const colors = { ...settingsRef.current.colors, ...patch };
    settingsRef.current = { ...settingsRef.current, colors };
    save('colors', colors);
    // Warning-level colors used by the API server
    window.electron.ipcRenderer.send('settings-colors-updated', colors);
  }, [save]);

  if (!settings) return null;

  return (
    <SettingsContext.Provider value={{ settings, save, saveColors, notify }}>
      {children}
    </SettingsContext.Provider>
  );
}
