import type { AutoModeSettingsRepository } from "~/db/repositories/auto-mode-settings-repository";
import { autoModeService } from "~/services/auto-mode-service";
import { ValidationError } from "./errors";

export interface ToggleAutoModeInput {
  projectId: string;
  enabled: boolean;
}

export interface ToggleAutoModeResult {
  projectId: string;
  enabled: boolean;
}

export class ToggleAutoModeUseCase {
  constructor(private autoModeSettingsRepository: AutoModeSettingsRepository) {}

  async execute(input: ToggleAutoModeInput): Promise<ToggleAutoModeResult> {
    if (!input.projectId) {
      throw new ValidationError("projectId is required");
    }

    await this.autoModeSettingsRepository.upsert(input.projectId, {
      enabled: input.enabled,
      updatedAt: new Date(),
    });

    if (input.enabled) {
      autoModeService.startLoop(input.projectId);
    } else {
      autoModeService.stopLoop(input.projectId);
    }

    return {
      projectId: input.projectId,
      enabled: input.enabled,
    };
  }
}
