import { randomUUID } from 'node:crypto';
import type {
  Card,
  CreateCardData,
  UpdateCardData,
  Project,
  CreateProjectData,
  UpdateProjectData,
} from '@autoboard/db';

/**
 * Mock implementation of CardRepository for testing.
 * Stores data in memory and tracks method calls for assertion.
 */
export class MockCardRepository {
  public cards: Map<string, Card> = new Map();
  public createCalls: Card[] = [];
  public updateCalls: Array<{ id: string; updates: UpdateCardData }> = [];
  public deleteCalls: string[] = [];

  async getAllCards(): Promise<Card[]> {
    return Array.from(this.cards.values()).filter((c) => !c.archivedAt);
  }

  async getCardsByProjectId(projectId: string): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(
      (c) => c.projectId === projectId && !c.archivedAt
    );
  }

  async getArchivedCardsByProjectId(projectId: string): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(
      (c) => c.projectId === projectId && c.archivedAt
    );
  }

  async getCardById(id: string): Promise<Card | null> {
    return this.cards.get(id) || null;
  }

  async createCard(data: CreateCardData): Promise<Card> {
    const card: Card = {
      id: data.id || randomUUID(),
      title: data.title,
      description: data.description,
      columnId: data.columnId,
      projectId: data.projectId,
      sessionId: null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      archivedAt: null,
    };
    this.cards.set(card.id, card);
    this.createCalls.push(card);
    return card;
  }

  async updateCard(id: string, updates: UpdateCardData): Promise<Card> {
    const card = this.cards.get(id);
    if (!card) throw new Error('Card not found');

    const updated: Card = {
      ...card,
      ...(updates.columnId !== undefined && { columnId: updates.columnId }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.sessionId !== undefined && { sessionId: updates.sessionId }),
      ...(updates.archivedAt !== undefined && { archivedAt: updates.archivedAt }),
      updatedAt: updates.updatedAt,
    };

    this.cards.set(id, updated);
    this.updateCalls.push({ id, updates });
    return updated;
  }

  async deleteCard(id: string): Promise<void> {
    this.cards.delete(id);
    this.deleteCalls.push(id);
  }

  reset(): void {
    this.cards.clear();
    this.createCalls = [];
    this.updateCalls = [];
    this.deleteCalls = [];
  }
}

/**
 * Mock implementation of ProjectRepository for testing.
 */
export class MockProjectRepository {
  public projects: Map<string, Project> = new Map();
  public createCalls: Project[] = [];
  public updateCalls: Array<{ id: string; updates: UpdateProjectData }> = [];
  public deleteCalls: string[] = [];

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    const project: Project = {
      id: data.id,
      name: data.name,
      filePath: data.filePath,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    this.projects.set(project.id, project);
    this.createCalls.push(project);
    return project;
  }

  async updateProject(id: string, updates: UpdateProjectData): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error('Project not found');

    const updated: Project = {
      ...project,
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.filePath !== undefined && { filePath: updates.filePath }),
      updatedAt: updates.updatedAt,
    };

    this.projects.set(id, updated);
    this.updateCalls.push({ id, updates });
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
    this.deleteCalls.push(id);
  }

  async deleteCardsByProjectId(projectId: string): Promise<void> {
    for (const [id, card] of this.projects) {
      if (card.id === projectId) {
        this.projects.delete(id);
      }
    }
  }

  reset(): void {
    this.projects.clear();
    this.createCalls = [];
    this.updateCalls = [];
    this.deleteCalls = [];
  }
}
