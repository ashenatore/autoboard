import type { Card } from "@autoboard/db";
import type { CardRepository } from "@autoboard/db";
import { ValidationError, NotFoundError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("ArchiveCard");

export interface ArchiveCardInput {
  id: string;
}

export interface ArchiveCardResult {
  card: Card;
}

export class ArchiveCardUseCase {
  constructor(private cardRepository: CardRepository) {}

  async execute(input: ArchiveCardInput): Promise<ArchiveCardResult> {
    if (!input.id) {
      logger.warn("Archive card validation failed", { hasId: !!input.id });
      throw new ValidationError("Card ID is required");
    }

    const existing = await this.cardRepository.getCardById(input.id);
    if (!existing) {
      logger.warn("Archive card failed - card not found", { id: input.id });
      throw new NotFoundError("Card not found");
    }

    const card = await this.cardRepository.updateCard(input.id, {
      archivedAt: new Date(),
      updatedAt: new Date(),
    });
    logger.info("Card archived", {
      id: input.id,
      columnId: card.columnId
    });
    return { card };
  }
}
