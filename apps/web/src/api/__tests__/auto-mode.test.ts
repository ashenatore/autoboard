import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAutoModeStatus,
  toggleAutoMode,
  setAutoModeConcurrency,
} from '../auto-mode.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Auto Mode API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getAutoModeStatus', () => {
    it('should fetch auto mode status for a project', async () => {
      const mockStatus = {
        projectId: 'proj-1',
        enabled: true,
        maxConcurrency: 2,
        runningCount: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const status = await getAutoModeStatus('proj-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/auto-mode?projectId=proj-1');
      expect(status).toEqual(mockStatus);
    });

    it('should encode projectId in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await getAutoModeStatus('proj with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auto-mode?projectId=proj%20with%20spaces'
      );
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getAutoModeStatus('proj-1')).rejects.toThrow(
        'Failed to fetch auto mode status'
      );
    });
  });

  describe('toggleAutoMode', () => {
    it('should enable auto mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await toggleAutoMode('proj-1', true);

      expect(mockFetch).toHaveBeenCalledWith('/api/auto-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'proj-1', enabled: true }),
      });
    });

    it('should disable auto mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await toggleAutoMode('proj-1', false);

      expect(mockFetch).toHaveBeenCalledWith('/api/auto-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'proj-1', enabled: false }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(toggleAutoMode('proj-1', true)).rejects.toThrow('Failed to toggle auto mode');
    });
  });

  describe('setAutoModeConcurrency', () => {
    it('should set concurrency limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await setAutoModeConcurrency('proj-1', 3);

      expect(mockFetch).toHaveBeenCalledWith('/api/auto-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'proj-1', maxConcurrency: 3 }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(setAutoModeConcurrency('proj-1', 3)).rejects.toThrow(
        'Failed to set concurrency'
      );
    });
  });
});
