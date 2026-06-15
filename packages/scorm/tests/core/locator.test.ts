import { describe, it, expect, afterEach } from 'vitest';
import { findScormApi } from '../../src/core/locator';

describe('findScormApi', () => {
  afterEach(() => {
    // Clean up any API objects set on window
    delete (window as Record<string, unknown>)['API'];
    delete (window as Record<string, unknown>)['API_1484_11'];
  });

  it('finds SCORM 1.2 API on current window', () => {
    const fakeApi = {
      LMSInitialize: () => 'true',
      LMSFinish: () => 'true',
      LMSGetValue: () => '',
      LMSSetValue: () => 'true',
      LMSCommit: () => 'true',
      LMSGetLastError: () => '0',
      LMSGetErrorString: () => '',
      LMSGetDiagnostic: () => '',
    };
    (window as Record<string, unknown>)['API'] = fakeApi;

    const result = findScormApi('1.2');
    expect(result.api).toBe(fakeApi);
    expect(result.source).toBe('window');
  });

  it('finds SCORM 2004 API on current window', () => {
    const fakeApi = {
      Initialize: () => 'true',
      Terminate: () => 'true',
      GetValue: () => '',
      SetValue: () => 'true',
      Commit: () => 'true',
      GetLastError: () => '0',
      GetErrorString: () => '',
      GetDiagnostic: () => '',
    };
    (window as Record<string, unknown>)['API_1484_11'] = fakeApi;

    const result = findScormApi('2004');
    expect(result.api).toBe(fakeApi);
    expect(result.source).toBe('window');
  });

  it('returns null when no API is found', () => {
    const result = findScormApi('1.2');
    expect(result.api).toBeNull();
    expect(result.source).toBeNull();
  });

  it('does not find wrong version API', () => {
    const fakeApi = { LMSInitialize: () => 'true' };
    (window as Record<string, unknown>)['API'] = fakeApi;

    // Looking for 2004 but only 1.2 is present
    const result = findScormApi('2004');
    expect(result.api).toBeNull();
  });

  it('respects maxParentDepth=0 (only checks current window)', () => {
    const result = findScormApi('1.2', { maxParentDepth: 0 });
    expect(result.api).toBeNull();
  });
});
