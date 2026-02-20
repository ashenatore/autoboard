import type { Context } from "hono";
import { GenerateCardTitleUseCase } from "@autoboard/domain";
import type { CardRepository, ProjectRepository } from "@autoboard/db";
import { claudeProvider } from "@autoboard/services";
import { getLogger } from "@autoboard/logger";
import { handleDomainError } from "../error-handler.js";

const logger = getLogger("GenerateTitleController");

export function createGenerateTitleController(
  cardRepository: CardRepository,
  projectRepository: ProjectRepository
) {
  const useCase = new GenerateCardTitleUseCase(
    cardRepository,
    projectRepository,
    claudeProvider
  );

  return {
    async post(c: Context) {
      let cardId: string | undefined;
      try {
        const body = await c.req.json();
        const { id } = body;
        cardId = id;

        logger.debug("Generate title request", { cardId: id });

        const result = await useCase.execute({ cardId: id });

        logger.info("Title generated", {
          cardId: id,
          titleLength: result.title.length
        });

        return c.json({ title: result.title, card: result.card });
      } catch (error) {
        logger.error("Generate title failed", {
          cardId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },
  };
}
