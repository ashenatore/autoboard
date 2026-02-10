import type { Card } from "~/db/types";
import type { CardRepository } from "~/db/repositories/card-repository";
import { ValidationError, NotFoundError } from "./errors";

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
      throw new ValidationError("Card ID is required");
    }

    const existing = await this.cardRepository.getCardById(input.id);
    if (!existing) {
      throw new NotFoundError("Card not found");
    }

    const card = await this.cardRepository.updateCard(input.id, {
      archivedAt: new Date(),
      updatedAt: new Date(),
    });

    return { card };
  }
}
