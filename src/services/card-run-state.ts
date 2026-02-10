import { EventEmitter } from "events";
import type { AgentMessage } from "./agent-query.interface";

/**
 * State for an active or completed card run.
 */
export interface CardRunState {
  abortController: AbortController;
  messages: AgentMessage[];
  status: "running" | "completed" | "error";
  error?: string;
  query?: any;
  needsInput: boolean;
  sequenceCounter: number;
}

export interface LogEvent {
  cardId: string;
  type: string;
  content: string;
  sequence: number;
}

/**
 * Service to manage in-memory state for active card runs.
 * This manages the lifecycle of card execution runs.
 */
class CardRunStateService {
  /** Active agent runs, keyed by cardId */
  private activeRuns = new Map<string, CardRunState>();
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  /**
   * Get the run state for a card.
   */
  getRun(cardId: string): CardRunState | undefined {
    return this.activeRuns.get(cardId);
  }

  /**
   * Check if a card is currently running.
   */
  isRunning(cardId: string): boolean {
    const run = this.activeRuns.get(cardId);
    return run?.status === "running";
  }

  /**
   * Create a new run state for a card.
   */
  createRun(cardId: string, abortController: AbortController, initialSequence: number = 0): void {
    this.activeRuns.set(cardId, {
      abortController,
      messages: [],
      status: "running",
      needsInput: false,
      sequenceCounter: initialSequence,
    });
    // Notify any existing SSE listeners that a new run started
    this.emitter.emit(`statusChange:${cardId}`, { cardId, status: "running" });
  }

  /**
   * Update the status of a run.
   */
  updateRunStatus(cardId: string, status: "running" | "completed" | "error", error?: string): void {
    const run = this.activeRuns.get(cardId);
    if (run) {
      run.status = status;
      if (error) {
        run.error = error;
      }
      this.emitter.emit(`statusChange:${cardId}`, { cardId, status, error });
    }
  }

  /**
   * Add a message to a run's message list.
   */
  addMessage(cardId: string, message: AgentMessage): void {
    const run = this.activeRuns.get(cardId);
    if (run) {
      run.messages.push(message);
    }
  }

  /**
   * Emit a log event and increment the sequence counter.
   */
  emitLog(cardId: string, type: string, content: string): number {
    const run = this.activeRuns.get(cardId);
    if (!run) return 0;

    run.sequenceCounter++;
    const sequence = run.sequenceCounter;
    const logEvent: LogEvent = { cardId, type, content, sequence };
    this.emitter.emit(`log:${cardId}`, logEvent);
    return sequence;
  }

  /**
   * Set the needsInput flag for a card run.
   */
  setNeedsInput(cardId: string, needsInput: boolean): void {
    const run = this.activeRuns.get(cardId);
    if (run) {
      run.needsInput = needsInput;
      this.emitter.emit(`needsInput:${cardId}`, { cardId, needsInput });
    }
  }

  /**
   * Store the Query reference for a card run.
   */
  setQuery(cardId: string, queryObj: any): void {
    const run = this.activeRuns.get(cardId);
    if (run) {
      run.query = queryObj;
    }
  }

  /**
   * Get all active runs (for needs-input endpoint).
   */
  getAllRuns(): Map<string, CardRunState> {
    return this.activeRuns;
  }

  /**
   * Subscribe to log events for a card. Returns unsubscribe function.
   */
  onLog(cardId: string, handler: (event: LogEvent) => void): () => void {
    const eventName = `log:${cardId}`;
    this.emitter.on(eventName, handler);
    return () => this.emitter.off(eventName, handler);
  }

  /**
   * Subscribe to status change events for a card. Returns unsubscribe function.
   */
  onStatusChange(cardId: string, handler: (event: { cardId: string; status: string; error?: string }) => void): () => void {
    const eventName = `statusChange:${cardId}`;
    this.emitter.on(eventName, handler);
    return () => this.emitter.off(eventName, handler);
  }

  /**
   * Subscribe to needsInput events for a card. Returns unsubscribe function.
   */
  onNeedsInput(cardId: string, handler: (event: { cardId: string; needsInput: boolean }) => void): () => void {
    const eventName = `needsInput:${cardId}`;
    this.emitter.on(eventName, handler);
    return () => this.emitter.off(eventName, handler);
  }

  /**
   * Cancel a running card execution.
   */
  cancelRun(cardId: string): void {
    const run = this.activeRuns.get(cardId);
    if (run && run.status === "running") {
      run.abortController.abort();
      run.status = "error";
      run.error = "Cancelled by user";
      this.emitter.emit(`statusChange:${cardId}`, { cardId, status: "error", error: "Cancelled by user" });
    }
  }

  /**
   * Remove a run from memory (cleanup).
   */
  removeRun(cardId: string): void {
    this.activeRuns.delete(cardId);
  }
}

/**
 * Singleton instance of CardRunStateService.
 */
export const cardRunStateService = new CardRunStateService();
