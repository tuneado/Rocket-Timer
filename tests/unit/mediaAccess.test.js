import { describe, it, expect, vi } from 'vitest';
import { createPermissionRequestHandler } from '../../src/main/mediaAccess.js';

function setup({ status = 'not-determined', answer = true, platform = 'darwin' } = {}) {
  const systemPreferences = {
    getMediaAccessStatus: vi.fn(() => status),
    askForMediaAccess: vi.fn(async () => answer)
  };
  const log = { warn: vi.fn() };
  const handler = createPermissionRequestHandler({ systemPreferences, log, platform });
  const request = (permission, details) => new Promise((resolve) => handler(null, permission, resolve, details));
  return { systemPreferences, log, request };
}

describe('createPermissionRequestHandler', () => {
  it('asks macOS the first time the camera is requested', async () => {
    const { systemPreferences, request } = setup({ status: 'not-determined', answer: true });
    expect(await request('media', { mediaTypes: ['video'] })).toBe(true);
    expect(systemPreferences.askForMediaAccess).toHaveBeenCalledWith('camera');
  });

  it('refuses the camera when the user says no, so the page gets an error', async () => {
    const { log, request } = setup({ status: 'not-determined', answer: false });
    expect(await request('media', { mediaTypes: ['video'] })).toBe(false);
    expect(log.warn).toHaveBeenCalled();
  });

  it('does not prompt again once decided', async () => {
    const granted = setup({ status: 'granted' });
    expect(await granted.request('media', { mediaTypes: ['video'] })).toBe(true);
    expect(granted.systemPreferences.askForMediaAccess).not.toHaveBeenCalled();

    const denied = setup({ status: 'denied' });
    expect(await denied.request('media', { mediaTypes: ['video'] })).toBe(false);
    expect(denied.systemPreferences.askForMediaAccess).not.toHaveBeenCalled();
  });

  it('grants everything else, and everything on other platforms', async () => {
    const mac = setup();
    expect(await mac.request('clipboard-read')).toBe(true);
    expect(await mac.request('media', { mediaTypes: ['audio'] })).toBe(true);
    expect(mac.systemPreferences.getMediaAccessStatus).not.toHaveBeenCalled();

    const windows = setup({ platform: 'win32', status: 'denied' });
    expect(await windows.request('media', { mediaTypes: ['video'] })).toBe(true);
  });

  it('falls back to granting if macOS cannot be asked', async () => {
    const { systemPreferences, request } = setup();
    systemPreferences.getMediaAccessStatus.mockImplementation(() => { throw new Error('unavailable'); });
    expect(await request('media', { mediaTypes: ['video'] })).toBe(true);
  });
});
