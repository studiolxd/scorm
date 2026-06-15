import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ScormProvider } from '../../src/react/scorm-provider';
import { useScorm } from '../../src/react/use-scorm';
import type { ReactNode } from 'react';

describe('useScorm', () => {
  it('throws when used outside ScormProvider', () => {
    expect(() => {
      renderHook(() => useScorm());
    }).toThrow('useScorm() must be used within a <ScormProvider>');
  });

  it('returns context value when inside ScormProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
        {children}
      </ScormProvider>
    );

    const { result } = renderHook(() => useScorm(), { wrapper });

    expect(result.current.status).toBeDefined();
    expect(result.current.status.version).toBe('1.2');
    expect(result.current.status.apiFound).toBe(true);
    expect(result.current.api).not.toBeNull();
    expect(result.current.raw).not.toBeNull();
  });

  it('api is functional with mock', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ScormProvider version="2004" options={{ noLmsBehavior: 'mock' }}>
        {children}
      </ScormProvider>
    );

    const { result } = renderHook(() => useScorm(), { wrapper });
    const api = result.current.api!;

    const initResult = api.initialize();
    expect(initResult.ok).toBe(true);

    const setResult = api.setComplete();
    expect(setResult.ok).toBe(true);

    const commitResult = api.commit();
    expect(commitResult.ok).toBe(true);
  });
});
