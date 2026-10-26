import { describe, it, expect, beforeEach } from 'vitest';
import { TimerEngine, getWarningLevel, TICK_MS } from '../../src/main/timerEngine.js';

/**
 * Fake clock and timers: advance(ms) moves time and runs due intervals/timeouts
 */
function fakeTime() {
  let now = 1_000_000;
  let nextId = 1;
  const tasks = new Map(); // id -> { at, every, fn }
  return {
    now: () => now,
    timers: {
      setInterval: (fn, every) => { const id = nextId++; tasks.set(id, { at: now + every, every, fn }); return id; },
      clearInterval: (id) => tasks.delete(id),
      setTimeout: (fn, ms) => { const id = nextId++; tasks.set(id, { at: now + ms, every: 0, fn }); return id; }
    },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const due = [...tasks.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        const [id, task] = due;
        now = task.at;
        if (task.every) task.at += task.every; else tasks.delete(id);
        task.fn();
      }
      now = end;
    }
  };
}

describe('TimerEngine', () => {
  let time;
  let settings;
  let engine;
  let completions;

  beforeEach(() => {
    time = fakeTime();
    settings = { autoStopAtZero: true, presets: [{ id: 1, name: 'Five', time: 300 }] };
    engine = new TimerEngine({ now: time.now, getSettings: () => settings, timers: time.timers });
    completions = 0;
    engine.on('complete', () => { completions++; });
  });

  it('counts down from the set time', () => {
    engine.setTime(60_000);
    engine.start();
    time.advance(10_000);
    const s = engine.getState();
    expect(s.running).toBe(true);
    expect(s.remainingMs).toBe(50_000);
    expect(s.elapsedMs).toBe(10_000);
    expect(s.endAt).toBe(time.now() + 50_000);
  });

  it('pauses and resumes without losing time or elapsed', () => {
    engine.setTime(60_000);
    engine.start();
    time.advance(10_000);
    engine.pause();
    time.advance(30_000); // paused time does not count
    let s = engine.getState();
    expect(s.paused).toBe(true);
    expect(s.remainingMs).toBe(50_000);
    expect(s.elapsedMs).toBe(10_000);

    engine.resume();
    time.advance(5_000);
    s = engine.getState();
    expect(s.remainingMs).toBe(45_000);
    expect(s.elapsedMs).toBe(15_000); // continues, not restarted
  });

  it('auto-stops at zero and fires completion once', () => {
    engine.setTime(3_000);
    engine.start();
    time.advance(5_000);
    const s = engine.getState();
    expect(s.running).toBe(false);
    expect(s.stoppedAtZero).toBe(true);
    expect(s.remainingMs).toBe(0);
    expect(completions).toBe(1);
  });

  it('runs into overtime when auto-stop is off', () => {
    settings.autoStopAtZero = false;
    engine.setTime(2_000);
    engine.start();
    time.advance(5_000);
    const s = engine.getState();
    expect(s.running).toBe(true);
    expect(s.remainingMs).toBe(-3_000);
    expect(s.warningLevel).toBe('overtime');
    expect(completions).toBe(1);
  });

  it('auto-resets one second after completion when enabled', () => {
    settings.autoReset = true;
    engine.setTime(2_000);
    engine.start();
    time.advance(2_000 + TICK_MS);
    expect(engine.getState().stoppedAtZero).toBe(true);
    time.advance(1_000);
    const s = engine.getState();
    expect(s.stoppedAtZero).toBe(false);
    expect(s.remainingMs).toBe(2_000);
  });

  it('restarts from the set time when started after finishing', () => {
    engine.setTime(1_000);
    engine.start();
    time.advance(2_000);
    engine.start();
    time.advance(500);
    expect(engine.getState().remainingMs).toBe(500);
  });

  it('reset returns to the last set time and clears elapsed', () => {
    engine.setTime(60_000);
    engine.start();
    time.advance(20_000);
    engine.reset();
    const s = engine.getState();
    expect(s.running).toBe(false);
    expect(s.remainingMs).toBe(60_000);
    expect(s.elapsedMs).toBe(0);
    expect(s.started).toBe(false);
  });

  it('adjusting while stopped changes the set time', () => {
    engine.setTime(60_000);
    engine.adjust(60_000);
    let s = engine.getState();
    expect([s.remainingMs, s.totalMs, s.lastSetMs]).toEqual([120_000, 120_000, 120_000]);
    engine.adjust(-180_000);
    s = engine.getState();
    expect([s.remainingMs, s.totalMs]).toEqual([0, 0]);
  });

  it('adjusting while running moves the deadline and grows the total if needed', () => {
    engine.setTime(60_000);
    engine.start();
    time.advance(10_000);
    engine.adjust(30_000);
    let s = engine.getState();
    expect(s.remainingMs).toBe(80_000);
    expect(s.totalMs).toBe(80_000);
    expect(s.lastSetMs).toBe(60_000); // reset still returns to the set time
    engine.adjust(-100_000); // crosses zero → completes and auto-stops
    s = engine.getState();
    expect(s.stoppedAtZero).toBe(true);
    expect(completions).toBe(1);
  });

  it('ignores adjustments once stopped at zero', () => {
    engine.setTime(1_000);
    engine.start();
    time.advance(2_000);
    engine.adjust(60_000);
    expect(engine.getState().remainingMs).toBe(0);
  });

  it('loads presets by index, but not while running', () => {
    expect(engine.loadPreset(0)).toBe(true);
    expect(engine.getState()).toMatchObject({ remainingMs: 300_000, preset: 0 });
    engine.start();
    expect(engine.loadPreset(0)).toBe(false);
    expect(engine.loadPreset(5)).toBe(false);
  });

  it('sets one time component, keeping the others', () => {
    engine.setTime((1 * 3600 + 2 * 60 + 3) * 1000);
    engine.setComponent('minutes', 30);
    expect(engine.getState().remainingMs).toBe((1 * 3600 + 30 * 60 + 3) * 1000);
  });

  it('resume does nothing unless paused', () => {
    engine.setTime(60_000);
    engine.resume();
    expect(engine.getState().running).toBe(false);
  });

  it('dispatches commands', () => {
    engine.command({ action: 'set-time', seconds: 90 });
    engine.command({ action: 'toggle' });
    expect(engine.getState().running).toBe(true);
    engine.command({ action: 'adjust', seconds: 30 });
    expect(engine.getState().remainingMs).toBe(120_000);
    expect(() => engine.command({ action: 'nope' })).toThrow();
  });

  it('emits change after commands and ticks', () => {
    const changes = [];
    engine.on('change', (s) => changes.push(s.remainingMs));
    engine.setTime(1_000);
    engine.start();
    time.advance(300);
    expect(changes.length).toBeGreaterThanOrEqual(5);
    expect(changes[changes.length - 1]).toBe(700);
  });
});

describe('getWarningLevel', () => {
  it('uses percentage thresholds by default', () => {
    expect(getWarningLevel(50_000, 100_000)).toBe('normal');
    expect(getWarningLevel(20_000, 100_000)).toBe('warning');
    expect(getWarningLevel(4_000, 100_000)).toBe('critical');
    expect(getWarningLevel(-1_000, 100_000)).toBe('overtime');
  });

  it('uses time thresholds when configured', () => {
    const s = { timerThresholdType: 'time', warningTimeMinutes: 1, warningTimeSeconds: 0, criticalTimeMinutes: 0, criticalTimeSeconds: 10 };
    expect(getWarningLevel(90_000, 600_000, s)).toBe('normal');
    expect(getWarningLevel(30_000, 600_000, s)).toBe('warning');
    expect(getWarningLevel(5_000, 600_000, s)).toBe('critical');
  });
});
