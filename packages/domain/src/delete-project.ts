import type { ProjectRepository } from "@autoboard/db";
import type { AutoModeSettingsRepository } from "@autoboard/db";
import type { IAutoModeLoop } from "@autoboard/shared";
import { ValidationError, NotFoundError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("DeleteProject");

export interface DeleteProjectInput {
  id: string;
}

export interface DeleteProjectResult {
  success: boolean;
}

export class DeleteProjectUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private autoModeSettingsRepository?: AutoModeSettingsRepository,
    private autoModeLoop?: IAutoModeLoop
  ) {}

  async execute(input: DeleteProjectInput): Promise<DeleteProjectResult> {
    if (!input.id) {
      logger.warn("Delete project validation failed", { hasId: !!input.id });
      throw new ValidationError("Project ID is required");
    }

    const existingProject = await this.projectRepository.getProjectById(input.id);
    if (!existingProject) {
      logger.warn("Delete project failed - project not found", { id: input.id });
      throw new NotFoundError("Project not found");
    }

    if (this.autoModeLoop) {
      logger.debug("Stopping auto mode loop for project", { id: input.id });
      this.autoModeLoop.stopLoop(input.id);
    }
    if (this.autoModeSettingsRepository) {
      await this.autoModeSettingsRepository.deleteByProjectId(input.id);
    }

    await this.projectRepository.deleteCardsByProjectId(input.id);
    await this.projectRepository.deleteProject(input.id);
    logger.info("Project deleted", {
      id: input.id,
      hadAutoModeSettings: true
    });
    return { success: true };
  }
}
