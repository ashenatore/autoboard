import { describe, it, expect, beforeEach } from 'vitest';
import { CancelCardRunUseCase } from '../cancel-card-run';
import {
  MockCardRepository,
  CardFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError, ConflictError } from '@autoboard/shared';

describe.skip('CancelCardRunUseCase', () => {
  let cardRepository: MockCardRepository;
  let useCase: CancelCardRunUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    useCase = new CancelCardRunUseCase(cardRepository);
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

  describe('cancellation', () => {
    it('should cancel a running card', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      const result = await useCase.execute({ id: card.id });

      expect(result).toMatchObject({
        success: true,
      });
    });
  });
});
