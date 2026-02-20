import type { Project } from "@autoboard/db";
import type { ProjectRepository } from "@autoboard/db";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("GetProjects");

export interface GetProjectsResult {
  projects: Project[];
}

export class GetProjectsUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(): Promise<GetProjectsResult> {
    const projects = await this.projectRepository.getAllProjects();
    logger.debug("Projects retrieved", { projectCount: projects.length });
    return { projects };
  }
}
