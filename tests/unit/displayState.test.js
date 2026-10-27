import { describe, it, expect, vi } from 'vitest';
import { diffDisplayState, createDisplayStateApplier } from '../../src/core/display/displayState.js';

/** Records what the applier asks of the renderer */
function fakeRenderer() {
  return {
    coverImage: { enabled: false },
    timerThresholds: {},
    setLayout: vi.fn(),
    setState: vi.fn(),
    setWatermarkEnabled: vi.fn(),
    enableCoverImage: vi.fn(async () => {}),
    disableCoverImage: vi.fn(),
    enableBackgroundImage: vi.fn(async () => {}),
    disableBackgroundImage: vi.fn(),
    renderFrame: vi.fn()
  };
}

describe('diffDisplayState', () => {
  it('returns every key the first time, then only the keys that changed', () => {
    const sent = {};
    const state = { frame: { countdown: '00:05:00' }, watermark: true };
    expect(diffDisplayState(state, sent)).toEqual(state);
    expect(diffDisplayState(state, sent)).toBeNull();
    expect(diffDisplayState({ ...state, frame: { countdown: '00:04:59' } }, sent))
      .toEqual({ frame: { countdown: '00:04:59' } });
  });
});

describe('createDisplayStateApplier', () => {
  it('waits for a state with the resolution before creating the renderer', async () => {
    const renderer = fakeRenderer();
    const createRenderer = vi.fn(() => renderer);
    const apply = createDisplayStateApplier(createRenderer);

    await apply({ frame: { countdown: '00:01:00' } });
    expect(createRenderer).not.toHaveBeenCalled();

    await apply({ resolution: { width: 1920, height: 1080 }, frame: { countdown: '00:01:00' }, watermark: false });
    expect(createRenderer).toHaveBeenCalledWith({ width: 1920, height: 1080 });
    expect(renderer.setState).toHaveBeenCalledWith({ countdown: '00:01:00' });
    expect(renderer.setWatermarkEnabled).toHaveBeenCalledWith(false);
  });

  it('only reloads images when they change', async () => {
    const renderer = fakeRenderer();
    const apply = createDisplayStateApplier(() => renderer);
    const coverImage = { enabled: true, path: '/cover.png' };

    await apply({ resolution: { width: 1920, height: 1080 }, coverImage });
    await apply({ coverImage: { ...coverImage } });
    expect(renderer.enableCoverImage).toHaveBeenCalledTimes(1);

    await apply({ backgroundImage: { enabled: false, path: '', opacity: 1 } });
    expect(renderer.disableBackgroundImage).toHaveBeenCalledTimes(1);
  });
});
