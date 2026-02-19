import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteProjectUseCase } from '../delete-project';
import {
  MockProjectRepository,
  ProjectFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe('DeleteProjectUseCase', () => {
  let projectRepository: MockProjectRepository;
  let useCase: DeleteProjectUseCase;

  beforeEach(() => {
    projectRepository = new MockProjectRepository();
    useCase = new DeleteProjectUseCase(projectRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if projectId is missing', async () => {
      await expect(
        useCase.execute({ id: '' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('project lookup', () => {
    it('should throw NotFoundError if project does not exist', async () => {
      await expect(
        useCase.execute({ id: 'non-existent-project' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('successful deletion', () => {
    it('should delete existing project', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      await useCase.execute({ id: project.id });

      expect(projectRepository.deleteCalls).toContain(project.id);
      const deletedProject = await projectRepository.getProjectById(project.id);
      expect(deletedProject).toBeNull();
    });

    it('should call deleteCardsByProjectId before deleting project', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      // Track method calls
      const deleteOrder: string[] = [];
      const originalDeleteCardsByProjectId = projectRepository.deleteCardsByProjectId.bind(projectRepository);
      projectRepository.deleteCardsByProjectId = async (id) => {
        deleteOrder.push(`deleteCards-${id}`);
        return originalDeleteCardsByProjectId(id);
      };

      const originalDeleteProject = projectRepository.deleteProject.bind(projectRepository);
      projectRepository.deleteProject = async (id) => {
        deleteOrder.push(`deleteProject-${id}`);
        return originalDeleteProject(id);
      };

      await useCase.execute({ id: project.id });

      // Verify both methods were called
      expect(deleteOrder).toHaveLength(2);
      expect(deleteOrder[0]).toContain('deleteCards');
      expect(deleteOrder[1]).toContain('deleteProject');
    });

    it('should return success confirmation', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({ id: project.id });

      expect(result).toMatchObject({
        success: true,
      });
    });

    it('should call projectRepository.deleteProject exactly once', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      await useCase.execute({ id: project.id });

      expect(projectRepository.deleteCalls).toHaveLength(1);
    });
  });

  describe('idempotency', () => {
    it('should throw NotFoundError on second deletion attempt', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      // First deletion succeeds
      await useCase.execute({ id: project.id });

      // Second deletion fails
      await expect(
        useCase.execute({ id: project.id })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
