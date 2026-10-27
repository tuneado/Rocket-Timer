/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * macOS camera access. Electron hands pages a camera stream without asking
 * macOS first; while the app has no camera permission, that stream stays
 * "live" but never delivers a frame (black preview, no error). So the first
 * time a page asks for the camera, ask macOS (system prompt), and refuse the
 * request if access is denied so the page reports an error instead.
 */

/**
 * Permission request handler for session.setPermissionRequestHandler.
 * Everything other than the camera on macOS is granted, as Electron does
 * without a handler.
 * @param {object} deps
 * @param {object} deps.systemPreferences - Electron's systemPreferences
 * @param {object} deps.log - logger with warn()
 * @param {string} [deps.platform]
 */
function createPermissionRequestHandler({ systemPreferences, log, platform = process.platform }) {
  return async (webContents, permission, callback, details = {}) => {
    const wantsCamera = permission === 'media' && (details.mediaTypes || []).includes('video');
    if (platform !== 'darwin' || !wantsCamera) return callback(true);

    try {
      let status = systemPreferences.getMediaAccessStatus('camera');
      if (status === 'not-determined') {
        status = (await systemPreferences.askForMediaAccess('camera')) ? 'granted' : 'denied';
      }
      if (status !== 'granted') {
        log.warn(`Camera access is ${status}: allow Rocket Timer in System Settings > Privacy & Security > Camera`);
      }
      callback(status === 'granted');
    } catch (error) {
      // Unknown state: behave as before (grant) rather than block the camera
      log.warn('Could not check camera access:', error && error.message);
      callback(true);
    }
  };
}

module.exports = { createPermissionRequestHandler };
