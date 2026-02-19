import type { CardLog, CardLogType } from '@autoboard/db';

/**
 * Test fixture helpers for CardLog entities.
 */
export class CardLogFixture {
  /**
   * Create a minimal card log for testing.
   */
  static create(overrides: Partial<CardLog> = {}): CardLog {
    const now = new Date();
    return {
      id: overrides.id || 'test-log-id',
      cardId: overrides.cardId || 'test-card-id',
      type: overrides.type || 'system',
      content: overrides.content || 'Test log content',
      sequence: overrides.sequence || 1,
      createdAt: overrides.createdAt || now,
    };
  }

  /**
   * Create logs with specific types.
   */
  static createWithType(
    type: CardLogType,
    content: string,
    overrides: Partial<CardLog> = {}
  ): CardLog {
    return this.create({ type, content, ...overrides });
  }

  /**
   * Create multiple logs with incremental sequences.
   */
  static createMany(
    cardId: string,
    count: number,
    overrides: Partial<CardLog> = {}
  ): CardLog[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({
        ...overrides,
        id: `test-log-${i}`,
        cardId,
        sequence: i + 1,
      })
    );
  }
}
