import type {
  AutoModeSettings,
  UpdateAutoModeData,
} from '@autoboard/db';

/**
 * Mock implementation of AutoModeSettingsRepository for testing.
 */
export class MockAutoModeSettingsRepository {
  public settings: Map<string, AutoModeSettings> = new Map();
  public upsertCalls: Array<{ projectId: string; data: UpdateAutoModeData }> = [];
  public getByProjectIdCalls: string[] = [];

  async getByProjectId(projectId: string): Promise<AutoModeSettings | null> {
    this.getByProjectIdCalls.push(projectId);
    return this.settings.get(projectId) || null;
  }

  async upsert(
    projectId: string,
    data: UpdateAutoModeData
  ): Promise<AutoModeSettings> {
    const existing = this.settings.get(projectId);
    const settings: AutoModeSettings = {
      projectId,
      enabled: data.enabled ?? existing?.enabled ?? false,
      maxConcurrency: data.maxConcurrency ?? existing?.maxConcurrency ?? 1,
      updatedAt: data.updatedAt,
    };
    this.settings.set(projectId, settings);
    this.upsertCalls.push({ projectId, data });
    return settings;
  }

  reset(): void {
    this.settings.clear();
    this.upsertCalls = [];
    this.getByProjectIdCalls = [];
  }
}
