import { describe, it, expect } from 'vitest';
import { Emitter } from '../../src/core/emitter.js';

describe('Emitter', () => {
  it('calls listeners in the order they were added, with the arguments', () => {
    const emitter = new Emitter();
    const calls = [];
    emitter.on('change', (a, b) => calls.push(['first', a, b]));
    emitter.on('change', (a, b) => calls.push(['second', a, b]));
    expect(emitter.emit('change', 1, 2)).toBe(true);
    expect(calls).toEqual([['first', 1, 2], ['second', 1, 2]]);
  });

  it('returns false when an event has no listeners', () => {
    expect(new Emitter().emit('change')).toBe(false);
  });

  it('removes a listener with off', () => {
    const emitter = new Emitter();
    let count = 0;
    const listener = () => count++;
    emitter.on('change', listener);
    emitter.off('change', listener);
    emitter.emit('change');
    expect(count).toBe(0);
  });

  it('removes all listeners, for one event or every event', () => {
    const emitter = new Emitter();
    let count = 0;
    emitter.on('change', () => count++);
    emitter.on('complete', () => count++);
    emitter.removeAllListeners('change');
    emitter.emit('change');
    emitter.emit('complete');
    expect(count).toBe(1);
    emitter.removeAllListeners();
    emitter.emit('complete');
    expect(count).toBe(1);
  });

  it('is not affected by listeners added during emit', () => {
    const emitter = new Emitter();
    let late = 0;
    emitter.on('change', () => emitter.on('change', () => late++));
    emitter.emit('change');
    expect(late).toBe(0);
  });
});
