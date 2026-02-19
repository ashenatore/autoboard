import { describe, it, expect, beforeEach } from 'vitest';
import { ArchiveCardUseCase } from '../archive-card';
import {
  MockCardRepository,
  CardFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe('ArchiveCardUseCase', () => {
  let cardRepository: MockCardRepository;
  let useCase: ArchiveCardUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    useCase = new ArchiveCardUseCase(cardRepository);
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

  describe('successful archiving', () => {
    it('should archive existing card by setting archivedAt', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      const result = await useCase.execute({ id: card.id });

      expect(result.card.archivedAt).toBeInstanceOf(Date);
      expect(result.card.archivedAt).not.toBeNull();
    });

    it('should update updatedAt timestamp when archiving', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());
      const originalUpdatedAt = card.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await useCase.execute({ id: card.id });

      expect(result.card.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not modify other card fields', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({
          title: 'Test Card',
          description: 'Test description',
          columnId: 'todo',
        })
      );

      const result = await useCase.execute({ id: card.id });

      expect(result.card.title).toBe('Test Card');
      expect(result.card.description).toBe('Test description');
      expect(result.card.columnId).toBe('todo');
      expect(result.card.projectId).toBe(card.projectId);
    });

    it('should call cardRepository.updateCard with archivedAt set', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      await useCase.execute({ id: card.id });

      expect(cardRepository.updateCalls).toHaveLength(1);
      const updateCall = cardRepository.updateCalls[0];
      expect(updateCall.id).toBe(card.id);
      expect(updateCall.updates.archivedAt).toBeInstanceOf(Date);
    });
  });

  describe('idempotency', () => {
    it('should allow re-archiving an already archived card', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      // First archive
      const firstResult = await useCase.execute({ id: card.id });
      const firstArchivedAt = firstResult.card.archivedAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second archive
      const secondResult = await useCase.execute({ id: card.id });

      expect(secondResult.card.archivedAt).toBeInstanceOf(Date);
      expect(secondResult.card.archivedAt!.getTime()).toBeGreaterThanOrEqual(
        firstArchivedAt!.getTime()
      );
    });
  });

  describe('repository interaction', () => {
    it('should preserve card in repository but mark as archived', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      await useCase.execute({ id: card.id });

      const archivedCard = await cardRepository.getCardById(card.id);
      expect(archivedCard).not.toBeNull();
      expect(archivedCard!.archivedAt).not.toBeNull();
    });
  });
});
