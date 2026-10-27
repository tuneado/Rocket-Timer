import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { setPlatform, getPlatform } from '../../src/core/platform.js';
import { createElectronPlatform } from '../../src/renderer/js/electronPlatform.js';
import LayoutRegistry from '../../src/core/display/layoutRegistry.js';

/** In-memory stand-in for the main-process layout store */
function fakeLayoutStore(initial = {}) {
  let stored = { ...initial };
  const listeners = [];
  return {
    getAll: vi.fn(() => ({ ...stored })),
    save: vi.fn((id, layout) => { stored[id] = layout; return true; }),
    remove: vi.fn((id) => { delete stored[id]; return true; }),
    clear: vi.fn(() => { stored = {}; return true; }),
    importLegacy: vi.fn(() => false),
    onChanged: vi.fn((callback) => listeners.push(callback)),
    broadcast: (layouts) => listeners.forEach((callback) => callback(layouts))
  };
}

const custom = { name: 'Stage Left', resolution: { width: 1920, height: 1080 } };

describe('platform', () => {
  afterEach(() => setPlatform({}));

  it('is empty until a shell sets it', () => {
    setPlatform(undefined);
    expect(getPlatform()).toEqual({});
  });

  it('returns what the shell set', () => {
    const services = { getAssetUrl: async () => 'x' };
    setPlatform(services);
    expect(getPlatform()).toBe(services);
  });
});

describe('createElectronPlatform', () => {
  it('has no services without the preload bridge', () => {
    expect(createElectronPlatform(undefined)).toEqual({});
  });

  it('maps the preload bridge', async () => {
    const layouts = fakeLayoutStore();
    const bridge = {
      settings: { getAll: vi.fn(async () => ({ frameRate: 30 })) },
      getResourcePath: vi.fn(async (path) => `/app/src/${path}`),
      layouts
    };
    const platform = createElectronPlatform(bridge);
    expect(await platform.settings.getAll()).toEqual({ frameRate: 30 });
    expect(await platform.getAssetUrl('renderer/assets/icon.png')).toBe('file:///app/src/renderer/assets/icon.png');
    expect(bridge.getResourcePath).toHaveBeenCalledWith('renderer/assets/icon.png');
    expect(platform.layouts).toBe(layouts);
  });
});

describe('LayoutRegistry with a platform layout store', () => {
  // The registry loads custom layouts on first use, so the store is set before that
  const store = fakeLayoutStore({ stage: custom });
  beforeAll(() => setPlatform({ layouts: store }));

  it('loads custom layouts from the store on first use', () => {
    expect(LayoutRegistry.hasLayout('stage')).toBe(true);
    expect(LayoutRegistry.getLayout('stage')).toEqual(custom);
    expect(store.getAll).toHaveBeenCalledTimes(1);
    expect(store.onChanged).toHaveBeenCalledTimes(1);
  });

  it('saves and removes through the store', () => {
    expect(LayoutRegistry.addCustomLayout('lobby', { ...custom, name: 'Lobby' })).toBe(true);
    expect(store.save).toHaveBeenCalledWith('lobby', { ...custom, name: 'Lobby' });
    expect(LayoutRegistry.hasLayout('lobby')).toBe(true);
    expect(LayoutRegistry.removeCustomLayout('lobby')).toBe(true);
    expect(store.remove).toHaveBeenCalledWith('lobby');
    expect(LayoutRegistry.hasLayout('lobby')).toBe(false);
  });

  it('follows changes saved from other windows', () => {
    store.broadcast({ other: { ...custom, name: 'Other' } });
    expect(LayoutRegistry.hasLayout('other')).toBe(true);
    expect(LayoutRegistry.hasLayout('stage')).toBe(false);
  });
});
