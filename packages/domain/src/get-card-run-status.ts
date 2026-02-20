import { cardRunStateService } from "@autoboard/services";
import { ValidationError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("GetCardRunStatus");

export interface GetCardRunStatusInput {
  cardId: string;
}

export interface GetCardRunStatusResult {
  status: "not_found" | "running" | "completed" | "error";
  messageCount: number;
  messages: unknown[];
  error?: string;
}

export class GetCardRunStatusUseCase {
  async execute(input: GetCardRunStatusInput): Promise<GetCardRunStatusResult> {
    if (!input.cardId) {
      logger.warn("Get card run status validation failed", {
        hasCardId: !!input.cardId
      });
      throw new ValidationError("cardId is required");
    }

    const run = cardRunStateService.getRun(input.cardId);
    if (!run) {
      logger.debug("Card run status not found", { cardId: input.cardId });
      return { status: "not_found", messageCount: 0, messages: [] };
    }
    logger.debug("Card run status retrieved", {
      cardId: input.cardId,
      status: run.status,
      messageCount: run.messages.length
    });
    return {
      status: run.status,
      messageCount: run.messages.length,
      messages: run.messages,
      error: run.error,
    };
  }
}
