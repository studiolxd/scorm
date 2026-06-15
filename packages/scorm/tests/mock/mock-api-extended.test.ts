import { describe, it, expect, beforeEach } from 'vitest';
import { MockScorm12Api } from '../../src/mock/mock-scorm12-api';
import { MockScorm2004Api } from '../../src/mock/mock-scorm2004-api';

describe('MockScorm12Api extended', () => {
  let api: MockScorm12Api;

  beforeEach(() => {
    api = new MockScorm12Api();
  });

  describe('_setError', () => {
    it('sets error code that persists until next operation', () => {
      api._setError('201');
      expect(api.LMSGetLastError()).toBe('201');
    });

    it('error is cleared by successful operation', () => {
      api._setError('401');
      api.LMSInitialize('');
      expect(api.LMSGetLastError()).toBe('0');
    });
  });

  describe('_isTerminated', () => {
    it('returns false initially', () => {
      expect(api._isTerminated()).toBe(false);
    });

    it('returns true after terminate', () => {
      api.LMSInitialize('');
      api.LMSFinish('');
      expect(api._isTerminated()).toBe(true);
    });
  });

  describe('operations after terminate', () => {
    beforeEach(() => {
      api.LMSInitialize('');
      api.LMSFinish('');
    });

    it('LMSGetValue fails after terminate', () => {
      expect(api.LMSGetValue('cmi.test')).toBe('');
      expect(api.LMSGetLastError()).toBe('301');
    });

    it('LMSSetValue fails after terminate', () => {
      expect(api.LMSSetValue('cmi.test', 'val')).toBe('false');
      expect(api.LMSGetLastError()).toBe('301');
    });

    it('LMSCommit fails after terminate', () => {
      expect(api.LMSCommit('')).toBe('false');
      expect(api.LMSGetLastError()).toBe('301');
    });
  });

  describe('LMSGetDiagnostic', () => {
    it('always returns empty string', () => {
      expect(api.LMSGetDiagnostic('101')).toBe('');
      expect(api.LMSGetDiagnostic('0')).toBe('');
    });
  });

  describe('store operations', () => {
    it('overwrites existing values', () => {
      api.LMSInitialize('');
      api.LMSSetValue('cmi.key', 'value1');
      api.LMSSetValue('cmi.key', 'value2');
      expect(api.LMSGetValue('cmi.key')).toBe('value2');
    });

    it('supports multiple keys', () => {
      api.LMSInitialize('');
      api.LMSSetValue('cmi.a', '1');
      api.LMSSetValue('cmi.b', '2');
      api.LMSSetValue('cmi.c', '3');
      expect(api.LMSGetValue('cmi.a')).toBe('1');
      expect(api.LMSGetValue('cmi.b')).toBe('2');
      expect(api.LMSGetValue('cmi.c')).toBe('3');
    });
  });
});

describe('MockScorm2004Api extended', () => {
  let api: MockScorm2004Api;

  beforeEach(() => {
    api = new MockScorm2004Api();
  });

  describe('_setError', () => {
    it('sets error code that persists until next operation', () => {
      api._setError('301');
      expect(api.GetLastError()).toBe('301');
    });
  });

  describe('_isTerminated', () => {
    it('returns false initially', () => {
      expect(api._isTerminated()).toBe(false);
    });

    it('returns true after terminate', () => {
      api.Initialize('');
      api.Terminate('');
      expect(api._isTerminated()).toBe(true);
    });
  });

  describe('operations after terminate', () => {
    beforeEach(() => {
      api.Initialize('');
      api.Terminate('');
    });

    it('GetValue fails with 123 after terminate', () => {
      expect(api.GetValue('cmi.test')).toBe('');
      expect(api.GetLastError()).toBe('123');
    });

    it('SetValue fails with 133 after terminate', () => {
      expect(api.SetValue('cmi.test', 'val')).toBe('false');
      expect(api.GetLastError()).toBe('133');
    });

    it('Commit fails with 143 after terminate', () => {
      expect(api.Commit('')).toBe('false');
      expect(api.GetLastError()).toBe('143');
    });

    it('Terminate fails with 113 after already terminated', () => {
      expect(api.Terminate('')).toBe('false');
      expect(api.GetLastError()).toBe('113');
    });
  });

  describe('GetDiagnostic', () => {
    it('always returns empty string', () => {
      expect(api.GetDiagnostic('101')).toBe('');
      expect(api.GetDiagnostic('0')).toBe('');
    });
  });

  describe('store operations', () => {
    it('overwrites existing values', () => {
      api.Initialize('');
      api.SetValue('cmi.key', 'a');
      api.SetValue('cmi.key', 'b');
      expect(api.GetValue('cmi.key')).toBe('b');
    });
  });

  describe('_reset', () => {
    it('allows re-initialization after reset', () => {
      api.Initialize('');
      api.Terminate('');
      api._reset();
      expect(api.Initialize('')).toBe('true');
      expect(api._isInitialized()).toBe(true);
    });
  });
});
