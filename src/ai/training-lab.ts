/**
 * "TRAIN IT YOURSELF": full-screen Training Lab.
 * A population of ghost runners learns a level live via neuroevolution
 * (simulated in a Web Worker). Controls: start/pause, speed, mutation
 * rate, population size, new level, reset, and load the pre-trained
 * champion to race against.
 */
import { generateLevel, THEME_IDS, type Level, type ThemeId } from '../game/level.ts';
import { drawWorld, type View } from '../game/renderer.ts';
import { createNetwork, type Network } from './network.ts';
import { BrainView, drawChart } from './brain-visual.ts';
import type { LabFrame, GenResult, LabConfig } from './lab-sim.ts';
import type { LabIn } from './lab.worker.ts';
import { sfx } from '../audio/sfx.ts';

interface LabPort {
  post(msg: LabIn): void;
  onmessage: ((m: { type: 'frame'; frame: LabFrame } | { type: 'gen'; res: GenResult }) => void) | null;
  terminate(): void;
}

function createPort(): LabPort {
  try {
    const w = new Worker(new URL('./lab.worker.ts', import.meta.url), { type: 'module' });
    const port: LabPort = {
      post: (m) => w.postMessage(m),
      onmessage: null,
      terminate: () => w.terminate(),
    };
    w.onmessage = (e) => port.onmessage?.(e.data);
    return port;
  } catch {
    return createLocalPort();
  }
}

/** Main-thread fallback with the same message protocol. */
function createLocalPort(): LabPort {
  let simP: Promise<import('./lab-sim.ts').LabSim> | null = null;
  let maxOn = false;
  const port: LabPort = {
    onmessage: null,
    terminate: () => {
      maxOn = false;
    },
    post: (m) => {
      void (async () => {
        if (m.type === 'init') {
          const { LabSim } = await import('./lab-sim.ts');
          simP = Promise.resolve(new LabSim(m.cfg));
        }
        const sim = simP ? await simP : null;
        if (!sim) return;
        const emit = (msg: Parameters<NonNullable<LabPort['onmessage']>>[0]) => port.onmessage?.(msg);
        switch (m.type) {
          case 'init':
            emit({ type: 'frame', frame: sim.frame() });
            break;
          case 'tick': {
            const res = sim.advance(m.steps);
            if (res) emit({ type: 'gen', res });
            emit({ type: 'frame', frame: sim.frame() });
            break;
          }
          case 'max': {
            maxOn = m.on;
            const loop = () => {
              if (!maxOn) return;
              const until = performance.now() + 12;
              while (performance.now() < until) {
                const res = sim.advance(100);
                if (res) emit({ type: 'gen', res });
              }
              emit({ type: 'frame', frame: sim.frame() });
              setTimeout(loop, 16);
            };
            loop();
            break;
          }
          case 'config':
            sim.configure(m.popSize, m.mutationRate);
            break;
          case 'reset':
            sim.reset();
            emit({ type: 'frame', frame: sim.frame() });
            break;
          case 'level':
            sim.setLevel(m.seed, m.theme);
            emit({ type: 'frame', frame: sim.frame() });
            break;
          case 'champion':
            sim.setChampion(m.weights);
            break;
        }
      })();
    },
  };
  return port;
}

const html = `
<div class="modal__head">
  <h2 class="modal__title" id="lab-title">TRAINING LAB</h2>
  <button class="modal__close" type="button" data-lab="close" aria-label="Close the Training Lab">✕</button>
</div>
<div class="lab__body">
  <div class="lab__stage">
    <canvas aria-label="Ghost runners learning the level" role="img"></canvas>
    <div class="lab__hudline" aria-live="off">
      <span>GEN <b data-l="gen">0</b></span>
      <span>ALIVE <b data-l="alive">-</b></span>
      <span>BEST <b data-l="best">-</b></span>
      <span>AVG <b data-l="avg">-</b></span>
      <span>CLEARED <b data-l="fin">0</b></span>
      <span>LEVEL <b data-l="lvl">-</b></span>
    </div>
  </div>
  <div class="lab__side">
    <div class="lab__panel"><p class="k-label">LEADER'S BRAIN · LIVE</p><canvas class="lab__brain" role="img" aria-label="Live network of the runner currently in the lead"></canvas></div>
    <div class="lab__panel">
      <p class="k-label">FITNESS PER GENERATION</p>
      <canvas class="lab__chart" role="img" aria-label="Best and average fitness per generation"></canvas>
      <p class="chart__key"><span class="key key--y"></span>BEST <span class="key key--p"></span>AVERAGE</p>
    </div>
    <div class="lab__panel"><p class="k-label">LOG</p><ul class="lab__log" data-l="log"></ul></div>
    <p class="lab__note">Generation 0 is pure random weights: most ghosts just fall in the first gap. After each generation the fittest brains survive, breed and mutate. Watch the curve climb. The yellow marker follows the leader; the cyan ghost is the pre-trained champion when loaded.</p>
  </div>
  <div class="lab__controls">
    <button class="btn btn--primary btn--sm" type="button" data-lab="play">▶ START</button>
    <div class="seg" role="group" aria-label="Simulation speed">
      <button type="button" data-speed="1" aria-pressed="true">1X</button>
      <button type="button" data-speed="5" aria-pressed="false">5X</button>
      <button type="button" data-speed="20" aria-pressed="false">20X</button>
      <button type="button" data-speed="max" aria-pressed="false">MAX</button>
    </div>
    <label class="lab__field">MUTATION <output data-l="mut">10%</output><input type="range" min="1" max="40" value="10" data-lab="mut"></label>
    <label class="lab__field">POPULATION<select data-lab="pop"><option value="20">20</option><option value="50" selected>50</option><option value="100">100</option></select></label>
    <button class="btn btn--ghost btn--sm" type="button" data-lab="level">NEW LEVEL</button>
    <button class="btn btn--ghost btn--sm" type="button" data-lab="reset">RESET</button>
    <button class="btn btn--ghost btn--sm" type="button" data-lab="champ" aria-pressed="false">LOAD CHAMPION</button>
  </div>
</div>`;

export class TrainingLab {
  private dialog: HTMLDialogElement;
  private port: LabPort | null = null;
  private stage: HTMLCanvasElement;
  private sctx: CanvasRenderingContext2D;
  private view: View = { w: 320, h: 180 };
  private scale = 2;
  private level: Level;
  private seed = 1234;
  private theme: ThemeId = 'night';
  private frame: LabFrame | null = null;
  private brain: BrainView;
  private brainNet: Network;
  private playing = false;
  private speed: number | 'max' = 1;
  private waiting = false;
  private raf = 0;
  private camX = 0;
  private lastT = 0;
  private history: GenResult['history'] = [];
  private championOn = false;
  onOpenChange: ((open: boolean) => void) | null = null;

  private championWeights: number[];

  constructor(championWeights: number[], layers: number[]) {
    this.championWeights = championWeights;
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'modal lab';
    this.dialog.setAttribute('aria-labelledby', 'lab-title');
    this.dialog.innerHTML = html;
    document.body.appendChild(this.dialog);
    this.stage = this.dialog.querySelector('.lab__stage canvas')!;
    this.sctx = this.stage.getContext('2d')!;
    this.level = generateLevel(this.seed, this.theme, 150);
    this.brainNet = createNetwork(layers);
    this.brain = new BrainView(this.dialog.querySelector('.lab__brain')!, null, this.brainNet, { showAll: true, fontSize: 7, maxPulses: 80 });
    this.bind();
  }

  private $(sel: string) {
    return this.dialog.querySelector<HTMLElement>(sel)!;
  }

  private bind() {
    const d = this.dialog;
    d.addEventListener('close', () => this.onClose());
    d.addEventListener('cancel', () => this.onClose());
    this.$('[data-lab="close"]').addEventListener('click', () => d.close());
    this.$('[data-lab="play"]').addEventListener('click', () => this.setPlaying(!this.playing));
    d.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((b) =>
      b.addEventListener('click', () => {
        sfx.select();
        d.querySelectorAll('[data-speed]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        const v = b.dataset.speed!;
        this.speed = v === 'max' ? 'max' : Number(v);
        this.syncMax();
      }),
    );
    const mut = this.$('[data-lab="mut"]') as HTMLInputElement;
    const pop = this.$('[data-lab="pop"]') as HTMLSelectElement;
    const sendCfg = () => {
      this.$('[data-l="mut"]').textContent = `${mut.value}%`;
      this.port?.post({ type: 'config', popSize: Number(pop.value), mutationRate: Number(mut.value) / 100 });
    };
    mut.addEventListener('input', sendCfg);
    pop.addEventListener('change', () => {
      sendCfg();
      this.log(`POPULATION → ${pop.value} (NEXT GENERATION)`);
    });
    this.$('[data-lab="level"]').addEventListener('click', () => {
      this.seed = (Math.random() * 1e9) | 0;
      this.theme = THEME_IDS[(THEME_IDS.indexOf(this.theme) + 1) % THEME_IDS.length];
      this.level = generateLevel(this.seed, this.theme, 150);
      this.port?.post({ type: 'level', seed: this.seed, theme: this.theme });
      this.log(`NEW LEVEL: ${this.theme.toUpperCase()} #${this.seed % 10000}`);
      sfx.select();
    });
    this.$('[data-lab="reset"]').addEventListener('click', () => {
      this.history = [];
      this.port?.post({ type: 'reset' });
      this.drawChart();
      this.log('RESET: NEW RANDOM POPULATION');
      sfx.select();
    });
    this.$('[data-lab="champ"]').addEventListener('click', (e) => {
      this.championOn = !this.championOn;
      (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(this.championOn));
      (e.currentTarget as HTMLElement).textContent = this.championOn ? 'HIDE CHAMPION' : 'LOAD CHAMPION';
      this.port?.post({ type: 'champion', weights: this.championOn ? this.championWeights : null });
      this.log(this.championOn ? 'CHAMPION LOADED (CYAN GHOST)' : 'CHAMPION REMOVED');
      sfx.select();
    });
  }

  private log(text: string) {
    const ul = this.$('[data-l="log"]');
    const li = document.createElement('li');
    li.textContent = `> ${text}`;
    ul.prepend(li);
    while (ul.children.length > 30) ul.lastElementChild?.remove();
  }

  open(): void {
    if (this.dialog.open) return;
    this.dialog.showModal();
    this.onOpenChange?.(true);
    if (!this.port) {
      this.port = createPort();
      this.port.onmessage = (m) => this.onMessage(m);
      const cfg: LabConfig = { popSize: 50, mutationRate: 0.1, seed: this.seed, theme: this.theme, cols: 150 };
      this.port.post({ type: 'init', cfg });
      this.log('50 RANDOM BRAINS SPAWNED. PRESS START.');
    }
    this.resize();
    this.drawChart();
    this.lastT = performance.now();
    const loop = (now: number) => {
      if (!this.dialog.open) return;
      this.tick(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private onClose() {
    this.setPlaying(false);
    cancelAnimationFrame(this.raf);
    this.onOpenChange?.(false);
  }

  private setPlaying(p: boolean) {
    this.playing = p;
    this.$('[data-lab="play"]').textContent = p ? '❚❚ PAUSE' : '▶ START';
    this.syncMax();
    if (p) sfx.select();
  }

  private syncMax() {
    this.port?.post({ type: 'max', on: this.playing && this.speed === 'max' });
  }

  private onMessage(m: { type: 'frame'; frame: LabFrame } | { type: 'gen'; res: GenResult }) {
    if (m.type === 'frame') {
      this.frame = m.frame;
      this.waiting = false;
      this.brainNet.weights.set(m.frame.leaderWeights);
      this.brain.setActivations(m.frame.leaderActs.map((a) => Float32Array.from(a)));
      this.$('[data-l="gen"]').textContent = String(m.frame.gen);
      this.$('[data-l="alive"]').textContent = `${m.frame.alive}/${m.frame.pop}`;
      this.$('[data-l="lvl"]').textContent = `${this.theme.toUpperCase()}`;
    } else {
      const r = m.res;
      this.history = r.history;
      this.$('[data-l="best"]').textContent = r.best.toFixed(0);
      this.$('[data-l="avg"]').textContent = r.mean.toFixed(0);
      this.$('[data-l="fin"]').textContent = String(r.finished);
      const prev = r.history[r.history.length - 2];
      const note = r.finished > 0 ? ` · ${r.finished} CLEARED THE LEVEL!` : prev && r.best > prev.best + 1 ? ' · NEW RECORD' : '';
      this.log(`GEN ${r.gen}: BEST ${r.best.toFixed(0)} AVG ${r.mean.toFixed(0)}${note}`);
      if (r.finished > 0 && (!prev || this.history.length < 2)) sfx.levelUp();
      this.drawChart();
    }
  }

  private drawChart() {
    drawChart(this.dialog.querySelector('.lab__chart')!, [
      { values: this.history.map((h) => h.mean), color: '#FF5C8A' },
      { values: this.history.map((h) => h.best), color: '#FFD447' },
    ]);
  }

  private resize() {
    const r = this.stage.getBoundingClientRect();
    this.scale = r.width < 500 ? 2 : 3;
    this.view = { w: Math.max(80, Math.floor(r.width / this.scale)), h: Math.max(60, Math.floor(r.height / this.scale)) };
    this.stage.width = this.view.w;
    this.stage.height = this.view.h;
    this.brain.resize();
  }

  private tick(now: number) {
    const dt = Math.min(0.1, (now - this.lastT) / 1000);
    this.lastT = now;
    const r = this.stage.getBoundingClientRect();
    if (Math.floor(r.width / this.scale) !== this.view.w || Math.floor(r.height / this.scale) !== this.view.h) this.resize();
    if (this.playing && this.speed !== 'max' && !this.waiting && this.port) {
      this.waiting = true;
      this.port.post({ type: 'tick', steps: this.speed });
    }
    this.render(now / 1000);
    this.brain.draw(now, dt);
  }

  private render(t: number) {
    const f = this.frame;
    const ctx = this.sctx;
    ctx.imageSmoothingEnabled = false;
    if (!f) {
      ctx.fillStyle = '#100C26';
      ctx.fillRect(0, 0, this.view.w, this.view.h);
      return;
    }
    // Sync the leader's enemies and coins into the drawing copy.
    this.level.enemies.forEach((e, i) => {
      if (i * 3 + 2 >= f.enemies.length) return;
      e.x = f.enemies[i * 3];
      e.y = f.enemies[i * 3 + 1];
      const alive = f.enemies[i * 3 + 2] > 0;
      if (e.alive && !alive) e.deadT = 0;
      e.alive = alive;
      if (!alive) e.deadT += 1 / 60;
    });
    this.level.coins.forEach((c, i) => (c.taken = f.coins[i] === 1));
    const ghosts: { x: number; y: number; alive: boolean; best: boolean; onGround: boolean; vy: number }[] = [];
    for (let i = 0; i < f.pop; i++) {
      ghosts.push({
        x: f.runners[i * 5],
        y: f.runners[i * 5 + 1],
        alive: f.runners[i * 5 + 2] > 0,
        onGround: f.runners[i * 5 + 3] > 0,
        vy: f.runners[i * 5 + 4],
        best: i === f.leader,
      });
    }
    const lead = ghosts[f.leader];
    const target = (lead ? lead.x : 0) - this.view.w * 0.4;
    this.camX += (target - this.camX) * 0.12;
    drawWorld(ctx, this.view, this.level, null, null, { camX: this.camX, offsetY: 0, time: t, ghosts });
    if (f.champion) {
      const c = f.champion;
      const top = this.view.h - 192;
      ctx.globalAlpha = c.alive ? 0.85 : 0.25;
      ctx.fillStyle = '#3DDCFF';
      ctx.fillRect(Math.round(c.x - this.camX), Math.round(top + c.y), 10, 14);
      ctx.fillStyle = '#100C26';
      ctx.fillRect(Math.round(c.x - this.camX + 5), Math.round(top + c.y + 3), 2, 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#3DDCFF';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('CHAMP', Math.round(c.x - this.camX - 8), Math.round(top + c.y - 4));
    }
  }
}
