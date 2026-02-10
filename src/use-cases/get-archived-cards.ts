import type { Card } from "~/db/types";
import type { CardRepository } from "~/db/repositories/card-repository";
import { ValidationError } from "./errors";

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
      throw new ValidationError("Project ID is required");
    }

    const cards = await this.cardRepository.getArchivedCardsByProjectId(
      input.projectId
    );

    return { cards };
  }
}
