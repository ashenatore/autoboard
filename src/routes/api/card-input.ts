import { APIEvent } from "@solidjs/start/server";
import { cardRunStateService } from "~/services/card-run-state";
import { cardLogRepository } from "~/db/repositories";

export async function POST({ request }: APIEvent) {
  try {
    const body = await request.json();
    const { cardId, message } = body;

    if (!cardId || !message) {
      return Response.json(
        { error: "cardId and message are required" },
        { status: 400 }
      );
    }

    const run = cardRunStateService.getRun(cardId);
    if (!run) {
      return Response.json({ error: "No active run found" }, { status: 404 });
    }

    if (!run.query) {
      return Response.json(
        { error: "No query reference available" },
        { status: 400 }
      );
    }

    // Send user input to the agent
    run.query.streamInput(message);

    // Clear needsInput flag
    cardRunStateService.setNeedsInput(cardId, false);

    // Persist user_input log
    const seq = cardRunStateService.emitLog(cardId, "user_input", message);
    await cardLogRepository.createLog({
      cardId,
      type: "user_input",
      content: message,
      sequence: seq,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error sending card input:", error);
    return Response.json(
      { error: "Failed to send input" },
      { status: 500 }
    );
  }
}
