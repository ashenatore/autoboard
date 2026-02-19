import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../projects.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Projects API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getProjects', () => {
    it('should fetch all projects', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Project 1', filePath: '/path/1' },
        { id: 'proj-2', name: 'Project 2', filePath: '/path/2' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
      });

      const projects = await getProjects();

      expect(mockFetch).toHaveBeenCalledWith('/api/projects');
      expect(projects).toEqual(mockProjects);
    });

    it('should throw error with custom message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Database error' }),
      });

      await expect(getProjects()).rejects.toThrow('Database error');
    });

    it('should throw generic error message when error details not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getProjects()).rejects.toThrow('Failed to fetch projects');
    });

    it('should throw generic error when JSON parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(getProjects()).rejects.toThrow('Failed to fetch projects');
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const newProject = { id: 'proj-1', name: 'New Project', filePath: '/path/to/project' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newProject,
      });

      const project = await createProject('New Project', '/path/to/project');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Project', filePath: '/path/to/project' }),
      });
      expect(project).toEqual(newProject);
    });

    it('should throw error with custom message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid file path' }),
      });

      await expect(createProject('Test', '/invalid/path')).rejects.toThrow('Invalid file path');
    });

    it('should throw generic error message when error details not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(createProject('Test', '/path')).rejects.toThrow('Failed to create project');
    });
  });

  describe('updateProject', () => {
    it('should update project name', async () => {
      const updatedProject = { id: 'proj-1', name: 'Updated Name', filePath: '/path' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProject,
      });

      const project = await updateProject('proj-1', 'Updated Name');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'proj-1', name: 'Updated Name', filePath: undefined }),
      });
      expect(project).toEqual(updatedProject);
    });

    it('should update project filePath', async () => {
      const updatedProject = { id: 'proj-1', name: 'Project', filePath: '/new/path' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProject,
      });

      const project = await updateProject('proj-1', undefined, '/new/path');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'proj-1', name: undefined, filePath: '/new/path' }),
      });
      expect(project).toEqual(updatedProject);
    });

    it('should update both name and filePath', async () => {
      const updatedProject = { id: 'proj-1', name: 'Updated', filePath: '/new/path' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProject,
      });

      const project = await updateProject('proj-1', 'Updated', '/new/path');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'proj-1', name: 'Updated', filePath: '/new/path' }),
      });
      expect(project).toEqual(updatedProject);
    });

    it('should throw error with custom message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Project not found' }),
      });

      await expect(updateProject('proj-1', 'Updated')).rejects.toThrow('Project not found');
    });

    it('should throw generic error message when error details not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(updateProject('proj-1', 'Updated')).rejects.toThrow(
        'Failed to update project'
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await deleteProject('proj-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'proj-1' }),
      });
    });

    it('should throw error with custom message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot delete project with cards' }),
      });

      await expect(deleteProject('proj-1')).rejects.toThrow('Cannot delete project with cards');
    });

    it('should throw generic error message when error details not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(deleteProject('proj-1')).rejects.toThrow('Failed to delete project');
    });
  });
});
