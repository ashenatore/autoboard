import type { AutoModeSettingsRepository } from "@autoboard/db";
import { ValidationError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("SetAutoModeConcurrency");

export interface SetAutoModeConcurrencyInput {
  projectId: string;
  maxConcurrency: number;
}

export interface SetAutoModeConcurrencyResult {
  projectId: string;
  maxConcurrency: number;
}

export class SetAutoModeConcurrencyUseCase {
  constructor(private autoModeSettingsRepository: AutoModeSettingsRepository) {}

  async execute(input: SetAutoModeConcurrencyInput): Promise<SetAutoModeConcurrencyResult> {
    if (!input.projectId) {
      logger.warn("Set concurrency validation failed", {
        hasProjectId: !!input.projectId,
        maxConcurrency: input.maxConcurrency,
        validRange: "1-10"
      });
      throw new ValidationError("projectId is required");
    }
    if (input.maxConcurrency < 1 || input.maxConcurrency > 10) {
      logger.warn("Set concurrency validation failed", {
        hasProjectId: !!input.projectId,
        maxConcurrency: input.maxConcurrency,
        validRange: "1-10"
      });
      throw new ValidationError("maxConcurrency must be between 1 and 10");
    }

    await this.autoModeSettingsRepository.upsert(input.projectId, {
      maxConcurrency: input.maxConcurrency,
      updatedAt: new Date(),
    });
    logger.info("Auto mode concurrency updated", {
      projectId: input.projectId,
      maxConcurrency: input.maxConcurrency
    });
    return { projectId: input.projectId, maxConcurrency: input.maxConcurrency };
  }
}
