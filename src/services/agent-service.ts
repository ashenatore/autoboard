/**
 * Agent Service - Convenience wrapper around ClaudeProvider.
 * Provides helper functions for common agent operations.
 * All actual implementation is delegated to claudeProvider.
 */

import { claudeProvider, TOOL_PRESETS, DEFAULT_MODEL } from "./claude-provider";
import type { AgentMessage } from "./agent-query.interface";

// Re-export for backwards compatibility
export { TOOL_PRESETS, DEFAULT_MODEL };
export type { AgentMessage };

/** Options for running the agent */
export interface RunAgentOptions {
  /** The prompt/task for the agent to execute */
  prompt: string;
  /** Working directory (project path) for the agent */
  cwd: string;
  /** Optional model override (defaults to opus) */
  model?: string;
  /** Optional system prompt */
  systemPrompt?: string;
  /** Optional abort controller for cancellation */
  abortController?: AbortController;
  /** Max turns before stopping (default: 500) */
  maxTurns?: number;
  /** Session ID to resume a previous conversation */
  resume?: string;
}

/**
 * Run the Claude agent with the given prompt on a project.
 *
 * @param options - Configuration for the agent run
 * @returns AsyncGenerator that yields agent messages
 */
export async function* runAgent(
  options: RunAgentOptions
): AsyncGenerator<AgentMessage> {
  yield* claudeProvider.query({
    prompt: options.prompt,
    model: options.model || DEFAULT_MODEL,
    cwd: options.cwd,
    maxTurns: options.maxTurns || 500,
    allowedTools: [...TOOL_PRESETS.fullAccess],
    systemPrompt: options.systemPrompt,
    abortController: options.abortController,
    resume: options.resume,
  });
}

/**
 * Run agent and collect all messages (non-streaming).
 *
 * @param options - Configuration for the agent run
 * @returns Array of all agent messages
 */
export async function runAgentToCompletion(
  options: RunAgentOptions
): Promise<AgentMessage[]> {
  const messages: AgentMessage[] = [];

  for await (const msg of runAgent(options)) {
    messages.push(msg);
  }

  return messages;
}

/**
 * Create an agent Query object that can be iterated and supports streamInput().
 *
 * @param options - Configuration for the agent run
 * @returns Query object that can be iterated and has streamInput method
 */
export function createAgentQuery(
  options: RunAgentOptions & { enableUserInput?: boolean }
) {
  return claudeProvider.createQuery({
    prompt: options.prompt,
    model: options.model || DEFAULT_MODEL,
    cwd: options.cwd,
    maxTurns: options.maxTurns || 500,
    allowedTools: [...TOOL_PRESETS.fullAccess],
    systemPrompt: options.systemPrompt,
    abortController: options.abortController,
    resume: options.resume,
    enableUserInput: options.enableUserInput,
  });
}
