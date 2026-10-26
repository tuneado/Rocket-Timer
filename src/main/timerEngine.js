/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Timer Engine - the single source of truth for the countdown.
 * Runs in the main process so the API, menus and every window see the same time,
 * whatever state the main window is in. Remaining time is always computed from a
 * wall-clock deadline, so it never drifts.
 *
 * Events:
 *   'change'   (state)  after every command and every tick while running
 *   'complete' (state)  once per run, when the time crosses zero
 */
const { EventEmitter } = require('events');

const TICK_MS = 100;

/**
 * Warning level for a remaining/total time (milliseconds), using the
 * threshold settings. Mirrors the renderer's display colors.
 * @returns {'normal'|'warning'|'critical'|'overtime'}
 */
function getWarningLevel(remainingMs, totalMs, settings = {}) {
  const remaining = Math.floor(remainingMs / 1000);
  const total = Math.floor(totalMs / 1000);
  if (remaining < 0) return 'overtime';
  if (total === 0) return 'normal';

  if ((settings.timerThresholdType || 'percentage') === 'percentage') {
    const warning = settings.warningPercentage || 30;
    const critical = settings.criticalPercentage || 5;
    const pct = (remaining / total) * 100;
    if (pct > warning) return 'normal';
    if (pct > critical) return 'warning';
    return 'critical';
  }

  const warning = (settings.warningTimeMinutes || 2) * 60 + (settings.warningTimeSeconds || 0);
  const critical = (settings.criticalTimeMinutes || 0) * 60 + (settings.criticalTimeSeconds || 30);
  if (remaining > warning) return 'normal';
  if (remaining > critical) return 'warning';
  return 'critical';
}

class TimerEngine extends EventEmitter {
  /**
   * @param {object} [options]
   * @param {() => number} [options.now] - clock in ms (injectable for tests)
   * @param {() => object} [options.getSettings] - current app settings
   * @param {object} [options.timers] - { setInterval, clearInterval, setTimeout }
   */
  constructor({ now = Date.now, getSettings = () => ({}), timers = globalThis } = {}) {
    super();
    this.now = now;
    this.getSettings = getSettings;
    this.timers = timers;

    this.totalMs = 0;          // full duration (progress bar denominator)
    this.remainingMs = 0;
    this.lastSetMs = 0;        // what reset returns to
    this.running = false;
    this.stoppedAtZero = false;
    this.deadline = 0;         // wall-clock end while running
    this.runStartedAt = 0;     // when the current run segment started
    this.elapsedBeforeMs = 0;  // elapsed from earlier run segments (pauses)
    this.preset = null;        // index of the loaded preset, null = custom time
    this.completionFired = false;
    this.interval = null;
  }

  // ==========================================================================
  // STATE
  // ==========================================================================

  getState() {
    const now = this.now();
    const remainingMs = this.running ? this.deadline - now : this.remainingMs;
    const elapsedMs = this.elapsedBeforeMs + (this.running ? now - this.runStartedAt : 0);
    return {
      remainingMs,
      totalMs: this.totalMs,
      lastSetMs: this.lastSetMs,
      elapsedMs,
      running: this.running,
      paused: !this.running && remainingMs > 0 && remainingMs < this.totalMs,
      stoppedAtZero: this.stoppedAtZero,
      // Nothing has run since the time was last set
      started: this.running || elapsedMs > 0,
      endAt: this.running ? this.deadline : null,
      preset: this.preset,
      warningLevel: getWarningLevel(remainingMs, this.totalMs, this.getSettings())
    };
  }

  _emitChange() {
    this.emit('change', this.getState());
  }

  // ==========================================================================
  // COMMANDS
  // ==========================================================================

  /**
   * Set a new duration. Stops the timer and clears elapsed time.
   * @param {number} ms
   * @param {number|null} [preset] - preset index when loaded from a preset
   */
  setTime(ms, preset = null) {
    this._halt();
    const value = Math.max(0, Math.round(ms));
    this.totalMs = value;
    this.remainingMs = value;
    this.lastSetMs = value;
    this.elapsedBeforeMs = 0;
    this.stoppedAtZero = false;
    this.preset = preset;
    this._emitChange();
  }

  /**
   * Replace one part (hours/minutes/seconds) of the current time
   */
  setComponent(part, value) {
    const base = Math.max(0, Math.floor((this.running ? this.deadline - this.now() : this.remainingMs) / 1000));
    let h = Math.floor(base / 3600);
    let m = Math.floor((base % 3600) / 60);
    let s = base % 60;
    if (part === 'hours') h = value;
    else if (part === 'minutes') m = value;
    else if (part === 'seconds') s = value;
    else return;
    this.setTime((h * 3600 + m * 60 + s) * 1000);
  }

  /**
   * Load preset by index from settings.presets (time in seconds).
   * Ignored while running, like the preset buttons.
   * @returns {boolean} true if loaded
   */
  loadPreset(index) {
    const preset = (this.getSettings().presets || [])[index];
    if (this.running || !preset || typeof preset.time !== 'number') return false;
    this.setTime(preset.time * 1000, index);
    return true;
  }

  start() {
    if (this.running) return;
    // Finished or empty: start again from the set time
    if (this.remainingMs <= 0) {
      if (this.lastSetMs <= 0) return;
      this.setTime(this.lastSetMs, this.preset);
    }
    const now = this.now();
    this.running = true;
    this.stoppedAtZero = false;
    this.completionFired = false;
    this.runStartedAt = now;
    this.deadline = now + this.remainingMs;
    this.interval = this.timers.setInterval(() => this._tick(), TICK_MS);
    this._emitChange();
  }

  pause() {
    if (!this.running) return;
    this._halt();
    this._emitChange();
  }

  toggle() {
    if (this.running) this.pause();
    else this.start();
  }

  /**
   * Resume only if paused (API semantics)
   */
  resume() {
    if (!this.running && this.getState().paused) this.start();
  }

  reset() {
    this.setTime(this.lastSetMs, this.preset);
  }

  /**
   * Add (or subtract, negative) time. While stopped this changes the set time too;
   * while running it moves the deadline. Ignored once stopped at zero.
   */
  adjust(deltaMs) {
    if (this.stoppedAtZero || !deltaMs) return;

    if (this.running) {
      const before = this.deadline - this.now();
      this.deadline += deltaMs;
      const after = this.deadline - this.now();
      if (after > this.totalMs) this.totalMs = after;
      this._checkZero(before, after);
    } else {
      this.remainingMs = Math.max(0, this.remainingMs + deltaMs);
      this.totalMs = Math.max(0, this.totalMs + deltaMs, this.remainingMs);
      this.lastSetMs = this.totalMs;
      this.preset = null;
    }
    this._emitChange();
  }

  /**
   * Command from IPC or the API: { action, seconds?, index?, part?, value? }
   * @returns {object} state after the command
   */
  command({ action, seconds, index, part, value } = {}) {
    switch (action) {
      case 'start': this.start(); break;
      case 'pause':
      case 'stop': this.pause(); break;
      case 'resume': this.resume(); break;
      case 'toggle': this.toggle(); break;
      case 'reset': this.reset(); break;
      case 'set-time': this.setTime(Number(seconds) * 1000); break;
      case 'adjust': this.adjust(Number(seconds) * 1000); break;
      case 'load-preset': this.loadPreset(Number(index)); break;
      case 'set-component': this.setComponent(part, Number(value)); break;
      default: throw new Error(`Unknown timer action: ${action}`);
    }
    return this.getState();
  }

  dispose() {
    this._halt();
    this.removeAllListeners();
  }

  // ==========================================================================
  // INTERNALS
  // ==========================================================================

  _tick() {
    if (!this.running) return;
    const before = this.remainingMs;
    this.remainingMs = this.deadline - this.now();
    this._checkZero(before, this.remainingMs);
    this._emitChange();
  }

  /**
   * Fire completion when crossing zero; stop there if auto-stop is on
   */
  _checkZero(beforeMs, afterMs) {
    if (!this.running || afterMs > 0) return;

    if (beforeMs > 0 && !this.completionFired) {
      this.completionFired = true;
      this.emit('complete', this.getState());
      if (this.getSettings().autoReset) {
        this.timers.setTimeout(() => this.reset(), 1000);
      }
    }

    if (this.getSettings().autoStopAtZero !== false) {
      this._halt();
      this.remainingMs = 0;
      this.stoppedAtZero = true;
    }
  }

  /**
   * Stop ticking and bank elapsed time (no event)
   */
  _halt() {
    if (this.interval) {
      this.timers.clearInterval(this.interval);
      this.interval = null;
    }
    if (this.running) {
      const now = this.now();
      this.remainingMs = this.deadline - now;
      this.elapsedBeforeMs += now - this.runStartedAt;
      this.running = false;
      this.deadline = 0;
    }
  }
}

module.exports = { TimerEngine, getWarningLevel, TICK_MS };
