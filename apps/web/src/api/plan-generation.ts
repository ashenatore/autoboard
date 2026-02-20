import type { Card } from "~/api/cards";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("WebAPI_PlanGeneration");

const DEFAULT_TIMEOUT_MS = 120_000;

export async function generatePlan(
  projectId: string,
  description: string,
  options?: { timeoutMs?: number }
): Promise<{ cards: Card[] }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );
  try {
    logger.info("Starting plan generation", {
      projectId,
      descriptionLength: description.length
    });
    const response = await fetch("/api/plan-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, description }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text();
      logger.error("Plan generation failed", {
        projectId,
        status: response.status,
        error: text
      });
      throw new Error(text || `Failed to generate plan (${response.status})`);
    }
    const data = await response.json();
    logger.info("Plan generation completed", {
      projectId,
      cardCount: data.cards?.length || 0
    });
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getPlanGenerationStatus(
  projectId: string
): Promise<{ isGenerating: boolean }> {
  logger.debug("Fetching plan generation status", { projectId });
  const response = await fetch(
    `/api/plan-generation/status?projectId=${encodeURIComponent(projectId)}`
  );
  if (!response.ok) {
    logger.error("Failed to get plan generation status", {
      projectId,
      status: response.status
    });
    throw new Error("Failed to get plan generation status");
  }
  return response.json();
}

export async function cancelPlanGeneration(projectId: string): Promise<void> {
  logger.debug("Cancelling plan generation", { projectId });
  const response = await fetch("/api/plan-generation", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  if (!response.ok) {
    logger.error("Failed to cancel plan generation", {
      projectId,
      status: response.status
    });
    throw new Error("Failed to cancel plan generation");
  }
}
