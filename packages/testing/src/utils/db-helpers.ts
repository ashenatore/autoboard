// Database helpers are temporarily disabled due to build issues
// These can be re-implemented when needed for integration tests

export interface TestDatabase {
  db: any;
  cleanup: () => void;
}

/**
 * Create an in-memory SQLite database for testing.
 * This is faster than file-based databases and isolated between tests.
 */
export function createInMemoryDatabase(): TestDatabase {
  // TODO: Re-implement with proper database setup
  return {
    db: null,
    cleanup: () => {},
  };
}

/**
 * Create a file-based SQLite database for testing.
 * Useful for tests that need to persist data across test runs.
 */
export function createFileDatabase(_testName: string): TestDatabase {
  // TODO: Re-implement with proper database setup
  return {
    db: null,
    cleanup: () => {},
  };
}

/**
 * Clean all tables in the database.
 * Useful for resetting database state between tests.
 */
export async function cleanDatabase(_db: any): Promise<void> {
  // TODO: Re-implement with proper database setup
}

/**
 * Seed the database with test data.
 */
export async function seedDatabase(
  _db: any,
  _data: {
    projects?: any[];
    cards?: any[];
    logs?: any[];
  }
): Promise<void> {
  // TODO: Re-implement with proper database setup
}
