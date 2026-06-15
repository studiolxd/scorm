import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ScormProvider } from '../../src/react/scorm-provider';
import { useScormAutoTerminate } from '../../src/react/use-scorm-auto-terminate';
import { useScorm } from '../../src/react/use-scorm';
import type { ReactNode } from 'react';

describe('useScormAutoTerminate', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
      {children}
    </ScormProvider>
  );

  it('auto-initializes on mount', () => {
    const { result } = renderHook(
      () => {
        const scorm = useScorm();
        useScormAutoTerminate();
        return scorm;
      },
      { wrapper },
    );

    // After mount, the api should have been initialized
    expect(result.current.api).not.toBeNull();
    expect(result.current.raw!.isInitialized()).toBe(true);
  });

  it('registers and unregisters event listeners', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(
      () => useScormAutoTerminate(),
      { wrapper },
    );

    // Should register beforeunload, pagehide, and freeze
    const addedEvents = addSpy.mock.calls.map(c => c[0]);
    expect(addedEvents).toContain('beforeunload');
    expect(addedEvents).toContain('pagehide');
    expect(addedEvents).toContain('freeze');

    unmount();

    // Should clean up listeners
    const removedEvents = removeSpy.mock.calls.map(c => c[0]);
    expect(removedEvents).toContain('beforeunload');
    expect(removedEvents).toContain('pagehide');
    expect(removedEvents).toContain('freeze');

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('does not register freeze listener when handleFreeze=false', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(
      () => useScormAutoTerminate({ handleFreeze: false }),
      { wrapper },
    );

    const addedEvents = addSpy.mock.calls.map(c => c[0]);
    expect(addedEvents).not.toContain('freeze');
    expect(addedEvents).toContain('beforeunload');

    addSpy.mockRestore();
  });

  it('does not register unload listeners when handleUnload=false', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(
      () => useScormAutoTerminate({ handleUnload: false }),
      { wrapper },
    );

    const addedEvents = addSpy.mock.calls.map(c => c[0]);
    expect(addedEvents).not.toContain('beforeunload');
    expect(addedEvents).not.toContain('pagehide');
    expect(addedEvents).toContain('freeze');

    addSpy.mockRestore();
  });
});
