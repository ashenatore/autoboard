import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCardUseCase } from '../update-card';
import {
  MockCardRepository,
  CardFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe('UpdateCardUseCase', () => {
  let cardRepository: MockCardRepository;
  let useCase: UpdateCardUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    useCase = new UpdateCardUseCase(cardRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if id is missing', async () => {
      await expect(
        useCase.execute({
          id: '',
          title: 'New Title',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('card lookup', () => {
    it('should throw NotFoundError if card does not exist', async () => {
      await expect(
        useCase.execute({
          id: 'non-existent-card',
          title: 'New Title',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('successful updates', () => {
    it('should update title', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      const result = await useCase.execute({
        id: card.id,
        title: 'Updated Title',
      });

      expect(result.card.title).toBe('Updated Title');
      expect(result.card.updatedAt).toBeInstanceOf(Date);
    });

    it('should update description', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      const result = await useCase.execute({
        id: card.id,
        description: 'Updated description',
      });

      expect(result.card.description).toBe('Updated description');
      expect(result.card.updatedAt).toBeInstanceOf(Date);
    });

    it('should update columnId', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({ columnId: 'todo' })
      );

      const result = await useCase.execute({
        id: card.id,
        columnId: 'in-progress',
      });

      expect(result.card.columnId).toBe('in-progress');
    });

    it('should update multiple fields', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      const result = await useCase.execute({
        id: card.id,
        title: 'New Title',
        description: 'New description',
        columnId: 'done',
      });

      expect(result.card.title).toBe('New Title');
      expect(result.card.description).toBe('New description');
      expect(result.card.columnId).toBe('done');
    });

    it('should update updatedAt timestamp', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());
      const originalUpdatedAt = card.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await useCase.execute({
        id: card.id,
        title: 'Updated',
      });

      expect(result.card.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should allow setting title to null', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({ title: 'Original Title' })
      );

      const result = await useCase.execute({
        id: card.id,
        title: null,
      });

      expect(result.card.title).toBeNull();
    });

    it('should allow setting description to null', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({ description: 'Original description' })
      );

      const result = await useCase.execute({
        id: card.id,
        description: null,
      });

      expect(result.card.description).toBeNull();
    });
  });

  describe('repository interaction', () => {
    it('should call cardRepository.updateCard with correct data', async () => {
      const card = await cardRepository.createCard(CardFixture.createData());

      await useCase.execute({
        id: card.id,
        title: 'New Title',
        columnId: 'done',
      });

      expect(cardRepository.updateCalls).toHaveLength(1);
      const updateCall = cardRepository.updateCalls[0];
      expect(updateCall.id).toBe(card.id);
      expect(updateCall.updates.title).toBe('New Title');
      expect(updateCall.updates.columnId).toBe('done');
    });
  });
});
