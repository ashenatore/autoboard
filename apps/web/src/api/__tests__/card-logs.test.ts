import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCardLogs,
  subscribeToCardLogs,
  sendCardInput,
  getNeedsInput,
  getRunningCards,
} from '../card-logs.js';

// Mock fetch and EventSource globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const mockEventSourceClass = vi.fn();
const mockEventSourceInstance = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
};
mockEventSourceClass.mockImplementation(() => mockEventSourceInstance);
global.EventSource = mockEventSourceClass as any;

describe('Card Logs API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockEventSourceClass.mockClear();
    mockEventSourceInstance.addEventListener.mockClear();
    mockEventSourceInstance.close.mockClear();
  });

  describe('getCardLogs', () => {
    it('should fetch logs for a card', async () => {
      const mockLogs = [
        { id: 'log-1', cardId: 'card-1', type: 'info', content: 'Test log', sequence: 1 },
        { id: 'log-2', cardId: 'card-1', type: 'tool', content: 'Tool execution', sequence: 2 },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      const logs = await getCardLogs('card-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/card-logs?cardId=card-1');
      expect(logs).toEqual(mockLogs);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getCardLogs('card-1')).rejects.toThrow('Failed to fetch card logs');
    });
  });

  describe('subscribeToCardLogs', () => {
    it('should create EventSource connection', () => {
      const onLog = vi.fn();
      const onStatus = vi.fn();
      const onNeedsInput = vi.fn();

      const es = subscribeToCardLogs('card-1', {
        onLog,
        onStatus,
        onNeedsInput,
      });

      expect(mockEventSourceClass).toHaveBeenCalledWith(
        '/api/card-logs-stream?cardId=card-1'
      );
      expect(es).toBeDefined();
    });

    it('should return EventSource instance', () => {
      const es = subscribeToCardLogs('card-1', {});

      expect(es).toBe(mockEventSourceInstance);
    });
  });

  describe('sendCardInput', () => {
    it('should send input to a card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await sendCardInput('card-1', 'Test input');

      expect(mockFetch).toHaveBeenCalledWith('/api/card-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-1', message: 'Test input' }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(sendCardInput('card-1', 'Test')).rejects.toThrow(
        'Failed to send input'
      );
    });
  });

  describe('getNeedsInput', () => {
    it('should fetch cards needing input', async () => {
      const mockCards = { 'card-1': true, 'card-2': true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCards,
      });

      const cards = await getNeedsInput();

      expect(mockFetch).toHaveBeenCalledWith('/api/needs-input');
      expect(cards).toEqual(mockCards);
    });

    it('should return empty object on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const cards = await getNeedsInput();

      expect(cards).toEqual({});
    });
  });

  describe('getRunningCards', () => {
    it('should fetch running cards', async () => {
      const mockCards = { 'card-1': true, 'card-2': true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCards,
      });

      const cards = await getRunningCards();

      expect(mockFetch).toHaveBeenCalledWith('/api/running-cards');
      expect(cards).toEqual(mockCards);
    });

    it('should return empty object on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const cards = await getRunningCards();

      expect(cards).toEqual({});
    });
  });
});
