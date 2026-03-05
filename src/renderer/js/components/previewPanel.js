import { getState, subscribe } from './store.js';

class PreviewPanel extends HTMLElement {
  connectedCallback() {
    this.render();
    // keep canvas id for compatibility
    const canvas = this.querySelector('#timerCanvas');
    if (canvas) {
      // if existing renderer expects canvas present, nothing else to do
    }
    this.unsubscribe = subscribe(() => this.update());
  }
  disconnectedCallback() {
    this.unsubscribe && this.unsubscribe();
  }
  update() {
    // Could reflect theme or sizing; for now, no-op
  }
  render() {
    this.className = 'preview-wrapper';
    this.innerHTML = `
      <div class="preview-frame">
        <canvas id="timerCanvas"></canvas>
      </div>
    `;
  }
}

customElements.define('preview-panel', PreviewPanel);
