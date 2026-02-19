import { describe, it, expect, beforeEach } from 'vitest';
import { GetProjectsUseCase } from '../get-projects';
import {
  MockProjectRepository,
  ProjectFixture,
} from '@autoboard/testing';

describe('GetProjectsUseCase', () => {
  let projectRepository: MockProjectRepository;
  let useCase: GetProjectsUseCase;

  beforeEach(() => {
    projectRepository = new MockProjectRepository();
    useCase = new GetProjectsUseCase(projectRepository);
  });

  describe('getting all projects', () => {
    it('should return empty array when no projects exist', async () => {
      const result = await useCase.execute();

      expect(result.projects).toEqual([]);
    });

    it('should return all projects', async () => {
      await projectRepository.createProject(
        ProjectFixture.createData({ id: 'proj-1', name: 'Project 1' })
      );
      await projectRepository.createProject(
        ProjectFixture.createData({ id: 'proj-2', name: 'Project 2' })
      );
      await projectRepository.createProject(
        ProjectFixture.createData({ id: 'proj-3', name: 'Project 3' })
      );

      const result = await useCase.execute();

      expect(result.projects).toHaveLength(3);
      expect(result.projects.map((p) => p.name)).toEqual(['Project 1', 'Project 2', 'Project 3']);
    });

    it('should preserve repository order', async () => {
      await projectRepository.createProject(
        ProjectFixture.createData({ id: 'proj-1', name: 'First Project' })
      );
      await projectRepository.createProject(
        ProjectFixture.createData({ id: 'proj-2', name: 'Second Project' })
      );
      await projectRepository.createProject(
        ProjectFixture.createData({ id: 'proj-3', name: 'Third Project' })
      );

      const result = await useCase.execute();

      expect(result.projects.map((p) => p.name)).toEqual([
        'First Project',
        'Second Project',
        'Third Project',
      ]);
    });
  });

  describe('project properties', () => {
    it('should include all project fields', async () => {
      const projectData = ProjectFixture.createData({
        name: 'Test Project',
        filePath: '/test/path',
      });
      await projectRepository.createProject(projectData);

      const result = await useCase.execute();

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0]).toMatchObject({
        id: projectData.id,
        name: 'Test Project',
        filePath: '/test/path',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
