import type { ProjectRepository } from "~/db/repositories/project-repository";
import type { AutoModeSettingsRepository } from "~/db/repositories/auto-mode-settings-repository";
import { autoModeService } from "~/services/auto-mode-service";
import { ValidationError, NotFoundError } from "./errors";

export interface DeleteProjectInput {
  id: string;
}

export interface DeleteProjectResult {
  success: boolean;
}

export class DeleteProjectUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private autoModeSettingsRepository?: AutoModeSettingsRepository
  ) {}

  async execute(input: DeleteProjectInput): Promise<DeleteProjectResult> {
    if (!input.id) {
      throw new ValidationError("Project ID is required");
    }

    // Check if project exists first
    const existingProject = await this.projectRepository.getProjectById(input.id);
    if (!existingProject) {
      throw new NotFoundError("Project not found");
    }

    // Stop auto mode loop if running
    autoModeService.stopLoop(input.id);

    // Delete auto mode settings
    if (this.autoModeSettingsRepository) {
      await this.autoModeSettingsRepository.deleteByProjectId(input.id);
    }

    // Delete all cards associated with this project first (cascading delete)
    await this.projectRepository.deleteCardsByProjectId(input.id);

    // Then delete the project itself
    await this.projectRepository.deleteProject(input.id);

    return { success: true };
  }
}
