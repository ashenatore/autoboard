import type { CardRepository } from "~/db/repositories/card-repository";
import type { ProjectRepository } from "~/db/repositories/project-repository";
import { cardLogRepository } from "~/db/repositories";
import { cardRunStateService } from "~/services/card-run-state";
import { createAgentQuery, type AgentMessage } from "~/services/agent-service";
import { ValidationError, NotFoundError, ConflictError } from "./errors";

export interface StartCardRunInput {
  cardId: string;
  prompt?: string;
  model?: string;
}

export interface StartCardRunResult {
  success: boolean;
  cardId: string;
  status: "started";
  projectPath: string;
  prompt: string;
}

export class StartCardRunUseCase {
  constructor(
    private cardRepository: CardRepository,
    private projectRepository: ProjectRepository
  ) {}

  async execute(input: StartCardRunInput): Promise<StartCardRunResult> {
    if (!input.cardId) {
      throw new ValidationError("cardId is required");
    }

    // Check if already running
    if (cardRunStateService.isRunning(input.cardId)) {
      throw new ConflictError("Card is already being processed");
    }

    // Fetch the card
    const kanbanCard = await this.cardRepository.getCardById(input.cardId);

    if (!kanbanCard) {
      throw new NotFoundError("Card not found");
    }

    if (!kanbanCard.projectId) {
      throw new ValidationError("Card has no associated project");
    }

    // Fetch the project to get the file path
    const project = await this.projectRepository.getProjectById(kanbanCard.projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const projectPath = project.filePath;
    const prompt = input.prompt || kanbanCard.description || kanbanCard.title || "";

    if (!prompt) {
      throw new ValidationError("Card must have a prompt, description, or title");
    }

    // Create abort controller for this run
    const abortController = new AbortController();

    // Get the max sequence from existing logs so new logs don't collide
    const existingLogs = await cardLogRepository.getLogsByCardId(input.cardId);
    const maxSequence = existingLogs.length > 0
      ? Math.max(...existingLogs.map((l) => l.sequence))
      : 0;

    // Initialize run state with sequence continuing from previous logs
    cardRunStateService.createRun(input.cardId, abortController, maxSequence);

    // Use existing session ID for conversation continuity
    const resumeSessionId = kanbanCard.sessionId || undefined;

    // Start the agent in background (don't await)
    this.runAgentInBackground(input.cardId, prompt, projectPath, input.model, abortController, resumeSessionId);

    return {
      success: true,
      cardId: input.cardId,
      status: "started",
      projectPath,
      prompt,
    };
  }

  /**
   * Run the agent in background, classify messages, persist logs, and move card on completion.
   */
  private async runAgentInBackground(
    cardId: string,
    prompt: string,
    cwd: string,
    model: string | undefined,
    abortController: AbortController,
    resumeSessionId?: string
  ): Promise<void> {
    const run = cardRunStateService.getRun(cardId);
    if (!run) return;

    try {
      const queryObj = createAgentQuery({
        prompt,
        cwd,
        model,
        abortController,
        enableUserInput: true,
        resume: resumeSessionId,
      });

      cardRunStateService.setQuery(cardId, queryObj);

      let capturedSessionId: string | null = null;

      for await (const msg of queryObj) {
        cardRunStateService.addMessage(cardId, msg as AgentMessage);
        await this.classifyAndPersistMessage(cardId, msg as AgentMessage);

        // Capture session_id from the first message that has one
        if (!capturedSessionId && msg.session_id) {
          capturedSessionId = msg.session_id;
        }
      }

      // Persist the session ID to the card for future resumption
      if (capturedSessionId) {
        await this.cardRepository.updateCard(cardId, {
          sessionId: capturedSessionId,
          updatedAt: new Date(),
        }).catch((err) => {
          console.error(`[Card ${cardId}] Failed to save session ID:`, err);
        });
      }

      // Move card to manual-review BEFORE emitting completed status,
      // so that when the client refetches cards it sees the updated columnId
      await this.cardRepository.updateCard(cardId, {
        columnId: "manual-review",
        updatedAt: new Date(),
      });

      // Emit system log for completion
      const seq = cardRunStateService.emitLog(cardId, "system", "Agent run completed");
      await cardLogRepository.createLog({
        cardId,
        type: "system",
        content: "Agent run completed",
        sequence: seq,
      });

      // Now emit completed status — this triggers client refetch
      cardRunStateService.updateRunStatus(cardId, "completed");

      console.log(`[Card ${cardId}] Agent run completed${resumeSessionId ? " (resumed session)" : ""}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Emit error log
      const seq = cardRunStateService.emitLog(cardId, "error", errorMessage);
      await cardLogRepository.createLog({
        cardId,
        type: "error",
        content: errorMessage,
        sequence: seq,
      }).catch(() => {});

      // Emit system log for error
      const seq2 = cardRunStateService.emitLog(cardId, "system", `Agent run failed: ${errorMessage}`);
      await cardLogRepository.createLog({
        cardId,
        type: "system",
        content: `Agent run failed: ${errorMessage}`,
        sequence: seq2,
      }).catch(() => {});

      // Move card to manual-review BEFORE emitting error status
      await this.cardRepository.updateCard(cardId, {
        columnId: "manual-review",
        updatedAt: new Date(),
      }).catch(() => {});

      // Now emit error status — this triggers client refetch
      cardRunStateService.updateRunStatus(cardId, "error", errorMessage);

      console.error(`[Card ${cardId}] Agent run failed:`, error);
    }
  }

  /**
   * Classify agent message into log entry types and persist.
   */
  private async classifyAndPersistMessage(
    cardId: string,
    msg: AgentMessage
  ): Promise<void> {
    if (msg.type === "assistant" && msg.message?.content) {
      for (const block of msg.message.content) {
        if (block.type === "text" && block.text) {
          const seq = cardRunStateService.emitLog(cardId, "assistant_text", block.text);
          await cardLogRepository.createLog({
            cardId,
            type: "assistant_text",
            content: block.text,
            sequence: seq,
          });
        } else if (block.type === "tool_use") {
          const toolName = block.name || "unknown";
          const toolInput = typeof block.input === "string"
            ? block.input
            : JSON.stringify(block.input || {});

          // Check if this is an AskUserQuestion tool
          if (toolName === "AskUserQuestion") {
            cardRunStateService.setNeedsInput(cardId, true);
            const seq = cardRunStateService.emitLog(cardId, "ask_user", toolInput);
            await cardLogRepository.createLog({
              cardId,
              type: "ask_user",
              content: toolInput,
              sequence: seq,
            });
          } else {
            const content = JSON.stringify({ tool: toolName, input: block.input });
            const seq = cardRunStateService.emitLog(cardId, "tool_use", content);
            await cardLogRepository.createLog({
              cardId,
              type: "tool_use",
              content,
              sequence: seq,
            });
          }
        }
      }
    } else if (msg.type === "result") {
      const content = typeof msg.result === "string"
        ? msg.result
        : JSON.stringify(msg.result || msg);
      const truncated = content.length > 2000 ? content.slice(0, 2000) + "..." : content;
      const seq = cardRunStateService.emitLog(cardId, "tool_result", truncated);
      await cardLogRepository.createLog({
        cardId,
        type: "tool_result",
        content: truncated,
        sequence: seq,
      });
    }
  }
}
