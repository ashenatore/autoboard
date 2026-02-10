/**
 * Claude Provider - Implementation of IAgentCodeQuery interface.
 * Contains all implementation details for running Claude code queries.
 */

import { query, type Options, type Query, type PermissionMode } from "@anthropic-ai/claude-agent-sdk";
import type {
  IAgentCodeQuery,
  AgentQueryOptions,
  AgentMessage,
  AgentQuery,
} from "./agent-query.interface";

/** Default model to use for agent queries */
export const DEFAULT_MODEL = "claude-opus-4-6";

/** Tool presets for agent execution */
export const TOOL_PRESETS = {
  fullAccess: [
    "Read",
    "Write",
    "Edit",
    "Glob",
    "Grep",
    "Bash",
    "WebSearch",
    "WebFetch",
  ] as const,
};

/**
 * System environment variables to pass to the SDK.
 */
const SYSTEM_ENV_VARS = [
  "PATH",
  "HOME",
  "SHELL",
  "TERM",
  "USER",
  "LANG",
  "LC_ALL",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
];

/**
 * Build environment object for the SDK from process.env.
 */
export function buildEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = {};
  for (const key of SYSTEM_ENV_VARS) {
    if (process.env[key]) {
      env[key] = process.env[key];
    }
  }
  return env;
}

/**
 * ClaudeProvider - Implements IAgentCodeQuery interface.
 * Handles all SDK-specific details for communicating with Claude's code query function.
 */
class ClaudeProvider implements IAgentCodeQuery {
  /**
   * Execute a query against Claude's code query function.
   *
   * @param options - Configuration options for the query
   * @returns AsyncGenerator that yields agent messages from the stream
   */
  async *query(options: AgentQueryOptions): AsyncGenerator<AgentMessage> {
    const {
      prompt,
      model,
      cwd,
      maxTurns = 1,
      allowedTools = [],
      permissionMode = "bypassPermissions",
      allowDangerouslySkipPermissions = true,
      env = buildEnv(),
      systemPrompt,
      abortController,
      resume,
    } = options;

    // Convert AgentQueryOptions to SDK Options type
    const sdkOptions: Options = {
      model,
      cwd,
      maxTurns,
      allowedTools,
      permissionMode: permissionMode as PermissionMode,
      allowDangerouslySkipPermissions,
      env,
      ...(systemPrompt && { systemPrompt }),
      ...(abortController && { abortController }),
      ...(resume && { resume }),
    };

    // Execute query using SDK
    const stream = query({ prompt, options: sdkOptions });

    // Yield messages from the stream
    for await (const msg of stream) {
      yield msg as AgentMessage;
    }
  }

  /**
   * Create a Query object that can be iterated and supports streamInput().
   * This is useful when you need to send user input to a running agent.
   *
   * @param options - Configuration options for the query
   * @returns Query object that can be iterated and has streamInput method
   */
  createQuery(
    options: AgentQueryOptions & { enableUserInput?: boolean }
  ): AgentQuery {
    const {
      prompt,
      model,
      cwd,
      maxTurns = 500,
      allowedTools = [],
      permissionMode = "bypassPermissions",
      allowDangerouslySkipPermissions = true,
      env = buildEnv(),
      systemPrompt,
      abortController,
      resume,
      enableUserInput,
    } = options;

    // Build allowed tools list
    const tools = enableUserInput
      ? [...allowedTools, "AskUserQuestion"]
      : allowedTools;

    // Convert AgentQueryOptions to SDK Options type
    const sdkOptions: Options = {
      model,
      cwd,
      maxTurns,
      allowedTools: tools.length > 0 ? tools : [...TOOL_PRESETS.fullAccess],
      permissionMode: permissionMode as PermissionMode,
      allowDangerouslySkipPermissions,
      env,
      ...(systemPrompt && { systemPrompt }),
      ...(abortController && { abortController }),
      ...(resume && { resume }),
    };

    // Return the raw SDK Query object which supports streamInput
    // Wrap streamInput to accept string instead of AsyncIterable<SDKUserMessage>
    const sdkQuery = query({ prompt, options: sdkOptions });
    
    // Create a wrapper that explicitly implements async iterable
    // This ensures Symbol.asyncIterator is properly preserved
    const queryWrapper: AgentQuery = {
      async *[Symbol.asyncIterator]() {
        yield* sdkQuery;
      },
      streamInput: (message: string) => {
        // SDK expects AsyncIterable<SDKUserMessage>, so wrap the string
        // The SDK Query.streamInput accepts AsyncIterable, but we simplify to string
        // Cast to any to work around complex SDK type requirements
        const messageIterable = async function* () {
          yield {
            type: "user" as const,
            message: message,
            parent_tool_use_id: null,
          } as any;
        };
        return (sdkQuery.streamInput as any)(messageIterable());
      },
    };
    
    return queryWrapper;
  }
}

/**
 * Singleton instance of ClaudeProvider for use across the application.
 */
export const claudeProvider = new ClaudeProvider();
