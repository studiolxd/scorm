import { describe, it, expect, beforeEach } from 'vitest';
import { Scorm12Driver } from '../../src/core/scorm12-driver';
import { Scorm2004Driver } from '../../src/core/scorm2004-driver';
import { createLogger } from '../../src/debug/logger';
import type { Scorm12RawApi, Scorm2004RawApi } from '../../src/types/common';

const logger = createLogger(false);

describe('Scorm12Driver edge cases', () => {
  describe('error method catch blocks', () => {
    it('getLastError returns 101 when LMSGetLastError throws', () => {
      const throwingApi = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'true',
        LMSCommit: () => 'true',
        LMSGetLastError: () => { throw new Error('API dead'); },
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => '',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(throwingApi, logger);
      expect(driver.getLastError()).toBe(101);
    });

    it('getErrorString returns empty string when LMSGetErrorString throws', () => {
      const throwingApi = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'true',
        LMSCommit: () => 'true',
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => { throw new Error('API dead'); },
        LMSGetDiagnostic: () => '',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(throwingApi, logger);
      expect(driver.getErrorString(301)).toBe('');
    });

    it('getDiagnostic returns empty string when LMSGetDiagnostic throws', () => {
      const throwingApi = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'true',
        LMSCommit: () => 'true',
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => { throw new Error('API dead'); },
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(throwingApi, logger);
      expect(driver.getDiagnostic(301)).toBe('');
    });
  });

  describe('initialize catches exceptions', () => {
    it('returns error when LMSInitialize throws', () => {
      const throwingApi = {
        LMSInitialize: () => { throw new TypeError('Cannot call'); },
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'true',
        LMSCommit: () => 'true',
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => '',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(throwingApi, logger);
      const result = driver.initialize();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.operation).toBe('initialize');
        expect(result.error.exception).toBeInstanceOf(TypeError);
      }
    });
  });

  describe('terminate catches exceptions', () => {
    it('returns error when LMSFinish throws', () => {
      const throwingApi = {
        LMSInitialize: () => 'true',
        LMSFinish: () => { throw new Error('Network error'); },
        LMSGetValue: () => '',
        LMSSetValue: () => 'true',
        LMSCommit: () => 'true',
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => '',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(throwingApi, logger);
      driver.initialize();
      const result = driver.terminate();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.operation).toBe('terminate');
        expect(result.error.exception).toBeInstanceOf(Error);
      }
    });
  });

  describe('commit catches exceptions', () => {
    it('returns error when LMSCommit throws', () => {
      const throwingApi = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'true',
        LMSCommit: () => { throw new Error('Commit failed'); },
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => '',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(throwingApi, logger);
      driver.initialize();
      const result = driver.commit();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.operation).toBe('commit');
      }
    });
  });

  describe('getValue catches exceptions', () => {
    it('returns error when LMSGetValue throws', () => {
      const throwingApi = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => { throw new Error('Get failed'); },
        LMSSetValue: () => 'true',
        LMSCommit: () => 'true',
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => '',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(throwingApi, logger);
      driver.initialize();
      const result = driver.getValue('cmi.core.student_name');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.path).toBe('cmi.core.student_name');
      }
    });
  });

  describe('setValue catches exceptions', () => {
    it('returns error when LMSSetValue throws', () => {
      const throwingApi = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => { throw new Error('Set failed'); },
        LMSCommit: () => 'true',
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => '',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(throwingApi, logger);
      driver.initialize();
      const result = driver.setValue('cmi.core.lesson_status', 'completed');
      expect(result.ok).toBe(false);
    });
  });

  describe('setValue with result !== "true" but errorCode === 0', () => {
    it('treats errorCode 0 as success', () => {
      const api = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'false', // returns false but error code is 0
        LMSCommit: () => 'true',
        LMSGetLastError: () => '0',
        LMSGetErrorString: () => '',
        LMSGetDiagnostic: () => '',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(api, logger);
      driver.initialize();
      const result = driver.setValue('cmi.core.lesson_status', 'completed');
      expect(result.ok).toBe(true);
    });
  });

  describe('buildError with LMS error methods throwing', () => {
    it('falls back to code 101 when getLastError returns NaN', () => {
      const api = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'false',
        LMSCommit: () => 'true',
        LMSGetLastError: () => 'not-a-number',
        LMSGetErrorString: () => 'Some error',
        LMSGetDiagnostic: () => 'diag',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(api, logger);
      driver.initialize();
      const result = driver.setValue('cmi.test', 'val');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(101);
      }
    });

    it('falls back to code 101 when error methods throw during buildError', () => {
      let callCount = 0;
      const api = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'false',
        LMSCommit: () => 'true',
        LMSGetLastError: () => {
          callCount++;
          // First call during setValue is fine, second during buildError throws
          if (callCount > 1) throw new Error('dead');
          return '201';
        },
        LMSGetErrorString: () => 'Invalid argument',
        LMSGetDiagnostic: () => '',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(api, logger);
      driver.initialize();
      const result = driver.setValue('cmi.test', 'val');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(101);
      }
    });
  });

  describe('getValue with non-zero error code', () => {
    it('returns error when LMS reports an error', () => {
      const api = {
        LMSInitialize: () => 'true',
        LMSFinish: () => 'true',
        LMSGetValue: () => '',
        LMSSetValue: () => 'true',
        LMSCommit: () => 'true',
        LMSGetLastError: () => '401',
        LMSGetErrorString: () => 'Not implemented error',
        LMSGetDiagnostic: () => 'Element not supported',
      } as unknown as Scorm12RawApi;

      const driver = new Scorm12Driver(api, logger);
      driver.initialize();
      const result = driver.getValue('cmi.unsupported');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(401);
        expect(result.error.errorString).toBe('Not implemented error');
        expect(result.error.diagnostic).toBe('Element not supported');
      }
    });
  });
});

describe('Scorm2004Driver edge cases', () => {
  describe('error method catch blocks', () => {
    it('getLastError returns 101 when GetLastError throws', () => {
      const throwingApi = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => { throw new Error('API dead'); },
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(throwingApi, logger);
      expect(driver.getLastError()).toBe(101);
    });

    it('getErrorString returns empty when GetErrorString throws', () => {
      const throwingApi = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => { throw new Error('dead'); },
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(throwingApi, logger);
      expect(driver.getErrorString(101)).toBe('');
    });

    it('getDiagnostic returns empty when GetDiagnostic throws', () => {
      const throwingApi = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => { throw new Error('dead'); },
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(throwingApi, logger);
      expect(driver.getDiagnostic(101)).toBe('');
    });
  });

  describe('post-termination error codes', () => {
    function makeTerminatedDriver() {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;
      const driver = new Scorm2004Driver(api, logger);
      driver.initialize();
      driver.terminate();
      return driver;
    }

    it('getValue returns 123 after termination', () => {
      const driver = makeTerminatedDriver();
      const result = driver.getValue('cmi.learner_name');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(123);
        expect(result.error.errorString).toBe('Retrieve Data After Termination');
      }
    });

    it('setValue returns 133 after termination', () => {
      const driver = makeTerminatedDriver();
      const result = driver.setValue('cmi.location', 'page1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(133);
        expect(result.error.errorString).toBe('Store Data After Termination');
      }
    });

    it('commit returns 143 after termination', () => {
      const driver = makeTerminatedDriver();
      const result = driver.commit();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(143);
        expect(result.error.errorString).toBe('Commit After Termination');
      }
    });
  });

  describe('2004-specific error codes', () => {
    it('initialize after terminate returns error with code 104', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      driver.initialize();
      driver.terminate();
      const result = driver.initialize();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(104);
        expect(result.error.errorString).toBe('Content Instance Terminated');
      }
    });

    it('terminate before init returns error with code 112', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      const result = driver.terminate();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(112);
      }
    });

    it('getValue before init returns error with code 122', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      const result = driver.getValue('cmi.learner_name');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(122);
      }
    });

    it('setValue before init returns error with code 132', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      const result = driver.setValue('cmi.location', 'page1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(132);
      }
    });

    it('commit before init returns error with code 142', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      const result = driver.commit();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(142);
      }
    });
  });

  describe('exception handling in operations', () => {
    it('initialize catches thrown errors', () => {
      const api = {
        Initialize: () => { throw new Error('boom'); },
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      const result = driver.initialize();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.exception).toBeInstanceOf(Error);
      }
    });

    it('terminate catches thrown errors', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => { throw new Error('boom'); },
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      driver.initialize();
      const result = driver.terminate();
      expect(result.ok).toBe(false);
    });

    it('getValue catches thrown errors', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => { throw new Error('boom'); },
        SetValue: () => 'true',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      driver.initialize();
      const result = driver.getValue('cmi.learner_name');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.path).toBe('cmi.learner_name');
      }
    });

    it('commit catches thrown errors', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'true',
        Commit: () => { throw new Error('boom'); },
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      driver.initialize();
      const result = driver.commit();
      expect(result.ok).toBe(false);
    });
  });

  describe('setValue with errorCode=0 but result="false"', () => {
    it('treats errorCode 0 as success', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'false',
        Commit: () => 'true',
        GetLastError: () => '0',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      driver.initialize();
      const result = driver.setValue('cmi.location', 'page1');
      expect(result.ok).toBe(true);
    });
  });

  describe('buildError with NaN from GetLastError', () => {
    it('falls back to code 101', () => {
      const api = {
        Initialize: () => 'true',
        Terminate: () => 'true',
        GetValue: () => '',
        SetValue: () => 'false',
        Commit: () => 'true',
        GetLastError: () => 'garbage',
        GetErrorString: () => '',
        GetDiagnostic: () => '',
      } as unknown as Scorm2004RawApi;

      const driver = new Scorm2004Driver(api, logger);
      driver.initialize();
      const result = driver.setValue('cmi.test', 'val');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(101);
      }
    });
  });
});
