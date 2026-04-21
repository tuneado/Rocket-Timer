/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Native-style text input prompt dialog for Electron.
 * Electron's dialog module doesn't support text input, so this creates
 * a small BrowserWindow with an input field styled to match the OS.
 * /
 */
const { BrowserWindow, ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Returns the directory used for transient prompt artefacts (preload/HTML).
 * Kept in a dedicated subfolder of the system temp dir so we can safely
 * purge stale files on startup if a previous run crashed / was force-killed.
 */
function getPromptTempDir() {
  const dir = path.join(app.getPath('temp'), 'rocket-timer-prompts');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) { /* noop */ }
  return dir;
}

/**
 * Remove stale prompt-* / prompt-preload-* files left over from a previous
 * process (crash, force quit, power loss). Safe to call on app startup.
 */
function cleanupStalePromptFiles() {
  try {
    const dir = getPromptTempDir();
    const entries = fs.readdirSync(dir);
    for (const name of entries) {
      if (!/^prompt(-preload)?-\d+\.(js|html)$/.test(name)) continue;
      try { fs.unlinkSync(path.join(dir, name)); } catch (_) { /* noop */ }
    }
  } catch (_) { /* noop */ }
}

/**
 * Show a text input prompt dialog.
 * @param {BrowserWindow} parentWindow - The parent window
 * @param {Object} options
 * @param {string} options.title - Window title
 * @param {string} options.label - Label above the input field
 * @param {string} [options.value] - Default input value
 * @param {string} [options.placeholder] - Placeholder text
 * @param {string} [options.confirmText] - Confirm button text (default: 'OK')
 * @param {string} [options.cancelText] - Cancel button text (default: 'Cancel')
 * @param {number} [options.width] - Dialog width (default: 400)
 * @param {number} [options.height] - Dialog height (default: 175)
 * @returns {Promise<string|null>} The entered text, or null if cancelled
 */
function showPrompt(parentWindow, options = {}) {
  return new Promise((resolve) => {
    const {
      title = 'Input',
      label = 'Enter value:',
      value = '',
      placeholder = '',
      confirmText = 'OK',
      cancelText = 'Cancel',
      width = 400,
      height = 175,
    } = options;

    // Generate a unique channel to avoid collisions with concurrent prompts
    const channel = `prompt-result-${Date.now()}`;

    // Write a preload script that exposes the IPC channel
    const preloadPath = path.join(getPromptTempDir(), `prompt-preload-${Date.now()}.js`);
    const preloadScript = `
      const { contextBridge, ipcRenderer } = require('electron');
      contextBridge.exposeInMainWorld('promptAPI', {
        submit: (value) => ipcRenderer.send('${channel}', value),
        cancel: () => ipcRenderer.send('${channel}', null),
      });
    `;
    fs.writeFileSync(preloadPath, preloadScript, 'utf8');

    const promptWindow = new BrowserWindow({
      width,
      height,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      modal: true,
      parent: parentWindow,
      show: false,
      title,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: preloadPath,
      },
    });

    const isDark = true; // Match your app's default theme

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 20px;
      background: ${isDark ? '#1e1e1e' : '#f5f5f5'};
      color: ${isDark ? '#cccccc' : '#333333'};
      display: flex;
      flex-direction: column;
      height: 100vh;
      user-select: none;
      -webkit-app-region: drag;
    }
    label {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      display: block;
    }
    input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid ${isDark ? '#555' : '#ccc'};
      border-radius: 6px;
      background: ${isDark ? '#2d2d2d' : '#ffffff'};
      color: ${isDark ? '#ffffff' : '#333333'};
      font-size: 14px;
      outline: none;
      -webkit-app-region: no-drag;
    }
    input:focus {
      border-color: ${isDark ? '#007aff' : '#0066cc'};
      box-shadow: 0 0 0 2px ${isDark ? 'rgba(0,122,255,0.25)' : 'rgba(0,102,204,0.25)'};
    }
    .buttons {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: auto;
      -webkit-app-region: no-drag;
    }
    button {
      padding: 6px 20px;
      border-radius: 6px;
      border: 1px solid ${isDark ? '#555' : '#ccc'};
      background: ${isDark ? '#3a3a3a' : '#e8e8e8'};
      color: ${isDark ? '#cccccc' : '#333333'};
      font-size: 13px;
      cursor: pointer;
    }
    button:hover { background: ${isDark ? '#444' : '#ddd'}; }
    button.primary {
      background: #007aff;
      color: #ffffff;
      border-color: #007aff;
    }
    button.primary:hover { background: #0066dd; }
    button.primary:disabled { opacity: 0.5; cursor: default; }
  </style>
</head>
<body>
  <label>${escapeHtml(label)}</label>
  <input
    type="text"
    id="input"
    value="${escapeHtml(value)}"
    placeholder="${escapeHtml(placeholder)}"
    autofocus
    maxlength="100"
  />
  <div class="buttons">
    <button id="cancel">${escapeHtml(cancelText)}</button>
    <button id="confirm" class="primary">${escapeHtml(confirmText)}</button>
  </div>
  <script>
    const input = document.getElementById('input');
    const confirmBtn = document.getElementById('confirm');
    const cancelBtn = document.getElementById('cancel');

    input.select();

    function updateConfirmState() {
      confirmBtn.disabled = input.value.trim().length === 0;
    }
    updateConfirmState();
    input.addEventListener('input', updateConfirmState);

    confirmBtn.addEventListener('click', () => {
      if (input.value.trim()) {
        window.promptAPI.submit(input.value.trim());
      }
    });

    cancelBtn.addEventListener('click', () => {
      window.promptAPI.cancel();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.promptAPI.submit(input.value.trim());
      }
      if (e.key === 'Escape') {
        window.promptAPI.cancel();
      }
    });
  </script>
</body>
</html>`;

    // Clean up temp preload file on close
    function cleanup() {
      try { fs.unlinkSync(preloadPath); } catch {}
    }

    let resolved = false;

    ipcMain.once(channel, (event, result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
      promptWindow.destroy();
      cleanup();
    });

    promptWindow.on('closed', () => {
      ipcMain.removeAllListeners(channel);
      cleanup();
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });

    // Write HTML to temp file (data: URLs don't support nodeIntegration/preload in Electron 28+)
    const htmlPath = path.join(getPromptTempDir(), `prompt-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    promptWindow.loadFile(htmlPath);
    promptWindow.once('ready-to-show', () => {
      promptWindow.show();
      // Clean up temp HTML file after load
      try { fs.unlinkSync(htmlPath); } catch {}
    });

    // Remove menu bar from prompt
    promptWindow.setMenuBarVisibility(false);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { showPrompt, cleanupStalePromptFiles };
