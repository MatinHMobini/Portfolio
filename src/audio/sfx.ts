/**
 * Chiptune sound effects synthesised live with the Web Audio API
 * (square / triangle oscillators and filtered noise). No audio files.
 * Muted by default; the choice is remembered in localStorage.
 */
type Wave = OscillatorType;

const KEY = 'pq.sound';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let noiseBuf: AudioBuffer | null = null;
const listeners: ((on: boolean) => void)[] = [];

try {
  enabled = localStorage.getItem(KEY) === 'on';
} catch {
  enabled = false;
}

function ensure(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function isSoundOn(): boolean {
  return enabled;
}

export function setSound(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* storage blocked: fine */
  }
  if (on) ensure();
  listeners.forEach((fn) => fn(on));
}

export function onSoundChange(fn: (on: boolean) => void): void {
  listeners.push(fn);
}

/** One oscillator note with a pitch slide and a quick envelope. */
function tone(freq: number, dur: number, wave: Wave = 'square', opts: { to?: number; delay?: number; vol?: number } = {}) {
  const ac = ensure();
  if (!ac || !master) return;
  const t = ac.currentTime + (opts.delay ?? 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + dur);
  const v = opts.vol ?? 0.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, opts: { freq?: number; to?: number; vol?: number; delay?: number } = {}) {
  const ac = ensure();
  if (!ac || !master) return;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + (opts.delay ?? 0);
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(opts.freq ?? 1200, t);
  if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(opts.vol ?? 0.4, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.02);
}

// Throttle so a crowd of events can't machine-gun the speakers.
const last = new Map<string, number>();
function gate(name: string, ms: number): boolean {
  const now = performance.now();
  if ((last.get(name) ?? 0) + ms > now) return false;
  last.set(name, now);
  return true;
}

export const sfx = {
  jump: () => gate('jump', 60) && tone(330, 0.16, 'square', { to: 700, vol: 0.3 }),
  doubleJump: () => gate('dj', 60) && tone(520, 0.14, 'square', { to: 1000, vol: 0.3 }),
  coin: () => {
    if (!gate('coin', 50)) return;
    tone(988, 0.07, 'square', { vol: 0.3 });
    tone(1319, 0.22, 'square', { delay: 0.07, vol: 0.3 });
  },
  stomp: () => {
    if (!gate('stomp', 60)) return;
    tone(220, 0.12, 'square', { to: 60, vol: 0.45 });
    noise(0.08, { freq: 600, vol: 0.3 });
  },
  dash: () => gate('dash', 100) && noise(0.18, { freq: 2400, to: 500, vol: 0.35 }),
  fall: () => {
    tone(900, 0.7, 'triangle', { to: 120, vol: 0.35 });
    noise(0.7, { freq: 3000, to: 300, vol: 0.18 });
  },
  land: () => {
    noise(0.12, { freq: 300, vol: 0.5 });
    tone(110, 0.1, 'triangle', { to: 50, vol: 0.5 });
  },
  spring: () => tone(200, 0.35, 'square', { to: 1200, vol: 0.3 }),
  die: () => {
    [494, 466, 440, 415].forEach((f, i) => tone(f, 0.16, 'square', { delay: i * 0.13, vol: 0.3 }));
  },
  blip: () => gate('blip', 30) && tone(1400 + Math.random() * 300, 0.03, 'square', { vol: 0.12 }),
  select: () => {
    tone(660, 0.05, 'square', { vol: 0.25 });
    tone(990, 0.08, 'square', { delay: 0.05, vol: 0.25 });
  },
  levelUp: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', { delay: i * 0.08, vol: 0.28 }));
  },
  learn: () => {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, 'triangle', { delay: i * 0.07, vol: 0.4 }));
  },
  coinInsert: () => {
    tone(1319, 0.06, 'square', { vol: 0.3 });
    tone(1760, 0.3, 'square', { delay: 0.06, vol: 0.3 });
    noise(0.05, { freq: 5000, vol: 0.2, delay: 0.02 });
  },
  insertCart: () => {
    noise(0.15, { freq: 800, to: 200, vol: 0.4 });
    tone(80, 0.08, 'square', { delay: 0.18, vol: 0.5 });
    tone(523, 0.1, 'square', { delay: 0.35, vol: 0.25 });
    tone(1047, 0.2, 'square', { delay: 0.45, vol: 0.25 });
  },
  oneUp: () => {
    [659, 784, 1319, 1047, 1175, 1568].forEach((f, i) => tone(f, 0.09, 'square', { delay: i * 0.08, vol: 0.28 }));
  },
  spawn: () => {
    tone(200, 0.6, 'triangle', { to: 1600, vol: 0.35 });
    noise(0.6, { freq: 400, to: 4000, vol: 0.15 });
  },
  glitch: () => {
    noise(0.3, { freq: 5000, to: 200, vol: 0.4 });
    tone(60, 0.3, 'square', { to: 1200, vol: 0.2 });
  },
  tick: () => tone(880, 0.05, 'square', { vol: 0.15 }),
  gameOver: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', { delay: i * 0.22, vol: 0.4 }));
  },
};
