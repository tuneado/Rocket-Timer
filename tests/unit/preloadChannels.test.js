/**
 * The preload only lets pages use IPC channels on its allowlists. These tests read the
 * sources (the preload needs Electron, so it isn't imported) and fail when the main
 * process handles or sends a channel the allowlist is missing, or the other way round.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const preload = fs.readFileSync(path.join(ROOT, 'src/preload/preload.js'), 'utf8');

const mainSource = fs.readdirSync(path.join(ROOT, 'src/main'), { recursive: true })
  .filter(f => f.endsWith('.js'))
  .map(f => fs.readFileSync(path.join(ROOT, 'src/main', f), 'utf8'))
  .join('\n');

function allowlist(name) {
  const block = preload.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!block) throw new Error(`${name} not found in preload.js`);
  return [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]).sort();
}

function channels(regex) {
  return [...new Set([...mainSource.matchAll(regex)].map(m => m[1]))]
    // utils/promptDialog.js generates its own preload with a templated channel name
    .filter(c => !c.includes('${'))
    .sort();
}

// Channels the preload exposes through dedicated APIs instead of the generic bridge
const DEDICATED = ['layouts:get-all', 'layouts:save', 'layouts:remove', 'layouts:clear',
  'layouts:import-legacy', 'layouts:changed', 'settings-updated'];
const generic = (list) => list.filter(c => !DEDICATED.includes(c));

describe('preload IPC allowlists', () => {
  it('send allowlist matches ipcMain.on handlers', () => {
    expect(allowlist('SEND_CHANNELS')).toEqual(generic(channels(/ipcMain\.on\(\s*'([^']+)'/g)));
  });

  it('invoke allowlist matches ipcMain.handle handlers', () => {
    expect(allowlist('INVOKE_CHANNELS')).toEqual(generic(channels(/ipcMain\.handle\(\s*'([^']+)'/g)));
  });

  it('receive allowlist matches what the main process sends', () => {
    const sent = channels(/(?:safeSend\([^,]+,|\.send\()\s*'([^']+)'/g);
    expect(allowlist('RECEIVE_CHANNELS')).toEqual(generic(sent));
  });
});
