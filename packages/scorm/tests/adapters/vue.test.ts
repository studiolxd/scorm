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
});
