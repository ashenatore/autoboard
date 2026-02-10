export interface CardLogEntry {
  id: string;
  cardId: string;
  type: string;
  content: string;
  sequence: number;
  createdAt: string;
}

export interface LogStreamHandlers {
  onLog?: (event: { cardId: string; type: string; content: string; sequence: number }) => void;
  onStatus?: (event: { cardId: string; status: string; error?: string; needsInput?: boolean }) => void;
  onNeedsInput?: (event: { cardId: string; needsInput: boolean }) => void;
}

/**
 * Fetch all persisted logs for a card.
 */
export async function getCardLogs(cardId: string): Promise<CardLogEntry[]> {
  const response = await fetch(
    `/api/card-logs?cardId=${encodeURIComponent(cardId)}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch card logs");
  }
  return response.json();
}

/**
 * Subscribe to real-time card log events via SSE.
 * Returns the EventSource for cleanup.
 */
export function subscribeToCardLogs(
  cardId: string,
  handlers: LogStreamHandlers
): EventSource {
  const es = new EventSource(
    `/api/card-logs-stream?cardId=${encodeURIComponent(cardId)}`
  );

  es.addEventListener("log", (e) => {
    if (handlers.onLog) {
      handlers.onLog(JSON.parse(e.data));
    }
  });

  es.addEventListener("status", (e) => {
    if (handlers.onStatus) {
      handlers.onStatus(JSON.parse(e.data));
    }
  });

  es.addEventListener("needsInput", (e) => {
    if (handlers.onNeedsInput) {
      handlers.onNeedsInput(JSON.parse(e.data));
    }
  });

  return es;
}

/**
 * Send user input to a running agent.
 */
export async function sendCardInput(
  cardId: string,
  message: string
): Promise<void> {
  const response = await fetch("/api/card-input", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId, message }),
  });

  if (!response.ok) {
    throw new Error("Failed to send input");
  }
}

/**
 * Fetch which cards currently need user input.
 */
export async function getNeedsInput(): Promise<Record<string, boolean>> {
  const response = await fetch("/api/needs-input");
  if (!response.ok) {
    return {};
  }
  return response.json();
}

/**
 * Fetch which cards are currently running.
 */
export async function getRunningCards(): Promise<Record<string, boolean>> {
  const response = await fetch("/api/running-cards");
  if (!response.ok) {
    return {};
  }
  return response.json();
}
