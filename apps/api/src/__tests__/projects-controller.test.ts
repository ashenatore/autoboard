import { describe, it, expect } from 'vitest';
import { createProjectsController } from '../controllers/projects-controller.js';
import { MockProjectRepository } from '@autoboard/testing';
import { MockAutoModeSettingsRepository } from '@autoboard/testing';

describe('ProjectsController', () => {
  it('should create controller with repositories', () => {
    const projectRepo = new MockProjectRepository();
    const autoModeRepo = new MockAutoModeSettingsRepository();
    const autoModeLoop = {} as any;

    const controller = createProjectsController(
      projectRepo,
      autoModeRepo,
      autoModeLoop
    );

    expect(controller.get).toBeDefined();
    expect(controller.post).toBeDefined();
    expect(controller.patch).toBeDefined();
    expect(controller.delete).toBeDefined();
  });
});
