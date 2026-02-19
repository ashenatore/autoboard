import { describe, it, expect, beforeEach } from 'vitest';
import { GetCardsUseCase } from '../get-cards';
import {
  MockCardRepository,
  CardFixture,
} from '@autoboard/testing';

describe('GetCardsUseCase', () => {
  let cardRepository: MockCardRepository;
  let useCase: GetCardsUseCase;

  beforeEach(() => {
    cardRepository = new MockCardRepository();
    useCase = new GetCardsUseCase(cardRepository);
  });

  describe('getting active cards', () => {
    it('should return empty array when no cards exist', async () => {
      const result = await useCase.execute({});

      expect(result.cards).toEqual([]);
    });

    it('should return all cards when no projectId specified', async () => {
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-1', title: 'Card 1' })
      );
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-2', title: 'Card 2' })
      );
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-3', title: 'Card 3' })
      );

      const result = await useCase.execute({});

      expect(result.cards).toHaveLength(3);
      expect(result.cards.map((c) => c.title)).toEqual(['Card 1', 'Card 2', 'Card 3']);
    });

    it('should return cards for specific projectId', async () => {
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-1', projectId: 'proj-1', title: 'Card 1' })
      );
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-2', projectId: 'proj-2', title: 'Card 2' })
      );

      const result = await useCase.execute({ projectId: 'proj-1' });

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].title).toBe('Card 1');
    });
  });

  describe('card ordering', () => {
    it('should preserve repository order', async () => {
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-1', title: 'First' })
      );
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-2', title: 'Second' })
      );
      await cardRepository.createCard(
        CardFixture.createData({ id: 'card-3', title: 'Third' })
      );

      const result = await useCase.execute({});

      expect(result.cards.map((c) => c.title)).toEqual(['First', 'Second', 'Third']);
    });
  });
});
