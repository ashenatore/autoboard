import type { Context } from "hono";
import { ValidationError, NotFoundError, ConflictError } from "@autoboard/shared";
import { getLogger } from "@autoboard/logger";

const logger = getLogger("ErrorHandler");

export function handleDomainError(error: unknown, c: Context): Response {
  if (error instanceof ValidationError) {
    return c.json({ error: error.message }, 400);
  }
  if (error instanceof NotFoundError) {
    return c.json({ error: error.message }, 404);
  }
  if (error instanceof ConflictError) {
    return c.json({ error: error.message }, 400);
  }
  logger.error("Unhandled error", error);
  return c.json(
    { error: error instanceof Error ? error.message : "Internal server error" },
    500
  );
}
