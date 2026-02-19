import { randomUUID } from 'node:crypto';

/**
 * Test utility functions for common testing patterns.
 */
export class TestHelpers {
  /**
   * Generate a random UUID for testing.
   */
  static randomId(): string {
    return randomUUID();
  }

  /**
   * Create a date offset from now for testing timestamps.
   */
  static dateOffset(seconds: number): Date {
    const date = new Date();
    date.setSeconds(date.getSeconds() + seconds);
    return date;
  }

  /**
   * Wait for a specified number of milliseconds.
   * Useful for testing async behavior and timeouts.
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wait until a condition is true or timeout expires.
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 50 } = options;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await this.wait(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Create a mock AbortController for testing.
   */
  static mockAbortController(): AbortController {
    return new AbortController();
  }

  /**
   * Assert that a function throws an error with the expected message.
   */
  static async assertThrows(
    fn: () => Promise<void> | void,
    expectedMessage?: string
  ): Promise<void> {
    try {
      await fn();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (!(error instanceof Error)) {
        throw new Error('Expected error to be an Error instance');
      }
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to include "${expectedMessage}", got "${error.message}"`
        );
      }
    }
  }

  /**
   * Create a spy function that tracks calls.
   */
  static spy<T extends (...args: unknown[]) => unknown>(
    fn?: T
  ): T & {
    calls: Array<Parameters<T>>;
    callCount: number;
    lastCall?: Parameters<T>;
  } {
    const calls: Array<Parameters<T>> = [];
    const spy = ((...args: Parameters<T>) => {
      calls.push(args);
      return fn?.(...args);
    }) as T & {
      calls: Array<Parameters<T>>;
      callCount: number;
      lastCall?: Parameters<T>;
    };

    Object.defineProperty(spy, 'calls', { get: () => calls });
    Object.defineProperty(spy, 'callCount', { get: () => calls.length });
    Object.defineProperty(spy, 'lastCall', { get: () => calls[calls.length - 1] });

    return spy;
  }
}
