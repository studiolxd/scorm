import { describe, it, expect } from 'vitest';
import { ScormError } from '../../src/errors/scorm-error';
import { SCORM_12_ERRORS, SCORM_2004_ERRORS } from '../../src/errors/error-codes';

describe('ScormError', () => {
  it('creates error with all fields', () => {
    const error = new ScormError({
      version: '1.2',
      operation: 'getValue',
      path: 'cmi.core.student_name',
      code: 301,
      errorString: 'Not initialized',
      diagnostic: 'Call LMSInitialize first',
      apiFound: true,
      initialized: false,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ScormError');
    expect(error.version).toBe('1.2');
    expect(error.operation).toBe('getValue');
    expect(error.path).toBe('cmi.core.student_name');
    expect(error.code).toBe(301);
    expect(error.errorString).toBe('Not initialized');
    expect(error.diagnostic).toBe('Call LMSInitialize first');
    expect(error.apiFound).toBe(true);
    expect(error.initialized).toBe(false);
    expect(error.exception).toBeUndefined();
  });

  describe('message formatting', () => {
    it('includes version, code, operation, and error string', () => {
      const error = new ScormError({
        version: '2004',
        operation: 'initialize',
        code: 102,
        errorString: 'General Initialization Failure',
        diagnostic: '',
        apiFound: true,
        initialized: false,
      });

      expect(error.message).toBe(
        'SCORM 2004 error [102] during initialize: General Initialization Failure',
      );
    });

    it('includes path when provided', () => {
      const error = new ScormError({
        version: '1.2',
        operation: 'setValue',
        path: 'cmi.core.lesson_status',
        code: 403,
        errorString: 'Element is read only',
        diagnostic: '',
        apiFound: true,
        initialized: true,
      });

      expect(error.message).toContain('on "cmi.core.lesson_status"');
    });

    it('omits path when not provided', () => {
      const error = new ScormError({
        version: '1.2',
        operation: 'initialize',
        code: 101,
        errorString: 'General Exception',
        diagnostic: '',
        apiFound: true,
        initialized: false,
      });

      expect(error.message).not.toContain('on "');
    });

    it('shows "unknown" when version is null', () => {
      const error = new ScormError({
        version: null,
        operation: 'createDriver',
        code: 0,
        errorString: 'SCORM API not found',
        diagnostic: '',
        apiFound: false,
        initialized: false,
      });

      expect(error.message).toContain('SCORM unknown error');
    });
  });

  it('preserves exception when provided', () => {
    const cause = new TypeError('API is not a function');
    const error = new ScormError({
      version: '2004',
      operation: 'getValue',
      code: 101,
      errorString: 'General Exception',
      diagnostic: '',
      exception: cause,
      apiFound: true,
      initialized: true,
    });

    expect(error.exception).toBe(cause);
  });
});

describe('error code maps', () => {
  describe('SCORM_12_ERRORS', () => {
    it('contains all standard SCORM 1.2 error codes', () => {
      expect(SCORM_12_ERRORS[0]).toBe('No error');
      expect(SCORM_12_ERRORS[101]).toBe('General Exception');
      expect(SCORM_12_ERRORS[201]).toBe('Invalid argument error');
      expect(SCORM_12_ERRORS[301]).toBe('Not initialized');
      expect(SCORM_12_ERRORS[401]).toBe('Not implemented error');
      expect(SCORM_12_ERRORS[402]).toBe('Invalid set value, element is a keyword');
      expect(SCORM_12_ERRORS[403]).toBe('Element is read only');
      expect(SCORM_12_ERRORS[404]).toBe('Element is write only');
      expect(SCORM_12_ERRORS[405]).toBe('Incorrect Data Type');
    });

    it('returns undefined for unknown codes', () => {
      expect(SCORM_12_ERRORS[999]).toBeUndefined();
    });
  });

  describe('SCORM_2004_ERRORS', () => {
    it('contains all standard SCORM 2004 error codes', () => {
      expect(SCORM_2004_ERRORS[0]).toBe('No Error');
      expect(SCORM_2004_ERRORS[101]).toBe('General Exception');
      expect(SCORM_2004_ERRORS[102]).toBe('General Initialization Failure');
      expect(SCORM_2004_ERRORS[103]).toBe('Already Initialized');
      expect(SCORM_2004_ERRORS[104]).toBe('Content Instance Terminated');
      expect(SCORM_2004_ERRORS[111]).toBe('General Termination Failure');
      expect(SCORM_2004_ERRORS[112]).toBe('Termination Before Initialization');
      expect(SCORM_2004_ERRORS[113]).toBe('Termination After Termination');
      expect(SCORM_2004_ERRORS[122]).toBe('Retrieve Data Before Initialization');
      expect(SCORM_2004_ERRORS[123]).toBe('Retrieve Data After Termination');
      expect(SCORM_2004_ERRORS[132]).toBe('Store Data Before Initialization');
      expect(SCORM_2004_ERRORS[133]).toBe('Store Data After Termination');
      expect(SCORM_2004_ERRORS[142]).toBe('Commit Before Initialization');
      expect(SCORM_2004_ERRORS[143]).toBe('Commit After Termination');
      expect(SCORM_2004_ERRORS[401]).toBe('Undefined Data Model Element');
      expect(SCORM_2004_ERRORS[406]).toBe('Data Model Element Type Mismatch');
      expect(SCORM_2004_ERRORS[408]).toBe('Data Model Dependency Not Established');
    });

    it('returns undefined for unknown codes', () => {
      expect(SCORM_2004_ERRORS[999]).toBeUndefined();
    });
  });
});
