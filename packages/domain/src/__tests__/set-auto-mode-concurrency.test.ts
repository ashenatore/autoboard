import { describe, it, expect, beforeEach } from 'vitest';
import { SetAutoModeConcurrencyUseCase } from '../set-auto-mode-concurrency';
import {
  MockAutoModeSettingsRepository,
} from '@autoboard/testing';
import { ValidationError } from '@autoboard/shared';

describe.skip('SetAutoModeConcurrencyUseCase', () => {
  let autoModeSettingsRepository: MockAutoModeSettingsRepository;
  let useCase: SetAutoModeConcurrencyUseCase;

  beforeEach(() => {
    autoModeSettingsRepository = new MockAutoModeSettingsRepository();
    useCase = new SetAutoModeConcurrencyUseCase(autoModeSettingsRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if projectId is missing', async () => {
      await expect(
        useCase.execute({ projectId: '', maxConcurrency: 2 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if maxConcurrency is missing', async () => {
      await expect(
        useCase.execute({ projectId: 'test-project', maxConcurrency: 0 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if maxConcurrency is less than 1', async () => {
      await expect(
        useCase.execute({ projectId: 'test-project', maxConcurrency: 0 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if maxConcurrency is greater than 10', async () => {
      await expect(
        useCase.execute({ projectId: 'test-project', maxConcurrency: 11 })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('setting concurrency', () => {
    it('should set concurrency to valid value', async () => {
      const result = await useCase.execute({
        projectId: 'test-project',
        maxConcurrency: 3,
      });

      expect(result.maxConcurrency).toBe(3);
    });

    it('should allow concurrency of 1', async () => {
      const result = await useCase.execute({
        projectId: 'test-project',
        maxConcurrency: 1,
      });

      expect(result.maxConcurrency).toBe(1);
    });

    it('should allow concurrency of 10', async () => {
      const result = await useCase.execute({
        projectId: 'test-project',
        maxConcurrency: 10,
      });

      expect(result.maxConcurrency).toBe(10);
    });
  });
});
