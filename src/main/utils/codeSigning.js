/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * macOS code signing check. Installing an update on macOS (Squirrel.Mac)
 * requires an app signed with an Apple Developer ID; ad-hoc or unsigned
 * builds download the update and then fail to install it.
 */
const { execFile } = require('child_process');
const path = require('path');

/**
 * Team ID from `codesign -dv` output, or null when there is none
 * ("TeamIdentifier=not set" for ad-hoc builds, no line when unsigned)
 */
function parseTeamIdentifier(codesignOutput) {
  const match = /^TeamIdentifier=(.+)$/m.exec(codesignOutput || '');
  const team = match && match[1].trim();
  return team && team !== 'not set' ? team : null;
}

/**
 * Whether the running macOS app is signed with a Developer ID (has a team).
 * @param {object} [deps]
 * @param {string} [deps.execPath] - .../Name.app/Contents/MacOS/Name
 * @param {Function} [deps.run] - execFile-compatible runner
 * @returns {Promise<boolean>}
 */
function hasDeveloperIdSignature({ execPath = process.execPath, run = execFile } = {}) {
  const appBundle = path.resolve(execPath, '..', '..', '..');
  return new Promise((resolve) => {
    // codesign prints the details on stderr; it exits non-zero for unsigned code
    run('codesign', ['-dv', appBundle], (error, stdout, stderr) => {
      resolve(Boolean(parseTeamIdentifier(`${stdout || ''}\n${stderr || ''}`)));
    });
  });
}

module.exports = { parseTeamIdentifier, hasDeveloperIdSignature };
