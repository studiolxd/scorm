import { describe, it, expect } from 'vitest';
import type { ScormStatus } from '../../src/types/status';
import { createScormStore } from '../../src/svelte/index';

describe('svelte adapter — createScormStore', () => {
  it('store reflects lifecycle changes for active subscribers', () => {
    const store = createScormStore('2004', { noLmsBehavior: 'mock' });

    const seen: ScormStatus[] = [];
    const unsub = store.status.subscribe((v) => seen.push(v));
    const last = () => seen[seen.length - 1];
    expect(last().initialized).toBe(false);

    store.session.initialize();
    expect(last().initialized).toBe(true);

    store.session.terminate();
    expect(last().terminated).toBe(true);

    unsub();
    store.destroy();
  });
});
