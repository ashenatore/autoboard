import type { AgentMessage } from '@autoboard/services';

/**
 * Mock implementation of Claude Agent Query for testing.
 * Allows control over message flow and error conditions.
 */
export class MockClaudeProvider {
  public messages: AgentMessage[] = [];
  public shouldThrow = false;
  public throwError?: Error;
  public streamInputCalls: string[] = [];

  /**
   * Create an async iterable that yields mock messages.
   */
  async *createQuery(options: {
    prompt: string;
    cwd: string;
    model?: string;
    abortController?: AbortController;
    enableUserInput?: boolean;
    resume?: string;
  }): AsyncIterable<AgentMessage> {
    if (this.shouldThrow) {
      throw this.throwError || new Error('Claude API error');
    }

    for (const message of this.messages) {
      yield message;
      // Small delay to simulate async behavior
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }

  /**
   * Mock streaming input to the agent.
   */
  streamInput(input: string): void {
    this.streamInputCalls.push(input);
  }

  /**
   * Add a message to be yielded.
   */
  addMessage(message: AgentMessage): void {
    this.messages.push(message);
  }

  /**
   * Reset all mock state.
   */
  reset(): void {
    this.messages = [];
    this.shouldThrow = false;
    this.throwError = undefined;
    this.streamInputCalls = [];
  }
}

/**
 * Helper to create mock agent messages for testing.
 */
export function createMockMessage(
  type: 'assistant' | 'result',
  content?: string
): AgentMessage {
  if (type === 'assistant') {
    return {
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: content || 'Mock assistant response',
          },
        ],
      },
      session_id: 'mock-session-id',
    };
  }
  return {
    type: 'result',
    result: content || 'Mock result',
  };
}

export function createToolUseMessage(
  toolName: string,
  toolInput: Record<string, unknown>
): AgentMessage {
  return {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          name: toolName,
          input: toolInput,
        },
      ],
    },
    session_id: 'mock-session-id',
  };
}
