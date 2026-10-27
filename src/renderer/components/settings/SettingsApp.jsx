/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { Sidebar } from '../ui/Sidebar.jsx';
import { SettingsProvider, useSettings } from './settingsContext.jsx';
import DisplaySection from './sections/DisplaySection.jsx';
import TimerSection from './sections/TimerSection.jsx';
import LayoutsSection from './sections/LayoutsSection.jsx';
import PerformanceSection from './sections/PerformanceSection.jsx';
import VideoInputSection from './sections/VideoInputSection.jsx';
import ApiSection from './sections/ApiSection.jsx';
import AppearanceSection from './sections/AppearanceSection.jsx';
import ShortcutsSection from './sections/ShortcutsSection.jsx';
import AboutSection from './sections/AboutSection.jsx';

/**
 * SettingsApp - Main Preact component for the Settings window.
 * Sections read and save settings through useSettings() (settingsContext.jsx).
 */

const SECTIONS = [
  { id: 'display', label: 'Display', icon: 'bi-tv' },
  { id: 'timer', label: 'Timer', icon: 'bi-stopwatch' },
  { id: 'layouts', label: 'Layouts', icon: 'bi-layout-text-window-reverse' },
  { id: 'performance', label: 'Performance', icon: 'bi-lightning' },
  { id: 'video-input', label: 'Video Input', icon: 'bi-camera-video' },
  { id: 'api', label: 'API & Integration', icon: 'bi-plug' },
  { id: 'shortcuts', label: 'Shortcuts', icon: 'bi-keyboard' },
  { id: 'appearance', label: 'Appearance', icon: 'bi-palette' },
  { id: 'about', label: 'About', icon: 'bi-info-circle' },
];

const SECTION_COMPONENTS = {
  'display': DisplaySection,
  'timer': TimerSection,
  'layouts': LayoutsSection,
  'performance': PerformanceSection,
  'video-input': VideoInputSection,
  'api': ApiSection,
  'shortcuts': ShortcutsSection,
  'appearance': AppearanceSection,
  'about': AboutSection,
};

const TOAST_COLORS = {
  info: '#3273dc',
  warning: '#ffdd57',
  error: '#f14668',
  success: '#48c774'
};

export function SettingsApp() {
  // A section can be opened directly, e.g. Help > Keyboard Shortcuts
  const [activeSection, setActiveSection] = useState(() => {
    const requested = window.location.hash.slice(1);
    return SECTION_COMPONENTS[requested] ? requested : 'display';
  });
  useEffect(() => window.electron.ipcRenderer.on('settings-open-section', (section) => {
    if (SECTION_COMPONENTS[section]) setActiveSection(section);
  }), []);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((message, type = 'info') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => t && { ...t, visible: false }), 5000);
  }, []);

  const ActiveSection = SECTION_COMPONENTS[activeSection];

  return (
    <SettingsProvider notify={notify}>
      <ThemeFollower />
      <div className="settings-container flex h-screen">
        {/* Sidebar Navigation */}
        <Sidebar
          items={SECTIONS}
          activeId={activeSection}
          onSelect={setActiveSection}
          header={
            <div className="flex items-center gap-2">
              <img
                src="../assets/rocket-icon_transparent.png"
                alt=""
                className="w-7 h-7 object-contain"
              />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Preferences</span>
            </div>
          }
        />

        {/* Content Area: only the open section is mounted */}
        <main className="settings-content flex-1 overflow-y-auto">
          <div className="settings-content-inner p-8 max-w-3xl">
            <ActiveSection key={activeSection} />
          </div>
        </main>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            fontWeight: 500,
            zIndex: 9999,
            maxWidth: '400px',
            transition: 'all 0.3s ease',
            background: TOAST_COLORS[toast.type] || TOAST_COLORS.info,
            color: toast.type === 'warning' ? '#333' : 'white',
            opacity: toast.visible ? 1 : 0,
            transform: toast.visible ? 'translateX(0)' : 'translateX(20px)',
            pointerEvents: toast.visible ? 'auto' : 'none'
          }}
        >
          {toast.message}
        </div>
      )}
    </SettingsProvider>
  );
}

/**
 * Applies the Appearance theme (dark / light / auto) to this window
 */
function ThemeFollower() {
  const { settings } = useSettings();
  const theme = settings.appearanceTheme || 'dark';

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'auto' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.setAttribute('data-theme', resolved);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return null;
}

export default SettingsApp;
