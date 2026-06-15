import { describe, it, expect, afterEach, vi } from 'vitest';
import { createDriver } from '../../src/core/create-driver';
import { createLogger } from '../../src/debug/logger';
import { ScormError } from '../../src/errors/scorm-error';
import type { ScormProviderOptions } from '../../src/types/options';

const logger = createLogger(false);

describe('createDriver', () => {
  afterEach(() => {
    delete (window as Record<string, unknown>)['API'];
    delete (window as Record<string, unknown>)['API_1484_11'];
  });

  describe('when API is found', () => {
    it('creates Scorm12Driver when version is 1.2', () => {
      (window as Record<string, unknown>)['API'] = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'true',
        LMSCommit: () => 'true',
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => '',
      };

      const result = createDriver('1.2', {}, logger);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe('1.2');
      }
    });

    it('creates Scorm2004Driver when version is 2004', () => {
      (window as Record<string, unknown>)['API_1484_11'] = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      };

      const result = createDriver('2004', {}, logger);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe('2004');
      }
    });
  });

  describe('noLmsBehavior = "error" (default)', () => {
    it('returns error Result when API not found', () => {
      const result = createDriver('1.2', {}, logger);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ScormError);
        expect(result.error.operation).toBe('createDriver');
        expect(result.error.apiFound).toBe(false);
        expect(result.error.initialized).toBe(false);
      }
    });

    it('returns error for 2004 with correct diagnostic', () => {
      const result = createDriver('2004', {}, logger);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.diagnostic).toContain('window.API_1484_11');
      }
    });

    it('returns error for 1.2 with correct diagnostic', () => {
      const result = createDriver('1.2', { noLmsBehavior: 'error' }, logger);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.diagnostic).toContain('window.API');
      }
    });
  });

  describe('noLmsBehavior = "mock"', () => {
    it('creates mock driver for 1.2', () => {
      const result = createDriver('1.2', { noLmsBehavior: 'mock' }, logger);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe('1.2');
        // Mock driver should be functional
        const initResult = result.value.initialize();
        expect(initResult.ok).toBe(true);
      }
    });

    it('creates mock driver for 2004', () => {
      const result = createDriver('2004', { noLmsBehavior: 'mock' }, logger);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe('2004');
        const initResult = result.value.initialize();
        expect(initResult.ok).toBe(true);
      }
    });
  });

  describe('noLmsBehavior = "throw"', () => {
    it('throws ScormError for 1.2', () => {
      expect(() => {
        createDriver('1.2', { noLmsBehavior: 'throw' }, logger);
      }).toThrow(ScormError);
    });

    it('throws ScormError for 2004', () => {
      expect(() => {
        createDriver('2004', { noLmsBehavior: 'throw' }, logger);
      }).toThrow('SCORM API not found');
    });

    it('thrown error has correct properties', () => {
      try {
        createDriver('2004', { noLmsBehavior: 'throw' }, logger);
        expect.unreachable('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ScormError);
        const error = e as ScormError;
        expect(error.version).toBe('2004');
        expect(error.operation).toBe('createDriver');
        expect(error.apiFound).toBe(false);
        expect(error.diagnostic).toContain('window.API_1484_11');
      }
    });
  });

  describe('options forwarding', () => {
    it('passes maxParentDepth and checkOpener to locator', () => {
      // With checkOpener=false and no API, should still get error
      const result = createDriver('1.2', {
        maxParentDepth: 0,
        checkOpener: false,
        noLmsBehavior: 'error',
      }, logger);
      expect(result.ok).toBe(false);
    });
  });

  describe('logger usage', () => {
    it('logs debug when API is found', () => {
      const debugLogger = createLogger(true);
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      (window as Record<string, unknown>)['API'] = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'true',
        LMSCommit: () => 'true',
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => '',
      };

      createDriver('1.2', {}, debugLogger);
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[react-scorm]'),
      );
      debugSpy.mockRestore();
    });

    it('logs warn when API not found', () => {
      const debugLogger = createLogger(true);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      createDriver('1.2', {}, debugLogger);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[react-scorm]'),
      );
      warnSpy.mockRestore();
    });
  });
});
