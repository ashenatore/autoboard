import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCardsController } from '../controllers/cards-controller.js';
import { MockCardRepository } from '@autoboard/testing';

describe('CardsController', () => {
  let repo: MockCardRepository;
  let controller: ReturnType<typeof createCardsController>;

  beforeEach(() => {
    repo = new MockCardRepository();
    controller = createCardsController(repo);
  });

  describe('creation', () => {
    it('should create controller with repository', () => {
      expect(controller.get).toBeDefined();
      expect(controller.post).toBeDefined();
      expect(controller.patch).toBeDefined();
      expect(controller.delete).toBeDefined();
    });
  });

  describe('GET endpoint', () => {
    it('should return all cards when no projectId provided', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Card 1',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const mockContext = {
        req: {
          url: 'http://localhost/api/cards',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.get(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should return cards for specific project', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Card 1',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const mockContext = {
        req: {
          url: 'http://localhost/api/cards?projectId=proj-1',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.get(mockContext as any);

      expect(mockContext.json).toHaveBeenCalled();
    });

    it('should return archived cards when archived=true', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'done',
        title: 'Card 1',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });
      await repo.updateCard('card-1', {
        archivedAt: now,
        updatedAt: new Date(),
      });

      const mockContext = {
        req: {
          url: 'http://localhost/api/cards?projectId=proj-1&archived=true',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.get(mockContext as any);

      expect(mockContext.json).toHaveBeenCalled();
    });
  });

  describe('POST endpoint', () => {
    it('should create a new card', async () => {
      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            title: 'New Card',
            description: 'Description',
            columnId: 'todo',
            projectId: 'proj-1',
          }),
          url: 'http://localhost/api/cards',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.post(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(expect.any(Object), 201);
      expect(repo.createCalls).toHaveLength(1);
    });

    it('should handle domain errors', async () => {
      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            title: '',
            description: 'Test',
            columnId: 'todo',
            projectId: 'proj-1',
          }),
          url: 'http://localhost/api/cards',
        },
        json: vi.fn().mockReturnValue({}),
      };

      const result = await controller.post(mockContext as any);

      // Should handle error gracefully
      expect(mockContext.json).toHaveBeenCalled();
    });
  });

  describe('PATCH endpoint', () => {
    it('should update a card', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Original',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            id: 'card-1',
            columnId: 'in-progress',
          }),
          url: 'http://localhost/api/cards',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.patch(mockContext as any);

      expect(mockContext.json).toHaveBeenCalled();
      expect(repo.updateCalls).toHaveLength(1);
    });

    it('should update multiple fields', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Original',
        description: 'Original',
        createdAt: now,
        updatedAt: now,
      });

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            id: 'card-1',
            title: 'Updated',
            description: 'Updated',
            columnId: 'done',
          }),
          url: 'http://localhost/api/cards',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.patch(mockContext as any);

      expect(mockContext.json).toHaveBeenCalled();
    });

    it('should archive a card when archivedAt is provided', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            id: 'card-1',
            archivedAt: now.toISOString(),
          }),
          url: 'http://localhost/api/cards',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.patch(mockContext as any);

      expect(mockContext.json).toHaveBeenCalled();
    });
  });

  describe('DELETE endpoint', () => {
    it('should delete a card', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            id: 'card-1',
          }),
          url: 'http://localhost/api/cards',
        },
        json: vi.fn().mockReturnValue({}),
      };

      await controller.delete(mockContext as any);

      expect(mockContext.json).toHaveBeenCalled();
      expect(repo.deleteCalls).toHaveLength(1);
      expect(repo.deleteCalls[0]).toBe('card-1');
    });
  });
});
