import { describe, it, expect, beforeEach } from 'vitest';

describe('MockCardLogRepository', () => {
  let repo: any;

  beforeEach(() => {
    // Import dynamically to avoid issues with the mock
    const { MockCardLogRepository } = require('@autoboard/testing');
    repo = new MockCardLogRepository();
  });

  describe('createLog', () => {
    it('should create a new log entry', async () => {
      const now = new Date();
      const log = await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Test log message',
        sequence: 1,
        createdAt: now,
      });

      expect(log).toBeDefined();
      expect(log.cardId).toBe('card-1');
      expect(log.type).toBe('info');
      expect(log.content).toBe('Test log message');
      expect(log.sequence).toBe(1);
      expect(log.createdAt).toEqual(now);
    });

    it('should generate ID if not provided', async () => {
      const log = await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Test',
        sequence: 1,
        createdAt: new Date(),
      });

      expect(log.id).toBeDefined();
      expect(typeof log.id).toBe('string');
    });

    it('should use provided ID', async () => {
      const log = await repo.createLog({
        id: 'log-1',
        cardId: 'card-1',
        type: 'info',
        content: 'Test',
        sequence: 1,
        createdAt: new Date(),
      });

      expect(log.id).toBe('log-1');
    });

    it('should track create calls', async () => {
      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Test',
        sequence: 1,
        createdAt: new Date(),
      });

      expect(repo.createCalls).toHaveLength(1);
      expect(repo.createCalls[0].cardId).toBe('card-1');
    });
  });

  describe('getLogsByCardId', () => {
    it('should return empty array for card with no logs', async () => {
      const logs = await repo.getLogsByCardId('card-1');
      expect(logs).toEqual([]);
    });

    it('should return logs for a card', async () => {
      const now = new Date();
      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Log 1',
        sequence: 1,
        createdAt: now,
      });

      await repo.createLog({
        cardId: 'card-1',
        type: 'tool',
        content: 'Log 2',
        sequence: 2,
        createdAt: new Date(now.getTime() + 1000),
      });

      const logs = await repo.getLogsByCardId('card-1');
      expect(logs).toHaveLength(2);
      expect(logs[0].content).toBe('Log 1');
      expect(logs[1].content).toBe('Log 2');
    });

    it('should not return logs from other cards', async () => {
      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Card 1 log',
        sequence: 1,
        createdAt: new Date(),
      });

      await repo.createLog({
        cardId: 'card-2',
        type: 'info',
        content: 'Card 2 log',
        sequence: 1,
        createdAt: new Date(),
      });

      const logs = await repo.getLogsByCardId('card-1');
      expect(logs).toHaveLength(1);
      expect(logs[0].content).toBe('Card 1 log');
    });
  });

  describe('getLogsAfterSequence', () => {
    it('should return logs after sequence number', async () => {
      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Log 1',
        sequence: 1,
        createdAt: new Date(),
      });

      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Log 2',
        sequence: 2,
        createdAt: new Date(),
      });

      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Log 3',
        sequence: 3,
        createdAt: new Date(),
      });

      const logs = await repo.getLogsAfterSequence('card-1', 1);
      expect(logs).toHaveLength(2);
      expect(logs[0].sequence).toBe(2);
      expect(logs[1].sequence).toBe(3);
    });

    it('should return empty array when no logs after sequence', async () => {
      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Log 1',
        sequence: 1,
        createdAt: new Date(),
      });

      const logs = await repo.getLogsAfterSequence('card-1', 5);
      expect(logs).toEqual([]);
    });

    it('should return empty array for non-existent card', async () => {
      const logs = await repo.getLogsAfterSequence('non-existent', 0);
      expect(logs).toEqual([]);
    });
  });

  describe('deleteLogsByCardId', () => {
    it('should delete logs for a card', async () => {
      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Log 1',
        sequence: 1,
        createdAt: new Date(),
      });

      await repo.createLog({
        cardId: 'card-2',
        type: 'info',
        content: 'Log 2',
        sequence: 1,
        createdAt: new Date(),
      });

      await repo.deleteLogsByCardId('card-1');

      const logs1 = await repo.getLogsByCardId('card-1');
      const logs2 = await repo.getLogsByCardId('card-2');

      expect(logs1).toEqual([]);
      expect(logs2).toHaveLength(1);
    });

    it('should track delete calls', async () => {
      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Test',
        sequence: 1,
        createdAt: new Date(),
      });

      await repo.deleteLogsByCardId('card-1');

      expect(repo.deleteCalls).toHaveLength(1);
      expect(repo.deleteCalls[0]).toBe('card-1');
    });
  });

  describe('reset', () => {
    it('should clear all data', async () => {
      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Test',
        sequence: 1,
        createdAt: new Date(),
      });
      await repo.deleteLogsByCardId('card-1');

      repo.reset();

      const logs = await repo.getLogsByCardId('card-1');
      expect(logs).toEqual([]);
      expect(repo.createCalls).toEqual([]);
      expect(repo.deleteCalls).toEqual([]);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical log workflow', async () => {
      const now = new Date();

      // Create initial logs
      await repo.createLog({
        cardId: 'card-1',
        type: 'info',
        content: 'Starting task',
        sequence: 1,
        createdAt: now,
      });

      await repo.createLog({
        cardId: 'card-1',
        type: 'tool',
        content: 'Running command',
        sequence: 2,
        createdAt: new Date(now.getTime() + 1000),
      });

      // Get all logs
      let logs = await repo.getLogsByCardId('card-1');
      expect(logs).toHaveLength(2);

      // Get logs after first
      logs = await repo.getLogsAfterSequence('card-1', 1);
      expect(logs).toHaveLength(1);
      expect(logs[0].content).toBe('Running command');

      // Clean up
      await repo.deleteLogsByCardId('card-1');
      logs = await repo.getLogsByCardId('card-1');
      expect(logs).toEqual([]);
    });
  });
});
