import { describe, it, expect } from 'vitest';
import { KonamiDetector, KONAMI } from '../src/ui/konami.ts';

const feed = (d: KonamiDetector, keys: string[]) => keys.map((k) => d.push(k));

describe('Konami detector', () => {
  it('fires on the exact sequence', () => {
    const d = new KonamiDetector();
    const results = feed(d, KONAMI);
    expect(results.slice(0, -1).every((r) => !r)).toBe(true);
    expect(results.at(-1)).toBe(true);
  });

  it('accepts upper-case B and A', () => {
    const d = new KonamiDetector();
    const seq = [...KONAMI.slice(0, 8), 'B', 'A'];
    expect(feed(d, seq).at(-1)).toBe(true);
  });

  it('works after unrelated keys and after an extra ↑', () => {
    const d = new KonamiDetector();
    expect(feed(d, ['x', 'ArrowUp', ...KONAMI]).at(-1)).toBe(true);
  });

  it('does not fire on a wrong sequence', () => {
    const d = new KonamiDetector();
    const wrong = [...KONAMI];
    wrong[5] = 'ArrowLeft';
    expect(feed(d, wrong).some(Boolean)).toBe(false);
  });

  it('resets after firing', () => {
    const d = new KonamiDetector();
    feed(d, KONAMI);
    expect(d.push('a')).toBe(false);
    expect(feed(d, KONAMI).at(-1)).toBe(true);
  });
});
