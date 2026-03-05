/**
 * Settings Page Entry Point
 * 
 * Renders the Preact settings app and initializes settings.js for business logic.
 */

import { h, render } from 'preact';
import { SettingsApp } from '../components/settings/SettingsApp.jsx';

// Mount Preact app
const container = document.getElementById('settings-root');
if (container) {
  render(<SettingsApp />, container);
}
