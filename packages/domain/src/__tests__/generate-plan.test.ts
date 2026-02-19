import { describe, it, expect, beforeEach } from 'vitest';
import { GeneratePlanUseCase } from '../generate-plan';
import {
  MockCardRepository,
  MockProjectRepository,
  ProjectFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe.skip('GeneratePlanUseCase', () => {
  let cardRepository: MockCardRepository;
  let projectRepository: MockProjectRepository;
  let useCase: GeneratePlanUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    projectRepository = new MockProjectRepository();
    useCase = new GeneratePlanUseCase(cardRepository, projectRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if projectId is missing', async () => {
      await expect(
        useCase.execute({
          projectId: '',
          description: 'Test feature',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if description is missing', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      await expect(
        useCase.execute({
          projectId: project.id,
          description: '',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('project lookup', () => {
    it('should throw NotFoundError if project does not exist', async () => {
      await expect(
        useCase.execute({
          projectId: 'non-existent-project',
          description: 'Test feature',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('successful plan generation', () => {
    it('should generate plan from description', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        projectId: project.id,
        description: 'Build a user authentication system',
      });

      expect(result).toMatchObject({
        projectId: project.id,
        plan: expect.objectContaining({
          title: expect.any(String),
          steps: expect.any(Array),
        }),
      });
    });

    it('should create cards for each step in the plan', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        projectId: project.id,
        description: 'Test feature',
      });

      expect(result.cards).toBeDefined();
      expect(Array.isArray(result.cards)).toBe(true);
    });
  });
});
