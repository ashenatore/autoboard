import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCardUseCase } from '../delete-card';
import {
  MockCardRepository,
  CardFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe('DeleteCardUseCase', () => {
  let cardRepository: MockCardRepository;
  let useCase: DeleteCardUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    useCase = new DeleteCardUseCase(cardRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if cardId is missing', async () => {
      await expect(
        useCase.execute({ id: '' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('successful deletion', () => {
    it('should delete existing card', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      await useCase.execute({ id: card.id });

      expect(cardRepository.deleteCalls).toContain(card.id);
      const deletedCard = await cardRepository.getCardById(card.id);
      expect(deletedCard).toBeNull();
    });

    it('should return success confirmation', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      const result = await useCase.execute({ id: card.id });

      expect(result).toMatchObject({
        success: true,
      });
    });

    it('should call cardRepository.deleteCard exactly once', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      await useCase.execute({ id: card.id });

      expect(cardRepository.deleteCalls).toHaveLength(1);
    });
  });

  describe('idempotency', () => {
    it('should allow deleting already deleted card', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      // First deletion succeeds
      await useCase.execute({ id: card.id });

      // Second deletion also succeeds (no error)
      const result = await useCase.execute({ id: card.id });

      expect(result.success).toBe(true);
    });
  });
});
