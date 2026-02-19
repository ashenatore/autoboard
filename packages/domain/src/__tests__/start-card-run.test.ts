import { describe, it, expect, beforeEach } from 'vitest';
import { StartCardRunUseCase } from '../start-card-run';
import {
  MockCardRepository,
  MockProjectRepository,
  CardFixture,
  ProjectFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError, ConflictError } from '@autoboard/shared';

describe.skip('StartCardRunUseCase', () => {
  let cardRepository: MockCardRepository;
  let projectRepository: MockProjectRepository;
  let useCase: StartCardRunUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    projectRepository = new MockProjectRepository();
    useCase = new StartCardRunUseCase(cardRepository, projectRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if cardId is missing', async () => {
      await expect(
        useCase.execute({ id: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if card has no project', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({
          projectId: '',
          description: 'Test card without project',
        })
      );

      await expect(
        useCase.execute({ id: card.id })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if card has no prompt, description, or title', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({
          title: null,
          description: null,
        })
      );

      await expect(
        useCase.execute({ id: card.id })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('card lookup', () => {
    it('should throw NotFoundError if card does not exist', async () => {
      await expect(
        useCase.execute({ id: 'non-existent-card' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if project does not exist', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({
          projectId: 'non-existent-project',
        })
      );

      await expect(
        useCase.execute({ id: card.id })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('successful execution', () => {
    it('should start card run with description as prompt', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({
          description: 'Test description',
        })
      );
      await projectRepository.createProject(
        ProjectFixture.createData({
          id: card.projectId,
        })
      );

      const result = await useCase.execute({ id: card.id });

      expect(result.success).toBe(true);
      expect(result.cardId).toBe(card.id);
      expect(result.status).toBe('started');
    });
  });
});
