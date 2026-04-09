/**
 * SettingsManager unit tests — SKIPPED
 *
 * SettingsManager calls `app.getPath('userData')` (from Electron) at construction time.
 * Mocking CJS `require('electron')` from ESM Vitest is unreliable due to interop issues.
 *
 * This module is tested via E2E smoke tests where real Electron is available.
 * If SettingsManager is refactored to accept a config path via constructor arg,
 * these tests can be re-enabled.
 */
import { describe, it } from 'vitest';

describe('SettingsManager', () => {
  it.todo('constructor — requires Electron runtime (tested in E2E)');
  it.todo('loadSettings — requires Electron runtime (tested in E2E)');
  it.todo('saveSettings — requires Electron runtime (tested in E2E)');
  it.todo('getSetting / setSetting — requires Electron runtime (tested in E2E)');
  it.todo('resetSettings — requires Electron runtime (tested in E2E)');
});
