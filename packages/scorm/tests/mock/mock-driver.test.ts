import { describe, it, expect } from 'vitest';
import { createMockDriver } from '../../src/mock/mock-driver';
import { createLogger } from '../../src/debug/logger';

const logger = createLogger(false);

describe('createMockDriver', () => {
  it('creates SCORM 1.2 mock driver', () => {
    const driver = createMockDriver('1.2', logger);
    expect(driver.version).toBe('1.2');
  });

  it('creates SCORM 2004 mock driver', () => {
    const driver = createMockDriver('2004', logger);
    expect(driver.version).toBe('2004');
  });

  it('1.2 mock driver is fully functional', () => {
    const driver = createMockDriver('1.2', logger);
    const initResult = driver.initialize();
    expect(initResult.ok).toBe(true);

    const setResult = driver.setValue('cmi.core.lesson_status', 'completed');
    expect(setResult.ok).toBe(true);

    const getResult = driver.getValue('cmi.core.lesson_status');
    expect(getResult.ok).toBe(true);
    if (getResult.ok) expect(getResult.value).toBe('completed');

    const commitResult = driver.commit();
    expect(commitResult.ok).toBe(true);

    const termResult = driver.terminate();
    expect(termResult.ok).toBe(true);
    expect(driver.isInitialized()).toBe(false);
  });

  it('2004 mock driver is fully functional', () => {
    const driver = createMockDriver('2004', logger);
    const initResult = driver.initialize();
    expect(initResult.ok).toBe(true);

    const setResult = driver.setValue('cmi.completion_status', 'completed');
    expect(setResult.ok).toBe(true);

    const getResult = driver.getValue('cmi.completion_status');
    expect(getResult.ok).toBe(true);
    if (getResult.ok) expect(getResult.value).toBe('completed');

    const termResult = driver.terminate();
    expect(termResult.ok).toBe(true);
  });
});
