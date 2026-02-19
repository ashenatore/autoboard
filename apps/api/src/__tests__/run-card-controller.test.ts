import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRunCardController } from '../controllers/run-card-controller.js';
import { MockCardRepository, MockProjectRepository } from '@autoboard/testing';

describe('RunCardController', () => {
  let cardRepository: MockCardRepository;
  let projectRepository: MockProjectRepository;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    projectRepository = new MockProjectRepository();
  });

  describe('creation', () => {
    it('should create controller with repositories', () => {
      const controller = createRunCardController(
        cardRepository,
        projectRepository
      );

      expect(controller.post).toBeDefined();
      expect(controller.get).toBeDefined();
      expect(controller.delete).toBeDefined();
    });
  });

  describe('POST endpoint', () => {
    it('should handle start card run request', async () => {
      const now = new Date();
      await cardRepository.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Test Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const controller = createRunCardController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            cardId: 'card-1',
            prompt: 'Test prompt',
            model: 'claude-opus-4-6',
          }),
          url: 'http://localhost/api/run-card',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.post(mockContext as any);

      expect(mockContext.req.json).toHaveBeenCalled();
    });
  });

  describe('GET endpoint', () => {
    it('should handle get status request', async () => {
      const controller = createRunCardController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          url: 'http://localhost/api/run-card?cardId=card-1',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.get(mockContext as any);

      expect(mockContext.json).toHaveBeenCalled();
    });

    it('should handle empty cardId', async () => {
      const controller = createRunCardController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          url: 'http://localhost/api/run-card',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.get(mockContext as any);

      expect(mockContext.json).toHaveBeenCalled();
    });
  });

  describe('DELETE endpoint', () => {
    it('should handle cancel run request', async () => {
      const controller = createRunCardController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            cardId: 'card-1',
          }),
          url: 'http://localhost/api/run-card',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.delete(mockContext as any);

      expect(mockContext.req.json).toHaveBeenCalled();
    });
  });
});
