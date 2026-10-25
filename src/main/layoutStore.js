/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Layout Store - persists custom layouts to a JSON file in userData.
 * Renderer windows keep a cached copy via IPC (see setupLayoutStoreHandlers).
 */
const fs = require('fs');
const path = require('path');

class LayoutStore {
  /**
   * @param {string} filePath - e.g. <userData>/layouts.json
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.layouts = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        if (data && typeof data.layouts === 'object' && data.layouts !== null) {
          return data.layouts;
        }
      }
    } catch (error) {
      console.error('Error loading custom layouts:', error);
      // Keep the unreadable file so the next save doesn't destroy it
      try {
        fs.renameSync(this.filePath, `${this.filePath}.corrupt-${Date.now()}`);
      } catch {
        // Nothing more we can do; start empty
      }
    }
    return {};
  }

  /**
   * Write `layouts` to disk; on success it becomes the current set
   */
  _write(layouts) {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify({ version: 1, layouts }, null, 2), 'utf8');
      this.layouts = layouts;
      return true;
    } catch (error) {
      console.error('Error saving custom layouts:', error);
      return false;
    }
  }

  getAll() {
    return this.layouts;
  }

  save(id, layoutData) {
    if (typeof id !== 'string' || !id || !layoutData || typeof layoutData !== 'object') {
      return false;
    }
    return this._write({ ...this.layouts, [id]: layoutData });
  }

  remove(id) {
    if (!Object.prototype.hasOwnProperty.call(this.layouts, id)) return false;
    const next = { ...this.layouts };
    delete next[id];
    return this._write(next);
  }

  clear() {
    return this._write({});
  }

  /**
   * Merge layouts from the old renderer localStorage. Existing ids are kept.
   * @returns {boolean} True if the merged set was saved
   */
  importLegacy(legacyLayouts) {
    if (!legacyLayouts || typeof legacyLayouts !== 'object') return false;
    const next = { ...this.layouts };
    for (const [id, layoutData] of Object.entries(legacyLayouts)) {
      if (!Object.prototype.hasOwnProperty.call(next, id) && layoutData && typeof layoutData === 'object') {
        next[id] = layoutData;
      }
    }
    return this._write(next);
  }
}

module.exports = LayoutStore;
