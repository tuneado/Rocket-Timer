import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Sidebar } from '../ui/Sidebar.jsx';
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
 * SettingsApp - Main Preact component for Settings window
 * 
 * Handles navigation and renders section components using the UI library.
 * Business logic remains in settings.js which connects via DOM element IDs.
 * 
 * NOTE: All sections are rendered but hidden via CSS so that settings.js
 * can access all DOM elements on page load.
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

export function SettingsApp() {
  const [activeSection, setActiveSection] = useState('display');

  // Handle navigation
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };

  // Render ALL sections, hiding inactive ones
  // This ensures all DOM elements exist for settings.js to access
  const renderAllSections = () => {
    return Object.entries(SECTION_COMPONENTS).map(([id, SectionComponent]) => (
      <div 
        key={id} 
        style={{ display: activeSection === id ? 'block' : 'none' }}
      >
        <SectionComponent />
      </div>
    ));
  };

  return (
    <div className="settings-container flex h-screen">
      {/* Sidebar Navigation */}
      <Sidebar
        items={SECTIONS}
        activeId={activeSection}
        onSelect={handleSectionChange}
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

      {/* Content Area */}
      <main className="settings-content flex-1 overflow-y-auto">
        <div className="settings-content-inner p-8 max-w-3xl">
          {renderAllSections()}
        </div>
      </main>
    </div>
  );
}

export default SettingsApp;
