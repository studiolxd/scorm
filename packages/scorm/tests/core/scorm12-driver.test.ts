import { describe, it, expect, beforeEach } from 'vitest';
import { Scorm12Driver } from '../../src/core/scorm12-driver';
import { MockScorm12Api } from '../../src/mock/mock-scorm12-api';
import { createLogger } from '../../src/debug/logger';

describe('Scorm12Driver', () => {
  let mockApi: MockScorm12Api;
  let driver: Scorm12Driver;

  beforeEach(() => {
    mockApi = new MockScorm12Api();
    driver = new Scorm12Driver(mockApi, createLogger(false));
  });

  it('has version 1.2', () => {
    expect(driver.version).toBe('1.2');
  });

  describe('initialize', () => {
    it('succeeds and sets initialized', () => {
      const result = driver.initialize();
      expect(result.ok).toBe(true);
      expect(driver.isInitialized()).toBe(true);
    });

    it('fails after termination', () => {
      driver.initialize();
      driver.terminate();
      const result = driver.initialize();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.operation).toBe('initialize');
      }
    });
  });

  describe('terminate', () => {
    it('succeeds when initialized', () => {
      driver.initialize();
      const result = driver.terminate();
      expect(result.ok).toBe(true);
      expect(driver.isInitialized()).toBe(false);
    });

    it('fails when not initialized', () => {
      const result = driver.terminate();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(301);
      }
    });
  });

  describe('getValue', () => {
    it('returns stored value after init', () => {
      driver.initialize();
      mockApi.LMSSetValue('cmi.core.student_name', 'John Doe');
      const result = driver.getValue('cmi.core.student_name');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('John Doe');
      }
    });

    it('returns empty string for unset values', () => {
      driver.initialize();
      const result = driver.getValue('cmi.core.student_name');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('');
      }
    });

    it('fails before initialization', () => {
      const result = driver.getValue('cmi.core.student_name');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(301);
        expect(result.error.path).toBe('cmi.core.student_name');
      }
    });
  });

  describe('setValue', () => {
    it('stores value successfully', () => {
      driver.initialize();
      const result = driver.setValue('cmi.core.lesson_status', 'completed');
      expect(result.ok).toBe(true);
      expect(mockApi.LMSGetValue('cmi.core.lesson_status')).toBe('completed');
    });

    it('fails before initialization', () => {
      const result = driver.setValue('cmi.core.lesson_status', 'completed');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(301);
      }
    });
  });

  describe('commit', () => {
    it('succeeds when initialized', () => {
      driver.initialize();
      const result = driver.commit();
      expect(result.ok).toBe(true);
    });

    it('fails when not initialized', () => {
      const result = driver.commit();
      expect(result.ok).toBe(false);
    });
  });

  describe('error methods', () => {
    it('getLastError returns 0 initially', () => {
      expect(driver.getLastError()).toBe(0);
    });

    it('getErrorString returns description', () => {
      expect(driver.getErrorString(301)).toBe('Not initialized');
    });
  });
});
