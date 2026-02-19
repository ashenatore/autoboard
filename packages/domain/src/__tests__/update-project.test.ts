import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateProjectUseCase } from '../update-project';
import {
  MockProjectRepository,
  ProjectFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

// Mock fs modules to avoid permission errors
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
}));

describe('UpdateProjectUseCase', () => {
  let projectRepository: MockProjectRepository;
  let useCase: UpdateProjectUseCase;

  beforeEach(() => {
    projectRepository = new MockProjectRepository();
    useCase = new UpdateProjectUseCase(projectRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if projectId is missing', async () => {
      await expect(
        useCase.execute({
          id: '',
          name: 'New Name',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('project lookup', () => {
    it('should throw NotFoundError if project does not exist', async () => {
      await expect(
        useCase.execute({
          id: 'non-existent-project',
          name: 'New Name',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('successful updates', () => {
    it('should update name', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        id: project.id,
        name: 'Updated Name',
      });

      expect(result.project.name).toBe('Updated Name');
      expect(result.project.updatedAt).toBeInstanceOf(Date);
    });

    it('should update filePath', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        id: project.id,
        filePath: '/new/path',
      });

      expect(result.project.filePath).toBe('/new/path');
    });

    it('should update multiple fields', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        id: project.id,
        name: 'New Name',
        filePath: '/new/path',
      });

      expect(result.project.name).toBe('New Name');
      expect(result.project.filePath).toBe('/new/path');
    });

    it('should update updatedAt timestamp', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());
      const originalUpdatedAt = project.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await useCase.execute({
        id: project.id,
        name: 'Updated',
      });

      expect(result.project.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not modify other fields', async () => {
      const project = await projectRepository.createProject(
        ProjectFixture.createData({
          name: 'Original Name',
          filePath: '/original/path',
        })
      );

      const result = await useCase.execute({
        id: project.id,
        name: 'New Name',
      });

      expect(result.project.name).toBe('New Name');
      expect(result.project.filePath).toBe('/original/path');
      expect(result.project.id).toBe(project.id);
      expect(result.project.createdAt).toEqual(project.createdAt);
    });
  });

  describe('repository interaction', () => {
    it('should call projectRepository.updateProject with correct data', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      await useCase.execute({
        id: project.id,
        name: 'New Name',
        filePath: '/new/path',
      });

      expect(projectRepository.updateCalls).toHaveLength(1);
      const updateCall = projectRepository.updateCalls[0];
      expect(updateCall.id).toBe(project.id);
      expect(updateCall.updates.name).toBe('New Name');
      expect(updateCall.updates.filePath).toBe('/new/path');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string name', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        id: project.id,
        name: '',
      });

      expect(result.project.name).toBe('');
    });

    it('should handle empty string filePath', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        id: project.id,
        filePath: '',
      });

      expect(result.project.filePath).toBe('');
    });
  });
});
