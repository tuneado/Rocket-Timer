/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Project Manager
 * Manages projects lifecycle: create, load, save, delete, import, export.
 * Enforces project limits and handles unsaved changes tracking.
 * /
 */
const Project = require('./models/Project');
const ProjectStorage = require('./utils/projectStorage');
const SettingsManager = require('./settingsManager');

class ProjectManager {
  constructor(settingsManager) {
    this.storage = new ProjectStorage();
    this.settingsManager = settingsManager || new SettingsManager();
    this.currentProject = null;
    this.hasUnsavedChanges = false;
    this._isLoadingProject = false;
    this.maxProjects = 10;
    this.initialized = false;
  }

  /**
   * Initialize project manager
   */
  async initialize() {
    try {
      await this.storage.initialize();
      
      // Load manifest
      const manifest = await this.storage.readManifest();
      
      // If no projects exist, create default project
      if (manifest.projects.length === 0) {
        console.log('📄 No projects found, creating default project');
        const defaultProject = await this.createProject('Default', true);
        await this.loadProject(defaultProject.id);
      } else {
        // Prefer the last-opened project so users resume where they left off.
        // Fallback order: currentProjectId → defaultProjectId → first project.
        const candidateIds = [
          manifest.currentProjectId,
          manifest.defaultProjectId,
          manifest.projects[0].id
        ].filter(Boolean);

        let loaded = false;
        for (const id of candidateIds) {
          // Guard: ensure the candidate still exists in the manifest.
          if (!manifest.projects.some(p => p.id === id)) continue;
          try {
            await this.loadProject(id);
            loaded = true;
            break;
          } catch (err) {
            console.warn(`⚠️  Could not load project ${id}, trying next:`, err && err.message);
          }
        }
        if (!loaded) {
          throw new Error('No loadable project found in manifest');
        }
      }
      
      this.initialized = true;
      console.log('✅ ProjectManager initialized');
      return true;
    } catch (error) {
      console.error('🚨 ProjectManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create new project
   */
  async createProject(name, setAsDefault = false) {
    try {
      const manifest = await this.storage.readManifest();
      
      // Check project limit
      if (manifest.projects.length >= this.maxProjects) {
        throw new Error(`Project limit reached (${this.maxProjects} projects max). Delete unused projects to create new ones.`);
      }
      
      // Create new project
      const project = new Project({ name, isDefault: setAsDefault });
      
      // Save project file
      await this.storage.saveProject(project);
      
      // Update manifest
      manifest.projects.push({
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        modifiedAt: project.modifiedAt,
        lastUsedAt: project.lastUsedAt,
        usageCount: project.usageCount,
        isDefault: project.isDefault
      });
      
      if (setAsDefault) {
        manifest.defaultProjectId = project.id;
        // Clear default flag on other projects
        manifest.projects.forEach(s => {
          if (s.id !== project.id) s.isDefault = false;
        });
      }
      
      await this.storage.saveManifest(manifest);
      
      console.log(`✅ Created project: ${name} (${project.id})`);
      return project;
    } catch (error) {
      console.error('🚨 Failed to create project:', error);
      throw error;
    }
  }

  /**
   * Load project by ID
   */
  async loadProject(projectId) {
    try {
      // Read project data
      const projectData = await this.storage.readProject(projectId);
      const project = Project.fromJSON(projectData);
      
      // Record usage
      project.recordUsage();
      await this.storage.saveProject(project);
      
      // Update manifest
      const manifest = await this.storage.readManifest();
      const projectInfo = manifest.projects.find(s => s.id === projectId);
      if (projectInfo) {
        projectInfo.lastUsedAt = project.lastUsedAt;
        projectInfo.usageCount = project.usageCount;
        manifest.currentProjectId = projectId;
        await this.storage.saveManifest(manifest);
      }
      
      // Set as current project
      this.currentProject = project;
      this.hasUnsavedChanges = false;
      this._isLoadingProject = true;
      
      // Apply project config to app settings and notify all windows
      this.applyProjectToSettings(project);
      
      // Reset after apply — renderer broadcasts triggered by applyProjectToSettings
      // should NOT mark the project as dirty
      this.hasUnsavedChanges = false;
      this._isLoadingProject = false;
      
      console.log(`📂 Loaded project: ${project.name} (${projectId})`);
      return project;
    } catch (error) {
      console.error('🚨 Failed to load project:', error);
      throw error;
    }
  }

  /**
   * Convert project config to flat settings and apply to app.
   * This writes to settings.json and broadcasts 'settings-updated' to all windows.
   */
  applyProjectToSettings(project) {
    const config = project.config;
    
    // Map structured project config → flat settings keys
    const settings = {
      // Timer
      defaultTime: config.timer?.defaultTime || { hours: 0, minutes: 45, seconds: 0 },
      autoStopAtZero: config.timer?.autoStopAtZero ?? true,
      autoReset: config.timer?.autoReset ?? false,
      flashAtZero: config.timer?.flashAtZero ?? false,
      
      // Layout
      defaultLayout: config.layout?.current || 'classic',
      
      // Theme
      defaultTheme: config.theme?.mode || 'dark',
      appearanceTheme: config.theme?.mode || 'dark',
      
      // Colors
      colors: config.theme?.colors || {},
      
      // Display
      showClock: config.display?.clock?.visible ?? false,
      clockFormat: config.display?.clock?.format || '24h',
      timeFormat: config.display?.clock?.format || '24h',
      
      // Warnings
      timerThresholdType: config.display?.warnings?.thresholdType || 'percentage',
      warningPercentage: config.display?.warnings?.warningPercentage ?? 30,
      criticalPercentage: config.display?.warnings?.criticalPercentage ?? 5,
      warningTimeMinutes: config.display?.warnings?.warningTimeMinutes ?? 2,
      warningTimeSeconds: config.display?.warnings?.warningTimeSeconds ?? 0,
      criticalTimeMinutes: config.display?.warnings?.criticalTimeMinutes ?? 0,
      criticalTimeSeconds: config.display?.warnings?.criticalTimeSeconds ?? 30,
      
      // Canvas
      canvasResolution: config.display?.canvas?.resolution || '1920x1080',
      canvasQuality: config.display?.canvas?.quality || 'high',
      frameRate: config.display?.canvas?.frameRate || 60,
      
      // Media
      backgroundImage: config.media?.backgroundImage || { enabled: false, path: '', opacity: 1.0 },
      coverImage: config.media?.coverImage || { enabled: false, path: '' },
      
      // API
      companionServerEnabled: config.api?.rest?.enabled ?? true,
      companionServerPort: config.api?.rest?.port || 9999,
      companionAllowExternal: config.api?.allowExternal ?? false,
      websocketPort: config.api?.websocket?.port || 8080,
      oscPort: config.api?.osc?.receivePort || 7000,
      oscRemotePort: config.api?.osc?.sendPort || 7001,
      
      // Audio
      soundNotification: config.audio?.enabled ?? false,
      customSoundFile: config.audio?.customSoundFile || null,
      customSoundFileName: config.audio?.customSoundFileName || null,
      
      // Appearance
      showWatermark: config.appearance?.showWatermark ?? true,
      matchTimerColor: config.appearance?.matchTimerColor ?? false,
      
      // Video
      defaultVideoDevice: config.video?.defaultDevice || '',
      autoStartVideoLaunch: config.video?.autoStartOnLaunch ?? false,
      autoStartVideoLayout: config.video?.autoStartOnLayout ?? true,
      releaseCameraIdle: config.video?.releaseCameraIdle ?? true,
      videoResolution: config.video?.resolution || '1920x1080',
      mirrorVideo: config.video?.mirror ?? false,
      videoScaling: config.video?.scaling || 'contain',
      
      // Hidden layouts
      hiddenBuiltinLayouts: config.layout?.hiddenBuiltinLayouts || [],
    };
    
    // Presets (same format: { id, name, time } with time in seconds)
    if (config.timer?.presets) {
      settings.presets = config.timer.presets.map((preset, i) => ({
        id: preset.id ?? (i + 1),
        name: preset.name || `Preset ${i + 1}`,
        time: preset.time
      }));
    }
    
    // Save to settings.json
    this.settingsManager.saveSettings(settings);
    
    // Broadcast to all windows
    this.broadcastSettings();
    
    console.log(`⚙️  Applied project settings: ${project.name}`);
  }

  /**
   * Capture current app settings into the current project's config.
   * Call this before saving a project to persist the latest state.
   */
  captureSettingsToProject() {
    if (!this.currentProject) return;
    
    const settings = this.settingsManager.getSettings();
    const config = this.currentProject.config;
    
    // Timer
    config.timer.defaultTime = settings.defaultTime || config.timer.defaultTime;
    config.timer.autoStopAtZero = settings.autoStopAtZero ?? config.timer.autoStopAtZero;
    config.timer.autoReset = settings.autoReset ?? config.timer.autoReset;
    config.timer.flashAtZero = settings.flashAtZero ?? config.timer.flashAtZero;
    
    // Presets (same format: { id, name, time } with time in seconds)
    if (settings.presets) {
      config.timer.presets = settings.presets.map((preset, i) => ({
        id: preset.id ?? (i + 1),
        name: preset.name || `Preset ${i + 1}`,
        time: preset.time
      }));
    }
    
    // Layout
    config.layout.current = settings.defaultLayout || config.layout.current;
    config.layout.hiddenBuiltinLayouts = settings.hiddenBuiltinLayouts || [];
    
    // Theme
    config.theme.mode = settings.appearanceTheme || settings.defaultTheme || config.theme.mode;
    if (settings.colors) {
      config.theme.colors = { ...config.theme.colors, ...settings.colors };
    }
    
    // Display
    config.display.clock.visible = settings.showClock ?? config.display.clock.visible;
    config.display.clock.format = settings.clockFormat || config.display.clock.format;
    
    // Warnings
    config.display.warnings.thresholdType = settings.timerThresholdType || config.display.warnings.thresholdType;
    config.display.warnings.warningPercentage = settings.warningPercentage ?? config.display.warnings.warningPercentage;
    config.display.warnings.criticalPercentage = settings.criticalPercentage ?? config.display.warnings.criticalPercentage;
    config.display.warnings.warningTimeMinutes = settings.warningTimeMinutes ?? config.display.warnings.warningTimeMinutes;
    config.display.warnings.warningTimeSeconds = settings.warningTimeSeconds ?? config.display.warnings.warningTimeSeconds;
    config.display.warnings.criticalTimeMinutes = settings.criticalTimeMinutes ?? config.display.warnings.criticalTimeMinutes;
    config.display.warnings.criticalTimeSeconds = settings.criticalTimeSeconds ?? config.display.warnings.criticalTimeSeconds;
    
    // Canvas
    config.display.canvas.resolution = settings.canvasResolution || config.display.canvas.resolution;
    config.display.canvas.quality = settings.canvasQuality || config.display.canvas.quality;
    config.display.canvas.frameRate = settings.frameRate || config.display.canvas.frameRate;
    
    // Media
    if (settings.backgroundImage) {
      config.media.backgroundImage = settings.backgroundImage;
    }
    if (settings.coverImage !== undefined) {
      config.media.coverImage = settings.coverImage;
    }
    
    // API
    config.api.rest.enabled = settings.companionServerEnabled ?? config.api.rest.enabled;
    config.api.rest.port = settings.companionServerPort || config.api.rest.port;
    config.api.allowExternal = settings.companionAllowExternal ?? config.api.allowExternal;
    config.api.websocket.port = settings.websocketPort || config.api.websocket.port;
    config.api.osc.receivePort = settings.oscPort || config.api.osc.receivePort;
    config.api.osc.sendPort = settings.oscRemotePort || config.api.osc.sendPort;
    
    // Audio
    config.audio.enabled = settings.soundNotification ?? config.audio.enabled;
    config.audio.customSoundFile = settings.customSoundFile ?? config.audio.customSoundFile;
    config.audio.customSoundFileName = settings.customSoundFileName ?? config.audio.customSoundFileName;
    
    // Appearance
    config.appearance.showWatermark = settings.showWatermark ?? config.appearance.showWatermark;
    config.appearance.matchTimerColor = settings.matchTimerColor ?? config.appearance.matchTimerColor;
    
    // Video
    config.video.defaultDevice = settings.defaultVideoDevice || config.video.defaultDevice;
    config.video.autoStartOnLaunch = settings.autoStartVideoLaunch ?? config.video.autoStartOnLaunch;
    config.video.autoStartOnLayout = settings.autoStartVideoLayout ?? config.video.autoStartOnLayout;
    config.video.releaseCameraIdle = settings.releaseCameraIdle ?? config.video.releaseCameraIdle;
    config.video.resolution = settings.videoResolution || config.video.resolution;
    config.video.mirror = settings.mirrorVideo ?? config.video.mirror;
    config.video.scaling = settings.videoScaling || config.video.scaling;
  }

  /**
   * Send settings-updated event to all renderer windows
   */
  broadcastSettings() {
    const { BrowserWindow } = require('electron');
    const updatedSettings = this.settingsManager.getSettings();
    
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('settings-updated', updatedSettings);
        // Also notify API server about preset changes
        win.webContents.send('settings-presets-updated', updatedSettings.presets || []);
      }
    });

    // Notify API server directly (main process IPC)
    const { ipcMain } = require('electron');
    ipcMain.emit('settings-presets-updated', null, updatedSettings.presets || []);
  }

  /**
   * Save current project
   */
  async saveProject() {
    try {
      if (!this.currentProject) {
        throw new Error('No project loaded');
      }
      
      // Capture current app settings into project config before saving
      this.captureSettingsToProject();
      
      this.currentProject.touch();
      await this.storage.saveProject(this.currentProject);
      
      // Update manifest
      const manifest = await this.storage.readManifest();
      const projectInfo = manifest.projects.find(s => s.id === this.currentProject.id);
      if (projectInfo) {
        projectInfo.modifiedAt = this.currentProject.modifiedAt;
        projectInfo.name = this.currentProject.name;
        await this.storage.saveManifest(manifest);
      }
      
      this.hasUnsavedChanges = false;
      
      console.log(`💾 Saved project: ${this.currentProject.name}`);
      return true;
    } catch (error) {
      console.error('🚨 Failed to save project:', error);
      throw error;
    }
  }

  /**
   * Update current project configuration
   */
  updateCurrentProject(configPath, value) {
    if (!this.currentProject) {
      throw new Error('No project loaded');
    }
    
    // Navigate to the config path and update value
    const keys = configPath.split('.');
    let target = this.currentProject.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }
    
    target[keys[keys.length - 1]] = value;
    if (!this._isLoadingProject) {
      this.hasUnsavedChanges = true;
    }
    
    return true;
  }

  /**
   * Rename project
   */
  async renameProject(projectId, newName) {
    try {
      const projectData = await this.storage.readProject(projectId);
      const project = Project.fromJSON(projectData);
      
      project.name = newName;
      project.touch();
      
      await this.storage.saveProject(project);
      
      // Update manifest
      const manifest = await this.storage.readManifest();
      const projectInfo = manifest.projects.find(s => s.id === projectId);
      if (projectInfo) {
        projectInfo.name = newName;
        projectInfo.modifiedAt = project.modifiedAt;
        await this.storage.saveManifest(manifest);
      }
      
      // Update current project if it's the one being renamed
      if (this.currentProject && this.currentProject.id === projectId) {
        this.currentProject.name = newName;
      }
      
      console.log(`✏️  Renamed project to: ${newName}`);
      return true;
    } catch (error) {
      console.error('🚨 Failed to rename project:', error);
      throw error;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    try {
      // Create backup before deletion
      await this.storage.createBackup(projectId, 'pre-delete');
      
      // Remove from manifest
      const manifest = await this.storage.readManifest();
      manifest.projects = manifest.projects.filter(s => s.id !== projectId);
      
      // Clear default if this was the default project
      if (manifest.defaultProjectId === projectId) {
        manifest.defaultProjectId = null;
      }
      
      // Clear current if this was the current project
      if (manifest.currentProjectId === projectId) {
        manifest.currentProjectId = manifest.projects.length > 0 ? manifest.projects[0].id : null;
      }
      
      await this.storage.saveManifest(manifest);
      
      // Delete project file
      await this.storage.deleteProject(projectId);
      
      console.log(`🗑️  Deleted project: ${projectId}`);
      return true;
    } catch (error) {
      console.error('🚨 Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * Duplicate project
   */
  async duplicateProject(projectId, newName = null) {
    try {
      const manifest = await this.storage.readManifest();
      
      // Check project limit
      if (manifest.projects.length >= this.maxProjects) {
        throw new Error(`Project limit reached (${this.maxProjects} projects max)`);
      }
      
      // Read original project
      const projectData = await this.storage.readProject(projectId);
      const originalProject = Project.fromJSON(projectData);
      
      // Clone it
      const clonedProject = originalProject.clone(newName);
      
      // Save cloned project
      await this.storage.saveProject(clonedProject);
      
      // Update manifest
      manifest.projects.push({
        id: clonedProject.id,
        name: clonedProject.name,
        createdAt: clonedProject.createdAt,
        modifiedAt: clonedProject.modifiedAt,
        lastUsedAt: clonedProject.lastUsedAt,
        usageCount: clonedProject.usageCount,
        isDefault: false
      });
      
      await this.storage.saveManifest(manifest);
      
      console.log(`📑 Duplicated project: ${originalProject.name} → ${clonedProject.name}`);
      return clonedProject;
    } catch (error) {
      console.error('🚨 Failed to duplicate project:', error);
      throw error;
    }
  }

  /**
   * Set project as default
   */
  async setDefaultProject(projectId) {
    try {
      const manifest = await this.storage.readManifest();
      
      // Clear all default flags
      manifest.projects.forEach(s => {
        s.isDefault = s.id === projectId;
      });
      
      manifest.defaultProjectId = projectId;
      await this.storage.saveManifest(manifest);
      
      // Update project file
      const projectData = await this.storage.readProject(projectId);
      const project = Project.fromJSON(projectData);
      project.isDefault = true;
      await this.storage.saveProject(project);
      
      console.log(`⭐ Set default project: ${projectId}`);
      return true;
    } catch (error) {
      console.error('🚨 Failed to set default project:', error);
      throw error;
    }
  }

  /**
   * Clear default project
   */
  async clearDefaultProject() {
    try {
      const manifest = await this.storage.readManifest();
      
      if (manifest.defaultProjectId) {
        // Update the project file
        const projectData = await this.storage.readProject(manifest.defaultProjectId);
        const project = Project.fromJSON(projectData);
        project.isDefault = false;
        await this.storage.saveProject(project);
      }
      
      // Clear all default flags in manifest
      manifest.projects.forEach(s => {
        s.isDefault = false;
      });
      manifest.defaultProjectId = null;
      
      await this.storage.saveManifest(manifest);
      
      console.log('🔄 Cleared default project');
      return true;
    } catch (error) {
      console.error('🚨 Failed to clear default project:', error);
      throw error;
    }
  }

  /**
   * Get all projects
   */
  async getAllProjects() {
    try {
      const manifest = await this.storage.readManifest();
      return manifest.projects;
    } catch (error) {
      console.error('🚨 Failed to get all projects:', error);
      throw error;
    }
  }

  /**
   * Get current project
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsaved() {
    return this.hasUnsavedChanges;
  }

  /**
   * Mark project as having unsaved changes
   */
  markAsChanged() {
    if (this._isLoadingProject) return;
    this.hasUnsavedChanges = true;
  }

  /**
   * Prompt user to save if there are unsaved changes.
   * Returns true if it's safe to proceed (saved or discarded), false if cancelled.
   */
  async promptSaveIfNeeded(parentWindow) {
    if (!this.hasUnsavedChanges || !this.currentProject) return true;

    const { dialog } = require('electron');
    const opts = {
      type: 'question',
      title: 'Unsaved Changes',
      message: `Save changes to "${this.currentProject.name}"?`,
      detail: 'Your changes will be lost if you don\'t save them.',
      buttons: ['Save', 'Don\'t Save', 'Cancel'],
      defaultId: 0,
      cancelId: 2,
    };
    const result = parentWindow
      ? await dialog.showMessageBox(parentWindow, opts)
      : await dialog.showMessageBox(opts);

    if (result.response === 0) {
      // Save
      await this.saveProject();
      return true;
    } else if (result.response === 1) {
      // Don't Save — discard
      this.hasUnsavedChanges = false;
      return true;
    }
    // Cancel
    return false;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    return await this.storage.getStorageStats();
  }

  /**
   * Export project to .rctimer file
   */
  async exportProject(projectId, exportPath) {
    try {
      const projectData = await this.storage.readProject(projectId);
      
      // Build export package
      const exportPackage = {
        format: 'rctimer',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        project: projectData
      };
      
      const fs = require('fs').promises;
      await fs.writeFile(exportPath, JSON.stringify(exportPackage, null, 2), 'utf8');
      
      console.log(`📦 Exported project to: ${exportPath}`);
      return true;
    } catch (error) {
      console.error('🚨 Failed to export project:', error);
      throw error;
    }
  }

  /**
   * Import project from .rctimer file
   */
  async importProject(importPath) {
    try {
      const fs = require('fs').promises;
      const raw = await fs.readFile(importPath, 'utf8');
      const importData = JSON.parse(raw);
      
      // Validate import format
      if (!importData.format || importData.format !== 'rctimer') {
        throw new Error('Invalid file format. Expected .rctimer project file.');
      }
      
      if (!importData.project || !importData.project.name || !importData.project.config) {
        throw new Error('Invalid project data in file.');
      }
      
      const manifest = await this.storage.readManifest();
      
      // Check limit
      if (manifest.projects.length >= this.maxProjects) {
        throw new Error(`Project limit reached (${this.maxProjects} projects max). Delete unused projects to create new ones.`);
      }
      
      // Create new project from imported data (always gets a fresh ID)
      const { v4: uuidv4 } = require('uuid');
      const projectData = importData.project;
      projectData.id = uuidv4();
      projectData.createdAt = new Date().toISOString();
      projectData.modifiedAt = new Date().toISOString();
      projectData.lastUsedAt = new Date().toISOString();
      projectData.usageCount = 0;
      projectData.isDefault = false;
      
      const project = Project.fromJSON(projectData);
      
      // Validate
      const validation = Project.validate(project.toJSON());
      if (!validation.valid) {
        throw new Error(`Invalid project data: ${validation.errors.join(', ')}`);
      }
      
      // Save
      await this.storage.saveProject(project);
      
      // Update manifest
      manifest.projects.push({
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        modifiedAt: project.modifiedAt,
        lastUsedAt: project.lastUsedAt,
        usageCount: project.usageCount,
        isDefault: false
      });
      await this.storage.saveManifest(manifest);
      
      console.log(`📥 Imported project: ${project.name} (${project.id})`);
      return project;
    } catch (error) {
      console.error('🚨 Failed to import project:', error);
      throw error;
    }
  }
}

module.exports = ProjectManager;

