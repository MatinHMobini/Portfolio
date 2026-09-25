/**
 * Wires the brain visual into the page: the large view in the 1-5
 * NEURAL NET section, the floating BRAIN widget, the full brain panel,
 * ML readouts, the fitness chart and the skill list.
 */
import { BrainView, drawChart } from './brain-visual.ts';
import { SKILLS, type BrainState } from './brain-state.ts';
import { paramCount, type Network } from './network.ts';
import type { Game } from '../game/game.ts';
import { toast } from '../ui/toasts.ts';
import { sfx } from '../audio/sfx.ts';

export interface ChampionMeta {
  generations: number;
  params: number;
  finalFitness: number;
  episodesTrained: number;
  holdout: { levels: number; finished: number; avgProgress: number };
}

export class BrainUI {
  private views: { view: BrainView; el: HTMLCanvasElement; visible: boolean }[] = [];
  private panel: HTMLDialogElement | null = null;
  private panelView: BrainView | null = null;
  private widgetCtx: CanvasRenderingContext2D | null;
  private widget = document.getElementById('brain-widget') as HTMLButtonElement;
  private human = false;
  onOpenLab: (() => void) | null = null;

  private game: Game;
  private state: BrainState;
  private net: Network;
  private meta: ChampionMeta;
  private history: { gen: number; best: number; mean: number }[];

  constructor(game: Game, state: BrainState, net: Network, meta: ChampionMeta, history: { gen: number; best: number; mean: number }[]) {
    this.game = game;
    this.state = state;
    this.net = net;
    this.meta = meta;
    this.history = history;
    this.widgetCtx = this.widget.querySelector('canvas')!.getContext('2d');
    const secCanvas = document.querySelector<HTMLCanvasElement>('[data-brain-canvas="section"]');
    if (secCanvas) {
      const view = new BrainView(secCanvas, state, net, { fontSize: 10 });
      const entry = { view, el: secCanvas, visible: false };
      this.views.push(entry);
      new IntersectionObserver(([e]) => {
        entry.visible = e.isIntersecting;
        if (e.isIntersecting) view.resize();
      }).observe(secCanvas);
    }
    window.addEventListener('resize', () => this.views.forEach((v) => v.view.resize()));

    this.fillReadouts(document);
    this.renderSkillList();
    this.drawCharts(document);
    state.onChange((skill) => {
      this.renderSkillList();
      this.setText('[data-brain="skills"]', `${state.learned.size}/${SKILLS.length}`);
      if (skill && skill.id !== 'run') {
        sfx.learn();
        toast(`NEW SKILL LEARNED: <b>${skill.label}</b>`);
        this.widget.classList.remove('is-learning');
        void this.widget.offsetWidth;
        this.widget.classList.add('is-learning');
      }
    });

    this.widget.addEventListener('click', () => this.openPanel());
    document.querySelectorAll<HTMLElement>('[data-open-lab]').forEach((b) => b.addEventListener('click', () => this.onOpenLab?.()));
    new ResizeObserver(() => this.drawCharts(document)).observe(document.querySelector('[data-brain-chart]') ?? document.body);
  }

  setHuman(on: boolean): void {
    this.human = on;
    this.views.forEach((v) => (v.view.human = on));
    if (this.panelView) this.panelView.human = on;
    document.querySelectorAll('[data-brain="mode"]').forEach((el) => {
      el.textContent = on ? 'HUMAN PLAYER' : 'AI DRIVING';
      el.classList.toggle('is-human', on);
    });
  }

  private setText(sel: string, text: string, root: ParentNode = document) {
    root.querySelectorAll(sel).forEach((el) => (el.textContent = text));
  }

  private fillReadouts(root: ParentNode) {
    this.setText('[data-brain="gen"]', String(this.meta.generations), root);
    this.setText('[data-brain="fit"]', this.meta.finalFitness.toFixed(0), root);
    this.setText('[data-brain="params"]', String(paramCount(this.net.layers)), root);
    this.setText('[data-brain="episodes"]', String(this.game.episodes), root);
    this.setText('[data-brain="skills"]', `${this.state.learned.size}/${SKILLS.length}`, root);
  }

  setEpisodes(n: number): void {
    this.setText('[data-brain="episodes"]', String(n));
  }

  private drawCharts(root: ParentNode) {
    root.querySelectorAll<HTMLCanvasElement>('[data-brain-chart]').forEach((c) =>
      drawChart(c, [
        { values: this.history.map((h) => h.mean), color: '#FF5C8A' },
        { values: this.history.map((h) => h.best), color: '#FFD447' },
      ]),
    );
  }

  private renderSkillList() {
    document.querySelectorAll<HTMLElement>('[data-brain="skill-list"]').forEach((ul) => {
      ul.innerHTML = SKILLS.map((s) => {
        const on = this.state.learned.has(s.id);
        return `<li class="${on ? 'is-learned' : ''}">${on ? '★ ' : '? '}${on ? s.label : '???'}<span class="sr-only">${on ? ' learned' : ' not seen yet'}</span></li>`;
      }).join('');
    });
  }

  openPanel(): void {
    sfx.select();
    if (!this.panel) {
      const d = document.createElement('dialog');
      d.className = 'modal';
      d.setAttribute('aria-labelledby', 'bp-title');
      d.innerHTML = `
        <div class="modal__head"><h2 class="modal__title" id="bp-title">BRAIN · <span data-brain="mode">AI DRIVING</span></h2><button class="modal__close" type="button" aria-label="Close brain panel">✕</button></div>
        <div class="modal__body">
          <div class="bp">
            <canvas class="bp__canvas" role="img" aria-label="Live neural network diagram"></canvas>
            <div class="bp__side">
              <div class="readouts"><dl>
                <dt>GENERATION</dt><dd data-brain="gen"></dd>
                <dt>FITNESS</dt><dd data-brain="fit"></dd>
                <dt>PARAMS</dt><dd data-brain="params"></dd>
                <dt>EPISODES</dt><dd data-brain="episodes"></dd>
                <dt>SKILLS</dt><dd data-brain="skills"></dd>
              </dl>
              <canvas class="chart" data-brain-chart role="img" aria-label="Training fitness chart"></canvas>
              <p class="chart__key"><span class="key key--y"></span>BEST <span class="key key--p"></span>AVERAGE</p></div>
              <button class="btn btn--primary btn--sm" type="button" data-open-lab>TRAIN IT YOURSELF</button>
              <a class="btn btn--ghost btn--sm" href="#brain" data-close-go>HOW IT WORKS</a>
            </div>
          </div>
          <ul class="skill-list" data-brain="skill-list" style="margin-top:20px;grid-template-columns:repeat(4,1fr)"></ul>
          <p class="bp__how">This is the real network steering the runner right now: ${this.meta.params} weights, evolved for ${this.meta.generations} generations. It finished ${this.meta.holdout.finished} of ${this.meta.holdout.levels} levels it had never seen during training. New pathways appear the first time you see the runner use a skill.</p>
        </div>`;
      document.body.appendChild(d);
      d.querySelector('.modal__close')!.addEventListener('click', () => d.close());
      d.querySelector('[data-open-lab]')!.addEventListener('click', () => {
        d.close();
        this.onOpenLab?.();
      });
      d.querySelector('[data-close-go]')!.addEventListener('click', () => {
        d.close();
        document.querySelector<HTMLDetailsElement>('#brain details')?.setAttribute('open', '');
      });
      d.addEventListener('click', (e) => {
        if (e.target === d) d.close();
      });
      this.panel = d;
      this.panelView = new BrainView(d.querySelector('.bp__canvas')!, this.state, this.net, { fontSize: 9 });
      this.panelView.human = this.human;
    }
    this.panel.showModal();
    this.panelView!.resize();
    this.fillReadouts(this.panel);
    this.setText('[data-brain="episodes"]', String(this.game.episodes), this.panel);
    this.renderSkillList();
    this.setHuman(this.human);
    this.drawCharts(this.panel);
  }

  /** Called every game frame. */
  frame(now: number, dt: number): void {
    const acts = this.game.acts;
    for (const v of this.views) {
      if (!v.visible) continue;
      v.view.setActivations(acts);
      v.view.draw(now, dt);
    }
    if (this.panel?.open && this.panelView) {
      this.panelView.setActivations(acts);
      this.panelView.draw(now, dt);
    }
    this.drawWidget(now, acts);
  }

  private lastWidget = 0;
  private drawWidget(now: number, acts: Float32Array[]) {
    if (!this.widgetCtx || now - this.lastWidget < 90) return;
    this.lastWidget = now;
    const c = this.widgetCtx;
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, 32, 32);
    // Pixel brain: 4 x 4 grid of neurons lit by hidden-layer activity.
    const h = acts[1] ?? new Float32Array(16);
    c.fillStyle = '#2A2266';
    c.fillRect(2, 4, 28, 24);
    for (let i = 0; i < 16; i++) {
      const a = h[i % h.length] ?? 0;
      const x = 4 + (i % 4) * 7;
      const y = 6 + Math.floor(i / 4) * 5;
      c.fillStyle = a >= 0 ? '#FFD447' : '#FF5C8A';
      c.globalAlpha = 0.25 + Math.min(0.75, Math.abs(a));
      c.fillRect(x, y, 4, 3);
    }
    c.globalAlpha = 1;
    const pulse = (Math.sin(now / 250) + 1) / 2;
    c.fillStyle = `rgba(255,92,138,${0.3 + pulse * 0.5})`;
    c.fillRect(0, 2, 2, 28);
    c.fillRect(30, 2, 2, 28);
  }
}
