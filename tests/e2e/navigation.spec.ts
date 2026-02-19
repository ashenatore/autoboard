import { test, expect } from '@playwright/test';
import { AppPage } from './helpers';

test.describe('Navigation', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AutoBoard/);
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL(/\/about/);
  });

  test('should navigate back to home', async ({ page }) => {
    await page.goto('/about');
    await page.click('a[href="/"]');
    await expect(page).toHaveURL(/\/$/);
  });

  test('should show 404 for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    await expect(page.locator('text=/not found/i')).toBeVisible();
  });

  test('should persist project selection across navigation', async ({ page }) => {
    const appPage = new AppPage(page);
    await page.goto('/');

    // Get initial projects
    const projects = await appPage.getProjects();

    if (projects.length > 0) {
      // Select a project
      await appPage.selectProject(projects[0]);
      const selectedProject = await appPage.getCurrentProjectName();

      // Navigate away and back
      await page.goto('/about');
      await page.goto('/');

      // Verify project is still selected
      const currentProject = await appPage.getCurrentProjectName();
      expect(currentProject).toBe(selectedProject);
    }
  });
});
