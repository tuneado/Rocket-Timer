/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
class InfoStatsCard extends HTMLElement {
  connectedCallback() {
    this.render();
  }
  render() {
    this.className = 'card info-stats-card';
    this.innerHTML = `
      <div class="card-content">
        <div class="field is-grouped is-grouped-multiline" style="gap:1rem;">
          <div class="control" style="flex:1;min-width:150px;">
            <label class="label is-small has-text-grey">Clock Time</label>
            <div class="has-text-weight-semibold is-size-5 has-text-white" id="clockTime">--:--:--</div>
          </div>
          <div class="control" style="flex:1;min-width:150px;">
            <label class="label is-small has-text-grey">Timer Value</label>
            <div class="has-text-weight-semibold is-size-5 has-text-white" id="timerValue">00:00:00</div>
          </div>
          <div class="control" style="flex:1;min-width:150px;">
            <label class="label is-small has-text-grey">Elapsed Time</label>
            <div class="has-text-weight-semibold is-size-5 has-text-white" id="elapsedTime">00:00:00</div>
          </div>
          <div class="control" style="flex:1;min-width:150px;">
            <label class="label is-small has-text-grey">Ends At</label>
            <div class="has-text-weight-semibold is-size-5 has-text-white" id="endsAtTime">--:--</div>
          </div>
        </div>
      </div>`;
  }
}

customElements.define('info-stats-card', InfoStatsCard);
