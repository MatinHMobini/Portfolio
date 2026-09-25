/**
 * Which parts of the network the visitor has "seen being learned".
 * The whole network always drives the runner; this only controls the
 * growing map: when the runner first uses a behaviour, the neurons and
 * connections that carry it (the strongest weighted path from the
 * relevant senses to the action) are revealed.
 */
import { weightAt, type Network } from './network.ts';

export interface SkillDef {
  id: string;
  label: string;
  inputs: number[];
  outputs: number[];
}

export const SKILLS: SkillDef[] = [
  { id: 'run', label: 'RUN', inputs: [6, 5], outputs: [0] },
  { id: 'coin', label: 'COIN GRAB', inputs: [4], outputs: [1] },
  { id: 'gap', label: 'GAP JUMP', inputs: [0, 1], outputs: [1] },
  { id: 'stomp', label: 'STOMP', inputs: [2, 3], outputs: [1] },
  { id: 'double', label: 'DOUBLE JUMP', inputs: [7, 1], outputs: [2] },
  { id: 'wall', label: 'WALL CLIMB', inputs: [5, 6], outputs: [1, 2] },
  { id: 'dive', label: 'DIVE', inputs: [7, 3], outputs: [3] },
  { id: 'dash', label: 'DASH', inputs: [0, 2], outputs: [4] },
];

export const nodeKey = (layer: number, index: number) => `${layer}:${index}`;

type Listener = (skill: SkillDef | null, added: string[]) => void;

export class BrainState {
  revealed = new Set<string>();
  learned = new Set<string>();
  /** Time (performance.now) each node was revealed, for grow animations. */
  bornAt = new Map<string, number>();
  private listeners: Listener[] = [];

  net: Network;

  constructor(net: Network) {
    this.net = net;
  }

  onChange(fn: Listener): void {
    this.listeners.push(fn);
  }

  /** Strongest path from the skill's inputs to its outputs through both hidden layers. */
  pathFor(skill: SkillDef, perLayer = 2): string[] {
    const net = this.net;
    const L = net.layers.length - 1;
    const keys = new Set<string>();
    skill.inputs.forEach((i) => keys.add(nodeKey(0, i)));
    let targets = skill.outputs;
    skill.outputs.forEach((o) => keys.add(nodeKey(L, o)));
    // Walk backwards: for each target pick the hidden neurons with the largest |weight|.
    for (let l = L; l >= 2; l--) {
      const prevN = net.layers[l - 1];
      const picked = new Set<number>();
      for (const t of targets) {
        const ranked = Array.from({ length: prevN }, (_, i) => i).sort(
          (a, b) => Math.abs(weightAt(net, l, b, t)) - Math.abs(weightAt(net, l, a, t)),
        );
        ranked.slice(0, perLayer).forEach((i) => picked.add(i));
      }
      picked.forEach((i) => keys.add(nodeKey(l - 1, i)));
      targets = [...picked];
    }
    return [...keys];
  }

  learn(skillId: string, now = 0): string[] {
    if (this.learned.has(skillId)) return [];
    const skill = SKILLS.find((s) => s.id === skillId);
    if (!skill) return [];
    this.learned.add(skillId);
    const added: string[] = [];
    for (const k of this.pathFor(skill)) {
      if (!this.revealed.has(k)) {
        this.revealed.add(k);
        this.bornAt.set(k, now);
        added.push(k);
      }
    }
    for (const fn of this.listeners) fn(skill, added);
    return added;
  }

  revealAll(now = 0): void {
    const added: string[] = [];
    this.net.layers.forEach((n, l) => {
      for (let i = 0; i < n; i++) {
        const k = nodeKey(l, i);
        if (!this.revealed.has(k)) {
          this.revealed.add(k);
          this.bornAt.set(k, now);
          added.push(k);
        }
      }
    });
    for (const fn of this.listeners) fn(null, added);
  }

  setNetwork(net: Network): void {
    this.net = net;
  }
}
