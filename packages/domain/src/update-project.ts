import { mkdirSync, existsSync } from "node:fs";
import type { Project, UpdateProjectData } from "@autoboard/db";
import type { ProjectRepository } from "@autoboard/db";
import { ValidationError, NotFoundError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("UpdateProject");

export interface UpdateProjectInput {
  id: string;
  name?: string;
  filePath?: string;
}

export interface UpdateProjectResult {
  project: Project;
}

export class UpdateProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: UpdateProjectInput): Promise<UpdateProjectResult> {
    if (!input.id) {
      logger.warn("Update project validation failed", { hasId: !!input.id });
      throw new ValidationError("Project ID is required");
    }

    const updateData: UpdateProjectData = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.filePath !== undefined) {
      if (!existsSync(input.filePath)) mkdirSync(input.filePath, { recursive: true });
      updateData.filePath = input.filePath;
      logger.debug("Project directory verified/created", {
        filePath: input.filePath
      });
    }

    try {
      const project = await this.projectRepository.updateProject(input.id, updateData);
      logger.debug("Project updated in repository", {
        id: input.id,
        hasName: input.name !== undefined,
        hasFilePath: input.filePath !== undefined
      });
      return { project };
    } catch (error) {
      if (error instanceof Error && error.message === "Project not found") {
        throw new NotFoundError("Project not found");
      }
      throw error;
    }
  }
}
