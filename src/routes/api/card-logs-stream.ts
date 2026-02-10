import { APIEvent } from "@solidjs/start/server";
import { cardRunStateService } from "~/services/card-run-state";

export async function GET({ request }: APIEvent) {
  const url = new URL(request.url);
  const cardId = url.searchParams.get("cardId");

  if (!cardId) {
    return Response.json({ error: "cardId is required" }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: any) {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream may be closed
        }
      }

      // Send current status
      const run = cardRunStateService.getRun(cardId);
      if (run) {
        send("status", {
          cardId,
          status: run.status,
          error: run.error,
          needsInput: run.needsInput,
        });
      } else {
        send("status", { cardId, status: "not_found" });
      }

      // Subscribe to events
      const unsubLog = cardRunStateService.onLog(cardId, (event) => {
        send("log", event);
      });

      const unsubStatus = cardRunStateService.onStatusChange(cardId, (event) => {
        send("status", event);
        if (event.status === "completed" || event.status === "error") {
          cleanup();
        }
      });

      const unsubNeedsInput = cardRunStateService.onNeedsInput(cardId, (event) => {
        send("needsInput", event);
      });

      function cleanup() {
        unsubLog();
        unsubStatus();
        unsubNeedsInput();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }

      // Handle client disconnect
      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
