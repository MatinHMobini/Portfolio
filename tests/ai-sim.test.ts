import { describe, it, expect } from 'vitest';
import { LabSim } from '../src/ai/lab-sim.ts';
import { BrainState, SKILLS, nodeKey } from '../src/ai/brain-state.ts';
import { createNetwork, DEFAULT_LAYERS, paramCount } from '../src/ai/network.ts';
import { runEpisode } from '../src/ai/policy.ts';
import { generateLevel, THEME_IDS } from '../src/game/level.ts';
import { sense, N_SENSES } from '../src/game/senses.ts';
import { createRunner } from '../src/game/physics.ts';
import champion from '../src/ai/champion.json';

describe('Training Lab simulation', () => {
  it('runs generations and records history', () => {
    const sim = new LabSim({ popSize: 12, mutationRate: 0.1, seed: 5, theme: 'night', cols: 80 });
    const r1 = sim.runGeneration();
    const r2 = sim.runGeneration();
    expect(r1.gen).toBe(0);
    expect(r2.gen).toBe(1);
    expect(r2.history).toHaveLength(2);
    expect(r2.bestWeights).toHaveLength(paramCount(DEFAULT_LAYERS));
    const f = sim.frame();
    expect(f.pop).toBe(12);
    expect(f.runners).toHaveLength(12 * 5);
  });

  it('adds the champion as a separate ghost', () => {
    const sim = new LabSim({ popSize: 5, mutationRate: 0.1, seed: 5, theme: 'sky', cols: 80 });
    sim.setChampion(champion.weights);
    sim.advance(10);
    expect(sim.frame().champion).not.toBeNull();
  });
});

describe('trained champion', () => {
  it('has the right shape and metadata', () => {
    expect(champion.layers).toEqual([...DEFAULT_LAYERS]);
    expect(champion.weights).toHaveLength(paramCount(champion.layers));
    expect(champion.meta.generations).toBeGreaterThan(0);
    expect(champion.history.length).toBe(champion.meta.generations);
  });

  it('plays much better than a random network', () => {
    const trained = createNetwork(champion.layers, champion.weights);
    const random = createNetwork(champion.layers); // all zero weights
    let a = 0;
    let b = 0;
    THEME_IDS.forEach((t, i) => {
      const lv = generateLevel(424242 + i, t, 200);
      a += runEpisode(trained, lv).distance;
      b += runEpisode(random, lv).distance;
    });
    expect(a).toBeGreaterThan(b * 2);
  });
});

describe('brain state (growing map)', () => {
  const net = createNetwork(champion.layers, champion.weights);

  it('reveals a pathway from senses to action when a skill is learned', () => {
    const s = new BrainState(net);
    const added = s.learn('gap', 1);
    expect(added.length).toBeGreaterThan(3);
    expect(s.revealed.has(nodeKey(0, 0))).toBe(true); // GAP DIST
    expect(s.revealed.has(nodeKey(3, 1))).toBe(true); // JUMP
    expect(added.some((k) => k.startsWith('1:'))).toBe(true);
    expect(added.some((k) => k.startsWith('2:'))).toBe(true);
  });

  it('only learns a skill once and notifies listeners', () => {
    const s = new BrainState(net);
    const seen: string[] = [];
    s.onChange((skill) => seen.push(skill?.id ?? 'all'));
    s.learn('stomp');
    expect(s.learn('stomp')).toEqual([]);
    expect(seen).toEqual(['stomp']);
    expect(SKILLS.map((k) => k.id)).toContain('stomp');
  });

  it('senses are normalised', () => {
    const lv = generateLevel(3, 'castle');
    const r = createRunner(48, lv);
    const v = sense(r, lv);
    expect(v).toHaveLength(N_SENSES);
    for (const x of v) expect(Math.abs(x)).toBeLessThanOrEqual(1);
  });
});
