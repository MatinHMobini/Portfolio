/// <reference lib="webworker" />
/**
 * Web Worker that runs the Training Lab simulation off the main thread,
 * so even MAX speed keeps the page smooth.
 */
import { LabSim, type LabConfig } from './lab-sim.ts';
import type { ThemeId } from '../game/level.ts';

export type LabIn =
  | { type: 'init'; cfg: LabConfig }
  | { type: 'tick'; steps: number }
  | { type: 'max'; on: boolean }
  | { type: 'config'; popSize: number; mutationRate: number }
  | { type: 'reset' }
  | { type: 'level'; seed: number; theme: ThemeId }
  | { type: 'champion'; weights: number[] | null };

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let sim: LabSim | null = null;
let maxOn = false;
let maxTimer = 0;

function post(msg: unknown) {
  ctx.postMessage(msg);
}

function runMax() {
  if (!sim || !maxOn) return;
  const until = performance.now() + 40;
  while (performance.now() < until) {
    const res = sim.advance(200);
    if (res) post({ type: 'gen', res });
  }
  post({ type: 'frame', frame: sim.frame() });
  maxTimer = self.setTimeout(runMax, 0);
}

ctx.onmessage = (e: MessageEvent<LabIn>) => {
  const m = e.data;
  switch (m.type) {
    case 'init':
      sim = new LabSim(m.cfg);
      post({ type: 'frame', frame: sim.frame() });
      break;
    case 'tick': {
      if (!sim) return;
      const res = sim.advance(m.steps);
      if (res) post({ type: 'gen', res });
      post({ type: 'frame', frame: sim.frame() });
      break;
    }
    case 'max':
      maxOn = m.on;
      clearTimeout(maxTimer);
      if (maxOn) runMax();
      break;
    case 'config':
      sim?.configure(m.popSize, m.mutationRate);
      break;
    case 'reset':
      sim?.reset();
      if (sim) post({ type: 'frame', frame: sim.frame() });
      break;
    case 'level':
      sim?.setLevel(m.seed, m.theme);
      if (sim) post({ type: 'frame', frame: sim.frame() });
      break;
    case 'champion':
      sim?.setChampion(m.weights);
      break;
  }
};
