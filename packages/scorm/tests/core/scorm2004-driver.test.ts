import { describe, it, expect, beforeEach } from 'vitest';
import { Scorm2004Driver } from '../../src/core/scorm2004-driver';
import { MockScorm2004Api } from '../../src/mock/mock-scorm2004-api';
import { createLogger } from '../../src/debug/logger';

describe('Scorm2004Driver', () => {
  let mockApi: MockScorm2004Api;
  let driver: Scorm2004Driver;

  beforeEach(() => {
    mockApi = new MockScorm2004Api();
    driver = new Scorm2004Driver(mockApi, createLogger(false));
  });

  it('has version 2004', () => {
    expect(driver.version).toBe('2004');
  });

  describe('initialize', () => {
    it('succeeds and sets initialized', () => {
      const result = driver.initialize();
      expect(result.ok).toBe(true);
      expect(driver.isInitialized()).toBe(true);
    });

    it('fails after termination with code 104', () => {
      driver.initialize();
      driver.terminate();
      const result = driver.initialize();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(104);
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

    it('fails with 112 when not initialized', () => {
      const result = driver.terminate();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(112);
      }
    });
  });

  describe('getValue', () => {
    it('returns stored value after init', () => {
      driver.initialize();
      mockApi.SetValue('cmi.learner_name', 'Jane Doe');
      const result = driver.getValue('cmi.learner_name');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Jane Doe');
      }
    });

    it('fails with 122 before initialization', () => {
      const result = driver.getValue('cmi.learner_name');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(122);
      }
    });
  });

  describe('setValue', () => {
    it('stores value successfully', () => {
      driver.initialize();
      const result = driver.setValue('cmi.completion_status', 'completed');
      expect(result.ok).toBe(true);
      expect(mockApi.GetValue('cmi.completion_status')).toBe('completed');
    });

    it('fails with 132 before initialization', () => {
      const result = driver.setValue('cmi.completion_status', 'completed');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(132);
      }
    });
  });

  describe('commit', () => {
    it('succeeds when initialized', () => {
      driver.initialize();
      const result = driver.commit();
      expect(result.ok).toBe(true);
    });

    it('fails with 142 when not initialized', () => {
      const result = driver.commit();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(142);
      }
    });
  });

  describe('error methods', () => {
    it('getLastError returns 0 initially', () => {
      expect(driver.getLastError()).toBe(0);
    });

    it('getErrorString returns description', () => {
      expect(driver.getErrorString(103)).toBe('Already Initialized');
    });
  });
});
