/**
 * Auto-Update Manager
 *
 * Handles automatic updates via GitHub Releases
 * Simple approach: Check for updates on startup, notify user, download in background
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog, BrowserWindow } = require('electron');
const log = require('electron-log');

const CHECK_TIMEOUT_MS = 15000;

class UpdateManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.progressWindow = null;
    this.checkingWindow = null;
    this.checkTimeout = null;
    this.setupLogging();
    this.setupAutoUpdater();
  }

  setupLogging() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
  }

  // ---------------------------------------------------------------------------
  // Checking modal (spinner) — dismissible via ESC, click-outside, or timeout
  // ---------------------------------------------------------------------------

  showCheckingModal() {
    if (this.checkingWindow) return;

    this.checkingWindow = new BrowserWindow({
      width: 300,
      height: 110,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      show: false,
      parent: this.mainWindow,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.checkingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1e1e1e;
    color: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    height: 100vh;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #333;
    user-select: none;
  }
  .spinner {
    width: 22px; height: 22px;
    border: 3px solid #333;
    border-top-color: #4a9eff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .label { font-size: 14px; font-weight: 500; }
</style>
</head>
<body>
  <div class="spinner"></div>
  <div class="label">Checking for updates...</div>
  <script>document.addEventListener('keydown', e => { if (e.key === 'Escape') window.close(); });</script>
</body>
</html>
    `)}`);

    // If the user closes the window (ESC or otherwise), cancel the check
    this.checkingWindow.on('closed', () => {
      this.checkingWindow = null;
      this._manualCheck = false;
      this.clearCheckTimeout();
    });

    // Dismiss when clicking outside the modal
    this.checkingWindow.on('blur', () => {
      this.closeCheckingModal();
    });

    this.checkingWindow.once('ready-to-show', () => {
      if (this.checkingWindow && !this.checkingWindow.isDestroyed()) {
        this.checkingWindow.show();
      }
    });

    // Timeout — if the check takes too long, close and notify
    this.checkTimeout = setTimeout(() => {
      log.warn('Update check timed out');
      const wasManual = this._manualCheck;
      this.closeCheckingModal();
      if (wasManual) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'warning',
          title: 'Update Check',
          message: 'Could not reach update server',
          detail: 'Please check your internet connection and try again.',
          buttons: ['OK']
        });
      }
    }, CHECK_TIMEOUT_MS);
  }

  clearCheckTimeout() {
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
      this.checkTimeout = null;
    }
  }

  closeCheckingModal() {
    this.clearCheckTimeout();
    if (this.checkingWindow && !this.checkingWindow.isDestroyed()) {
      this.checkingWindow.close(); // triggers 'closed' handler above
    }
  }

  // ---------------------------------------------------------------------------
  // Download progress window
  // ---------------------------------------------------------------------------

  createProgressWindow() {
    if (this.progressWindow) return;

    this.progressWindow = new BrowserWindow({
      width: 380,
      height: 130,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      fullscreenable: false,
      frame: false,
      show: false,
      parent: this.mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.progressWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1e1e1e;
    color: #e0e0e0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #333;
    user-select: none;
  }
  .title { font-size: 14px; font-weight: 600; margin-bottom: 16px; }
  .bar-container {
    width: 100%; height: 6px;
    background: #333; border-radius: 3px;
    overflow: hidden; margin-bottom: 12px;
  }
  .bar {
    height: 100%; width: 0%;
    background: linear-gradient(90deg, #4a9eff, #6cb4ff);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  .percent { font-size: 12px; color: #888; }
</style>
</head>
<body>
  <div class="title">Downloading update...</div>
  <div class="bar-container"><div class="bar" id="bar"></div></div>
  <div class="percent" id="percent">0%</div>
</body>
</html>
    `)}`);

    this.progressWindow.once('ready-to-show', () => {
      this.progressWindow.show();
    });
  }

  updateProgress(percent) {
    if (this.progressWindow && !this.progressWindow.isDestroyed()) {
      this.progressWindow.webContents.executeJavaScript(`
        document.getElementById('bar').style.width = '${percent}%';
        document.getElementById('percent').textContent = '${percent}%';
      `).catch(() => {});
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setProgressBar(percent / 100);
    }
  }

  closeProgressWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setProgressBar(-1);
    }
    if (this.progressWindow && !this.progressWindow.isDestroyed()) {
      this.progressWindow.close();
      this.progressWindow = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Auto-updater event handlers
  // ---------------------------------------------------------------------------

  setupAutoUpdater() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info.version);
      this.closeCheckingModal();
      this._manualCheck = false;

      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `Rocket Timer v${info.version} is available`,
        detail: 'Would you like to download and install it?',
        buttons: ['Download & Install', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          this.createProgressWindow();
          autoUpdater.downloadUpdate();
        }
      });
    });

    autoUpdater.on('update-not-available', () => {
      log.info('App is up to date');
      const wasManual = this._manualCheck;
      this.closeCheckingModal();
      this._manualCheck = false;

      if (wasManual) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'No Updates Available',
          message: 'You\u2019re up to date!',
          detail: `Rocket Timer ${require('../../package.json').version} is the latest version.`,
          buttons: ['OK']
        });
      }
    });

    autoUpdater.on('download-progress', (progressInfo) => {
      const percent = Math.round(progressInfo.percent);
      log.info(`Download progress: ${percent}%`);
      this.updateProgress(percent);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info.version);
      this.closeProgressWindow();

      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded!',
        detail: `Rocket Timer v${info.version} is ready. Restart now to apply the update.`,
        buttons: ['Restart Now', 'Restart Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });

    autoUpdater.on('error', (error) => {
      log.error('Update error:', error);
      const wasManual = this._manualCheck;
      this.closeCheckingModal();
      this.closeProgressWindow();
      this._manualCheck = false;

      if (wasManual) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'error',
          title: 'Update Error',
          message: 'Failed to check for updates',
          detail: 'Please try again later or download manually from GitHub.',
          buttons: ['OK']
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  checkForUpdates() {
    if (!app.isPackaged) {
      log.info('Skipping auto update check in development mode');
      return;
    }
    log.info('Checking for updates...');
    autoUpdater.checkForUpdates();
  }

  checkForUpdatesManual() {
    if (!app.isPackaged) {
      log.info('Update check skipped — app is not packaged');
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Development Mode',
        message: 'Update checking is not available',
        detail: 'Auto-updates only work in the packaged app. Build with "npm run dist" to test updates.',
        buttons: ['OK']
      });
      return;
    }

    log.info('Manual update check triggered');
    this._manualCheck = true;
    this.showCheckingModal();

    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Update check failed:', err);
      this.closeCheckingModal();
      this._manualCheck = false;
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'Update Error',
        message: 'Failed to check for updates',
        detail: 'Please try again later or download manually from GitHub.',
        buttons: ['OK']
      });
    });
  }
}

module.exports = UpdateManager;
