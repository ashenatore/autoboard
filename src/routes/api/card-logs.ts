import { APIEvent } from "@solidjs/start/server";
import { cardLogRepository } from "~/db/repositories";

export async function GET({ request }: APIEvent) {
  try {
    const url = new URL(request.url);
    const cardId = url.searchParams.get("cardId");

    if (!cardId) {
      return Response.json({ error: "cardId is required" }, { status: 400 });
    }

    const logs = await cardLogRepository.getLogsByCardId(cardId);
    return Response.json(logs);
  } catch (error) {
    console.error("Error fetching card logs:", error);
    return Response.json({ error: "Failed to fetch card logs" }, { status: 500 });
  }
}
