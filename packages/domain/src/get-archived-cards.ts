import type { Card } from "@autoboard/db";
import type { CardRepository } from "@autoboard/db";
import { ValidationError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("GetArchivedCards");

export interface GetArchivedCardsInput {
  projectId: string;
}

export interface GetArchivedCardsResult {
  cards: Card[];
}

export class GetArchivedCardsUseCase {
  constructor(private cardRepository: CardRepository) {}

  async execute(input: GetArchivedCardsInput): Promise<GetArchivedCardsResult> {
    if (!input.projectId) {
      logger.warn("Get archived cards validation failed", {
        hasProjectId: !!input.projectId
      });
      throw new ValidationError("Project ID is required");
    }
    const cards = await this.cardRepository.getArchivedCardsByProjectId(input.projectId);
    logger.debug("Archived cards retrieved", {
      projectId: input.projectId,
      cardCount: cards.length
    });
    return { cards };
  }
}
