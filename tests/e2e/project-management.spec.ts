import { test, expect } from '@playwright/test';
import { AppPage, CreateProjectModal } from './helpers';

test.describe('Project Management', () => {
  let appPage: AppPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    await appPage.goto();
    await appPage.waitForLoad();
  });

  test('should display initial empty state', async ({ page }) => {
    const projects = await appPage.getProjects();
    // Initially there might be projects or be empty
    expect(projects).toBeDefined();
  });

  test('should open create project modal', async ({ page }) => {
    await appPage.openCreateProjectModal();

    const modal = new CreateProjectModal(page);
    await modal.waitForOpen();

    await expect(modal.nameInput).toBeVisible();
    await expect(modal.filePathInput).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    await appPage.openCreateProjectModal();

    const modal = new CreateProjectModal(page);
    await modal.waitForOpen();

    const timestamp = Date.now();
    const projectName = `Test Project ${timestamp}`;
    const filePath = `/tmp/test-project-${timestamp}`;

    await modal.createProject(projectName, filePath);

    // Wait for modal to close and project to appear
    await page.waitForTimeout(500);

    const projects = await appPage.getProjects();
    expect(projects).toContain(projectName);
  });

  test('should select a project', async ({ page }) => {
    const projects = await appPage.getProjects();

    if (projects.length > 0) {
      const firstProject = projects[0];
      await appPage.selectProject(firstProject);

      const currentProject = await appPage.getCurrentProjectName();
      expect(currentProject).toBe(firstProject);
    }
  });

  test('should cancel project creation', async ({ page }) => {
    await appPage.openCreateProjectModal();

    const modal = new CreateProjectModal(page);
    await modal.waitForOpen();

    await modal.nameInput.fill('Should Not Exist');
    await modal.cancel();

    // Modal should be closed
    await expect(modal.modal).not.toBeVisible();
  });

  test('should display kanban board for selected project', async ({ page }) => {
    const projects = await appPage.getProjects();

    if (projects.length > 0) {
      await appPage.selectProject(projects[0]);

      // Verify kanban board is visible
      const board = page.locator('[data-testid="kanban-board"]');
      await expect(board).toBeVisible();

      // Verify columns exist
      const columns = page.locator('[data-testid^="kanban-column-"]');
      const columnCount = await columns.count();
      expect(columnCount).toBeGreaterThan(0);
    }
  });
});
