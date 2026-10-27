/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Minimal event emitter for the core, so it runs without Node's 'events'
 * (browser, iOS web view). Same call order and semantics as Node's for
 * on/off/emit/removeAllListeners.
 */
export class Emitter {
  constructor() {
    this._listeners = new Map();
  }

  on(event, listener) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(listener);
    return this;
  }

  off(event, listener) {
    const list = this._listeners.get(event);
    if (!list) return this;
    const i = list.lastIndexOf(listener);
    if (i !== -1) list.splice(i, 1);
    if (!list.length) this._listeners.delete(event);
    return this;
  }

  /**
   * Call listeners synchronously, in the order they were added
   * @returns {boolean} true if the event had listeners
   */
  emit(event, ...args) {
    const list = this._listeners.get(event);
    if (!list) return false;
    // Copy so listeners added or removed during emit don't affect this call
    for (const listener of [...list]) listener.apply(this, args);
    return true;
  }

  removeAllListeners(event) {
    if (event === undefined) this._listeners.clear();
    else this._listeners.delete(event);
    return this;
  }
}
