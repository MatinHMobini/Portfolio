/**
 * A tiny multilayer perceptron. Weights live in one flat Float32Array
 * (the "genome") so the genetic algorithm can mutate and cross it
 * over easily. Hidden layers use tanh, the output layer uses sigmoid.
 *
 * Layout per layer: for each neuron j, `inputs` weights then 1 bias.
 */
export const DEFAULT_LAYERS = [8, 10, 8, 5] as const;

export interface Network {
  layers: number[];
  weights: Float32Array;
  /** Activations of every layer from the most recent forward pass. */
  acts: Float32Array[];
}

export function paramCount(layers: readonly number[]): number {
  let n = 0;
  for (let i = 1; i < layers.length; i++) n += layers[i] * (layers[i - 1] + 1);
  return n;
}

export function createNetwork(layers: readonly number[] = DEFAULT_LAYERS, weights?: ArrayLike<number>): Network {
  const count = paramCount(layers);
  const w = new Float32Array(count);
  if (weights) {
    if (weights.length !== count) throw new Error(`Expected ${count} weights, got ${weights.length}`);
    w.set(weights);
  }
  return { layers: [...layers], weights: w, acts: layers.map((n) => new Float32Array(n)) };
}

/** Offset of the first weight of layer `l` (l >= 1). */
export function layerOffset(layers: readonly number[], l: number): number {
  let off = 0;
  for (let i = 1; i < l; i++) off += layers[i] * (layers[i - 1] + 1);
  return off;
}

/** Weight from neuron i in layer l-1 to neuron j in layer l. */
export function weightAt(net: Network, l: number, i: number, j: number): number {
  const prev = net.layers[l - 1];
  return net.weights[layerOffset(net.layers, l) + j * (prev + 1) + i];
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** Run the network. Returns the output activations (a view, do not keep). */
export function forward(net: Network, input: ArrayLike<number>): Float32Array {
  const { layers, weights, acts } = net;
  const a0 = acts[0];
  for (let i = 0; i < layers[0]; i++) a0[i] = input[i];
  let off = 0;
  const last = layers.length - 1;
  for (let l = 1; l <= last; l++) {
    const prev = acts[l - 1];
    const cur = acts[l];
    const nIn = layers[l - 1];
    for (let j = 0; j < layers[l]; j++) {
      let sum = 0;
      for (let i = 0; i < nIn; i++) sum += weights[off + i] * prev[i];
      sum += weights[off + nIn];
      off += nIn + 1;
      cur[j] = l === last ? sigmoid(sum) : Math.tanh(sum);
    }
  }
  return acts[last];
}
