import type { Context } from "hono";
import {
  GetAutoModeStatusUseCase,
  ToggleAutoModeUseCase,
  SetAutoModeConcurrencyUseCase,
} from "@autoboard/domain";
import type { AutoModeSettingsRepository } from "@autoboard/db";
import type { IAutoModeLoop } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";
import { handleDomainError } from "../error-handler.js";

const logger = getLogger("AutoModeController");

export function createAutoModeController(
  autoModeSettingsRepository: AutoModeSettingsRepository,
  autoModeLoop: IAutoModeLoop & { ensureInitialized?(): Promise<void> }
) {
  const getStatus = new GetAutoModeStatusUseCase(
    autoModeSettingsRepository,
    autoModeLoop
  );
  const toggle = new ToggleAutoModeUseCase(
    autoModeSettingsRepository,
    autoModeLoop
  );
  const setConcurrency = new SetAutoModeConcurrencyUseCase(
    autoModeSettingsRepository
  );

  return {
    async get(c: Context) {
      let projectId: string | undefined;
      try {
        await autoModeLoop.ensureInitialized?.();
        const url = new URL(c.req.url);
        projectId = url.searchParams.get("projectId") || undefined;
        if (!projectId) {
          return c.json({ error: "projectId is required" }, 400);
        }

        logger.debug("Get auto mode status request", { projectId });

        const result = await getStatus.execute({ projectId });

        logger.debug("Auto mode status retrieved", {
          projectId,
          enabled: result.enabled,
          loopRunning: result.loopRunning,
          activeRunCount: result.activeRunCount
        });

        return c.json(result);
      } catch (error) {
        logger.error("Get auto mode status failed", {
          projectId,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },

    async post(c: Context) {
      let projectId: string | undefined;
      let enabled: boolean | undefined;
      try {
        await autoModeLoop.ensureInitialized?.();
        const body = await c.req.json();
        const { projectId: pid, enabled: en } = body;
        projectId = pid;
        enabled = en;

        logger.debug("Toggle auto mode request", { projectId: pid, enabled: en });

        const result = await toggle.execute({ projectId: pid, enabled: en });

        logger.info("Auto mode toggled", {
          projectId: pid,
          enabled: result.enabled
        });

        return c.json(result);
      } catch (error) {
        logger.error("Toggle auto mode failed", {
          projectId,
          enabled,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },

    async patch(c: Context) {
      let projectId: string | undefined;
      let maxConcurrency: number | undefined;
      try {
        await autoModeLoop.ensureInitialized?.();
        const body = await c.req.json();
        const { projectId: pid, maxConcurrency: max } = body;
        projectId = pid;
        maxConcurrency = max;

        logger.debug("Set auto mode concurrency request", {
          projectId: pid,
          maxConcurrency: max
        });

        const result = await setConcurrency.execute({ projectId: pid, maxConcurrency: max });

        logger.info("Auto mode concurrency updated", {
          projectId: pid,
          maxConcurrency: result.maxConcurrency
        });

        return c.json(result);
      } catch (error) {
        logger.error("Set auto mode concurrency failed", {
          projectId,
          maxConcurrency,
          error: error instanceof Error ? error.message : String(error)
        });
        return handleDomainError(error, c);
      }
    },
  };
}
