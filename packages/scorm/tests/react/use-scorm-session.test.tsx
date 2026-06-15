import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ScormProvider } from '../../src/react/scorm-provider';
import { useScormSession } from '../../src/react/use-scorm-session';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
    {children}
  </ScormProvider>
);

const wrapper2004 = ({ children }: { children: ReactNode }) => (
  <ScormProvider version="2004" options={{ noLmsBehavior: 'mock' }}>
    {children}
  </ScormProvider>
);

const noApiWrapper = ({ children }: { children: ReactNode }) => (
  <ScormProvider version="1.2" options={{ noLmsBehavior: 'error' }}>
    {children}
  </ScormProvider>
);

describe('useScormSession', () => {
  it('starts with initialized and terminated as false', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper });
    expect(result.current.initialized).toBe(false);
    expect(result.current.terminated).toBe(false);
  });

  it('sets initialized to true after successful initialize()', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper });
    act(() => {
      result.current.initialize();
    });
    expect(result.current.initialized).toBe(true);
    expect(result.current.terminated).toBe(false);
  });

  it('sets initialized false and terminated true after terminate()', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper });
    act(() => { result.current.initialize(); });
    act(() => { result.current.terminate(); });
    expect(result.current.initialized).toBe(false);
    expect(result.current.terminated).toBe(true);
  });

  it('returns Result from initialize()', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper });
    let r: ReturnType<typeof result.current.initialize>;
    act(() => { r = result.current.initialize(); });
    expect(r!).toBeDefined();
    expect(r!.ok).toBe(true);
  });

  it('returns Result from terminate()', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper });
    act(() => { result.current.initialize(); });
    let r: ReturnType<typeof result.current.terminate>;
    act(() => { r = result.current.terminate(); });
    expect(r!).toBeDefined();
    expect(r!.ok).toBe(true);
  });

  it('returns Result from commit()', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper });
    act(() => { result.current.initialize(); });
    let r: ReturnType<typeof result.current.commit>;
    act(() => { r = result.current.commit(); });
    expect(r!).toBeDefined();
    expect(r!.ok).toBe(true);
  });

  it('returns undefined from initialize() when api is null', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper: noApiWrapper });
    let r: ReturnType<typeof result.current.initialize>;
    act(() => { r = result.current.initialize(); });
    expect(r!).toBeUndefined();
  });

  it('returns undefined from terminate() when api is null', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper: noApiWrapper });
    let r: ReturnType<typeof result.current.terminate>;
    act(() => { r = result.current.terminate(); });
    expect(r!).toBeUndefined();
  });

  it('returns undefined from commit() when api is null', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper: noApiWrapper });
    let r: ReturnType<typeof result.current.commit>;
    act(() => { r = result.current.commit(); });
    expect(r!).toBeUndefined();
  });

  it('does not set initialized on failed initialize()', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper });
    // initialize twice — second call should fail (already initialized in mock)
    act(() => { result.current.initialize(); });
    act(() => { result.current.initialize(); }); // mock returns false on double-init
    // initialized stays true from first call, second call fails but doesn't reset it
    expect(result.current.initialized).toBe(true);
  });

  it('exposes api, status, and raw from useScorm', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper });
    expect(result.current.api).not.toBeNull();
    expect(result.current.status).toBeDefined();
    expect(result.current.status.version).toBe('1.2');
  });

  it('works with SCORM 2004', () => {
    const { result } = renderHook(() => useScormSession(), { wrapper: wrapper2004 });
    act(() => { result.current.initialize(); });
    expect(result.current.initialized).toBe(true);
    expect(result.current.status.version).toBe('2004');
  });

  it('throws when used outside ScormProvider', () => {
    expect(() => {
      renderHook(() => useScormSession());
    }).toThrow('useScorm() must be used within a <ScormProvider>');
  });
});
