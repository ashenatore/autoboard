import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildEnv, DEFAULT_MODEL, TOOL_PRESETS, claudeProvider } from '../claude-provider.js';

describe('ClaudeProvider', () => {
  describe('constants', () => {
    it('should export DEFAULT_MODEL', () => {
      expect(DEFAULT_MODEL).toBe('claude-opus-4-6');
    });

    it('should export TOOL_PRESETS with fullAccess tools', () => {
      expect(TOOL_PRESETS).toBeDefined();
      expect(TOOL_PRESETS.fullAccess).toEqual([
        'Read',
        'Write',
        'Edit',
        'Glob',
        'Grep',
        'Bash',
        'WebSearch',
        'WebFetch',
      ]);
    });
  });

  describe('buildEnv', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should include safe system environment variables', () => {
      process.env.PATH = '/usr/bin:/bin';
      process.env.HOME = '/home/user';
      process.env.USER = 'testuser';

      const env = buildEnv();

      expect(env.PATH).toBe('/usr/bin:/bin');
      expect(env.HOME).toBe('/home/user');
      expect(env.USER).toBe('testuser');
    });

    it('should include ANTHROPIC_* variables', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      process.env.ANTHROPIC_AUTH_TOKEN = 'test-token';
      process.env.ANTHROPIC_BASE_URL = 'https://test.anthropic.com';

      const env = buildEnv();

      expect(env.ANTHROPIC_API_KEY).toBe('test-key');
      expect(env.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
      expect(env.ANTHROPIC_BASE_URL).toBe('https://test.anthropic.com');
    });

    it('should exclude unsafe environment variables', () => {
      process.env.UNSAFE_VAR = 'should-be-excluded';
      process.env.DANGEROUS_TOKEN = 'should-not-appear';

      const env = buildEnv();

      expect(env.UNSAFE_VAR).toBeUndefined();
      expect(env.DANGEROUS_TOKEN).toBeUndefined();
    });

    it('should handle missing environment variables gracefully', () => {
      // Clear all environment variables
      process.env = {};

      const env = buildEnv();

      expect(env).toEqual({});
    });

    it('should include language and locale variables', () => {
      process.env.LANG = 'en_US.UTF-8';
      process.env.LC_ALL = 'en_US.UTF-8';

      const env = buildEnv();

      expect(env.LANG).toBe('en_US.UTF-8');
      expect(env.LC_ALL).toBe('en_US.UTF-8');
    });

    it('should include shell and terminal variables', () => {
      process.env.SHELL = '/bin/bash';
      process.env.TERM = 'xterm-256color';

      const env = buildEnv();

      expect(env.SHELL).toBe('/bin/bash');
      expect(env.TERM).toBe('xterm-256color');
    });

    it('should return undefined for unset safe variables', () => {
      delete process.env.PATH;
      delete process.env.HOME;

      const env = buildEnv();

      expect(env.PATH).toBeUndefined();
      expect(env.HOME).toBeUndefined();
    });
  });

  describe('claudeProvider instance', () => {
    it('should be exported as a singleton', () => {
      expect(claudeProvider).toBeDefined();
      expect(typeof claudeProvider.query).toBe('function');
      expect(typeof claudeProvider.createQuery).toBe('function');
    });
  });
});
