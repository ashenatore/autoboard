import type { Project } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("WebAPI_Projects");

export type { Project };

export async function getProjects(): Promise<Project[]> {
  logger.debug("Fetching projects");
  const response = await fetch("/api/projects");
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    logger.error("Failed to fetch projects", {
      error: err.error || "Unknown error"
    });
    throw new Error(err.error || "Failed to fetch projects");
  }
  return response.json();
}

export async function createProject(name: string, filePath: string): Promise<Project> {
  logger.debug("Creating project", {
    hasName: !!name,
    hasFilePath: !!filePath
  });
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, filePath }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    logger.error("Failed to create project", {
      error: err.error || "Unknown error"
    });
    throw new Error(err.error || "Failed to create project");
  }
  return response.json();
}

export async function updateProject(
  id: string,
  name?: string,
  filePath?: string
): Promise<Project> {
  logger.debug("Updating project", {
    id,
    hasName: !!name,
    hasFilePath: !!filePath
  });
  const response = await fetch("/api/projects", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name, filePath }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    logger.error("Failed to update project", {
      id,
      error: err.error || "Unknown error"
    });
    throw new Error(err.error || "Failed to update project");
  }
  return response.json();
}

export async function deleteProject(id: string): Promise<void> {
  logger.debug("Deleting project", { id });
  const response = await fetch("/api/projects", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    logger.error("Failed to delete project", {
      id,
      error: err.error || "Unknown error"
    });
    throw new Error(err.error || "Failed to delete project");
  }
}
