import { describe, it, expect, beforeEach } from 'vitest';
import { GetCardRunStatusUseCase } from '../get-card-run-status';
import {
  MockCardRepository,
  CardFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe.skip('GetCardRunStatusUseCase', () => {
  let cardRepository: MockCardRepository;
  let useCase: GetCardRunStatusUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    useCase = new GetCardRunStatusUseCase(cardRepository);
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

  describe('status retrieval', () => {
    it('should return status for card', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      const result = await useCase.execute({ id: card.id });

      expect(result).toMatchObject({
        cardId: card.id,
        isRunning: expect.any(Boolean),
        status: expect.any(String),
      });
    });
  });
});
