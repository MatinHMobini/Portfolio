/**
 * Konami code detector: ↑ ↑ ↓ ↓ ← → ← → B A.
 * Pure logic (no DOM) so it can be unit tested. Keeps a rolling buffer
 * of the last N keys and compares it with the sequence.
 */
export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export class KonamiDetector {
  private buf: string[] = [];
  private sequence: readonly string[];

  constructor(sequence: readonly string[] = KONAMI) {
    this.sequence = sequence;
  }

  /** Feed one key (KeyboardEvent.key). Returns true when the full code was just entered. */
  push(key: string): boolean {
    this.buf.push(key.length === 1 ? key.toLowerCase() : key);
    if (this.buf.length > this.sequence.length) this.buf.shift();
    const hit = this.buf.length === this.sequence.length && this.buf.every((k, i) => k === this.sequence[i]);
    if (hit) this.buf = [];
    return hit;
  }

  reset(): void {
    this.buf = [];
  }
}
