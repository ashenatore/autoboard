import type { Project, CreateProjectData } from '@autoboard/db';

/**
 * Test fixture helpers for Project entities.
 */
export class ProjectFixture {
  /**
   * Create a minimal project for testing.
   */
  static create(overrides: Partial<Project> = {}): Project {
    const now = new Date();
    return {
      id: overrides.id || 'test-project-id',
      name: overrides.name || 'Test Project',
      filePath: overrides.filePath || '/test/path',
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
    };
  }

  /**
   * Create project data for insertion.
   */
  static createData(overrides: Partial<CreateProjectData> = {}): CreateProjectData {
    const now = new Date();
    return {
      id: overrides.id || 'test-project-id',
      name: overrides.name || 'Test Project',
      filePath: overrides.filePath || '/test/path',
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
    };
  }

  /**
   * Create multiple projects with incremental IDs.
   */
  static createMany(count: number, overrides: Partial<Project> = {}): Project[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({
        ...overrides,
        id: `test-project-${i}`,
      })
    );
  }
}
