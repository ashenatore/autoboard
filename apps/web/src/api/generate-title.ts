import type { Card } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("WebAPI_GenerateTitle");

export interface GenerateTitleResponse {
  title: string;
  card: Card;
}

export async function generateTitle(
  cardId: string
): Promise<GenerateTitleResponse> {
  logger.debug("Generating title", { cardId });
  const response = await fetch("/api/generate-title", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId }),
  });
  if (!response.ok) {
    logger.error("Failed to generate title", {
      cardId,
      status: response.status
    });
    throw new Error("Failed to generate title");
  }
  const data = await response.json();
  logger.info("Title generated", {
    cardId,
    titleLength: data.title.length
  });
  return data;
}
