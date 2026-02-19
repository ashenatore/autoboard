import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCards,
  getArchivedCards,
  createCard,
  updateCard,
  deleteCard,
  archiveCard,
} from '../cards.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Cards API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getCards', () => {
    it('should return empty array when projectId is empty', async () => {
      const cards = await getCards('');
      expect(cards).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch cards for a project', async () => {
      const mockCards = [
        { id: 'card-1', title: 'Card 1', columnId: 'todo' },
        { id: 'card-2', title: 'Card 2', columnId: 'todo' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCards,
      });

      const cards = await getCards('proj-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cards?projectId=proj-1'
      );
      expect(cards).toEqual(mockCards);
    });

    it('should encode projectId in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getCards('proj with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cards?projectId=proj%20with%20spaces'
      );
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getCards('proj-1')).rejects.toThrow('Failed to fetch cards');
    });
  });

  describe('getArchivedCards', () => {
    it('should return empty array when projectId is empty', async () => {
      const cards = await getArchivedCards('');
      expect(cards).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch archived cards for a project', async () => {
      const mockCards = [
        { id: 'card-1', title: 'Archived Card', columnId: 'done' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCards,
      });

      const cards = await getArchivedCards('proj-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cards?projectId=proj-1&archived=true'
      );
      expect(cards).toEqual(mockCards);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getArchivedCards('proj-1')).rejects.toThrow('Failed to fetch archived cards');
    });
  });

  describe('createCard', () => {
    it('should create a new card', async () => {
      const newCard = { id: 'card-1', title: 'New Card', columnId: 'todo' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newCard,
      });

      const params = {
        title: 'New Card',
        description: 'Description',
        columnId: 'todo',
        projectId: 'proj-1',
      };

      const card = await createCard(params);

      expect(mockFetch).toHaveBeenCalledWith('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      expect(card).toEqual(newCard);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const params = {
        title: 'New Card',
        description: 'Description',
        columnId: 'todo',
        projectId: 'proj-1',
      };

      await expect(createCard(params)).rejects.toThrow('Failed to create card');
    });
  });

  describe('updateCard', () => {
    it('should update a card', async () => {
      const updatedCard = { id: 'card-1', title: 'Updated Card', columnId: 'in-progress' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedCard,
      });

      const updates = {
        title: 'Updated Card',
        columnId: 'in-progress',
      };

      const card = await updateCard('card-1', updates);

      expect(mockFetch).toHaveBeenCalledWith('/api/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'card-1', ...updates }),
      });
      expect(card).toEqual(updatedCard);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(updateCard('card-1', { title: 'Updated' })).rejects.toThrow(
        'Failed to update card'
      );
    });
  });

  describe('deleteCard', () => {
    it('should delete a card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await deleteCard('card-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'card-1' }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(deleteCard('card-1')).rejects.toThrow('Failed to delete card');
    });
  });

  describe('archiveCard', () => {
    it('should archive a card', async () => {
      const archivedCard = { id: 'card-1', title: 'Card' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => archivedCard,
      });

      const card = await archiveCard('card-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"archivedAt":'),
      });
      expect(card).toEqual(archivedCard);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(archiveCard('card-1')).rejects.toThrow('Failed to archive card');
    });
  });
});
