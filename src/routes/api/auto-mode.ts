import { APIEvent } from "@solidjs/start/server";
import { autoModeSettingsRepository } from "~/db/repositories";
import {
  GetAutoModeStatusUseCase,
  ToggleAutoModeUseCase,
  SetAutoModeConcurrencyUseCase,
} from "~/use-cases";
import { ValidationError } from "~/use-cases/errors";
import { autoModeService } from "~/services/auto-mode-service";

export async function GET({ request }: APIEvent) {
  try {
    await autoModeService.ensureInitialized();

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return Response.json({ error: "projectId is required" }, { status: 400 });
    }

    const useCase = new GetAutoModeStatusUseCase(autoModeSettingsRepository);
    const result = await useCase.execute({ projectId });
    return Response.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Error getting auto mode status:", error);
    return Response.json({ error: "Failed to get auto mode status" }, { status: 500 });
  }
}

export async function POST({ request }: APIEvent) {
  try {
    await autoModeService.ensureInitialized();

    const body = await request.json();
    const { projectId, enabled } = body;

    const useCase = new ToggleAutoModeUseCase(autoModeSettingsRepository);
    const result = await useCase.execute({ projectId, enabled });
    return Response.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Error toggling auto mode:", error);
    return Response.json({ error: "Failed to toggle auto mode" }, { status: 500 });
  }
}

export async function PATCH({ request }: APIEvent) {
  try {
    await autoModeService.ensureInitialized();

    const body = await request.json();
    const { projectId, maxConcurrency } = body;

    const useCase = new SetAutoModeConcurrencyUseCase(autoModeSettingsRepository);
    const result = await useCase.execute({ projectId, maxConcurrency });
    return Response.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Error setting auto mode concurrency:", error);
    return Response.json({ error: "Failed to set concurrency" }, { status: 500 });
  }
}
