import { describe, it, expect } from 'vitest';
import { TOOL_PRESETS, DEFAULT_MODEL } from '../agent-service.js';

describe('AgentService', () => {
  describe('exports', () => {
    it('should export TOOL_PRESETS', () => {
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

    it('should export DEFAULT_MODEL', () => {
      expect(DEFAULT_MODEL).toBe('claude-opus-4-6');
    });
  });
});
