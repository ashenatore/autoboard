import { describe, it, expect } from 'vitest';
import { MockProjectRepository } from '@autoboard/testing';
import type { CreateProjectData, UpdateProjectData } from '@autoboard/db';

describe('MockProjectRepository', () => {
  let repo: MockProjectRepository;

  beforeEach(() => {
    repo = new MockProjectRepository();
  });

  describe('getAllProjects', () => {
    it('should return empty array initially', async () => {
      const projects = await repo.getAllProjects();
      expect(projects).toEqual([]);
    });

    it('should return all projects', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Project 1',
        filePath: '/path/1',
        createdAt: now,
        updatedAt: now,
      });

      await repo.createProject({
        id: 'proj-2',
        name: 'Project 2',
        filePath: '/path/2',
        createdAt: now,
        updatedAt: now,
      });

      const projects = await repo.getAllProjects();
      expect(projects).toHaveLength(2);
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Test Project',
        filePath: '/path',
        createdAt: now,
        updatedAt: now,
      });

      const project = await repo.getProjectById('proj-1');
      expect(project).toBeDefined();
      expect(project?.id).toBe('proj-1');
      expect(project?.name).toBe('Test Project');
    });

    it('should return null for non-existent project', async () => {
      const project = await repo.getProjectById('non-existent');
      expect(project).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should create project with all fields', async () => {
      const now = new Date();
      const data: CreateProjectData = {
        id: 'proj-1',
        name: 'New Project',
        filePath: '/path/to/project',
        createdAt: now,
        updatedAt: now,
      };

      const project = await repo.createProject(data);

      expect(project.id).toBe('proj-1');
      expect(project.name).toBe('New Project');
      expect(project.filePath).toBe('/path/to/project');
      expect(project.createdAt).toEqual(now);
      expect(project.updatedAt).toEqual(now);
    });

    it('should track create calls', async () => {
      const now = new Date();
      const data: CreateProjectData = {
        id: 'proj-1',
        name: 'New Project',
        filePath: '/path',
        createdAt: now,
        updatedAt: now,
      };

      await repo.createProject(data);

      expect(repo.createCalls).toHaveLength(1);
      expect(repo.createCalls[0].name).toBe('New Project');
    });
  });

  describe('updateProject', () => {
    it('should update project name', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Original Name',
        filePath: '/path',
        createdAt: now,
        updatedAt: now,
      });

      const updates: UpdateProjectData = {
        name: 'Updated Name',
        updatedAt: new Date(),
      };

      const updated = await repo.updateProject('proj-1', updates);

      expect(updated.name).toBe('Updated Name');
      expect(updated.filePath).toBe('/path');
    });

    it('should update project filePath', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Test Project',
        filePath: '/old/path',
        createdAt: now,
        updatedAt: now,
      });

      const updates: UpdateProjectData = {
        filePath: '/new/path',
        updatedAt: new Date(),
      };

      const updated = await repo.updateProject('proj-1', updates);

      expect(updated.filePath).toBe('/new/path');
      expect(updated.name).toBe('Test Project');
    });

    it('should update both name and filePath', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Original',
        filePath: '/old',
        createdAt: now,
        updatedAt: now,
      });

      const updates: UpdateProjectData = {
        name: 'Updated',
        filePath: '/new',
        updatedAt: new Date(),
      };

      const updated = await repo.updateProject('proj-1', updates);

      expect(updated.name).toBe('Updated');
      expect(updated.filePath).toBe('/new');
    });

    it('should update updatedAt timestamp', async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 1000);

      await repo.createProject({
        id: 'proj-1',
        name: 'Test',
        filePath: '/path',
        createdAt: now,
        updatedAt: now,
      });

      const updates: UpdateProjectData = {
        updatedAt: later,
      };

      const updated = await repo.updateProject('proj-1', updates);

      expect(updated.updatedAt).toEqual(later);
    });

    it('should throw error for non-existent project', async () => {
      const updates: UpdateProjectData = {
        updatedAt: new Date(),
      };

      await expect(repo.updateProject('non-existent', updates)).rejects.toThrow('Project not found');
    });

    it('should track update calls', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Original',
        filePath: '/path',
        createdAt: now,
        updatedAt: now,
      });

      const updates: UpdateProjectData = {
        name: 'Updated',
        updatedAt: new Date(),
      };

      await repo.updateProject('proj-1', updates);

      expect(repo.updateCalls).toHaveLength(1);
      expect(repo.updateCalls[0].id).toBe('proj-1');
      expect(repo.updateCalls[0].updates.name).toBe('Updated');
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Test Project',
        filePath: '/path',
        createdAt: now,
        updatedAt: now,
      });

      await repo.deleteProject('proj-1');

      const project = await repo.getProjectById('proj-1');
      expect(project).toBeNull();
    });

    it('should track delete calls', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Test',
        filePath: '/path',
        createdAt: now,
        updatedAt: now,
      });

      await repo.deleteProject('proj-1');

      expect(repo.deleteCalls).toHaveLength(1);
      expect(repo.deleteCalls[0]).toBe('proj-1');
    });
  });

  describe('deleteCardsByProjectId', () => {
    it('should delete cards with matching project ID', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Project 1',
        filePath: '/path/1',
        createdAt: now,
        updatedAt: now,
      });

      await repo.createProject({
        id: 'proj-2',
        name: 'Project 2',
        filePath: '/path/2',
        createdAt: now,
        updatedAt: now,
      });

      await repo.deleteCardsByProjectId('proj-1');

      const proj1 = await repo.getProjectById('proj-1');
      const proj2 = await repo.getProjectById('proj-2');

      expect(proj1).toBeNull();
      expect(proj2).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should clear all data', async () => {
      const now = new Date();
      await repo.createProject({
        id: 'proj-1',
        name: 'Test',
        filePath: '/path',
        createdAt: now,
        updatedAt: now,
      });

      repo.reset();

      const projects = await repo.getAllProjects();
      expect(projects).toEqual([]);
      expect(repo.createCalls).toEqual([]);
      expect(repo.updateCalls).toEqual([]);
      expect(repo.deleteCalls).toEqual([]);
    });
  });
});
