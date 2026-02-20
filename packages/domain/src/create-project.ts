import { randomUUID } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import type { Project, CreateProjectData } from "@autoboard/db";
import type { ProjectRepository } from "@autoboard/db";
import { ValidationError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("CreateProject");

export interface CreateProjectInput {
  name: string;
  filePath: string;
}

export interface CreateProjectResult {
  project: Project;
}

export class CreateProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectResult> {
    if (!input.name || !input.filePath) {
      logger.warn("Create project validation failed", {
        hasName: !!input.name,
        hasFilePath: !!input.filePath
      });
      throw new ValidationError("Name and filePath are required");
    }
    if (!existsSync(input.filePath)) {
      const existedBefore = existsSync(input.filePath);
      mkdirSync(input.filePath, { recursive: true });
      logger.debug("Project directory created", {
        filePath: input.filePath,
        existed: existedBefore
      });
    }

    const id = randomUUID();
    const now = new Date();
    const projectData: CreateProjectData = {
      id,
      name: input.name,
      filePath: input.filePath,
      createdAt: now,
      updatedAt: now,
    };
    const project = await this.projectRepository.createProject(projectData);
    logger.info("Project created", {
      id,
      name: input.name
    });
    return { project };
  }
}
