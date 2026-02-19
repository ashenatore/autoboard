import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateTitle,
} from '../generate-title.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Generate Title API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('generateTitle', () => {
    it('should generate a title for a card', async () => {
      const mockResult = {
        title: 'Implement User Authentication',
        card: {
          id: 'card-1',
          title: 'Implement User Authentication',
          description: 'Add login and signup functionality',
        },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await generateTitle('card-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-1' }),
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(generateTitle('card-1')).rejects.toThrow(
        'Failed to generate title'
      );
    });

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(generateTitle('card-1')).rejects.toThrow('Failed to generate title');
    });
  });
});
