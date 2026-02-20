import { getLogger } from "@autoboard/logger";

const logger = getLogger("WebAPI_AutoMode");

export interface AutoModeStatus {
  projectId: string;
  enabled: boolean;
  maxConcurrency: number;
  loopRunning: boolean;
  activeRunCount: number;
  activeCardIds: string[];
}

export async function getAutoModeStatus(projectId: string): Promise<AutoModeStatus> {
  if (!projectId) {
    return {
      projectId: "",
      enabled: false,
      maxConcurrency: 1,
      loopRunning: false,
      activeRunCount: 0,
      activeCardIds: [],
    };
  }
  logger.debug("Fetching auto mode status", { projectId });
  const response = await fetch(
    `/api/auto-mode?projectId=${encodeURIComponent(projectId)}`
  );
  if (!response.ok) {
    logger.error("Failed to get auto mode status", {
      projectId,
      status: response.status
    });
    throw new Error("Failed to get auto mode status");
  }
  return response.json();
}

export async function toggleAutoMode(
  projectId: string,
  enabled: boolean
): Promise<void> {
  logger.debug("Toggling auto mode", { projectId, enabled });
  const response = await fetch("/api/auto-mode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, enabled }),
  });
  if (!response.ok) {
    logger.error("Failed to toggle auto mode", {
      projectId,
      enabled,
      status: response.status
    });
    throw new Error("Failed to toggle auto mode");
  }
}

export async function setAutoModeConcurrency(
  projectId: string,
  maxConcurrency: number
): Promise<void> {
  logger.debug("Setting auto mode concurrency", {
    projectId,
    maxConcurrency
  });
  const response = await fetch("/api/auto-mode", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, maxConcurrency }),
  });
  if (!response.ok) {
    logger.error("Failed to set concurrency", {
      projectId,
      maxConcurrency,
      status: response.status
    });
    throw new Error("Failed to set concurrency");
  }
}
