import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToggleAutoModeUseCase } from '../toggle-auto-mode';
import {
  MockAutoModeSettingsRepository,
  ProjectFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe.skip('ToggleAutoModeUseCase', () => {
  let autoModeSettingsRepository: MockAutoModeSettingsRepository;
  let useCase: ToggleAutoModeUseCase;

  beforeEach(() => {
    autoModeSettingsRepository = new MockAutoModeSettingsRepository();
    useCase = new ToggleAutoModeUseCase(autoModeSettingsRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if projectId is missing', async () => {
      await expect(
        useCase.execute({ projectId: '' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('basic functionality', () => {
    it('should toggle auto-mode enabled', async () => {
      const result = await useCase.execute({
        projectId: 'test-project',
        enabled: true,
      });

      expect(result.enabled).toBe(true);
    });

    it('should toggle auto-mode disabled', async () => {
      const result = await useCase.execute({
        projectId: 'test-project',
        enabled: false,
      });

      expect(result.enabled).toBe(false);
    });
  });
});
