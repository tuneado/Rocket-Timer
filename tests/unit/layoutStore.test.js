import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import LayoutStore from '../../src/main/layoutStore.js';

const layout = (name) => ({ name, resolution: { width: 1920, height: 1080 } });

describe('LayoutStore', () => {
  let dir;
  let file;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocket-layouts-'));
    file = path.join(dir, 'layouts.json');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('starts empty when no file exists', () => {
    expect(new LayoutStore(file).getAll()).toEqual({});
  });

  it('saves layouts to disk and loads them back', () => {
    const store = new LayoutStore(file);
    expect(store.save('stage', layout('Stage'))).toBe(true);

    const reloaded = new LayoutStore(file);
    expect(reloaded.getAll()).toEqual({ stage: layout('Stage') });
    expect(JSON.parse(fs.readFileSync(file, 'utf8')).version).toBe(1);
  });

  it('rejects invalid ids and data', () => {
    const store = new LayoutStore(file);
    expect(store.save('', layout('A'))).toBe(false);
    expect(store.save('a', null)).toBe(false);
    expect(fs.existsSync(file)).toBe(false);
  });

  it('removes a layout and reports missing ids', () => {
    const store = new LayoutStore(file);
    store.save('a', layout('A'));
    store.save('b', layout('B'));
    expect(store.remove('a')).toBe(true);
    expect(store.remove('missing')).toBe(false);
    expect(Object.keys(new LayoutStore(file).getAll())).toEqual(['b']);
  });

  it('clears all layouts', () => {
    const store = new LayoutStore(file);
    store.save('a', layout('A'));
    expect(store.clear()).toBe(true);
    expect(new LayoutStore(file).getAll()).toEqual({});
  });

  it('imports legacy layouts without overwriting existing ids', () => {
    const store = new LayoutStore(file);
    store.save('a', layout('Kept'));
    expect(store.importLegacy({ a: layout('Old A'), b: layout('Old B') })).toBe(true);
    expect(store.getAll()).toEqual({ a: layout('Kept'), b: layout('Old B') });
  });

  it('keeps a corrupt file aside instead of overwriting it', () => {
    fs.writeFileSync(file, '{ not json');
    const store = new LayoutStore(file);
    expect(store.getAll()).toEqual({});
    const backups = fs.readdirSync(dir).filter(f => f.startsWith('layouts.json.corrupt-'));
    expect(backups).toHaveLength(1);
  });

  it('leaves the current set unchanged when a write fails', () => {
    const store = new LayoutStore(file);
    store.save('a', layout('A'));
    // A directory where the file should be makes the write fail
    store.filePath = dir;
    expect(store.save('b', layout('B'))).toBe(false);
    expect(Object.keys(store.getAll())).toEqual(['a']);
  });
});
