import type { Context } from "hono";
import {
  GetCardsUseCase,
  CreateCardUseCase,
  UpdateCardUseCase,
  DeleteCardUseCase,
  GetArchivedCardsUseCase,
} from "@autoboard/domain";
import type { CardRepository } from "@autoboard/db";
import { getLogger } from "@autoboard/logger";
import { handleDomainError } from "../error-handler.js";

const logger = getLogger("CardsController");

export function createCardsController(cardRepository: CardRepository) {
  const getCards = new GetCardsUseCase(cardRepository);
  const createCard = new CreateCardUseCase(cardRepository);
  const updateCard = new UpdateCardUseCase(cardRepository);
  const deleteCard = new DeleteCardUseCase(cardRepository);
  const getArchivedCards = new GetArchivedCardsUseCase(cardRepository);

  return {
    async get(c: Context) {
      try {
        const url = new URL(c.req.url);
        const projectId = url.searchParams.get("projectId") || undefined;
        const archived = url.searchParams.get("archived");

        logger.debug("Get cards request", {
          method: c.req.method,
          path: c.req.path,
          projectId
        });

        if (archived === "true" && projectId) {
          const result = await getArchivedCards.execute({ projectId });
          logger.debug("Get cards completed", {
            cardCount: result.cards.length,
            archived
          });
          return c.json(result.cards);
        }
        const result = await getCards.execute({ projectId });
        logger.debug("Get cards completed", {
          cardCount: result.cards.length,
          archived
        });
        return c.json(result.cards);
      } catch (error) {
        return handleDomainError(error, c);
      }
    },

    async post(c: Context) {
      try {
        const body = await c.req.json();
        const { title, description, columnId, projectId } = body;

        logger.debug("Create card request", {
          hasTitle: !!title,
          hasDescription: !!description,
          columnId,
          projectId
        });

        const result = await createCard.execute({
          title,
          description,
          columnId,
          projectId,
        });

        logger.info("Card created", {
          cardId: result.card.id,
          columnId: result.card.columnId
        });

        return c.json(result.card, 201);
      } catch (error) {
        logger.error("Create card failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },

    async patch(c: Context) {
      let cardId: string | undefined;
      try {
        const body = await c.req.json();
        const { id, columnId, title, description, archivedAt } = body;
        cardId = id;

        logger.debug("Update card request", {
          id,
          hasColumnId: columnId !== undefined,
          hasTitle: !!title,
          hasDescription: !!description,
          hasArchivedAt: archivedAt !== undefined
        });

        const result = await updateCard.execute({
          id,
          columnId,
          title,
          description,
          archivedAt: archivedAt ? new Date(archivedAt) : undefined,
        });

        logger.info("Card updated", {
          id: result.card.id,
          columnId: result.card.columnId
        });

        return c.json(result.card);
      } catch (error) {
        logger.error("Update card failed", {
          id: cardId,
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

        logger.debug("Delete card request", { id });

        const result = await deleteCard.execute({ id });

        logger.info("Card deleted", { id });

        return c.json(result);
      } catch (error) {
        logger.error("Delete card failed", {
          id: cardId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },
  };
}
