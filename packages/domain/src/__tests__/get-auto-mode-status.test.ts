import { describe, it, expect, beforeEach } from 'vitest';
import { GetAutoModeStatusUseCase } from '../get-auto-mode-status';
import {
  MockAutoModeSettingsRepository,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe.skip('GetAutoModeStatusUseCase', () => {
  let autoModeSettingsRepository: MockAutoModeSettingsRepository;
  let useCase: GetAutoModeStatusUseCase;

  beforeEach(() => {
    autoModeSettingsRepository = new MockAutoModeSettingsRepository();
    useCase = new GetAutoModeStatusUseCase(autoModeSettingsRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if projectId is missing', async () => {
      await expect(
        useCase.execute({ projectId: '' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('status when not enabled', () => {
    it('should return disabled status when no settings exist', async () => {
      const result = await useCase.execute({ projectId: 'test-project' });

      expect(result.enabled).toBe(false);
      expect(result.maxConcurrency).toBe(1);
    });
  });

  describe('status when enabled', () => {
    it('should return enabled status', async () => {
      await autoModeSettingsRepository.upsert('test-project', {
        enabled: true,
        maxConcurrency: 5,
        updatedAt: new Date(),
      });

      const result = await useCase.execute({ projectId: 'test-project' });

      expect(result.enabled).toBe(true);
      expect(result.maxConcurrency).toBe(5);
    });
  });
});
