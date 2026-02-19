import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generatePlan,
  getPlanGenerationStatus,
  cancelPlanGeneration,
} from '../plan-generation.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Plan Generation API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('generatePlan', () => {
    it('should generate a plan for a project', async () => {
      const mockResult = {
        cards: [
          { id: 'card-1', title: 'Task 1', description: 'First task' },
          { id: 'card-2', title: 'Task 2', description: 'Second task' },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await generatePlan('proj-1', 'Build a feature');

      expect(mockFetch).toHaveBeenCalledWith('/api/plan-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'proj-1',
          description: 'Build a feature',
        }),
      });
      expect(result).toEqual(mockResult);
    });

    it('should generate a plan with description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cards: [] }),
      });

      const description = 'Create a comprehensive testing suite';
      await generatePlan('proj-1', description);

      expect(mockFetch).toHaveBeenCalledWith('/api/plan-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'proj-1',
          description: 'Create a comprehensive testing suite',
        }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Failed to generate plan',
      });

      await expect(generatePlan('proj-1', 'Build a feature')).rejects.toThrow();
    });
  });

  describe('getPlanGenerationStatus', () => {
    it('should check if plan is being generated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isGenerating: true }),
      });

      const status = await getPlanGenerationStatus('proj-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/plan-generation/status?projectId=proj-1'
      );
      expect(status.isGenerating).toBe(true);
    });

    it('should return false when not generating', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isGenerating: false }),
      });

      const status = await getPlanGenerationStatus('proj-1');

      expect(status.isGenerating).toBe(false);
    });

    it('should encode projectId in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isGenerating: false }),
      });

      await getPlanGenerationStatus('proj with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/plan-generation/status?projectId=proj%20with%20spaces'
      );
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getPlanGenerationStatus('proj-1')).rejects.toThrow(
        'Failed to get plan generation status'
      );
    });
  });

  describe('cancelPlanGeneration', () => {
    it('should cancel plan generation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await cancelPlanGeneration('proj-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/plan-generation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'proj-1' }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(cancelPlanGeneration('proj-1')).rejects.toThrow(
        'Failed to cancel plan generation'
      );
    });
  });
});
