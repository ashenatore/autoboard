import { EventEmitter } from 'events';
import type { AgentMessage } from '@autoboard/services';

/**
 * Mock implementation of CardRunStateService for testing.
 * Tracks run state and emits events like the real service.
 */
export class MockCardRunStateService extends EventEmitter {
  public runs: Map<
    string,
    {
      abortController: AbortController;
      status: string;
      query?: any;
      needsInput: boolean;
      sequence: number;
    }
  > = new Map();

  public createRunCalls: Array<{ cardId: string; maxSequence: number }> = [];
  public setQueryCalls: Array<{ cardId: string; query: any }> = [];
  public setStatusCalls: Array<{ cardId: string; status: string; error?: string }> = [];

  isRunning(cardId: string): boolean {
    return this.runs.has(cardId);
  }

  createRun(cardId: string, abortController: AbortController, maxSequence: number): void {
    this.runs.set(cardId, {
      abortController,
      status: 'running',
      needsInput: false,
      sequence: maxSequence,
    });
    this.createRunCalls.push({ cardId, maxSequence });
    this.emit('runCreated', { cardId });
  }

  setQuery(cardId: string, query: any): void {
    const run = this.runs.get(cardId);
    if (run) {
      run.query = query;
      this.setQueryCalls.push({ cardId, query });
    }
  }

  getRun(cardId: string) {
    return this.runs.get(cardId);
  }

  updateRunStatus(cardId: string, status: string, error?: string): void {
    const run = this.runs.get(cardId);
    if (run) {
      run.status = status;
      this.setStatusCalls.push({ cardId, status, error });
      this.emit('statusChange', { cardId, status, error });
    }
  }

  setNeedsInput(cardId: string, needsInput: boolean): void {
    const run = this.runs.get(cardId);
    if (run) {
      run.needsInput = needsInput;
      if (needsInput) {
        this.emit('needsInput', { cardId });
      }
    }
  }

  addMessage(cardId: string, message: any): void {
    this.emit('message', { cardId, message });
  }

  emitLog(cardId: string, type: string, content: string): number {
    const run = this.runs.get(cardId);
    if (run) {
      run.sequence++;
      const sequence = run.sequence;
      this.emit('log', { cardId, type, content, sequence });
      return sequence;
    }
    return 0;
  }

  reset(): void {
    this.runs.clear();
    this.createRunCalls = [];
    this.setQueryCalls = [];
    this.setStatusCalls = [];
    this.removeAllListeners();
  }
}
