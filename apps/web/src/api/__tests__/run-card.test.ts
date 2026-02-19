import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  runCard,
  getRunStatus,
  cancelRun,
} from '../run-card.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Run Card API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('runCard', () => {
    it('should start a card run', async () => {
      const mockResult = {
        cardId: 'card-1',
        status: 'started' as const,
        projectPath: '/path/to/project',
        prompt: 'Execute task',
        success: true,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await runCard({ cardId: 'card-1' });

      expect(mockFetch).toHaveBeenCalledWith('/api/run-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-1' }),
      });
      expect(result).toEqual(mockResult);
    });

    it('should start a card run with custom prompt', async () => {
      const mockResult = {
        cardId: 'card-1',
        status: 'started' as const,
        projectPath: '/path/to/project',
        prompt: 'Custom prompt',
        success: true,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await runCard({ cardId: 'card-1', prompt: 'Custom prompt' });

      expect(mockFetch).toHaveBeenCalledWith('/api/run-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-1', prompt: 'Custom prompt' }),
      });
      expect(result).toEqual(mockResult);
    });

    it('should start a card run with custom model', async () => {
      const mockResult = {
        cardId: 'card-1',
        status: 'started' as const,
        projectPath: '/path/to/project',
        prompt: 'Execute task',
        success: true,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await runCard({ cardId: 'card-1', model: 'claude-sonnet-4-6' });

      expect(mockFetch).toHaveBeenCalledWith('/api/run-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-1', model: 'claude-sonnet-4-6' }),
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Card not found' }),
      });

      await expect(runCard({ cardId: 'card-1' })).rejects.toThrow('Card not found');
    });
  });

  describe('getRunStatus', () => {
    it('should get card run status', async () => {
      const mockStatus = {
        status: 'running' as const,
        messageCount: 5,
        messages: [],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const status = await getRunStatus('card-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/run-card?cardId=card-1');
      expect(status).toEqual(mockStatus);
    });

    it('should encode cardId in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'not_found' as const, messageCount: 0, messages: [] }),
      });

      await getRunStatus('card with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/run-card?cardId=card%20with%20spaces'
      );
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getRunStatus('card-1')).rejects.toThrow(
        'Failed to get run status'
      );
    });
  });

  describe('cancelRun', () => {
    it('should cancel a card run', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await cancelRun('card-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/run-card', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-1' }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(cancelRun('card-1')).rejects.toThrow('Failed to cancel run');
    });
  });
});
