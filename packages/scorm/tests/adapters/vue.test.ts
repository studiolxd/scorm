import { describe, it, expect } from 'vitest';
import { effectScope } from 'vue';
import { useScorm } from '../../src/vue/index';

describe('vue adapter — useScorm', () => {
  it('creates a session with reactive status', () => {
    const scope = effectScope();
    const result = scope.run(() => useScorm('2004', { noLmsBehavior: 'mock' }))!;

    expect(result.session.api).not.toBeNull();
    expect(result.status.value.initialized).toBe(false);

    result.initialize();
    expect(result.status.value.initialized).toBe(true);

    result.terminate();
    expect(result.status.value.terminated).toBe(true);

    scope.stop(); // triggers onScopeDispose → session.destroy()
  });

  it('works outside an effect scope and exposes destroy() for manual cleanup', () => {
    // No effectScope: onScopeDispose is a no-op, so the caller must use destroy().
    const result = useScorm('2004', { noLmsBehavior: 'mock' });
    expect(typeof result.destroy).toBe('function');

    result.initialize();
    expect(result.status.value.initialized).toBe(true);

    // destroy() detaches the change listener: further changes don't update status.
    result.destroy();
    result.session.terminate();
    expect(result.status.value.terminated).toBe(false); // not observed after destroy
  });
});
