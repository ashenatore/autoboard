import type { Context } from "hono";
import {
  GetProjectsUseCase,
  CreateProjectUseCase,
  DeleteProjectUseCase,
  UpdateProjectUseCase,
} from "@autoboard/domain";
import type {
  ProjectRepository,
  AutoModeSettingsRepository,
} from "@autoboard/db";
import type { IAutoModeLoop } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";
import { handleDomainError } from "../error-handler.js";

const logger = getLogger("ProjectsController");

export function createProjectsController(
  projectRepository: ProjectRepository,
  autoModeSettingsRepository: AutoModeSettingsRepository,
  autoModeLoop: IAutoModeLoop
) {
  const getProjects = new GetProjectsUseCase(projectRepository);
  const createProject = new CreateProjectUseCase(projectRepository);
  const deleteProject = new DeleteProjectUseCase(
    projectRepository,
    autoModeSettingsRepository,
    autoModeLoop
  );
  const updateProject = new UpdateProjectUseCase(projectRepository);

  return {
    async get(c: Context) {
      try {
        logger.debug("Get projects request");
        const result = await getProjects.execute();
        logger.debug("Get projects completed", { projectCount: result.projects.length });
        return c.json(result.projects);
      } catch (error) {
        logger.error("Get projects failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },

    async post(c: Context) {
      try {
        const body = await c.req.json();
        const { name, filePath } = body;

        logger.debug("Create project request", {
          hasName: !!name,
          hasFilePath: !!filePath
        });

        const result = await createProject.execute({ name, filePath });

        logger.info("Project created", {
          projectId: result.project.id,
          name: result.project.name
        });

        return c.json(result.project, 201);
      } catch (error) {
        logger.error("Create project failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },

    async patch(c: Context) {
      let projectId: string | undefined;
      try {
        const body = await c.req.json();
        const { id, name, filePath } = body;
        projectId = id;

        logger.debug("Update project request", {
          id,
          hasName: !!name,
          hasFilePath: !!filePath
        });

        const result = await updateProject.execute({ id, name, filePath });

        logger.info("Project updated", {
          id: result.project.id,
          name: result.project.name
        });

        return c.json(result.project);
      } catch (error) {
        logger.error("Update project failed", {
          id: projectId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },

    async delete(c: Context) {
      let projectId: string | undefined;
      try {
        const body = await c.req.json();
        const { id } = body;
        projectId = id;

        logger.debug("Delete project request", { id });

        const result = await deleteProject.execute({ id });

        logger.info("Project deleted", { id });

        return c.json(result);
      } catch (error) {
        logger.error("Delete project failed", {
          id: projectId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },
  };
}
