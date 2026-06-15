import { describe, it, expect, beforeEach } from 'vitest';
import { MockScorm2004Api } from '../../src/mock/mock-scorm2004-api';

describe('MockScorm2004Api', () => {
  let api: MockScorm2004Api;

  beforeEach(() => {
    api = new MockScorm2004Api();
  });

  describe('Initialize', () => {
    it('succeeds on first call', () => {
      expect(api.Initialize('')).toBe('true');
      expect(api.GetLastError()).toBe('0');
    });

    it('fails with 103 on double initialize', () => {
      api.Initialize('');
      expect(api.Initialize('')).toBe('false');
      expect(api.GetLastError()).toBe('103');
    });

    it('fails with 104 after termination', () => {
      api.Initialize('');
      api.Terminate('');
      expect(api.Initialize('')).toBe('false');
      expect(api.GetLastError()).toBe('104');
    });
  });

  describe('Terminate', () => {
    it('succeeds when initialized', () => {
      api.Initialize('');
      expect(api.Terminate('')).toBe('true');
      expect(api.GetLastError()).toBe('0');
    });

    it('fails with 112 before initialization', () => {
      expect(api.Terminate('')).toBe('false');
      expect(api.GetLastError()).toBe('112');
    });

    it('fails with 113 on double terminate', () => {
      api.Initialize('');
      api.Terminate('');
      expect(api.Terminate('')).toBe('false');
      expect(api.GetLastError()).toBe('113');
    });
  });

  describe('GetValue / SetValue', () => {
    it('stores and retrieves values', () => {
      api.Initialize('');
      api.SetValue('cmi.completion_status', 'completed');
      expect(api.GetValue('cmi.completion_status')).toBe('completed');
    });

    it('returns empty string for unset values', () => {
      api.Initialize('');
      expect(api.GetValue('cmi.learner_name')).toBe('');
    });

    it('GetValue fails with 122 before init', () => {
      expect(api.GetValue('cmi.learner_name')).toBe('');
      expect(api.GetLastError()).toBe('122');
    });

    it('GetValue fails with 123 after terminate', () => {
      api.Initialize('');
      api.Terminate('');
      expect(api.GetValue('cmi.learner_name')).toBe('');
      expect(api.GetLastError()).toBe('123');
    });

    it('SetValue fails with 132 before init', () => {
      expect(api.SetValue('cmi.location', 'page1')).toBe('false');
      expect(api.GetLastError()).toBe('132');
    });

    it('SetValue fails with 133 after terminate', () => {
      api.Initialize('');
      api.Terminate('');
      expect(api.SetValue('cmi.location', 'page1')).toBe('false');
      expect(api.GetLastError()).toBe('133');
    });
  });

  describe('Commit', () => {
    it('succeeds when initialized', () => {
      api.Initialize('');
      expect(api.Commit('')).toBe('true');
    });

    it('fails with 142 before init', () => {
      expect(api.Commit('')).toBe('false');
      expect(api.GetLastError()).toBe('142');
    });

    it('fails with 143 after terminate', () => {
      api.Initialize('');
      api.Terminate('');
      expect(api.Commit('')).toBe('false');
      expect(api.GetLastError()).toBe('143');
    });
  });

  describe('error helpers', () => {
    it('returns error string for known codes', () => {
      expect(api.GetErrorString('0')).toBe('No Error');
      expect(api.GetErrorString('103')).toBe('Already Initialized');
      expect(api.GetErrorString('112')).toBe('Termination Before Initialization');
    });

    it('returns empty for unknown codes', () => {
      expect(api.GetErrorString('999')).toBe('');
    });
  });

  describe('test helpers', () => {
    it('_reset clears all state', () => {
      api.Initialize('');
      api.SetValue('cmi.test', 'value');
      api._reset();
      expect(api._isInitialized()).toBe(false);
      expect(api._isTerminated()).toBe(false);
      expect(api._getStore().size).toBe(0);
    });
  });
});
