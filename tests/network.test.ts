import { describe, it, expect } from 'vitest';
import { createNetwork, forward, paramCount, weightAt, layerOffset, DEFAULT_LAYERS } from '../src/ai/network.ts';

describe('neural network', () => {
  it('counts parameters (weights + biases)', () => {
    expect(paramCount([8, 10, 8, 5])).toBe(8 * 10 + 10 + 10 * 8 + 8 + 8 * 5 + 5);
    expect(paramCount(DEFAULT_LAYERS)).toBe(223);
  });

  it('computes a forward pass by hand for a tiny net', () => {
    // 2 inputs -> 1 hidden (tanh) -> 1 output (sigmoid)
    // hidden: w = [0.5, -1], bias 0.25 ; output: w = [2], bias -1
    const net = createNetwork([2, 1, 1], [0.5, -1, 0.25, 2, -1]);
    const out = forward(net, [1, 0.5]);
    const h = Math.tanh(0.5 * 1 - 1 * 0.5 + 0.25);
    const o = 1 / (1 + Math.exp(-(2 * h - 1)));
    expect(out[0]).toBeCloseTo(o, 6);
    expect(net.acts[1][0]).toBeCloseTo(h, 6);
    expect(Array.from(net.acts[0])).toEqual([1, 0.5]);
  });

  it('keeps outputs in (0, 1) and hidden activations in [-1, 1]', () => {
    const w = Array.from({ length: paramCount(DEFAULT_LAYERS) }, (_, i) => Math.sin(i * 12.9898) * 3);
    const net = createNetwork(DEFAULT_LAYERS, w);
    const out = forward(net, [1, -1, 0.5, 0.2, -0.3, 0.9, 1, -0.8]);
    for (const v of out) expect(v > 0 && v < 1).toBe(true);
    for (const v of net.acts[1]) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });

  it('looks up individual weights with weightAt', () => {
    const layers = [2, 3, 1];
    const w = Array.from({ length: paramCount(layers) }, (_, i) => i);
    const net = createNetwork(layers, w);
    // layer 1, neuron j=2, input i=1 -> offset 2*(2+1)+1 = 7
    expect(weightAt(net, 1, 1, 2)).toBe(7);
    expect(layerOffset(layers, 2)).toBe(9);
    expect(weightAt(net, 2, 0, 0)).toBe(9);
  });

  it('rejects a weight vector of the wrong length', () => {
    expect(() => createNetwork([2, 1], [1, 2])).toThrow();
  });
});
