import type { AutoModeSettingsRepository } from "~/db/repositories/auto-mode-settings-repository";
import { autoModeService } from "~/services/auto-mode-service";
import { ValidationError } from "./errors";

export interface GetAutoModeStatusInput {
  projectId: string;
}

export interface GetAutoModeStatusResult {
  projectId: string;
  enabled: boolean;
  maxConcurrency: number;
  loopRunning: boolean;
  activeRunCount: number;
  activeCardIds: string[];
}

export class GetAutoModeStatusUseCase {
  constructor(private autoModeSettingsRepository: AutoModeSettingsRepository) {}

  async execute(input: GetAutoModeStatusInput): Promise<GetAutoModeStatusResult> {
    if (!input.projectId) {
      throw new ValidationError("projectId is required");
    }

    const settings = await this.autoModeSettingsRepository.getByProjectId(input.projectId);
    const loopStatus = autoModeService.getStatus(input.projectId);

    return {
      projectId: input.projectId,
      enabled: settings?.enabled ?? false,
      maxConcurrency: settings?.maxConcurrency ?? 1,
      loopRunning: loopStatus.loopRunning,
      activeRunCount: loopStatus.activeRunCount,
      activeCardIds: loopStatus.activeCardIds,
    };
  }
}
