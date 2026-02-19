import { randomUUID } from 'node:crypto';
import type { CardLog } from '@autoboard/db';

/**
 * Mock implementation of CardLogRepository for testing.
 * Stores data in memory and tracks method calls for assertion.
 */
export class MockCardLogRepository {
  public logs: Map<string, CardLog> = new Map();
  public createCalls: Omit<CardLog, 'id'>[] = [];
  public deleteCalls: string[] = [];

  async createLog(data: {
    id?: string;
    cardId: string;
    type: CardLog['type'];
    content: string;
    sequence: number;
    createdAt: Date;
  }): Promise<CardLog> {
    const log: CardLog = {
      id: data.id || randomUUID(),
      cardId: data.cardId,
      type: data.type,
      content: data.content,
      sequence: data.sequence,
      createdAt: data.createdAt,
    };
    this.logs.set(log.id, log);
    this.createCalls.push(data);
    return log;
  }

  async getLogsByCardId(cardId: string): Promise<CardLog[]> {
    return Array.from(this.logs.values())
      .filter((log) => log.cardId === cardId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async getLogsAfterSequence(cardId: string, afterSequence: number): Promise<CardLog[]> {
    return Array.from(this.logs.values())
      .filter((log) => log.cardId === cardId && log.sequence > afterSequence)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async deleteLogsByCardId(cardId: string): Promise<void> {
    for (const [id, log] of this.logs) {
      if (log.cardId === cardId) {
        this.logs.delete(id);
      }
    }
    this.deleteCalls.push(cardId);
  }

  reset(): void {
    this.logs.clear();
    this.createCalls = [];
    this.deleteCalls = [];
  }
}
