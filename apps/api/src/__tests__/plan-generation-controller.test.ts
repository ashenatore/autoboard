import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPlanGenerationController } from '../controllers/plan-generation-controller.js';
import { MockCardRepository, MockProjectRepository } from '@autoboard/testing';

describe('PlanGenerationController', () => {
  let cardRepository: MockCardRepository;
  let projectRepository: MockProjectRepository;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    projectRepository = new MockProjectRepository();
  });

  describe('creation', () => {
    it('should create controller with repositories', () => {
      const controller = createPlanGenerationController(
        cardRepository,
        projectRepository
      );

      expect(controller.post).toBeDefined();
      expect(controller.get).toBeDefined();
      expect(controller.delete).toBeDefined();
    });
  });

  describe('POST endpoint', () => {
    it('should return 400 when projectId is missing', async () => {
      const controller = createPlanGenerationController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            description: 'Test description',
          }),
          url: 'http://localhost/api/plan-generation',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.post(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'projectId is required' },
        400
      );
    });

    it('should handle generate plan request', async () => {
      const now = new Date();
      await projectRepository.createProject({
        id: 'proj-1',
        name: 'Test Project',
        filePath: '/path/to/project',
        createdAt: now,
        updatedAt: now,
      });

      const controller = createPlanGenerationController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            projectId: 'proj-1',
            description: 'Build a feature',
          }),
          url: 'http://localhost/api/plan-generation',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.post(mockContext as any);

      expect(mockContext.req.json).toHaveBeenCalled();
    });
  });

  describe('GET endpoint', () => {
    it('should return isGenerating status for project', async () => {
      const controller = createPlanGenerationController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          url: 'http://localhost/api/plan-generation?projectId=proj-1',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.get(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith({
        isGenerating: false,
      });
    });

    it('should return false when projectId is empty', async () => {
      const controller = createPlanGenerationController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          url: 'http://localhost/api/plan-generation',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.get(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith({
        isGenerating: false,
      });
    });
  });

  describe('DELETE endpoint', () => {
    it('should return 400 when projectId is missing', async () => {
      const controller = createPlanGenerationController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({}),
          url: 'http://localhost/api/plan-generation',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.delete(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'projectId is required' },
        400
      );
    });

    it('should handle cancel generation request', async () => {
      const controller = createPlanGenerationController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            projectId: 'proj-1',
          }),
          url: 'http://localhost/api/plan-generation',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.delete(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith({
        success: true,
      });
    });
  });
});
