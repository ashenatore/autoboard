import { cardRunStateService } from "@autoboard/services";
import { ValidationError, NotFoundError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("CancelCardRun");

export interface CancelCardRunInput {
  cardId: string;
}

export interface CancelCardRunResult {
  success: boolean;
  status: "running" | "completed" | "error";
}

export class CancelCardRunUseCase {
  async execute(input: CancelCardRunInput): Promise<CancelCardRunResult> {
    if (!input.cardId) {
      logger.warn("Cancel card run validation failed", {
        hasCardId: !!input.cardId
      });
      throw new ValidationError("cardId is required");
    }

    const run = cardRunStateService.getRun(input.cardId);
    if (!run) {
      logger.warn("Cancel card run failed - no active run", {
        cardId: input.cardId
      });
      throw new NotFoundError("No active run found");
    }

    if (run.status === "running") cardRunStateService.cancelRun(input.cardId);
    const updatedRun = cardRunStateService.getRun(input.cardId);
    logger.info("Card run cancelled", {
      cardId: input.cardId,
      previousStatus: run?.status
    });
    return {
      success: true,
      status: updatedRun?.status || "error",
    };
  }
}
