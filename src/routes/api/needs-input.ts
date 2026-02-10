import { APIEvent } from "@solidjs/start/server";
import { cardRunStateService } from "~/services/card-run-state";

export async function GET(_event: APIEvent) {
  const result: Record<string, boolean> = {};

  for (const [cardId, run] of cardRunStateService.getAllRuns()) {
    if (run.needsInput) {
      result[cardId] = true;
    }
  }

  return Response.json(result);
}
