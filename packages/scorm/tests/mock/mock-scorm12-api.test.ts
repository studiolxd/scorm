import { describe, it, expect, beforeEach } from 'vitest';
import { MockScorm12Api } from '../../src/mock/mock-scorm12-api';

describe('MockScorm12Api', () => {
  let api: MockScorm12Api;

  beforeEach(() => {
    api = new MockScorm12Api();
  });

  describe('LMSInitialize', () => {
    it('succeeds on first call', () => {
      expect(api.LMSInitialize('')).toBe('true');
      expect(api.LMSGetLastError()).toBe('0');
    });

    it('fails on double initialize', () => {
      api.LMSInitialize('');
      expect(api.LMSInitialize('')).toBe('false');
      expect(api.LMSGetLastError()).toBe('101');
    });

    it('fails after termination', () => {
      api.LMSInitialize('');
      api.LMSFinish('');
      expect(api.LMSInitialize('')).toBe('false');
      expect(api.LMSGetLastError()).toBe('101');
    });
  });

  describe('LMSFinish', () => {
    it('succeeds when initialized', () => {
      api.LMSInitialize('');
      expect(api.LMSFinish('')).toBe('true');
      expect(api.LMSGetLastError()).toBe('0');
    });

    it('fails when not initialized', () => {
      expect(api.LMSFinish('')).toBe('false');
      expect(api.LMSGetLastError()).toBe('301');
    });
  });

  describe('LMSGetValue / LMSSetValue', () => {
    it('stores and retrieves values', () => {
      api.LMSInitialize('');
      api.LMSSetValue('cmi.core.lesson_status', 'completed');
      expect(api.LMSGetValue('cmi.core.lesson_status')).toBe('completed');
    });

    it('returns empty string for unset values', () => {
      api.LMSInitialize('');
      expect(api.LMSGetValue('cmi.core.student_name')).toBe('');
    });

    it('fails before initialization', () => {
      expect(api.LMSGetValue('cmi.core.student_name')).toBe('');
      expect(api.LMSGetLastError()).toBe('301');

      expect(api.LMSSetValue('cmi.core.lesson_status', 'completed')).toBe('false');
      expect(api.LMSGetLastError()).toBe('301');
    });
  });

  describe('LMSCommit', () => {
    it('succeeds when initialized', () => {
      api.LMSInitialize('');
      expect(api.LMSCommit('')).toBe('true');
    });

    it('fails when not initialized', () => {
      expect(api.LMSCommit('')).toBe('false');
      expect(api.LMSGetLastError()).toBe('301');
    });
  });

  describe('error helpers', () => {
    it('returns error string for known codes', () => {
      expect(api.LMSGetErrorString('0')).toBe('No error');
      expect(api.LMSGetErrorString('301')).toBe('Not initialized');
    });

    it('returns empty for unknown codes', () => {
      expect(api.LMSGetErrorString('999')).toBe('');
    });
  });

  describe('test helpers', () => {
    it('_reset clears all state', () => {
      api.LMSInitialize('');
      api.LMSSetValue('cmi.test', 'value');
      api._reset();
      expect(api._isInitialized()).toBe(false);
      expect(api._isTerminated()).toBe(false);
      expect(api._getStore().size).toBe(0);
    });

    it('_getStore returns a copy', () => {
      api.LMSInitialize('');
      api.LMSSetValue('cmi.key', 'val');
      const store = api._getStore();
      expect(store.get('cmi.key')).toBe('val');
      store.set('cmi.other', 'x');
      expect(api._getStore().has('cmi.other')).toBe(false);
    });
  });
});
