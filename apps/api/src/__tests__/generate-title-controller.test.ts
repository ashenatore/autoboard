import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGenerateTitleController } from '../controllers/generate-title-controller.js';
import { MockCardRepository, MockProjectRepository } from '@autoboard/testing';

describe('GenerateTitleController', () => {
  let cardRepository: MockCardRepository;
  let projectRepository: MockProjectRepository;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    projectRepository = new MockProjectRepository();
  });

  describe('creation', () => {
    it('should create controller with repositories and claudeProvider', () => {
      const controller = createGenerateTitleController(
        cardRepository,
        projectRepository
      );

      expect(controller.post).toBeDefined();
    });
  });

  describe('POST endpoint', () => {
    it('should handle generate title request', async () => {
      const now = new Date();
      await cardRepository.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: '',
        description: 'Implement a feature',
        createdAt: now,
        updatedAt: now,
      });

      const controller = createGenerateTitleController(
        cardRepository,
        projectRepository
      );

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            cardId: 'card-1',
          }),
          url: 'http://localhost/api/generate-title',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.post(mockContext as any);

      expect(mockContext.req.json).toHaveBeenCalled();
    });
  });
});
