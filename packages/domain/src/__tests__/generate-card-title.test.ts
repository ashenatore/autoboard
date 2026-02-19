import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateCardTitleUseCase } from '../generate-card-title';
import {
  MockCardRepository,
  CardFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe.skip('GenerateCardTitleUseCase', () => {
  let cardRepository: MockCardRepository;
  let useCase: GenerateCardTitleUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    useCase = new GenerateCardTitleUseCase(cardRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if cardId is missing', async () => {
      await expect(
        useCase.execute({ id: '' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('card lookup', () => {
    it('should throw NotFoundError if card does not exist', async () => {
      await expect(
        useCase.execute({ id: 'non-existent-card' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('successful title generation', () => {
    it('should generate title from card description', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({
          description: 'Implement user authentication with JWT tokens',
        })
      );

      const result = await useCase.execute({ id: card.id });

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
    });

    it('should update card with generated title', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({
          title: null,
          description: 'Test description',
        })
      );

      await useCase.execute({ id: card.id });

      const updatedCard = await cardRepository.getCardById(card.id);
      expect(updatedCard?.title).toBeTruthy();
    });
  });
});
