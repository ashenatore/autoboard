import { describe, it, expect, beforeEach } from 'vitest';
import { CreateCardUseCase } from '../create-card';
import {
  MockCardRepository,
  MockProjectRepository,
  CardFixture,
  ProjectFixture,
} from '@autoboard/testing';
import { ValidationError } from '@autoboard/shared';

describe('CreateCardUseCase', () => {
  let cardRepository: MockCardRepository;
  let projectRepository: MockProjectRepository;
  let useCase: CreateCardUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    projectRepository = new MockProjectRepository();
    useCase = new CreateCardUseCase(cardRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if projectId is missing', async () => {
      await expect(
        useCase.execute({
          projectId: '',
          columnId: 'todo',
          title: 'Test Card',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if columnId is missing', async () => {
      await expect(
        useCase.execute({
          projectId: 'test-project',
          columnId: '',
          title: 'Test Card',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if neither title nor description is provided', async () => {
      await expect(
        useCase.execute({
          projectId: 'test-project',
          columnId: 'todo',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('successful creation', () => {
    it('should create card with title only', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        projectId: project.id,
        columnId: 'todo',
        title: 'Test Card',
      });

      expect(result).toMatchObject({
        card: {
          id: expect.any(String),
          projectId: project.id,
          columnId: 'todo',
          title: 'Test Card',
          description: null,
        }
      });
      expect(cardRepository.createCalls).toHaveLength(1);
    });

    it('should create card with description only', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        projectId: project.id,
        columnId: 'todo',
        description: 'Test description',
      });

      expect(result).toMatchObject({
        card: {
          id: expect.any(String),
          projectId: project.id,
          columnId: 'todo',
          title: null,
          description: 'Test description',
        }
      });
    });

    it('should create card with both title and description', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        projectId: project.id,
        columnId: 'in-progress',
        title: 'Test Card',
        description: 'Test description',
      });

      expect(result).toMatchObject({
        card: {
          id: expect.any(String),
          projectId: project.id,
          columnId: 'in-progress',
          title: 'Test Card',
          description: 'Test description',
        }
      });
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const before = new Date();
      const result = await useCase.execute({
        projectId: project.id,
        columnId: 'todo',
        title: 'Test Card',
      });
      const after = new Date();

      expect(result.card.createdAt).toBeInstanceOf(Date);
      expect(result.card.updatedAt).toBeInstanceOf(Date);
      expect(result.card.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.card.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should create card in manual-review column', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        projectId: project.id,
        columnId: 'manual-review',
        title: 'Review Card',
      });

      expect(result.card.columnId).toBe('manual-review');
    });

    it('should create card in done column', async () => {
      const project = await projectRepository.createProject(ProjectFixture.createData());

      const result = await useCase.execute({
        projectId: project.id,
        columnId: 'done',
        title: 'Done Card',
      });

      expect(result.card.columnId).toBe('done');
    });
  });

  describe('repository interaction', () => {
    it('should call cardRepository.createCard with correct data', async () => {
      await useCase.execute({
        projectId: 'test-project',
        columnId: 'todo',
        title: 'Test Card',
        description: 'Test description',
      });

      expect(cardRepository.createCalls).toHaveLength(1);
      const createdCard = cardRepository.createCalls[0];
      expect(createdCard.projectId).toBe('test-project');
      expect(createdCard.columnId).toBe('todo');
      expect(createdCard.title).toBe('Test Card');
      expect(createdCard.description).toBe('Test description');
    });
  });
});
