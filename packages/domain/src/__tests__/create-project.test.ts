import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateProjectUseCase } from '../create-project';
import {
  MockProjectRepository,
  ProjectFixture,
} from '@autoboard/testing';
import { ValidationError } from '@autoboard/shared';

// Mock fs modules to avoid permission errors
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
}));

describe('CreateProjectUseCase', () => {
  let projectRepository: MockProjectRepository;
  let useCase: CreateProjectUseCase;

  beforeEach(() => {
    projectRepository = new MockProjectRepository();
    useCase = new CreateProjectUseCase(projectRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if name is missing', async () => {
      await expect(
        useCase.execute({
          name: '',
          filePath: '/test/path',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if filePath is missing', async () => {
      await expect(
        useCase.execute({
          name: 'Test Project',
          filePath: '',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('successful creation', () => {
    it('should create project with valid data', async () => {
      const result = await useCase.execute({
        name: 'Test Project',
        filePath: '/test/path',
      });

      expect(result.project).toMatchObject({
        id: expect.any(String),
        name: 'Test Project',
        filePath: '/test/path',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const before = new Date();

      const result = await useCase.execute({
        name: 'Test Project',
        filePath: '/test/path',
      });

      const after = new Date();

      expect(result.project.createdAt).toBeInstanceOf(Date);
      expect(result.project.updatedAt).toBeInstanceOf(Date);
      expect(result.project.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.project.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(result.project.updatedAt.getTime()).toBe(result.project.createdAt.getTime());
    });

    it('should generate unique ID for each project', async () => {
      const project1 = await useCase.execute({
        name: 'Project 1',
        filePath: '/path1',
      });

      const project2 = await useCase.execute({
        name: 'Project 2',
        filePath: '/path2',
      });

      expect(project1.project.id).not.toBe(project2.project.id);
    });
  });

  describe('repository interaction', () => {
    it('should call projectRepository.createProject with correct data', async () => {
      await useCase.execute({
        name: 'Test Project',
        filePath: '/test/path',
      });

      expect(projectRepository.createCalls).toHaveLength(1);
      const createdProject = projectRepository.createCalls[0];
      expect(createdProject.name).toBe('Test Project');
      expect(createdProject.filePath).toBe('/test/path');
    });
  });

  describe('file path handling', () => {
    it('should accept absolute paths', async () => {
      const result = await useCase.execute({
        name: 'Test Project',
        filePath: '/absolute/path/to/project',
      });

      expect(result.project.filePath).toBe('/absolute/path/to/project');
    });

    it('should accept relative paths', async () => {
      const result = await useCase.execute({
        name: 'Test Project',
        filePath: './relative/path',
      });

      expect(result.project.filePath).toBe('./relative/path');
    });

    it('should accept paths with spaces', async () => {
      const result = await useCase.execute({
        name: 'Test Project',
        filePath: '/path with spaces/project',
      });

      expect(result.project.filePath).toBe('/path with spaces/project');
    });
  });

  describe('project name handling', () => {
    it('should accept names with special characters', async () => {
      const result = await useCase.execute({
        name: 'Project-Name_123',
        filePath: '/test/path',
      });

      expect(result.project.name).toBe('Project-Name_123');
    });

    it('should accept names with spaces', async () => {
      const result = await useCase.execute({
        name: 'My Test Project',
        filePath: '/test/path',
      });

      expect(result.project.name).toBe('My Test Project');
    });
  });
});
