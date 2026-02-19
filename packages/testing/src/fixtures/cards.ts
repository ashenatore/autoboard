import type { Card, CreateCardData } from '@autoboard/db';

/**
 * Test fixture helpers for Card entities.
 */
export class CardFixture {
  /**
   * Create a minimal card for testing.
   */
  static create(overrides: Partial<Card> = {}): Card {
    const now = new Date();
    return {
      id: overrides.id || 'test-card-id',
      title: overrides.title !== undefined ? overrides.title : 'Test Card',
      description: overrides.description !== undefined ? overrides.description : 'Test description',
      columnId: overrides.columnId || 'todo',
      projectId: overrides.projectId || 'test-project-id',
      sessionId: overrides.sessionId || null,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      archivedAt: overrides.archivedAt || null,
    };
  }

  /**
   * Create card data for insertion.
   */
  static createData(overrides: Partial<CreateCardData> = {}): CreateCardData {
    const now = new Date();
    return {
      id: overrides.id || 'test-card-id',
      title: overrides.title !== undefined ? overrides.title : 'Test Card',
      description: overrides.description !== undefined ? overrides.description : 'Test description',
      columnId: overrides.columnId || 'todo',
      projectId: overrides.projectId || 'test-project-id',
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
    };
  }

  /**
   * Create multiple cards with incremental IDs.
   */
  static createMany(count: number, overrides: Partial<Card> = {}): Card[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({
        ...overrides,
        id: `test-card-${i}`,
      })
    );
  }
}
