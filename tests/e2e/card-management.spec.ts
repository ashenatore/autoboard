import { test, expect } from '@playwright/test';
import { AppPage, KanbanBoard, CreateCardModal } from './helpers';

test.describe('Card Management', () => {
  let appPage: AppPage;
  let kanbanBoard: KanbanBoard;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    await appPage.goto();
    await appPage.waitForLoad();

    kanbanBoard = new KanbanBoard(page);

    // Select or create a project for testing
    const projects = await appPage.getProjects();
    if (projects.length > 0) {
      await appPage.selectProject(projects[0]);
    } else {
      // Create a test project if none exists
      await appPage.openCreateProjectModal();
      const modal = new CreateCardModal(page);
      await page.locator('[data-testid="project-name-input"]').fill('E2E Test Project');
      await page.locator('[data-testid="project-filepath-input"]').fill('/tmp/e2e-test');
      await page.locator('[data-testid="create-project-submit"]').click();
      await page.waitForTimeout(500);
    }
  });

  test('should display kanban columns', async ({ page }) => {
    const columnCount = await kanbanBoard.getColumnCount();
    expect(columnCount).toBe(4); // todo, in-progress, manual-review, done

    const columnNames = [];
    for (let i = 0; i < columnCount; i++) {
      const name = await kanbanBoard.getColumnName(i);
      columnNames.push(name);
    }

    expect(columnNames).toContain('todo');
    expect(columnNames).toContain('in-progress');
    expect(columnNames).toContain('manual-review');
    expect(columnNames).toContain('done');
  });

  test('should open create card modal', async ({ page }) => {
    await kanbanBoard.openCreateCardModal();

    const modal = page.locator('[data-testid="create-card-modal"]');
    await expect(modal).toBeVisible();

    await expect(page.locator('[data-testid="card-title-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-description-input"]')).toBeVisible();
  });

  test('should create a new card', async ({ page }) => {
    // Get initial card count
    const initialCount = await kanbanBoard.getCardCount('todo');

    // Open create card modal
    await kanbanBoard.openCreateCardModal();

    // Fill in card details
    const timestamp = Date.now();
    const cardTitle = `Test Card ${timestamp}`;
    const cardDescription = 'This is a test card created by E2E tests';

    await page.locator('[data-testid="card-title-input"]').fill(cardTitle);
    await page.locator('[data-testid="card-description-input"]').fill(cardDescription);
    await page.locator('[data-testid="create-card-submit"]').click();

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Verify card was created
    const newCount = await kanbanBoard.getCardCount('todo');
    expect(newCount).toBe(initialCount + 1);

    // Verify card is visible
    const card = page.locator(`[data-testid="kanban-card-${cardTitle}"]`);
    await expect(card).toBeVisible();
  });

  test('should display card details', async ({ page }) => {
    // Create a test card
    await kanbanBoard.openCreateCardModal();

    const timestamp = Date.now();
    const cardTitle = `Detail Test ${timestamp}`;

    await page.locator('[data-testid="card-title-input"]').fill(cardTitle);
    await page.locator('[data-testid="card-description-input"]').fill('Test description');
    await page.locator('[data-testid="create-card-submit"]').click();
    await page.waitForTimeout(500);

    // Click on card to view details
    const card = page.locator(`[data-testid="kanban-card-${cardTitle}"]`);
    await card.click();

    // Verify card detail modal appears
    const modal = page.locator('[data-testid="card-detail-modal"]');
    await expect(modal).toBeVisible();

    // Verify card details are displayed
    await expect(page.locator('[data-testid="card-detail-title"]')).toContainText(cardTitle);
    await expect(page.locator('[data-testid="card-detail-description"]')).toContainText('Test description');
  });

  test('should cancel card creation', async ({ page }) => {
    // Open create card modal
    await kanbanBoard.openCreateCardModal();

    // Fill in some data
    await page.locator('[data-testid="card-title-input"]').fill('Should Not Create');

    // Cancel
    await page.locator('[data-testid="create-card-cancel"]').click();

    // Verify modal is closed
    const modal = page.locator('[data-testid="create-card-modal"]');
    await expect(modal).not.toBeVisible();
  });
});
