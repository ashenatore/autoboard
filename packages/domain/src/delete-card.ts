import type { CardRepository } from "@autoboard/db";
import { ValidationError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("DeleteCard");

export interface DeleteCardInput {
  id: string;
}

export interface DeleteCardResult {
  success: boolean;
}

export class DeleteCardUseCase {
  constructor(private cardRepository: CardRepository) {}

  async execute(input: DeleteCardInput): Promise<DeleteCardResult> {
    if (!input.id) {
      logger.warn("Delete card validation failed", { hasId: !!input.id });
      throw new ValidationError("Card ID is required");
    }
    await this.cardRepository.deleteCard(input.id);
    logger.info("Card deleted from repository", { id: input.id });
    return { success: true };
  }
}
