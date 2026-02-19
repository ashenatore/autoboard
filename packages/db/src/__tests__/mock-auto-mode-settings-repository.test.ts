import { describe, it, expect, beforeEach } from 'vitest';
import { MockAutoModeSettingsRepository } from '@autoboard/testing';
import type { UpdateAutoModeData } from '@autoboard/db';

describe('MockAutoModeSettingsRepository', () => {
  let repo: MockAutoModeSettingsRepository;

  beforeEach(() => {
    repo = new MockAutoModeSettingsRepository();
  });

  describe('getByProjectId', () => {
    it('should return null for non-existent project', async () => {
      const settings = await repo.getByProjectId('non-existent');
      expect(settings).toBeNull();
    });

    it('should return settings for existing project', async () => {
      const now = new Date();
      await repo.upsert('proj-1', {
        enabled: true,
        maxConcurrency: 3,
        updatedAt: now,
      });

      const settings = await repo.getByProjectId('proj-1');
      expect(settings).toBeDefined();
      expect(settings?.projectId).toBe('proj-1');
      expect(settings?.enabled).toBe(true);
      expect(settings?.maxConcurrency).toBe(3);
    });

    it('should track getByProjectId calls', async () => {
      await repo.getByProjectId('proj-1');
      await repo.getByProjectId('proj-2');

      expect(repo.getByProjectIdCalls).toEqual(['proj-1', 'proj-2']);
    });
  });

  describe('upsert', () => {
    it('should create new settings', async () => {
      const now = new Date();
      const data: UpdateAutoModeData = {
        enabled: true,
        maxConcurrency: 2,
        updatedAt: now,
      };

      const settings = await repo.upsert('proj-1', data);

      expect(settings.projectId).toBe('proj-1');
      expect(settings.enabled).toBe(true);
      expect(settings.maxConcurrency).toBe(2);
      expect(settings.updatedAt).toEqual(now);
    });

    it('should update existing settings', async () => {
      const now = new Date();
      await repo.upsert('proj-1', {
        enabled: false,
        maxConcurrency: 1,
        updatedAt: now,
      });

      const later = new Date(now.getTime() + 1000);
      const updated = await repo.upsert('proj-1', {
        enabled: true,
        maxConcurrency: 3,
        updatedAt: later,
      });

      expect(updated.enabled).toBe(true);
      expect(updated.maxConcurrency).toBe(3);
      expect(updated.updatedAt).toEqual(later);
    });

    it('should use existing values when not provided', async () => {
      const now = new Date();
      await repo.upsert('proj-1', {
        enabled: true,
        maxConcurrency: 2,
        updatedAt: now,
      });

      const later = new Date(now.getTime() + 1000);
      const updated = await repo.upsert('proj-1', {
        updatedAt: later,
      });

      expect(updated.enabled).toBe(true);
      expect(updated.maxConcurrency).toBe(2);
      expect(updated.updatedAt).toEqual(later);
    });

    it('should use defaults when no existing settings', async () => {
      const now = new Date();
      const settings = await repo.upsert('proj-1', {
        updatedAt: now,
      });

      expect(settings.enabled).toBe(false);
      expect(settings.maxConcurrency).toBe(1);
    });

    it('should track upsert calls', async () => {
      const now = new Date();
      const data: UpdateAutoModeData = {
        enabled: true,
        maxConcurrency: 2,
        updatedAt: now,
      };

      await repo.upsert('proj-1', data);

      expect(repo.upsertCalls).toHaveLength(1);
      expect(repo.upsertCalls[0]).toEqual({
        projectId: 'proj-1',
        data,
      });
    });

    it('should store multiple projects independently', async () => {
      const now = new Date();
      await repo.upsert('proj-1', {
        enabled: true,
        maxConcurrency: 2,
        updatedAt: now,
      });

      await repo.upsert('proj-2', {
        enabled: false,
        maxConcurrency: 1,
        updatedAt: now,
      });

      const settings1 = await repo.getByProjectId('proj-1');
      const settings2 = await repo.getByProjectId('proj-2');

      expect(settings1?.enabled).toBe(true);
      expect(settings2?.enabled).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all data', async () => {
      const now = new Date();
      await repo.upsert('proj-1', {
        enabled: true,
        maxConcurrency: 2,
        updatedAt: now,
      });

      // Verify we have data before reset
      expect(repo.upsertCalls).toHaveLength(1);

      repo.reset();

      expect(repo.settings.size).toBe(0);
      expect(repo.upsertCalls).toEqual([]);
      expect(repo.getByProjectIdCalls).toEqual([]);
    });

    it('should clear data after multiple operations', async () => {
      const now = new Date();
      await repo.upsert('proj-1', {
        enabled: true,
        maxConcurrency: 2,
        updatedAt: now,
      });
      await repo.upsert('proj-2', {
        enabled: false,
        maxConcurrency: 1,
        updatedAt: now,
      });

      // Verify we have data before reset
      expect(repo.upsertCalls).toHaveLength(2);

      repo.reset();

      expect(repo.settings.size).toBe(0);
      expect(repo.upsertCalls).toEqual([]);
      expect(repo.getByProjectIdCalls).toEqual([]);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical auto-mode workflow', async () => {
      const now = new Date();

      // Initial state - auto mode disabled
      let settings = await repo.getByProjectId('proj-1');
      expect(settings).toBeNull();

      // Enable auto mode
      settings = await repo.upsert('proj-1', {
        enabled: true,
        maxConcurrency: 2,
        updatedAt: now,
      });
      expect(settings.enabled).toBe(true);

      // Update concurrency
      const later = new Date(now.getTime() + 1000);
      settings = await repo.upsert('proj-1', {
        maxConcurrency: 3,
        updatedAt: later,
      });
      expect(settings.maxConcurrency).toBe(3);
      expect(settings.enabled).toBe(true); // Should preserve enabled

      // Disable auto mode
      const later2 = new Date(later.getTime() + 1000);
      settings = await repo.upsert('proj-1', {
        enabled: false,
        updatedAt: later2,
      });
      expect(settings.enabled).toBe(false);

      // Verify final state
      settings = await repo.getByProjectId('proj-1');
      expect(settings?.enabled).toBe(false);
      expect(settings?.maxConcurrency).toBe(3);
    });
  });
});
