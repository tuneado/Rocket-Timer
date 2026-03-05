/**
 * Settings Page Entry Point
 * 
 * Renders the Preact settings app.
 */

import { h, render } from 'preact';
import { SettingsApp } from './components/settings/SettingsApp.jsx';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  const root = document.getElementById('settings-root');
  if (root) {
    render(<SettingsApp />, root);
    
    // Dispatch event to notify settings.js that Preact has rendered
    // Use setTimeout to ensure render is complete
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('preact-settings-ready'));
    }, 0);
  }
}
