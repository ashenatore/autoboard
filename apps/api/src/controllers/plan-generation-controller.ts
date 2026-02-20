import type { Context } from "hono";
import { GeneratePlanUseCase } from "@autoboard/domain";
import type { CardRepository, ProjectRepository } from "@autoboard/db";
import { getLogger } from "@autoboard/logger";
import { handleDomainError } from "../error-handler.js";

const logger = getLogger("PlanGenerationController");

const generatingProjects = new Set<string>();
const abortControllers = new Map<string, AbortController>();

export function createPlanGenerationController(
  cardRepository: CardRepository,
  projectRepository: ProjectRepository
) {
  const generatePlan = new GeneratePlanUseCase(
    cardRepository,
    projectRepository
  );

  return {
    async post(c: Context) {
      const body = await c.req.json();
      const { projectId, description } = body;
      if (!projectId) {
        return c.json({ error: "projectId is required" }, 400);
      }

      const abortController = new AbortController();
      abortControllers.set(projectId, abortController);
      generatingProjects.add(projectId);

      logger.info("Plan generation started", {
        projectId,
        descriptionLength: description.length
      });

      try {
        const result = await generatePlan.execute({
          projectId,
          description,
          abortController,
        });

        logger.info("Plan generation completed", {
          projectId,
          cardsCreated: result.cards.length
        });

        return c.json({ cards: result.cards });
      } catch (error) {
        logger.error("Plan generation failed", {
          projectId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      } finally {
        abortControllers.delete(projectId);
        generatingProjects.delete(projectId);
      }
    },

    get(c: Context) {
      const url = new URL(c.req.url);
      const projectId = url.searchParams.get("projectId") ?? "";
      return c.json({
        isGenerating: projectId ? generatingProjects.has(projectId) : false,
      });
    },

    async delete(c: Context) {
      let projectId: string | undefined;
      try {
        const body = await c.req.json();
        const { id } = body;
        projectId = id;
        if (!id) {
          return c.json({ error: "projectId is required" }, 400);
        }

        logger.debug("Cancel plan generation request", { projectId: id });

        const controller = abortControllers.get(id);
        if (controller) {
          controller.abort();
          abortControllers.delete(id);
          generatingProjects.delete(id);
        }

        logger.info("Plan generation cancelled", { projectId: id });

        return c.json({ success: true });
      } catch (error) {
        logger.error("Cancel plan generation failed", {
          projectId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },
  };
}
