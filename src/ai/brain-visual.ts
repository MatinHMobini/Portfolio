/**
 * Live neural network diagram. Nodes are pixel squares labelled with
 * senses (left) and actions (right). Edge colour = weight sign
 * (yellow positive, pink negative), thickness = magnitude. Neurons glow
 * with their live activation and signal pulses travel along the edges
 * that are carrying the most signal right now.
 */
import { weightAt, type Network } from './network.ts';
import { nodeKey, type BrainState } from './brain-state.ts';
import { SENSE_NAMES, ACTION_NAMES } from '../game/senses.ts';

const YELLOW = '#FFD447';
const PINK = '#FF5C8A';
const WHITE = '#F5F2FF';
const MUTED = '#9D97C7';

interface Pulse {
  l: number;
  i: number;
  j: number;
  t: number;
  pos: boolean;
}

export interface BrainViewOptions {
  /** Show every node regardless of the reveal state (Training Lab). */
  showAll?: boolean;
  labels?: boolean;
  /** Font size for labels in CSS px. */
  fontSize?: number;
  /** Max pulses alive at once. */
  maxPulses?: number;
}

export class BrainView {
  private ctx: CanvasRenderingContext2D;
  private pulses: Pulse[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private net: Network;
  /** Activations to display (copied from the driving network). */
  acts: Float32Array[];
  human = false;

  private canvas: HTMLCanvasElement;
  private state: BrainState | null;
  private opts: BrainViewOptions;

  constructor(canvas: HTMLCanvasElement, state: BrainState | null, net: Network, opts: BrainViewOptions = {}) {
    this.canvas = canvas;
    this.state = state;
    this.opts = opts;
    this.ctx = canvas.getContext('2d')!;
    this.net = net;
    this.acts = net.layers.map((n) => new Float32Array(n));
    this.resize();
  }

  setNetwork(net: Network): void {
    this.net = net;
    if (this.acts.length !== net.layers.length) this.acts = net.layers.map((n) => new Float32Array(n));
  }

  setActivations(acts: Float32Array[]): void {
    for (let l = 0; l < acts.length && l < this.acts.length; l++) this.acts[l].set(acts[l]);
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(10, r.width);
    this.h = Math.max(10, r.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  private visible(l: number, i: number): boolean {
    if (this.opts.showAll || !this.state) return true;
    return this.state.revealed.has(nodeKey(l, i));
  }

  private pos(l: number, i: number): [number, number] {
    const layers = this.net.layers;
    const labels = this.opts.labels !== false;
    const fs = this.opts.fontSize ?? 10;
    const padL = labels ? fs * 10.5 : 14;
    const padR = labels ? fs * 10.5 : 14;
    const padY = Math.max(12, fs * 1.4);
    const x = padL + ((this.w - padL - padR) * l) / (layers.length - 1);
    const n = layers[l];
    const span = this.h - padY * 2;
    const y = padY + (n === 1 ? span / 2 : (span * i) / (n - 1));
    return [x, y];
  }

  draw(now: number, dt: number): void {
    const { ctx, net } = this;
    const layers = net.layers;
    const fs = this.opts.fontSize ?? 10;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    const nodeSize = Math.max(6, Math.min(14, this.h / 22));

    // Edges.
    for (let l = 1; l < layers.length; l++) {
      for (let j = 0; j < layers[l]; j++) {
        if (!this.visible(l, j)) continue;
        const [x1, y1] = this.pos(l, j);
        for (let i = 0; i < layers[l - 1]; i++) {
          if (!this.visible(l - 1, i)) continue;
          const w = weightAt(net, l, i, j);
          const mag = Math.min(1, Math.abs(w) / 2.5);
          if (mag < 0.06) continue;
          const [x0, y0] = this.pos(l - 1, i);
          const act = Math.abs(this.acts[l - 1][i] * w);
          const grow = this.growth(l, j, now) * this.growth(l - 1, i, now);
          ctx.globalAlpha = (0.12 + Math.min(0.6, act * 0.5)) * grow;
          ctx.strokeStyle = w >= 0 ? YELLOW : PINK;
          ctx.lineWidth = 0.6 + mag * 3;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          // Spawn signal pulses on strongly active edges.
          if (act > 0.25 && this.pulses.length < (this.opts.maxPulses ?? 160) && Math.random() < act * dt * 5) {
            this.pulses.push({ l, i, j, t: 0, pos: w * this.acts[l - 1][i] >= 0 });
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    // Pulses.
    const ps = Math.max(3, nodeSize * 0.4);
    this.pulses = this.pulses.filter((p) => {
      p.t += dt * 2.2;
      if (p.t >= 1) return false;
      if (!this.visible(p.l, p.j) || !this.visible(p.l - 1, p.i)) return false;
      const [x0, y0] = this.pos(p.l - 1, p.i);
      const [x1, y1] = this.pos(p.l, p.j);
      ctx.fillStyle = p.pos ? YELLOW : PINK;
      ctx.fillRect(Math.round(x0 + (x1 - x0) * p.t - ps / 2), Math.round(y0 + (y1 - y0) * p.t - ps / 2), ps, ps);
      return true;
    });

    // Nodes.
    ctx.textBaseline = 'middle';
    ctx.font = `${fs}px "Press Start 2P", monospace`;
    const last = layers.length - 1;
    for (let l = 0; l < layers.length; l++) {
      for (let i = 0; i < layers[l]; i++) {
        const [x, y] = this.pos(l, i);
        const vis = this.visible(l, i);
        if (!vis) {
          // Undiscovered neuron: faint outline only.
          ctx.strokeStyle = 'rgba(157,151,199,0.25)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(Math.round(x - nodeSize / 2) + 0.5, Math.round(y - nodeSize / 2) + 0.5, nodeSize, nodeSize);
          ctx.setLineDash([]);
          continue;
        }
        const a = this.acts[l][i];
        const g = this.growth(l, i, now);
        const s = nodeSize * (0.4 + 0.6 * g);
        const out = l === last;
        const level = out ? a : (a + 1) / 2; // 0..1
        const on = out ? a > 0.5 : Math.abs(a) > 0.5;
        const color = out ? (on ? YELLOW : '#3B3380') : a >= 0 ? YELLOW : PINK;
        if (on) {
          ctx.globalAlpha = 0.25 + 0.2 * Math.sin(now / 120 + i);
          ctx.fillStyle = color;
          ctx.fillRect(Math.round(x - s), Math.round(y - s), Math.round(s * 2), Math.round(s * 2));
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#100C26';
        ctx.fillRect(Math.round(x - s / 2 - 2), Math.round(y - s / 2 - 2), Math.round(s + 4), Math.round(s + 4));
        ctx.fillStyle = color;
        ctx.globalAlpha = out ? 0.35 + 0.65 * level : 0.25 + 0.75 * Math.abs(a);
        ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s));
        ctx.globalAlpha = 1;
        // "Just learned" flash ring.
        if (g < 1) {
          ctx.strokeStyle = WHITE;
          ctx.globalAlpha = 1 - g;
          ctx.lineWidth = 2;
          const r = s + 14 * g;
          ctx.strokeRect(Math.round(x - r / 2), Math.round(y - r / 2), Math.round(r), Math.round(r));
          ctx.globalAlpha = 1;
        }
        if (this.opts.labels !== false && (l === 0 || l === last)) {
          const name = l === 0 ? SENSE_NAMES[i] : ACTION_NAMES[i];
          ctx.fillStyle = l === 0 ? MUTED : on ? YELLOW : WHITE;
          ctx.textAlign = l === 0 ? 'right' : 'left';
          ctx.fillText(name, l === 0 ? x - s - 8 : x + s + 8, y + 1);
        }
      }
    }
    if (this.human) {
      ctx.fillStyle = 'rgba(16,12,38,0.75)';
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.fillStyle = PINK;
      ctx.textAlign = 'center';
      ctx.font = `${Math.max(10, fs * 1.4)}px "Press Start 2P", monospace`;
      ctx.fillText('HUMAN PLAYER', this.w / 2, this.h / 2);
    }
  }

  /** 0..1 grow-in animation for a node revealed recently. */
  private growth(l: number, i: number, now: number): number {
    if (this.opts.showAll || !this.state) return 1;
    const born = this.state.bornAt.get(nodeKey(l, i));
    if (born === undefined || born === 0) return 1;
    return Math.min(1, (now - born) / 900);
  }
}

/** Small stepped line chart for fitness history. */
export function drawChart(
  canvas: HTMLCanvasElement,
  series: { values: number[]; color: string }[],
  opts: { label?: string } = {},
): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  const w = Math.max(10, r.width);
  const h = Math.max(10, r.height);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // Grid.
  ctx.fillStyle = '#2A2266';
  for (let y = 0; y <= 4; y++) ctx.fillRect(0, Math.round(((h - 2) * y) / 4), w, 1);
  const all = series.flatMap((s) => s.values);
  if (!all.length) return;
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  for (const s of series) {
    const n = s.values.length;
    ctx.fillStyle = s.color;
    for (let k = 0; k < n; k++) {
      const x = n === 1 ? 0 : (k / (n - 1)) * (w - 3);
      const y = h - 3 - ((s.values[k] - min) / (max - min)) * (h - 6);
      ctx.fillRect(Math.round(x), Math.round(y), 3, 3);
      if (k > 0) {
        const px = ((k - 1) / (n - 1)) * (w - 3);
        const py = h - 3 - ((s.values[k - 1] - min) / (max - min)) * (h - 6);
        ctx.globalAlpha = 0.6;
        ctx.fillRect(Math.round(px), Math.round(Math.min(py, y)), Math.max(1, Math.round(x - px)), Math.max(1, Math.round(Math.abs(y - py))));
        ctx.globalAlpha = 1;
      }
    }
  }
  if (opts.label) {
    ctx.fillStyle = MUTED;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(opts.label, w - 4, 4);
  }
}
