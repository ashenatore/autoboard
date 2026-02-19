import { describe, it, expect } from 'vitest';
import { MockCardRepository } from '@autoboard/testing';
import type { CreateCardData, UpdateCardData } from '@autoboard/db';

describe('MockCardRepository', () => {
  let repo: MockCardRepository;

  beforeEach(() => {
    repo = new MockCardRepository();
  });

  describe('getAllCards', () => {
    it('should return empty array initially', async () => {
      const cards = await repo.getAllCards();
      expect(cards).toEqual([]);
    });

    it('should exclude archived cards', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Active Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      await repo.createCard({
        id: 'card-2',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Archived Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      // Archive card-2
      await repo.updateCard('card-2', {
        archivedAt: now,
        updatedAt: new Date(),
      });

      const cards = await repo.getAllCards();
      expect(cards).toHaveLength(1);
      expect(cards[0].id).toBe('card-1');
    });
  });

  describe('getCardsByProjectId', () => {
    it('should filter by project ID', async () => {
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

      await repo.createCard({
        id: 'card-2',
        projectId: 'proj-2',
        columnId: 'todo',
        title: 'Card 2',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const proj1Cards = await repo.getCardsByProjectId('proj-1');
      expect(proj1Cards).toHaveLength(1);
      expect(proj1Cards[0].id).toBe('card-1');
    });

    it('should exclude archived cards', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Active Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      await repo.createCard({
        id: 'card-2',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Archived Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      // Archive card-2
      await repo.updateCard('card-2', {
        archivedAt: now,
        updatedAt: new Date(),
      });

      const cards = await repo.getCardsByProjectId('proj-1');
      expect(cards).toHaveLength(1);
      expect(cards[0].id).toBe('card-1');
    });
  });

  describe('getArchivedCardsByProjectId', () => {
    it('should return only archived cards', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Active Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      await repo.createCard({
        id: 'card-2',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Archived Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      // Archive card-2
      await repo.updateCard('card-2', {
        archivedAt: now,
        updatedAt: new Date(),
      });

      const cards = await repo.getArchivedCardsByProjectId('proj-1');
      expect(cards).toHaveLength(1);
      expect(cards[0].id).toBe('card-2');
    });

    it('should return empty array when no archived cards', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Active Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const cards = await repo.getArchivedCardsByProjectId('proj-1');
      expect(cards).toEqual([]);
    });
  });

  describe('getCardById', () => {
    it('should return card by ID', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Test Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const card = await repo.getCardById('card-1');
      expect(card).toBeDefined();
      expect(card?.id).toBe('card-1');
    });

    it('should return null for non-existent card', async () => {
      const card = await repo.getCardById('non-existent');
      expect(card).toBeNull();
    });
  });

  describe('createCard', () => {
    it('should create card with generated ID', async () => {
      const now = new Date();
      const data: CreateCardData = {
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'New Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      };

      const card = await repo.createCard(data);

      expect(card.id).toBeDefined();
      expect(card.title).toBe('New Card');
      expect(card.sessionId).toBeNull();
      expect(card.archivedAt).toBeNull();
    });

    it('should create card with provided ID', async () => {
      const now = new Date();
      const data: CreateCardData = {
        id: 'custom-id',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'New Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      };

      const card = await repo.createCard(data);

      expect(card.id).toBe('custom-id');
    });

    it('should track create calls', async () => {
      const now = new Date();
      const data: CreateCardData = {
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'New Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      };

      await repo.createCard(data);

      expect(repo.createCalls).toHaveLength(1);
      expect(repo.createCalls[0].title).toBe('New Card');
    });
  });

  describe('updateCard', () => {
    it('should update card fields', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Original Title',
        description: 'Original Description',
        createdAt: now,
        updatedAt: now,
      });

      const updates: UpdateCardData = {
        title: 'Updated Title',
        description: 'Updated Description',
        columnId: 'in-progress',
        updatedAt: new Date(),
      };

      const updated = await repo.updateCard('card-1', updates);

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated Description');
      expect(updated.columnId).toBe('in-progress');
    });

    it('should update sessionId', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Test Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const updates: UpdateCardData = {
        sessionId: 'session-123',
        updatedAt: new Date(),
      };

      const updated = await repo.updateCard('card-1', updates);

      expect(updated.sessionId).toBe('session-123');
    });

    it('should set archivedAt for soft delete', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Test Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      const archiveTime = new Date();
      const updates: UpdateCardData = {
        archivedAt: archiveTime,
        updatedAt: new Date(),
      };

      const updated = await repo.updateCard('card-1', updates);

      expect(updated.archivedAt).toEqual(archiveTime);
    });

    it('should throw error for non-existent card', async () => {
      const updates: UpdateCardData = {
        updatedAt: new Date(),
      };

      await expect(repo.updateCard('non-existent', updates)).rejects.toThrow('Card not found');
    });

    it('should track update calls', async () => {
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

      const updates: UpdateCardData = {
        title: 'Updated',
        updatedAt: new Date(),
      };

      await repo.updateCard('card-1', updates);

      expect(repo.updateCalls).toHaveLength(1);
      expect(repo.updateCalls[0].id).toBe('card-1');
      expect(repo.updateCalls[0].updates.title).toBe('Updated');
    });
  });

  describe('deleteCard', () => {
    it('should delete card', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Test Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      await repo.deleteCard('card-1');

      const card = await repo.getCardById('card-1');
      expect(card).toBeNull();
    });

    it('should track delete calls', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Test Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      await repo.deleteCard('card-1');

      expect(repo.deleteCalls).toHaveLength(1);
      expect(repo.deleteCalls[0]).toBe('card-1');
    });
  });

  describe('reset', () => {
    it('should clear all data', async () => {
      const now = new Date();
      await repo.createCard({
        id: 'card-1',
        projectId: 'proj-1',
        columnId: 'todo',
        title: 'Test Card',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      repo.reset();

      const cards = await repo.getAllCards();
      expect(cards).toEqual([]);
      expect(repo.createCalls).toEqual([]);
      expect(repo.updateCalls).toEqual([]);
      expect(repo.deleteCalls).toEqual([]);
    });
  });
});
