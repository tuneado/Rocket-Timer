/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Project Storage Utilities
 * Handles file I/O for projects including reading, writing, and backup management.
 * /
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { app } = require('electron');

class ProjectStorage {
  constructor() {
    this.projectsDir = path.join(app.getPath('userData'), 'projects');
    this.manifestPath = path.join(this.projectsDir, 'manifest.json');
    this.projectsSubdir = path.join(this.projectsDir, 'projects');
    this.backupsDir = path.join(this.projectsDir, 'backups');
    this.maxBackups = 5;
  }

  /**
   * Initialize storage directories
   */
  async initialize() {
    try {
      await fs.mkdir(this.projectsDir, { recursive: true });
      await fs.mkdir(this.projectsSubdir, { recursive: true });
      await fs.mkdir(this.backupsDir, { recursive: true });
      
      // Create manifest if it doesn't exist
      if (!fsSync.existsSync(this.manifestPath)) {
        await this.saveManifest({
          currentProjectId: null,
          defaultProjectId: null,
          projects: []
        });
      }
      
      console.log('✅ Project storage initialized:', this.projectsDir);
      return true;
    } catch (error) {
      console.error('🚨 Failed to initialize project storage:', error);
      throw error;
    }
  }

  /**
   * Read manifest file
   */
  async readManifest() {
    try {
      const data = await fs.readFile(this.manifestPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Manifest doesn't exist, return empty
        return {
          currentProjectId: null,
          defaultProjectId: null,
          projects: []
        };
      }
      throw error;
    }
  }

  /**
   * Save manifest file
   */
  async saveManifest(manifest) {
    try {
      await fs.writeFile(
        this.manifestPath,
        JSON.stringify(manifest, null, 2),
        'utf8'
      );
      return true;
    } catch (error) {
      console.error('🚨 Failed to save manifest:', error);
      throw error;
    }
  }

  /**
   * Read project file
   */
  async readProject(projectId) {
    try {
      const projectPath = path.join(this.projectsSubdir, `${projectId}.json`);
      const data = await fs.readFile(projectPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Project not found: ${projectId}`);
      }
      throw error;
    }
  }

  /**
   * Save project file
   */
  async saveProject(project) {
    try {
      const projectPath = path.join(this.projectsSubdir, `${project.id}.json`);
      await fs.writeFile(
        projectPath,
        JSON.stringify(project.toJSON(), null, 2),
        'utf8'
      );
      return true;
    } catch (error) {
      console.error('🚨 Failed to save project:', error);
      throw error;
    }
  }

  /**
   * Delete project file
   */
  async deleteProject(projectId) {
    try {
      const projectPath = path.join(this.projectsSubdir, `${projectId}.json`);
      await fs.unlink(projectPath);
      
      // Also delete project assets folder if it exists
      const assetsPath = path.join(this.projectsSubdir, `${projectId}-assets`);
      if (fsSync.existsSync(assetsPath)) {
        await fs.rm(assetsPath, { recursive: true, force: true });
      }
      
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // Already deleted
      }
      console.error('🚨 Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * Create backup of project before destructive operation
   */
  async createBackup(projectId, reason = 'manual') {
    try {
      const projectPath = path.join(this.projectsSubdir, `${projectId}.json`);
      
      if (!fsSync.existsSync(projectPath)) {
        return null; // Nothing to backup
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `${projectId}_${timestamp}_${reason}.json`;
      const backupPath = path.join(this.backupsDir, backupFilename);
      
      await fs.copyFile(projectPath, backupPath);
      
      // Clean up old backups for this project
      await this.cleanupBackups(projectId);
      
      console.log(`💾 Backup created: ${backupFilename}`);
      return backupPath;
    } catch (error) {
      console.error('🚨 Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups, keeping only the most recent ones
   */
  async cleanupBackups(projectId) {
    try {
      const files = await fs.readdir(this.backupsDir);
      const projectBackups = files
        .filter(f => f.startsWith(projectId))
        .map(f => ({
          name: f,
          path: path.join(this.backupsDir, f),
          stat: fsSync.statSync(path.join(this.backupsDir, f))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime); // Most recent first
      
      // Keep only the most recent N backups
      const toDelete = projectBackups.slice(this.maxBackups);
      
      for (const backup of toDelete) {
        await fs.unlink(backup.path);
        console.log(`🗑️  Deleted old backup: ${backup.name}`);
      }
    } catch (error) {
      console.error('🚨 Failed to cleanup backups:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * List all backups for a project
   */
  async listBackups(projectId) {
    try {
      const files = await fs.readdir(this.backupsDir);
      return files
        .filter(f => f.startsWith(projectId))
        .map(f => ({
          name: f,
          path: path.join(this.backupsDir, f),
          stat: fsSync.statSync(path.join(this.backupsDir, f))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime);
    } catch (error) {
      console.error('🚨 Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Restore project from backup
   */
  async restoreFromBackup(backupPath, projectId) {
    try {
      const projectPath = path.join(this.projectsSubdir, `${projectId}.json`);
      await fs.copyFile(backupPath, projectPath);
      console.log(`♻️  Restored project from backup: ${path.basename(backupPath)}`);
      return true;
    } catch (error) {
      console.error('🚨 Failed to restore from backup:', error);
      throw error;
    }
  }

  /**
   * Get project assets directory
   */
  getProjectAssetsDir(projectId) {
    return path.join(this.projectsSubdir, `${projectId}-assets`);
  }

  /**
   * Create assets directory for project
   */
  async createAssetsDir(projectId) {
    const assetsDir = this.getProjectAssetsDir(projectId);
    await fs.mkdir(assetsDir, { recursive: true });
    return assetsDir;
  }

  /**
   * Copy media file to project assets
   */
  async copyMediaFile(sourcePath, projectId, filename) {
    try {
      const assetsDir = await this.createAssetsDir(projectId);
      const destPath = path.join(assetsDir, filename);
      await fs.copyFile(sourcePath, destPath);
      return destPath;
    } catch (error) {
      console.error('🚨 Failed to copy media file:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const manifest = await this.readManifest();
      const files = await fs.readdir(this.projectsSubdir, { withFileTypes: true });
      
      let totalSize = 0;
      for (const file of files) {
        const filePath = path.join(this.projectsSubdir, file.name);
        if (file.isFile()) {
          const stat = await fs.stat(filePath);
          totalSize += stat.size;
        } else if (file.isDirectory()) {
          // Calculate directory size recursively
          totalSize += await this.getDirectorySize(filePath);
        }
      }
      
      return {
        projectCount: manifest.projects.length,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        storageDirectory: this.projectsDir
      };
    } catch (error) {
      console.error('🚨 Failed to get storage stats:', error);
      return null;
    }
  }

  /**
   * Get directory size recursively
   */
  async getDirectorySize(dirPath) {
    let size = 0;
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        if (file.isFile()) {
          const stat = await fs.stat(filePath);
          size += stat.size;
        } else if (file.isDirectory()) {
          size += await this.getDirectorySize(filePath);
        }
      }
    } catch (error) {
      console.error(`Error calculating directory size for ${dirPath}:`, error);
    }
    return size;
  }
}

module.exports = ProjectStorage;
