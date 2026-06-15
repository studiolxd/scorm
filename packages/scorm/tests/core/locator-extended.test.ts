import { describe, it, expect, afterEach, vi } from 'vitest';
import { findScormApi } from '../../src/core/locator';

/** Minimal complete SCORM 1.2 API object that passes duck-type validation. */
const makeScorm12Api = () => ({
  LMSInitialize: () => 'true',
  LMSFinish: () => 'true',
  LMSGetValue: () => '',
  LMSSetValue: () => 'true',
  LMSCommit: () => 'true',
  LMSGetLastError: () => '0',
  LMSGetErrorString: () => '',
  LMSGetDiagnostic: () => '',
});

/** Minimal complete SCORM 2004 API object that passes duck-type validation. */
const makeScorm2004Api = () => ({
  Initialize: () => 'true',
  Terminate: () => 'true',
  GetValue: () => '',
  SetValue: () => 'true',
  Commit: () => 'true',
  GetLastError: () => '0',
  GetErrorString: () => '',
  GetDiagnostic: () => '',
});

describe('findScormApi extended', () => {
  afterEach(() => {
    delete (window as Record<string, unknown>)['API'];
    delete (window as Record<string, unknown>)['API_1484_11'];
    vi.restoreAllMocks();
  });

  describe('non-object API values', () => {
    it('ignores string value for API', () => {
      (window as Record<string, unknown>)['API'] = 'not-an-object';
      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
    });

    it('ignores number value for API', () => {
      (window as Record<string, unknown>)['API'] = 42;
      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
    });

    it('ignores null value for API', () => {
      (window as Record<string, unknown>)['API'] = null;
      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
    });

    it('ignores boolean value for API', () => {
      (window as Record<string, unknown>)['API'] = true;
      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
    });
  });

  describe('checkOpener option', () => {
    it('skips opener check when checkOpener=false', () => {
      // Even though we can't easily set window.opener in jsdom,
      // we verify no error is thrown and null is returned
      const result = findScormApi('1.2', { checkOpener: false });
      expect(result.api).toBeNull();
      expect(result.source).toBeNull();
    });

    it('checks opener by default', () => {
      // Default behavior - no opener set so should return null
      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
    });
  });

  describe('source labeling', () => {
    it('labels direct window find as "window"', () => {
      const fakeApi = makeScorm12Api();
      (window as Record<string, unknown>)['API'] = fakeApi;

      const result = findScormApi('1.2');
      expect(result.source).toBe('window');
    });
  });

  describe('duck-type validation', () => {
    it('rejects partial API objects missing required methods', () => {
      // Only has one method — does not pass duck-type check
      (window as Record<string, unknown>)['API'] = { LMSInitialize: () => 'true' };
      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
    });

    it('rejects array values', () => {
      (window as Record<string, unknown>)['API'] = [];
      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
    });

    it('rejects Object.prototype', () => {
      (window as Record<string, unknown>)['API'] = Object.prototype;
      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
    });

    it('accepts a fully-shaped SCORM 1.2 API', () => {
      const fakeApi = makeScorm12Api();
      (window as Record<string, unknown>)['API'] = fakeApi;
      const result = findScormApi('1.2');
      expect(result.api).toBe(fakeApi);
    });

    it('accepts a fully-shaped SCORM 2004 API', () => {
      const fakeApi = makeScorm2004Api();
      (window as Record<string, unknown>)['API_1484_11'] = fakeApi;
      const result = findScormApi('2004');
      expect(result.api).toBe(fakeApi);
    });
  });

  describe('maxParentDepth', () => {
    it('works with maxParentDepth=0', () => {
      (window as Record<string, unknown>)['API'] = makeScorm12Api();
      // depth=0 means only check current window (same as default behavior for current)
      const result = findScormApi('1.2', { maxParentDepth: 0 });
      expect(result.api).not.toBeNull();
      expect(result.source).toBe('window');
    });

    it('returns null with maxParentDepth=0 when API not on current window', () => {
      const result = findScormApi('1.2', { maxParentDepth: 0 });
      expect(result.api).toBeNull();
    });
  });

  describe('parent traversal termination', () => {
    it('stops when window.parent === window (top of hierarchy)', () => {
      // In jsdom, window.parent === window, so traversal stops immediately
      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
    });
  });

  describe('SecurityError handling', () => {
    it('handles SecurityError on API access gracefully', () => {
      // Simulate cross-origin by making API property throw
      Object.defineProperty(window, 'API', {
        get: () => { throw new DOMException('Blocked', 'SecurityError'); },
        configurable: true,
      });

      const result = findScormApi('1.2');
      expect(result.api).toBeNull();
      expect(result.source).toBeNull();

      // Clean up
      Object.defineProperty(window, 'API', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    });

    it('handles SecurityError on opener access gracefully', () => {
      Object.defineProperty(window, 'opener', {
        get: () => { throw new DOMException('Blocked', 'SecurityError'); },
        configurable: true,
      });

      const result = findScormApi('1.2', { checkOpener: true });
      expect(result.api).toBeNull();

      Object.defineProperty(window, 'opener', {
        value: null,
        configurable: true,
        writable: true,
      });
    });
  });

  describe('SCORM 2004 API name', () => {
    it('searches for API_1484_11', () => {
      const fakeApi = makeScorm2004Api();
      (window as Record<string, unknown>)['API_1484_11'] = fakeApi;

      const result = findScormApi('2004');
      expect(result.api).toBe(fakeApi);
      expect(result.source).toBe('window');
    });
  });
});
