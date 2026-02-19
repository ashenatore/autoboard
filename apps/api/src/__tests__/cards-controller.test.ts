import { describe, it, expect } from 'vitest';
import { createCardsController } from '../controllers/cards-controller.js';
import { MockCardRepository } from '@autoboard/testing';

describe('CardsController', () => {
  it('should create controller with repository', () => {
    const repo = new MockCardRepository();
    const controller = createCardsController(repo);

    expect(controller.get).toBeDefined();
    expect(controller.post).toBeDefined();
    expect(controller.patch).toBeDefined();
    expect(controller.delete).toBeDefined();
  });
});
