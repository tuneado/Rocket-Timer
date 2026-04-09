import { describe, it, expect } from 'vitest';
import Project from '../../src/main/models/Project.js';

describe('Project model', () => {
  describe('constructor defaults', () => {
    it('creates a project with default values', () => {
      const project = new Project();
      expect(typeof project.id).toBe('string');
      expect(project.id.length).toBeGreaterThan(0);
      expect(project.name).toBe('Untitled Project');
      expect(project.description).toBe('');
      expect(project.tags).toEqual([]);
      expect(project.usageCount).toBe(0);
      expect(project.isDefault).toBe(false);
      expect(project.version).toBe('1.0.0');
    });

    it('uses provided data over defaults', () => {
      const project = new Project({
        id: 'custom-id',
        name: 'My Show',
        description: 'A test project',
        tags: ['live', 'event'],
        isDefault: true,
      });
      expect(project.id).toBe('custom-id');
      expect(project.name).toBe('My Show');
      expect(project.description).toBe('A test project');
      expect(project.tags).toEqual(['live', 'event']);
      expect(project.isDefault).toBe(true);
    });
  });

  describe('getDefaultConfig', () => {
    it('returns timer defaults with 8 presets', () => {
      const project = new Project();
      const config = project.getDefaultConfig();
      expect(config.timer.presets).toHaveLength(8);
      expect(config.timer.defaultTime).toEqual({ hours: 0, minutes: 45, seconds: 0 });
      expect(config.timer.autoStopAtZero).toBe(true);
    });

    it('returns theme defaults', () => {
      const project = new Project();
      const config = project.getDefaultConfig();
      expect(config.theme.mode).toBe('dark');
      expect(config.theme.colors.countdown).toBe('#ffffff');
      expect(config.theme.colors.background).toBe('#000000');
    });

    it('returns API defaults', () => {
      const project = new Project();
      const config = project.getDefaultConfig();
      expect(config.api.rest.port).toBe(9999);
      expect(config.api.websocket.port).toBe(8080);
      expect(config.api.osc.receivePort).toBe(7000);
      expect(config.api.allowExternal).toBe(false);
    });

    it('returns display defaults', () => {
      const project = new Project();
      const config = project.getDefaultConfig();
      expect(config.display.canvas.resolution).toBe('1920x1080');
      expect(config.display.canvas.frameRate).toBe(60);
    });
  });

  describe('touch()', () => {
    it('updates modifiedAt timestamp', () => {
      const project = new Project({ modifiedAt: '2020-01-01T00:00:00.000Z' });
      const before = project.modifiedAt;
      project.touch();
      expect(project.modifiedAt).not.toBe(before);
    });
  });

  describe('recordUsage()', () => {
    it('increments usage count and updates timestamps', () => {
      const project = new Project();
      const initialCount = project.usageCount;
      project.recordUsage();
      expect(project.usageCount).toBe(initialCount + 1);
      project.recordUsage();
      expect(project.usageCount).toBe(initialCount + 2);
    });
  });

  describe('toJSON()', () => {
    it('returns a plain object with all fields', () => {
      const project = new Project({ name: 'Serialized' });
      const json = project.toJSON();
      expect(json.name).toBe('Serialized');
      expect(json.id).toBeDefined();
      expect(json.config).toBeDefined();
      expect(json.createdAt).toBeDefined();
      expect(json.modifiedAt).toBeDefined();
    });

    it('round-trips through constructor', () => {
      const original = new Project({ name: 'Roundtrip', tags: ['a', 'b'] });
      const json = original.toJSON();
      const restored = new Project(json);
      expect(restored.name).toBe('Roundtrip');
      expect(restored.tags).toEqual(['a', 'b']);
      expect(restored.id).toBe(original.id);
    });
  });
});
