/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { getState, subscribe } from './store.js';

class ControlsPanel extends HTMLElement {
  connectedCallback() {
    this.render();
    this.unsubscribe = subscribe(() => this.update());
  }
  disconnectedCallback() {
    this.unsubscribe && this.unsubscribe();
  }
  update() {}
  render() {
    this.className = 'controls-card';
    this.innerHTML = `
      <div class="card-content">
        <div class="field is-grouped is-grouped-centered">
          <div class="control">
            <button id="startStop" class="button is-large is-success control-button" aria-label="Start timer" aria-keyshortcut="Space">
              <span class="icon"><i class="bi bi-play-fill"></i></span><span>Start</span>
            </button>
          </div>
          <div class="control">
            <button id="reset" class="button is-large is-danger control-button" aria-label="Reset timer to set duration" aria-keyshortcut="r">
              <span class="icon"><i class="bi bi-arrow-clockwise"></i></span><span>Reset</span>
            </button>
          </div>
          <div class="control">
            <div class="quick-adjust-container">
              <button id="addMinute" class="button is-light quick-adjust-button" aria-label="Add one minute" aria-keyshortcut="ArrowUp">
                <span class="icon is-small"><i class="bi bi-caret-up-fill"></i></span><span style="font-size:0.9rem;font-weight:600;">+1</span>
              </button>
              <button id="subtractMinute" class="button is-light quick-adjust-button" aria-label="Subtract one minute" aria-keyshortcut="ArrowDown">
                <span class="icon is-small"><i class="bi bi-caret-down-fill"></i></span><span style="font-size:0.9rem;font-weight:600;">-1</span>
              </button>
            </div>
          </div>
          <div class="control">
            <div class="quick-adjust-container">
              <button id="addFive" class="button is-light quick-adjust-button" aria-label="Add five minutes" aria-keyshortcut="Shift+ArrowUp">
                <span class="icon is-small"><i class="bi bi-caret-up-fill"></i></span><span style="font-size:0.9rem;font-weight:600;">+5</span>
              </button>
              <button id="subtractFive" class="button is-light quick-adjust-button" aria-label="Subtract five minutes" aria-keyshortcut="Shift+ArrowDown">
                <span class="icon is-small"><i class="bi bi-caret-down-fill"></i></span><span style="font-size:0.9rem;font-weight:600;">-5</span>
              </button>
            </div>
          </div>
          <div class="control">
            <div class="quick-adjust-container">
              <button id="addTen" class="button is-light quick-adjust-button" aria-label="Add ten minutes" aria-keyshortcut="Ctrl+ArrowUp">
                <span class="icon is-small"><i class="bi bi-caret-up-fill"></i></span><span style="font-size:0.9rem;font-weight:600;">+10</span>
              </button>
              <button id="subtractTen" class="button is-light quick-adjust-button" aria-label="Subtract ten minutes" aria-keyshortcut="Ctrl+ArrowDown">
                <span class="icon is-small"><i class="bi bi-caret-down-fill"></i></span><span style="font-size:0.9rem;font-weight:600;">-10</span>
              </button>
            </div>
          </div>
          <div class="control" style="display:flex;align-items:stretch;">
            <div class="control-separator"></div>
          </div>
          <div class="control">
            <button id="flashButton" class="button is-large is-light control-button" title="Flash screen" aria-label="Flash screen" aria-keyshortcut="f">
              <span class="icon"><i class="bi bi-lightning-fill"></i></span>
            </button>
          </div>
          <div class="control">
            <button id="muteSounds" class="button is-large is-danger control-button" title="Unmute" aria-label="Toggle sound mute" aria-keyshortcut="m">
              <span class="icon"><i class="bi bi-volume-mute-fill"></i></span>
            </button>
          </div>
          <div class="control">
            <button id="featureImage" class="button is-large is-light control-button" title="Feature Image" aria-label="Toggle feature image" aria-keyshortcut="i">
              <span class="icon"><i class="bi bi-image-fill"></i></span>
            </button>
          </div>
        </div>
      </div>`;
  }
}

customElements.define('controls-panel', ControlsPanel);
