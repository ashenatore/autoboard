import type { Context } from "hono";
import {
  StartCardRunUseCase,
  GetCardRunStatusUseCase,
  CancelCardRunUseCase,
} from "@autoboard/domain";
import type { CardRepository, ProjectRepository } from "@autoboard/db";
import { getLogger } from "@autoboard/logger";
import { handleDomainError } from "../error-handler.js";

const logger = getLogger("RunCardController");

export function createRunCardController(
  cardRepository: CardRepository,
  projectRepository: ProjectRepository
) {
  const startRun = new StartCardRunUseCase(cardRepository, projectRepository);
  const getStatus = new GetCardRunStatusUseCase();
  const cancelRun = new CancelCardRunUseCase();

  return {
    async post(c: Context) {
      let cardId: string | undefined;
      try {
        const body = await c.req.json();
        const { cardId: id, prompt: overridePrompt, model } = body;
        cardId = id;

        logger.debug("Start card run request", {
          cardId: id,
          hasPrompt: !!overridePrompt,
          model
        });

        const result = await startRun.execute({
          cardId: id,
          prompt: overridePrompt,
          model,
        });

        logger.info("Card run started", {
          cardId: result.cardId,
          model,
          promptLength: result.prompt.length
        });

        return c.json(result);
      } catch (error) {
        logger.error("Start card run failed", {
          cardId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },

    async get(c: Context) {
      let cardId: string | undefined;
      try {
        const url = new URL(c.req.url);
        cardId = url.searchParams.get("cardId") || "";

        logger.debug("Get card run status request", { cardId });

        const result = await getStatus.execute({ cardId });

        logger.debug("Card run status retrieved", {
          cardId,
          status: result.status
        });

        return c.json(result);
      } catch (error) {
        logger.error("Get card run status failed", {
          cardId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },

    async delete(c: Context) {
      let cardId: string | undefined;
      try {
        const body = await c.req.json();
        const { id } = body;
        cardId = id;

        logger.debug("Cancel card run request", { cardId: id });

        const result = await cancelRun.execute({ cardId: id });

        logger.info("Card run cancelled", {
          cardId: id,
          status: result.status
        });

        return c.json(result);
      } catch (error) {
        logger.error("Cancel card run failed", {
          cardId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },
  };
}
