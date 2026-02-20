import type { AutoModeSettingsRepository } from "@autoboard/db";
import type { IAutoModeLoop } from "@autoboard/shared";
import { ValidationError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("ToggleAutoMode");

export interface ToggleAutoModeInput {
  projectId: string;
  enabled: boolean;
}

export interface ToggleAutoModeResult {
  projectId: string;
  enabled: boolean;
}

export class ToggleAutoModeUseCase {
  constructor(
    private autoModeSettingsRepository: AutoModeSettingsRepository,
    private autoModeLoop: IAutoModeLoop
  ) {}

  async execute(input: ToggleAutoModeInput): Promise<ToggleAutoModeResult> {
    if (!input.projectId) {
      logger.warn("Toggle auto mode validation failed", {
        hasProjectId: !!input.projectId
      });
      throw new ValidationError("projectId is required");
    }

    await this.autoModeSettingsRepository.upsert(input.projectId, {
      enabled: input.enabled,
      updatedAt: new Date(),
    });

    if (input.enabled) {
      this.autoModeLoop.startLoop(input.projectId);
    } else {
      this.autoModeLoop.stopLoop(input.projectId);
    }
    logger.info("Auto mode toggled", {
      projectId: input.projectId,
      enabled: input.enabled,
      loopAction: input.enabled ? "started" : "stopped"
    });
    return { projectId: input.projectId, enabled: input.enabled };
  }
}
