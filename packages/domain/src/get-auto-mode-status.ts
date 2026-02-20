import type { AutoModeSettingsRepository } from "@autoboard/db";
import type { IAutoModeLoop } from "@autoboard/shared";
import { ValidationError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("GetAutoModeStatus");

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
  constructor(
    private autoModeSettingsRepository: AutoModeSettingsRepository,
    private autoModeLoop: IAutoModeLoop
  ) {}

  async execute(input: GetAutoModeStatusInput): Promise<GetAutoModeStatusResult> {
    if (!input.projectId) {
      logger.warn("Get auto mode status validation failed", {
        hasProjectId: !!input.projectId
      });
      throw new ValidationError("projectId is required");
    }

    const settings = await this.autoModeSettingsRepository.getByProjectId(input.projectId);
    const loopStatus = this.autoModeLoop.getStatus(input.projectId);

    const enabled = settings?.enabled ?? false;
    const loopRunning = loopStatus.loopRunning;
    const activeRunCount = loopStatus.activeRunCount;

    logger.debug("Auto mode status retrieved", {
      projectId: input.projectId,
      enabled,
      loopRunning,
      activeRunCount
    });

    return {
      projectId: input.projectId,
      enabled,
      maxConcurrency: settings?.maxConcurrency ?? 1,
      loopRunning,
      activeRunCount,
      activeCardIds: loopStatus.activeCardIds,
    };
  }
}
