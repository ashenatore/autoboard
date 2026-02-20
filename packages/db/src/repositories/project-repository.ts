import { db } from "../client.js";
import { projects, kanbanCards } from "../schema.js";
import { eq } from "drizzle-orm";
import type { Project, CreateProjectData, UpdateProjectData } from "../types.js";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("ProjectRepository");

export class ProjectRepository {
  async getAllProjects(): Promise<Project[]> {
    const results = await db.select().from(projects);
    logger.debug("Retrieved all projects", { projectCount: results.length });
    return results.map(this.mapToDomain);
  }

  async getProjectById(id: string): Promise<Project | null> {
    const results = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    logger.debug("Retrieved project by ID", {
      id,
      found: results.length > 0
    });
    if (results.length === 0) return null;
    return this.mapToDomain(results[0]);
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    const results = await db
      .insert(projects)
      .values({
        id: data.id,
        name: data.name,
        filePath: data.filePath,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .returning();
    logger.debug("Project created in database", {
      id: data.id,
      name: data.name
    });
    return this.mapToDomain(results[0]);
  }

  async updateProject(id: string, updates: UpdateProjectData): Promise<Project> {
    const updateData: Partial<typeof projects.$inferInsert> = {
      updatedAt: updates.updatedAt,
    };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.filePath !== undefined) updateData.filePath = updates.filePath;

    const results = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    if (results.length === 0) {
      logger.error("Project update failed - not found", { id });
      throw new Error("Project not found");
    }
    logger.debug("Project updated in database", {
      id,
      hasName: updates.name !== undefined,
      hasFilePath: updates.filePath !== undefined
    });
    return this.mapToDomain(results[0]);
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
    logger.debug("Project deleted from database", { id });
  }

  async deleteCardsByProjectId(projectId: string): Promise<void> {
    await db.delete(kanbanCards).where(eq(kanbanCards.projectId, projectId));
    logger.debug("Deleted cards by project", { projectId });
  }

  private mapToDomain(row: typeof projects.$inferSelect): Project {
    return {
      id: row.id,
      name: row.name,
      filePath: row.filePath,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const projectRepository = new ProjectRepository();
