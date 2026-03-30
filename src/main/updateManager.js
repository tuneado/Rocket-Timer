/**
 * Auto-Update Manager
 *
 * Handles automatic updates via GitHub Releases using a single update window
 * that transitions through states: checking → found → downloading → ready
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog, BrowserWindow, ipcMain } = require('electron');
const log = require('electron-log');

const CHECK_TIMEOUT_MS = 15000;

class UpdateManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.updateWindow = null;
    this.checkTimeout = null;
    this.setupLogging();
    this.setupIPC();
    this.setupAutoUpdater();
  }

  setupLogging() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
  }

  // ---------------------------------------------------------------------------
  // IPC handlers for update window button clicks
  // ---------------------------------------------------------------------------

  setupIPC() {
    ipcMain.on('update-action', (event, action) => {
      switch (action) {
        case 'download':
          this.sendToWindow('state', 'downloading');
          autoUpdater.downloadUpdate();
          break;
        case 'restart':
          autoUpdater.quitAndInstall();
          break;
        case 'later':
        case 'dismiss':
          this.closeUpdateWindow();
          break;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Single update window — transitions through states
  // ---------------------------------------------------------------------------

  showUpdateWindow(initialState) {
    if (this.updateWindow && !this.updateWindow.isDestroyed()) {
      this.sendToWindow('state', initialState);
      this.updateWindow.show();
      return;
    }

    this.updateWindow = new BrowserWindow({
      width: 420,
      height: 220,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      show: false,
      parent: this.mainWindow,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false  // Allow ipcRenderer access via preload-like pattern
      }
    });

    const html = this.getUpdateWindowHTML();
    this.updateWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    this.updateWindow.on('closed', () => {
      this.updateWindow = null;
      this._manualCheck = false;
      this.clearCheckTimeout();
    });

    this.updateWindow.once('ready-to-show', () => {
      if (this.updateWindow && !this.updateWindow.isDestroyed()) {
        this.updateWindow.show();
        this.sendToWindow('state', initialState);
      }
    });
  }

  sendToWindow(channel, data) {
    if (this.updateWindow && !this.updateWindow.isDestroyed()) {
      this.updateWindow.webContents.send(channel, data);
    }
  }

  closeUpdateWindow() {
    this.clearCheckTimeout();
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setProgressBar(-1);
    }
    if (this.updateWindow && !this.updateWindow.isDestroyed()) {
      this.updateWindow.close();
    }
  }

  clearCheckTimeout() {
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
      this.checkTimeout = null;
    }
  }

  getUpdateWindowHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1e1e1e;
    color: #e0e0e0;
    height: 100vh;
    padding: 28px 32px;
    border-radius: 12px;
    border: 1px solid #333;
    user-select: none;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .icon.checking { background: #2a3a4a; }
  .icon.available { background: #1a3a1a; }
  .icon.downloading { background: #2a3a4a; }
  .icon.ready { background: #1a3a1a; }
  .icon.uptodate { background: #2a3a4a; }
  .icon.error { background: #3a1a1a; }
  .title { font-size: 16px; font-weight: 600; }
  .subtitle { font-size: 13px; color: #888; margin-top: 2px; }

  .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .message { font-size: 13px; color: #aaa; line-height: 1.5; }

  .progress-area { margin: 8px 0 4px; }
  .bar-bg {
    width: 100%; height: 6px;
    background: #333; border-radius: 3px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%; width: 0%;
    background: linear-gradient(90deg, #4a9eff, #6cb4ff);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  .progress-text { font-size: 12px; color: #666; margin-top: 6px; }

  .spinner-inline {
    width: 16px; height: 16px;
    border: 2px solid #333;
    border-top-color: #4a9eff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
    vertical-align: middle;
    margin-right: 8px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: auto;
    padding-top: 16px;
  }
  .btn {
    padding: 7px 18px;
    border-radius: 6px;
    border: none;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-primary {
    background: #4a9eff;
    color: #fff;
  }
  .btn-primary:hover { background: #3a8eef; }
  .btn-secondary {
    background: #333;
    color: #ccc;
  }
  .btn-secondary:hover { background: #444; }

  .view { display: none; }
  .view.active { display: flex; flex-direction: column; height: 100%; }
</style>
</head>
<body>

  <!-- CHECKING STATE -->
  <div class="view" id="view-checking">
    <div class="header">
      <div class="icon checking"><div class="spinner-inline" style="margin:0;width:20px;height:20px;"></div></div>
      <div>
        <div class="title">Checking for updates</div>
        <div class="subtitle">Contacting update server...</div>
      </div>
    </div>
    <div class="content">
      <div class="message">This should only take a moment.</div>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" onclick="send('dismiss')">Cancel</button>
    </div>
  </div>

  <!-- UPDATE AVAILABLE -->
  <div class="view" id="view-available">
    <div class="header">
      <div class="icon available">&#x2728;</div>
      <div>
        <div class="title" id="available-title">New version available</div>
        <div class="subtitle" id="available-version"></div>
      </div>
    </div>
    <div class="content">
      <div class="message">A new version is ready to download. The app will restart to apply the update.</div>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" onclick="send('later')">Later</button>
      <button class="btn btn-primary" onclick="send('download')">Download & Install</button>
    </div>
  </div>

  <!-- DOWNLOADING -->
  <div class="view" id="view-downloading">
    <div class="header">
      <div class="icon downloading"><div class="spinner-inline" style="margin:0;width:20px;height:20px;"></div></div>
      <div>
        <div class="title">Downloading update</div>
        <div class="subtitle" id="dl-subtitle">Starting download...</div>
      </div>
    </div>
    <div class="content">
      <div class="progress-area">
        <div class="bar-bg"><div class="bar-fill" id="bar"></div></div>
        <div class="progress-text" id="dl-detail"></div>
      </div>
      <div class="message" style="margin-top:8px;">Please don't quit the app.</div>
    </div>
  </div>

  <!-- READY TO INSTALL -->
  <div class="view" id="view-ready">
    <div class="header">
      <div class="icon ready">&#x2705;</div>
      <div>
        <div class="title">Update ready!</div>
        <div class="subtitle" id="ready-version"></div>
      </div>
    </div>
    <div class="content">
      <div class="message">The update has been downloaded. Restart now to apply it, or it will install next time you open the app.</div>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" onclick="send('later')">Restart Later</button>
      <button class="btn btn-primary" onclick="send('restart')">Restart Now</button>
    </div>
  </div>

  <!-- UP TO DATE -->
  <div class="view" id="view-uptodate">
    <div class="header">
      <div class="icon uptodate">&#x2714;&#xFE0F;</div>
      <div>
        <div class="title">You're up to date!</div>
        <div class="subtitle" id="uptodate-version"></div>
      </div>
    </div>
    <div class="content">
      <div class="message">You're running the latest version of Rocket Timer.</div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="send('dismiss')">OK</button>
    </div>
  </div>

  <!-- ERROR -->
  <div class="view" id="view-error">
    <div class="header">
      <div class="icon error">&#x26A0;&#xFE0F;</div>
      <div>
        <div class="title">Update failed</div>
        <div class="subtitle" id="error-detail">Could not check for updates</div>
      </div>
    </div>
    <div class="content">
      <div class="message">Please check your internet connection and try again, or download manually from GitHub.</div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="send('dismiss')">OK</button>
    </div>
  </div>

<script>
  const { ipcRenderer } = require('electron');

  function send(action) {
    ipcRenderer.send('update-action', action);
  }

  function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + id);
    if (el) el.classList.add('active');
  }

  ipcRenderer.on('state', (event, data) => {
    if (typeof data === 'string') {
      showView(data);
    } else if (data && data.state) {
      showView(data.state);
      if (data.version) {
        const els = document.querySelectorAll('#available-version, #ready-version');
        els.forEach(el => el.textContent = 'Version ' + data.version);
      }
      if (data.currentVersion) {
        document.getElementById('uptodate-version').textContent = 'Version ' + data.currentVersion;
      }
      if (data.error) {
        document.getElementById('error-detail').textContent = data.error;
      }
    }
  });

  ipcRenderer.on('download-progress', (event, data) => {
    document.getElementById('bar').style.width = data.percent + '%';
    document.getElementById('dl-subtitle').textContent = data.percent + '% downloaded';
    if (data.speed) {
      document.getElementById('dl-detail').textContent = data.speed + ' \u2022 ' + data.remaining;
    } else {
      document.getElementById('dl-detail').textContent = data.percent + '%';
    }
  });

  // ESC to close during non-critical states
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') send('dismiss');
  });
</script>
</body>
</html>`;
  }

  // ---------------------------------------------------------------------------
  // Auto-updater event handlers
  // ---------------------------------------------------------------------------

  setupAutoUpdater() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info.version);
      this.clearCheckTimeout();
      this._manualCheck = false;
      this.showUpdateWindow({ state: 'available', version: info.version });
    });

    autoUpdater.on('update-not-available', () => {
      log.info('App is up to date');
      this.clearCheckTimeout();
      const wasManual = this._manualCheck;
      this._manualCheck = false;

      if (wasManual) {
        const currentVersion = require('../../package.json').version;
        this.showUpdateWindow({ state: 'uptodate', currentVersion });
      } else {
        this.closeUpdateWindow();
      }
    });

    autoUpdater.on('download-progress', (progressInfo) => {
      const percent = Math.round(progressInfo.percent);
      const speed = progressInfo.bytesPerSecond
        ? this.formatBytes(progressInfo.bytesPerSecond) + '/s'
        : '';
      const remaining = progressInfo.transferred && progressInfo.total
        ? `${this.formatBytes(progressInfo.transferred)} / ${this.formatBytes(progressInfo.total)}`
        : '';

      log.info(`Download progress: ${percent}%`);
      this.sendToWindow('download-progress', { percent, speed, remaining });

      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.setProgressBar(percent / 100);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info.version);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.setProgressBar(-1);
      }
      this.showUpdateWindow({ state: 'ready', version: info.version });
    });

    autoUpdater.on('error', (error) => {
      log.error('Update error:', error);
      this.clearCheckTimeout();
      const wasManual = this._manualCheck;
      this._manualCheck = false;

      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.setProgressBar(-1);
      }

      if (wasManual) {
        this.showUpdateWindow({ state: 'error', error: error.message || 'Unknown error' });
      } else {
        this.closeUpdateWindow();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
    this.showUpdateWindow('checking');

    // Timeout if server doesn't respond
    this.checkTimeout = setTimeout(() => {
      log.warn('Update check timed out');
      this._manualCheck = false;
      this.showUpdateWindow({ state: 'error', error: 'Could not reach the update server. Check your internet connection.' });
    }, CHECK_TIMEOUT_MS);

    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Update check failed:', err);
      this.clearCheckTimeout();
      this._manualCheck = false;
      this.showUpdateWindow({ state: 'error', error: err.message || 'Connection failed' });
    });
  }
}

module.exports = UpdateManager;
