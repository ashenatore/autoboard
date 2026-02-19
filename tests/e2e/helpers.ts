import { Page, Locator } from '@playwright/test';

export class AppPage {
  readonly page: Page;
  readonly topBar: Locator;
  readonly kanbanBoard: Locator;
  readonly createProjectButton: Locator;
  readonly logDrawer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.topBar = page.locator('[data-testid="top-bar"]');
    this.kanbanBoard = page.locator('[data-testid="kanban-board"]');
    this.createProjectButton = page.locator('[data-testid="create-project-button"]');
    this.logDrawer = page.locator('[data-testid="log-drawer"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    await this.kanbanBoard.waitFor({ state: 'visible' });
  }

  async getProjects() {
    const buttons = this.page.locator('[data-testid^="project-button-"]');
    const count = await buttons.count();
    const projects: string[] = [];
    for (let i = 0; i < count; i++) {
      projects.push(await buttons.nth(i).textContent() || '');
    }
    return projects;
  }

  async selectProject(name: string) {
    await this.page.click(`[data-testid="project-button-${name}"]`);
  }

  async openCreateProjectModal() {
    await this.createProjectButton.click();
  }

  async getCurrentProjectName() {
    const name = this.page.locator('[data-testid="current-project-name"]');
    return await name.textContent();
  }
}

export class CreateProjectModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly filePathInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[data-testid="create-project-modal"]');
    this.nameInput = page.locator('[data-testid="project-name-input"]');
    this.filePathInput = page.locator('[data-testid="project-filepath-input"]');
    this.createButton = page.locator('[data-testid="create-project-submit"]');
    this.cancelButton = page.locator('[data-testid="create-project-cancel"]');
  }

  async waitForOpen() {
    await this.modal.waitFor({ state: 'visible' });
  }

  async createProject(name: string, filePath: string) {
    await this.nameInput.fill(name);
    await this.filePathInput.fill(filePath);
    await this.createButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  async cancel() {
    await this.cancelButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }
}

export class KanbanBoard {
  readonly page: Page;
  readonly columns: Locator;
  readonly createCardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.columns = page.locator('[data-testid^="kanban-column-"]');
    this.createCardButton = page.locator('[data-testid="create-card-button"]');
  }

  async getColumnCount() {
    return await this.columns.count();
  }

  async getColumnName(index: number) {
    return await this.columns.nth(index).locator('[data-testid="column-name"]').textContent();
  }

  async getCardCount(columnName: string) {
    const column = this.page.locator(`[data-testid="kanban-column-${columnName}"]`);
    return await column.locator('[data-testid^="kanban-card-"]').count();
  }

  async openCreateCardModal() {
    await this.createCardButton.click();
  }
}

export class CreateCardModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[data-testid="create-card-modal"]');
    this.titleInput = page.locator('[data-testid="card-title-input"]');
    this.descriptionInput = page.locator('[data-testid="card-description-input"]');
    this.createButton = page.locator('[data-testid="create-card-submit"]');
  }

  async waitForOpen() {
    await this.modal.waitFor({ state: 'visible' });
  }

  async createCard(title: string, description: string) {
    await this.titleInput.fill(title);
    await this.descriptionInput.fill(description);
    await this.createButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }
}

export class LogDrawer {
  readonly page: Page;
  readonly drawer: Locator;
  readonly logs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.drawer = page.locator('[data-testid="log-drawer"]');
    this.logs = page.locator('[data-testid^="log-entry-"]');
  }

  async isOpen() {
    return await this.drawer.isVisible();
  }

  async getLogs() {
    const count = await this.logs.count();
    const logTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      logTexts.push(await this.logs.nth(i).textContent() || '');
    }
    return logTexts;
  }
}
