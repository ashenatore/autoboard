import { randomUUID } from "node:crypto";
import type { Card, CreateCardData } from "@autoboard/db";
import type { CardRepository } from "@autoboard/db";
import { ValidationError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("CreateCard");

export interface CreateCardInput {
  title?: string;
  description?: string;
  columnId: string;
  projectId: string;
}

export interface CreateCardResult {
  card: Card;
}

export class CreateCardUseCase {
  constructor(private cardRepository: CardRepository) {}

  async execute(input: CreateCardInput): Promise<CreateCardResult> {
    if (!input.columnId || !input.projectId) {
      logger.warn("Card validation failed", {
        hasTitle: !!input.title,
        hasDescription: !!input.description
      });
      throw new ValidationError("ColumnId and projectId are required");
    }
    if (!input.description && !input.title) {
      logger.warn("Card validation failed", {
        hasTitle: !!input.title,
        hasDescription: !!input.description
      });
      throw new ValidationError("Either title or description is required");
    }

    const id = randomUUID();
    const now = new Date();
    const cardData: CreateCardData = {
      id,
      title: input.title || null,
      description: input.description || null,
      columnId: input.columnId,
      projectId: input.projectId,
      createdAt: now,
      updatedAt: now,
    };

    const card = await this.cardRepository.createCard(cardData);
    logger.debug("Card created in repository", {
      id,
      columnId: input.columnId,
      projectId: input.projectId
    });
    return { card };
  }
}
