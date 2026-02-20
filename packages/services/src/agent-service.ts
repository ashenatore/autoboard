/**
 * Agent Service - Convenience wrapper around ClaudeProvider.
 */

import { claudeProvider, TOOL_PRESETS, DEFAULT_MODEL } from "./claude-provider.js";
import { getLogger } from "@autoboard/logger";
import type { AgentMessage } from "./agent-query.interface.js";

const logger = getLogger("AgentService");

export { TOOL_PRESETS, DEFAULT_MODEL };
export type { AgentMessage };

export interface RunAgentOptions {
  prompt: string;
  cwd: string;
  model?: string;
  systemPrompt?: string;
  abortController?: AbortController;
  maxTurns?: number;
  resume?: string;
}

export async function* runAgent(options: RunAgentOptions): AsyncGenerator<AgentMessage> {
  logger.debug("Agent run starting", {
    hasPrompt: !!options.prompt,
    cwd: options.cwd,
    model: options.model || DEFAULT_MODEL,
    maxTurns: options.maxTurns || 500
  });

  const messages: AgentMessage[] = [];
  for await (const msg of claudeProvider.query({
    prompt: options.prompt,
    model: options.model || DEFAULT_MODEL,
    cwd: options.cwd,
    maxTurns: options.maxTurns || 500,
    allowedTools: [...TOOL_PRESETS.fullAccess],
    systemPrompt: options.systemPrompt,
    abortController: options.abortController,
    resume: options.resume,
  })) {
    messages.push(msg);
    yield msg;
  }

  logger.debug("Agent run completed", {
    messageCount: messages.length
  });
}

export async function runAgentToCompletion(options: RunAgentOptions): Promise<AgentMessage[]> {
  logger.debug("Agent run to completion starting", {
    hasPrompt: !!options.prompt,
    cwd: options.cwd,
    model: options.model || DEFAULT_MODEL
  });

  const messages: AgentMessage[] = [];
  for await (const msg of runAgent(options)) messages.push(msg);

  logger.debug("Agent run to completion completed", {
    messageCount: messages.length
  });

  return messages;
}

export function createAgentQuery(options: RunAgentOptions & { enableUserInput?: boolean }) {
  logger.debug("Creating agent query", {
    hasPrompt: !!options.prompt,
    cwd: options.cwd,
    enableUserInput: options.enableUserInput ?? false
  });

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
