import type { Card, CreateCardParams, UpdateCardParams } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("WebAPI_Cards");

export type { Card, CreateCardParams, UpdateCardParams };

export async function getCards(projectId: string): Promise<Card[]> {
  if (!projectId) return [];
  logger.debug("Fetching cards", { projectId });
  const response = await fetch(`/api/cards?projectId=${encodeURIComponent(projectId)}`);
  if (!response.ok) {
    logger.error("Failed to fetch cards", {
      projectId,
      status: response.status
    });
    throw new Error("Failed to fetch cards");
  }
  return response.json();
}

export async function getArchivedCards(projectId: string): Promise<Card[]> {
  if (!projectId) return [];
  logger.debug("Fetching archived cards", { projectId });
  const response = await fetch(
    `/api/cards?projectId=${encodeURIComponent(projectId)}&archived=true`
  );
  if (!response.ok) {
    logger.error("Failed to fetch archived cards", {
      projectId,
      status: response.status
    });
    throw new Error("Failed to fetch archived cards");
  }
  return response.json();
}

export async function createCard(params: CreateCardParams): Promise<Card> {
  logger.debug("Creating card", {
    hasTitle: !!params.title,
    hasDescription: !!params.description,
    columnId: params.columnId
  });
  const response = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    logger.error("Failed to create card", {
      status: response.status
    });
    throw new Error("Failed to create card");
  }
  return response.json();
}

export async function updateCard(id: string, updates: UpdateCardParams): Promise<Card> {
  logger.debug("Updating card", {
    id,
    updateKeys: Object.keys(updates)
  });
  const response = await fetch("/api/cards", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!response.ok) {
    logger.error("Failed to update card", {
      id,
      status: response.status
    });
    throw new Error("Failed to update card");
  }
  return response.json();
}

export async function deleteCard(id: string): Promise<void> {
  logger.debug("Deleting card", { id });
  const response = await fetch("/api/cards", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    logger.error("Failed to delete card", {
      id,
      status: response.status
    });
    throw new Error("Failed to delete card");
  }
}

export async function archiveCard(id: string): Promise<Card> {
  logger.debug("Archiving card", { id });
  const response = await fetch("/api/cards", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, archivedAt: new Date().toISOString() }),
  });
  if (!response.ok) {
    logger.error("Failed to archive card", {
      id,
      status: response.status
    });
    throw new Error("Failed to archive card");
  }
  return response.json();
}
