import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cardRunStateService } from '../card-run-state.js';
import type { CardRunState } from '../card-run-state.js';

describe('CardRunStateService', () => {
  beforeEach(() => {
    // Clear all runs before each test
    const allRuns = cardRunStateService.getAllRuns();
    for (const [cardId] of allRuns) {
      cardRunStateService.removeRun(cardId);
    }
  });

  describe('run management', () => {
    it('should create a new run', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const run = cardRunStateService.getRun('card-1');
      expect(run).toBeDefined();
      expect(run?.status).toBe('running');
      expect(run?.messages).toEqual([]);
      expect(run?.needsInput).toBe(false);
      expect(run?.sequenceCounter).toBe(0);
    });

    it('should create a run with initial sequence', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController, 5);

      const run = cardRunStateService.getRun('card-1');
      expect(run?.sequenceCounter).toBe(5);
    });

    it('should return undefined for non-existent run', () => {
      const run = cardRunStateService.getRun('non-existent');
      expect(run).toBeUndefined();
    });

    it('should check if card is running', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      expect(cardRunStateService.isRunning('card-1')).toBe(true);
      expect(cardRunStateService.isRunning('non-existent')).toBe(false);
    });

    it('should return false for non-running card', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);
      cardRunStateService.updateRunStatus('card-1', 'completed');

      expect(cardRunStateService.isRunning('card-1')).toBe(false);
    });

    it('should remove run', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);
      expect(cardRunStateService.getRun('card-1')).toBeDefined();

      cardRunStateService.removeRun('card-1');
      expect(cardRunStateService.getRun('card-1')).toBeUndefined();
    });

    it('should get all runs', () => {
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();

      cardRunStateService.createRun('card-1', abortController1);
      cardRunStateService.createRun('card-2', abortController2);

      const allRuns = cardRunStateService.getAllRuns();
      expect(allRuns.size).toBe(2);
      expect(allRuns.has('card-1')).toBe(true);
      expect(allRuns.has('card-2')).toBe(true);
    });
  });

  describe('status updates', () => {
    it('should update run status to completed', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      cardRunStateService.updateRunStatus('card-1', 'completed');

      const run = cardRunStateService.getRun('card-1');
      expect(run?.status).toBe('completed');
    });

    it('should update run status to error', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      cardRunStateService.updateRunStatus('card-1', 'error', 'Something went wrong');

      const run = cardRunStateService.getRun('card-1');
      expect(run?.status).toBe('error');
      expect(run?.error).toBe('Something went wrong');
    });

    it('should not update non-existent run', () => {
      cardRunStateService.updateRunStatus('non-existent', 'completed');
      // Should not throw
      expect(cardRunStateService.getRun('non-existent')).toBeUndefined();
    });
  });

  describe('message handling', () => {
    it('should add message to run', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const message = {
        type: 'text' as const,
        message: 'Test message',
        parent_tool_use_id: null,
      };

      cardRunStateService.addMessage('card-1', message);

      const run = cardRunStateService.getRun('card-1');
      expect(run?.messages).toHaveLength(1);
      expect(run?.messages[0]).toEqual(message);
    });

    it('should not add message to non-existent run', () => {
      const message = {
        type: 'text' as const,
        message: 'Test message',
        parent_tool_use_id: null,
      };

      cardRunStateService.addMessage('non-existent', message);
      // Should not throw
    });
  });

  describe('log emission', () => {
    it('should emit log events', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const handler = vi.fn();
      cardRunStateService.onLog('card-1', handler);

      cardRunStateService.emitLog('card-1', 'info', 'Test log');

      expect(handler).toHaveBeenCalledWith({
        cardId: 'card-1',
        type: 'info',
        content: 'Test log',
        sequence: 1,
      });
    });

    it('should increment sequence counter', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const seq1 = cardRunStateService.emitLog('card-1', 'info', 'Log 1');
      const seq2 = cardRunStateService.emitLog('card-1', 'info', 'Log 2');
      const seq3 = cardRunStateService.emitLog('card-1', 'info', 'Log 3');

      expect(seq1).toBe(1);
      expect(seq2).toBe(2);
      expect(seq3).toBe(3);
    });

    it('should return 0 for non-existent run', () => {
      const seq = cardRunStateService.emitLog('non-existent', 'info', 'Test');
      expect(seq).toBe(0);
    });

    it('should unsubscribe from log events', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const handler = vi.fn();
      const unsubscribe = cardRunStateService.onLog('card-1', handler);

      unsubscribe();
      cardRunStateService.emitLog('card-1', 'info', 'Test log');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('status change events', () => {
    it('should emit status change on create', () => {
      const handler = vi.fn();
      cardRunStateService.onStatusChange('card-1', handler);

      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      expect(handler).toHaveBeenCalledWith({
        cardId: 'card-1',
        status: 'running',
      });
    });

    it('should emit status change on update', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const handler = vi.fn();
      cardRunStateService.onStatusChange('card-1', handler);

      cardRunStateService.updateRunStatus('card-1', 'completed');

      expect(handler).toHaveBeenCalledWith({
        cardId: 'card-1',
        status: 'completed',
      });
    });

    it('should emit status change with error', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const handler = vi.fn();
      cardRunStateService.onStatusChange('card-1', handler);

      cardRunStateService.updateRunStatus('card-1', 'error', 'Test error');

      expect(handler).toHaveBeenCalledWith({
        cardId: 'card-1',
        status: 'error',
        error: 'Test error',
      });
    });

    it('should unsubscribe from status change events', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const handler = vi.fn();
      const unsubscribe = cardRunStateService.onStatusChange('card-1', handler);

      unsubscribe();
      cardRunStateService.updateRunStatus('card-1', 'completed');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('needs input events', () => {
    it('should set and emit needs input', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const handler = vi.fn();
      cardRunStateService.onNeedsInput('card-1', handler);

      cardRunStateService.setNeedsInput('card-1', true);

      expect(handler).toHaveBeenCalledWith({
        cardId: 'card-1',
        needsInput: true,
      });

      const run = cardRunStateService.getRun('card-1');
      expect(run?.needsInput).toBe(true);
    });

    it('should set needs input to false', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);
      cardRunStateService.setNeedsInput('card-1', true);

      cardRunStateService.setNeedsInput('card-1', false);

      const run = cardRunStateService.getRun('card-1');
      expect(run?.needsInput).toBe(false);
    });

    it('should unsubscribe from needs input events', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const handler = vi.fn();
      const unsubscribe = cardRunStateService.onNeedsInput('card-1', handler);

      unsubscribe();
      cardRunStateService.setNeedsInput('card-1', true);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('query management', () => {
    it('should set query object', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const queryObj = { test: 'query' };
      cardRunStateService.setQuery('card-1', queryObj);

      const run = cardRunStateService.getRun('card-1');
      expect(run?.query).toEqual(queryObj);
    });

    it('should not set query for non-existent run', () => {
      cardRunStateService.setQuery('non-existent', { test: 'query' });
      // Should not throw
    });
  });

  describe('cancel run', () => {
    it('should cancel running run', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);

      const handler = vi.fn();
      cardRunStateService.onStatusChange('card-1', handler);

      cardRunStateService.cancelRun('card-1');

      expect(abortController.signal.aborted).toBe(true);
      expect(handler).toHaveBeenCalledWith({
        cardId: 'card-1',
        status: 'error',
        error: 'Cancelled by user',
      });

      const run = cardRunStateService.getRun('card-1');
      expect(run?.status).toBe('error');
      expect(run?.error).toBe('Cancelled by user');
    });

    it('should not cancel completed run', () => {
      const abortController = new AbortController();
      cardRunStateService.createRun('card-1', abortController);
      cardRunStateService.updateRunStatus('card-1', 'completed');

      cardRunStateService.cancelRun('card-1');

      expect(abortController.signal.aborted).toBe(false);
    });

    it('should not cancel non-existent run', () => {
      cardRunStateService.cancelRun('non-existent');
      // Should not throw
    });
  });

  describe('concurrent runs', () => {
    it('should handle multiple runs independently', () => {
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();

      cardRunStateService.createRun('card-1', abortController1);
      cardRunStateService.createRun('card-2', abortController2);

      cardRunStateService.emitLog('card-1', 'info', 'Log 1');
      cardRunStateService.emitLog('card-2', 'info', 'Log 2');

      const run1 = cardRunStateService.getRun('card-1');
      const run2 = cardRunStateService.getRun('card-2');

      expect(run1?.sequenceCounter).toBe(1);
      expect(run2?.sequenceCounter).toBe(1);
    });

    it('should handle events for specific cards', () => {
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();

      cardRunStateService.createRun('card-1', abortController1);
      cardRunStateService.createRun('card-2', abortController2);

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      cardRunStateService.onLog('card-1', handler1);
      cardRunStateService.onLog('card-2', handler2);

      cardRunStateService.emitLog('card-1', 'info', 'Card 1 log');
      cardRunStateService.emitLog('card-2', 'info', 'Card 2 log');

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Card 1 log' })
      );
      expect(handler2).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Card 2 log' })
      );
    });
  });
});
