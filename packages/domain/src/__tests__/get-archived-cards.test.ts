import { describe, it, expect, beforeEach } from 'vitest';
import { GetArchivedCardsUseCase } from '../get-archived-cards';
import {
  MockCardRepository,
  CardFixture,
} from '@autoboard/testing';
import { ValidationError, NotFoundError } from '@autoboard/shared';

describe('GetArchivedCardsUseCase', () => {
  let cardRepository: MockCardRepository;
  let useCase: GetArchivedCardsUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    useCase = new GetArchivedCardsUseCase(cardRepository);
  });

  describe('validation', () => {
    it('should throw ValidationError if projectId is missing', async () => {
      await expect(
        useCase.execute({ projectId: '' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getting archived cards', () => {
    it('should return empty array when project has no archived cards', async () => {
      const result = await useCase.execute({ projectId: 'test-project' });

      expect(result.cards).toEqual([]);
    });

    it('should return only archived cards', async () => {
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-1', projectId: 'test-project', title: 'Active Card' })
      );
      const archivedCard1 = await cardRepository.createCard(
        CardFixture.createData({ id: 'card-2', projectId: 'test-project', title: 'Archived Card 1' })
      );
      const archivedCard2 = await cardRepository.createCard(
        CardFixture.createData({ id: 'card-3', projectId: 'test-project', title: 'Archived Card 2' })
      );

      await cardRepository.updateCard(archivedCard1.id, {
        archivedAt: new Date(),
        updatedAt: new Date(),
      });
      await cardRepository.updateCard(archivedCard2.id, {
        archivedAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({ projectId: 'test-project' });

      expect(result.cards).toHaveLength(2);
      expect(result.cards.map((c) => c.title).sort()).toEqual(['Archived Card 1', 'Archived Card 2']);
    });

    it('should not return active cards', async () => {
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-1', projectId: 'test-project', title: 'Active Card' })
      );
      const archivedCard = await cardRepository.createCard(
        CardFixture.createData({ id: 'card-2', projectId: 'test-project', title: 'Archived Card' })
      );
      await cardRepository.updateCard(archivedCard.id, {
        archivedAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({ projectId: 'test-project' });

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].title).toBe('Archived Card');
    });

    it('should not return cards from other projects', async () => {
      const card1 = await cardRepository.createCard(
        CardFixture.createData({ id: 'card-1', projectId: 'proj-1', title: 'Card 1' })
      );
      await cardRepository.updateCard(card1.id, {
        archivedAt: new Date(),
        updatedAt: new Date(),
      });

      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-2', projectId: 'proj-2', title: 'Card 2' })
      );

      const result = await useCase.execute({ projectId: 'proj-1' });

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].title).toBe('Card 1');
    });
  });

  describe('archived card properties', () => {
    it('should include archivedAt timestamp', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({ id: 'card-1', projectId: 'test-project' })
      );
      const archivedAt = new Date();
      await cardRepository.updateCard(card.id, {
        archivedAt,
        updatedAt: new Date(),
      });

      const result = await useCase.execute({ projectId: 'test-project' });

      expect(result.cards[0].archivedAt).toEqual(archivedAt);
    });

    it('should preserve all card properties', async () => {
      const card = await cardRepository.createCard(
        CardFixture.createData({
          id: 'card-1',
          projectId: 'test-project',
          title: 'Test Card',
          description: 'Test description',
          columnId: 'done',
        })
      );
      await cardRepository.updateCard(card.id, {
        archivedAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({ projectId: 'test-project' });

      expect(result.cards[0]).toMatchObject({
        id: card.id,
        title: 'Test Card',
        description: 'Test description',
        columnId: 'done',
        projectId: 'test-project',
        archivedAt: expect.any(Date),
      });
    });
  });

  describe('ordering', () => {
    it('should preserve repository order', async () => {
      const card1 = await cardRepository.createCard(
        CardFixture.createData({ id: 'card-1', projectId: 'test-project', title: 'First' })
      );
      const card2 = await cardRepository.createCard(
        CardFixture.createData({ id: 'card-2', projectId: 'test-project', title: 'Second' })
      );
      const card3 = await cardRepository.createCard(
        CardFixture.createData({ id: 'card-3', projectId: 'test-project', title: 'Third' })
      );

      await cardRepository.updateCard(card1.id, {
        archivedAt: new Date(),
        updatedAt: new Date(),
      });
      await cardRepository.updateCard(card2.id, {
        archivedAt: new Date(),
        updatedAt: new Date(),
      });
      await cardRepository.updateCard(card3.id, {
        archivedAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({ projectId: 'test-project' });

      expect(result.cards.map((c) => c.title)).toEqual(['First', 'Second', 'Third']);
    });
  });
});
