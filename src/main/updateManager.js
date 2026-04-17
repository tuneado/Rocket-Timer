/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Auto-Update Manager
 * Handles automatic updates via GitHub Releases
 * Simple approach: Check for updates on startup, notify user, download in background
 * /
 */
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');

class UpdateManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupLogging();
    this.setupAutoUpdater();
  }

  setupLogging() {
    // Configure logging for updates
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
  }

  setupAutoUpdater() {
    // Don't auto-download updates - let user decide
    autoUpdater.autoDownload = false;
    
    // Don't install immediately - wait for user to quit
    autoUpdater.autoInstallOnAppQuit = true;

    // Event: Update is available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info.version);
      this._manualCheck = false;
      
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: 'Would you like to download it now? The update will install when you quit the app.',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          // User clicked "Download"
          autoUpdater.downloadUpdate();
          
          // Notify renderer that download started
          this.sendStatus('downloading', 'Downloading update...', 0);
        }
      });
    });

    // Event: No updates available
    autoUpdater.on('update-not-available', (info) => {
      log.info('App is up to date');
      
      if (this._manualCheck) {
        this._manualCheck = false;
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'No Updates Available',
          message: 'You\u2019re up to date!',
          detail: `Rocket Timer ${require('../../package.json').version} is the latest version.`,
          buttons: ['OK']
        });
      }
    });

    // Event: Download progress
    autoUpdater.on('download-progress', (progressInfo) => {
      const percent = Math.round(progressInfo.percent);
      log.info(`Download progress: ${percent}%`);
      
      this.sendStatus('downloading', `Downloading update: ${percent}%`, percent);
    });

    // Event: Update downloaded and ready
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info.version);
      
      this.sendStatus('ready', `Update ${info.version} ready to install`, 100);
      
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded successfully!',
        detail: 'The update will be installed when you restart the app. Restart now?',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          this.installAndRestart();
        }
      });
    });

    // Event: Error during update
    autoUpdater.on('error', (error) => {
      log.error('Update error:', error);
      
      this.sendStatus('error', 'Update failed');
      
      if (this._manualCheck) {
        this._manualCheck = false;
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

  /**
   * Check for updates
   * Call this when the app starts
   */
  checkForUpdates() {
    // Only check for updates in production (not during development)
    if (process.env.NODE_ENV === 'development') {
      log.info('Skipping update check in development mode');
      return;
    }

    log.info('Checking for updates...');
    autoUpdater.checkForUpdates();
  }

  /**
   * Send update status to renderer
   */
  sendStatus(status, message, progress) {
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-status', { status, message, progress });
      }
    } catch (_) {
      // Window may be destroyed during quit
    }
  }

  /**
   * Install update and force restart
   */
  installAndRestart() {
    log.info('Installing update and restarting...');
    this.sendStatus('installing', 'Installing update...');
    // isSilent=false (show installer), isForceRunAfter=true (relaunch app after install)
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
  }

  /**
   * Manual update check (e.g., from menu)
   */
  checkForUpdatesManual() {
    log.info('Manual update check triggered');
    this._manualCheck = true;
    
    try {
      const result = autoUpdater.checkForUpdates();
      if (result && result.catch) {
        result.catch((err) => {
          log.error('Update check promise rejected:', err);
          if (this._manualCheck) {
            this._manualCheck = false;
            dialog.showMessageBox(this.mainWindow, {
              type: 'info',
              title: 'Update Check',
              message: 'Unable to check for updates',
              detail: 'Update checking is not available in development mode. It will work in the packaged app.',
              buttons: ['OK']
            });
          }
        });
      }
    } catch (err) {
      log.error('Update check failed:', err);
      this._manualCheck = false;
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Check',
        message: 'Unable to check for updates',
        detail: 'Update checking is not available in development mode. It will work in the packaged app.',
        buttons: ['OK']
      });
    }
  }
}

module.exports = UpdateManager;
