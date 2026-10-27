import { describe, it, expect } from 'vitest';
import { parseTeamIdentifier, hasDeveloperIdSignature } from '../../src/main/utils/codeSigning.js';

const ADHOC = 'Executable=/Applications/Rocket Timer.app/Contents/MacOS/Rocket Timer\nSignature=adhoc\nTeamIdentifier=not set\n';
const SIGNED = 'Authority=Developer ID Application: Example (ABCDE12345)\nTeamIdentifier=ABCDE12345\n';
const UNSIGNED = '/Applications/Rocket Timer.app: code object is not signed at all\n';

describe('parseTeamIdentifier', () => {
  it('reads the team of a Developer ID build', () => {
    expect(parseTeamIdentifier(SIGNED)).toBe('ABCDE12345');
  });

  it('has no team for ad-hoc, unsigned or empty output', () => {
    expect(parseTeamIdentifier(ADHOC)).toBeNull();
    expect(parseTeamIdentifier(UNSIGNED)).toBeNull();
    expect(parseTeamIdentifier('')).toBeNull();
  });
});

describe('hasDeveloperIdSignature', () => {
  const fakeRun = (stderr, error = null) => (cmd, args, callback) => {
    fakeRun.lastArgs = [cmd, ...args];
    callback(error, '', stderr);
  };

  it('checks the app bundle that contains the executable', async () => {
    const run = fakeRun(SIGNED);
    expect(await hasDeveloperIdSignature({ execPath: '/Applications/Rocket Timer.app/Contents/MacOS/Rocket Timer', run })).toBe(true);
    expect(fakeRun.lastArgs).toEqual(['codesign', '-dv', '/Applications/Rocket Timer.app']);
  });

  it('is false for ad-hoc and unsigned builds', async () => {
    const execPath = '/Applications/Rocket Timer.app/Contents/MacOS/Rocket Timer';
    expect(await hasDeveloperIdSignature({ execPath, run: fakeRun(ADHOC) })).toBe(false);
    expect(await hasDeveloperIdSignature({ execPath, run: fakeRun(UNSIGNED, new Error('exit 1')) })).toBe(false);
  });
});
