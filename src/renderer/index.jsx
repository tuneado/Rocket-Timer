import { h, render } from 'preact';
import { App } from './components/App.jsx';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  const appRoot = document.getElementById('app');
  if (appRoot) {
    render(<App />, appRoot);
  }
}
