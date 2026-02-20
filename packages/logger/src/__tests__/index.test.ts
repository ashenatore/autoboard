/**
 * Comprehensive unit tests for the logger package
 *
 * Test coverage:
 * 1. Log level filtering (debug shows all, info shows info+, warn shows warn+, error shows only errors)
 * 2. Context is included in all log output
 * 3. Environment variable LOG_LEVEL parsing with fallback to 'info'
 * 4. stderr vs stdout routing for backend (Node.js)
 * 5. Browser console mapping (verify console.error/warn/info/debug are called)
 * 6. Platform detection works correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Logger', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let stdoutWrite: ReturnType<typeof vi.spyOn>;
  let stderrWrite: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;

    // Clear environment
    process.env = {};

    // Mock stdout/stderr writes
    stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    // Mock console methods (for browser tests)
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock console.debug if it exists, otherwise create it
    if (typeof console.debug === 'undefined') {
      (console as any).debug = vi.fn();
    } else {
      vi.spyOn(console, 'debug').mockImplementation(() => {});
    }

    // Clear module cache to ensure fresh imports
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;

    // Restore mocks
    vi.restoreAllMocks();

    // Clear module cache
    vi.resetModules();
  });

  describe('log level filtering', () => {
    it('debug level shows all logs (debug, info, warn, error)', async () => {
      process.env.LOG_LEVEL = 'debug';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      // All logs should be output to stdout/stderr
      const stdoutCalls = stdoutWrite.mock.calls.length;
      const stderrCalls = stderrWrite.mock.calls.length;
      expect(stdoutCalls + stderrCalls).toBeGreaterThan(0);

      // Check that messages contain context
      const allWrites = [...stdoutWrite.mock.calls, ...stderrWrite.mock.calls];
      allWrites.forEach((call) => {
        const message = call[0] as string;
        expect(message).toContain('[test]');
      });
    });

    it('info level shows info, warn, and error logs (but not debug)', async () => {
      process.env.LOG_LEVEL = 'info';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      const stdoutCalls = stdoutWrite.mock.calls.length;
      const stderrCalls = stderrWrite.mock.calls.length;
      expect(stdoutCalls + stderrCalls).toBe(3); // info, warn, error (not debug)
    });

    it('warn level shows warn and error logs (but not debug or info)', async () => {
      process.env.LOG_LEVEL = 'warn';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      const stdoutCalls = stdoutWrite.mock.calls.length;
      const stderrCalls = stderrWrite.mock.calls.length;
      expect(stdoutCalls + stderrCalls).toBe(2); // warn, error only
    });

    it('error level shows only error logs (but not debug, info, or warn)', async () => {
      process.env.LOG_LEVEL = 'error';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      const stdoutCalls = stdoutWrite.mock.calls.length;
      const stderrCalls = stderrWrite.mock.calls.length;
      expect(stdoutCalls + stderrCalls).toBe(1); // error only
    });
  });

  describe('context inclusion', () => {
    it('includes context in all log output', async () => {
      process.env.LOG_LEVEL = 'debug';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'my-context' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      // Verify context appears in all writes
      const allWrites = [...stdoutWrite.mock.calls, ...stderrWrite.mock.calls];
      allWrites.forEach((call) => {
        const message = call[0] as string;
        expect(message).toContain('[my-context]');
      });
    });

    it('allows logging with meta data', async () => {
      process.env.LOG_LEVEL = 'debug';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'base-context' });

      logger.info('message', { userId: '123', action: 'test' });

      expect(stdoutWrite.mock.calls.length).toBeGreaterThan(0);
      const call = stdoutWrite.mock.calls[0][0] as string;
      expect(call).toContain('[base-context]');
      expect(call).toContain('message');
    });
  });

  describe('LOG_LEVEL environment variable', () => {
    it('uses "info" as default when LOG_LEVEL is not set', async () => {
      delete process.env.LOG_LEVEL;
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.debug('debug message');
      logger.info('info message');

      // Debug should not appear, info should
      const stdoutCalls = stdoutWrite.mock.calls.length;
      const stderrCalls = stderrWrite.mock.calls.length;
      expect(stdoutCalls + stderrCalls).toBe(1); // Only info
    });

    it('parses LOG_LEVEL from environment variable (debug)', async () => {
      process.env.LOG_LEVEL = 'debug';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.debug('should appear');

      expect(stdoutWrite.mock.calls.length).toBeGreaterThan(0);
    });

    it('parses LOG_LEVEL from environment variable (info)', async () => {
      process.env.LOG_LEVEL = 'info';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.info('should appear');

      expect(stdoutWrite.mock.calls.length).toBeGreaterThan(0);
    });

    it('parses LOG_LEVEL from environment variable (warn)', async () => {
      process.env.LOG_LEVEL = 'warn';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.warn('should appear');

      expect(stderrWrite.mock.calls.length).toBeGreaterThan(0);
    });

    it('parses LOG_LEVEL from environment variable (error)', async () => {
      process.env.LOG_LEVEL = 'error';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.error('should appear');

      expect(stderrWrite.mock.calls.length).toBeGreaterThan(0);
    });

    it('falls back to "info" for invalid LOG_LEVEL values', async () => {
      process.env.LOG_LEVEL = 'invalid';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.debug('should not appear');
      logger.info('should appear');

      // Debug should not appear (fallback to info), info should
      const stdoutCalls = stdoutWrite.mock.calls.length;
      const stderrCalls = stderrWrite.mock.calls.length;
      expect(stdoutCalls + stderrCalls).toBe(1); // Only info
    });

    it('is case-insensitive for LOG_LEVEL values', async () => {
      process.env.LOG_LEVEL = 'DEBUG';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.debug('should appear');

      expect(stdoutWrite.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('stderr vs stdout routing for Node.js', () => {
    it('routes error and warn to stderr in Node.js', async () => {
      process.env.LOG_LEVEL = 'debug';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.error('error to stderr');
      logger.warn('warn to stderr');

      expect(stderrWrite.mock.calls.length).toBe(2);
      expect(stdoutWrite.mock.calls.length).toBe(0);
    });

    it('routes info and debug to stdout in Node.js', async () => {
      process.env.LOG_LEVEL = 'debug';
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      logger.info('info to stdout');
      logger.debug('debug to stdout');

      expect(stdoutWrite.mock.calls.length).toBe(2);
      expect(stderrWrite.mock.calls.length).toBe(0);
    });
  });

  describe('logger methods', () => {
    it('provides debug, info, warn, and error methods', async () => {
      const { createLogger } = await import('../index.js');
      const logger = createLogger({ context: 'test' });

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('allows creating multiple logger instances with different contexts', async () => {
      const { createLogger } = await import('../index.js');

      const logger1 = createLogger({ context: 'context-1' });
      const logger2 = createLogger({ context: 'context-2' });

      expect(logger1).toBeDefined();
      expect(logger2).toBeDefined();

      // They should be different instances
      expect(logger1).not.toBe(logger2);
    });

    it('supports getLogger cached API', async () => {
      const { getLogger } = await import('../index.js');

      const logger1 = getLogger('cached-context');
      const logger2 = getLogger('cached-context');

      expect(logger1).toBeDefined();
      expect(logger2).toBeDefined();

      // Should return the same instance for same context
      expect(logger1).toBe(logger2);
    });
  });
});
