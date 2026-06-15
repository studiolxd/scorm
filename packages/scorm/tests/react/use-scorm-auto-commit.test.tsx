import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ScormProvider } from '../../src/react/scorm-provider';
import { useScormAutoCommit } from '../../src/react/use-scorm-auto-commit';
import { useScorm } from '../../src/react/use-scorm';
import type { ReactNode } from 'react';

describe('useScormAutoCommit (#5)', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
      {children}
    </ScormProvider>
  );

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('commits on the configured interval', () => {
    const commitSpy = vi.fn();
    renderHook(
      () => {
        const { api, raw } = useScorm();
        if (raw && !raw.isInitialized()) api?.initialize();
        // Wrap commit to observe calls
        if (api && !(api as { _patched?: boolean })._patched) {
          const original = api.commit.bind(api);
          api.commit = () => { commitSpy(); return original(); };
          (api as { _patched?: boolean })._patched = true;
        }
        useScormAutoCommit(1000);
      },
      { wrapper },
    );

    expect(commitSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(commitSpy).toHaveBeenCalledTimes(3);
  });

  it('does not set an interval when intervalMs <= 0', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    renderHook(() => useScormAutoCommit(0), { wrapper });
    expect(setIntervalSpy).not.toHaveBeenCalled();
    setIntervalSpy.mockRestore();
  });

  it('clears the interval on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useScormAutoCommit(1000), { wrapper });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
