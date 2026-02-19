import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAutoModeController } from '../controllers/auto-mode-controller.js';
import { MockAutoModeSettingsRepository } from '@autoboard/testing';

describe('AutoModeController', () => {
  let autoModeSettingsRepository: MockAutoModeSettingsRepository;
  let autoModeLoop: any;

  beforeEach(() => {
    autoModeSettingsRepository = new MockAutoModeSettingsRepository();
    autoModeLoop = {
      ensureInitialized: vi.fn().mockResolvedValue(undefined),
      getStatus: vi.fn(),
      isEnabled: vi.fn(),
      getConcurrency: vi.fn(),
    };
  });

  describe('creation', () => {
    it('should create controller with repositories', () => {
      const controller = createAutoModeController(
        autoModeSettingsRepository,
        autoModeLoop
      );

      expect(controller.get).toBeDefined();
      expect(controller.post).toBeDefined();
      expect(controller.patch).toBeDefined();
    });
  });

  describe('GET endpoint', () => {
    it('should return 400 when projectId is missing', async () => {
      const controller = createAutoModeController(
        autoModeSettingsRepository,
        autoModeLoop
      );

      const mockContext = {
        req: {
          url: 'http://localhost/api/auto-mode',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.get(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'projectId is required' },
        400
      );
    });

    it('should call ensureInitialized on autoModeLoop', async () => {
      const controller = createAutoModeController(
        autoModeSettingsRepository,
        autoModeLoop
      );

      const mockContext = {
        req: {
          url: 'http://localhost/api/auto-mode?projectId=proj-1',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.get(mockContext as any);

      expect(autoModeLoop.ensureInitialized).toHaveBeenCalled();
    });
  });

  describe('POST endpoint', () => {
    it('should call ensureInitialized on autoModeLoop', async () => {
      const controller = createAutoModeController(
        autoModeSettingsRepository,
        autoModeLoop
      );

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            projectId: 'proj-1',
            enabled: true,
          }),
          url: 'http://localhost/api/auto-mode',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.post(mockContext as any);

      expect(autoModeLoop.ensureInitialized).toHaveBeenCalled();
    });
  });

  describe('PATCH endpoint', () => {
    it('should call ensureInitialized on autoModeLoop', async () => {
      const controller = createAutoModeController(
        autoModeSettingsRepository,
        autoModeLoop
      );

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            projectId: 'proj-1',
            maxConcurrency: 3,
          }),
          url: 'http://localhost/api/auto-mode',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.patch(mockContext as any);

      expect(autoModeLoop.ensureInitialized).toHaveBeenCalled();
    });
  });
});
