/**
 * The live level runner behind the whole site.
 *
 * A fixed full-viewport canvas renders the current section's level at
 * game-pixel resolution (scaled up with crisp pixels). The champion
 * neural network drives the runner with the same fixed-timestep physics
 * used in training. Scrolling to another section plays a transition:
 * down = the floor opens and the runner falls into the next world;
 * up = a spring launches it back up.
 */
import { TILE, DT, WORLD_H, RUNNER_W, RUNNER_H } from './constants.ts';
import { generateLevel, heightAt, type Level, type ThemeId } from './level.ts';
import { createRunner, stepEnemies, stepRunner, EV, type Action, type Runner } from './physics.ts';
import { sense, N_SENSES } from './senses.ts';
import { mixSeed } from './rng.ts';
import { drawWorld, drawRunnerSprite, drawSpring, worldTop, type View } from './renderer.ts';
import { Particles } from './particles.ts';
import { forward, type Network } from '../ai/network.ts';
import { outputsToAction } from '../ai/policy.ts';
import { sfx } from '../audio/sfx.ts';

export interface SectionInfo {
  theme: ThemeId;
  world: string;
  name: string;
}

export interface GameEvents {
  score?(score: number, coins: number): void;
  lives?(lives: number, hit: boolean): void;
  world?(index: number): void;
  skill?(id: string): void;
  episode?(count: number): void;
  toast?(html: string): void;
  landed?(index: number): void;
}

export interface HumanInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
  dive: boolean;
  dash: boolean;
}

interface WorldState {
  index: number;
  level: Level;
  runner: Runner;
  camX: number;
  time: number;
}

interface Transition {
  dir: 1 | -1;
  t: number;
  dur: number;
  from: WorldState;
  to: WorldState;
  startX: number;
  startY: number;
  landed: boolean;
}

const MAX_LIVES = 3;

export class Game {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  view: View = { w: 320, h: 240 };
  /** CSS pixels per game pixel. */
  scale = 3;
  private cur: WorldState;
  private transition: Transition | null = null;
  private queued: number | null = null;
  private visits: number[];
  private particles: Particles;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private pausedExternally = false;
  private input = new Float32Array(N_SENSES);
  private action: Action = { speed: 0, jump: false, doubleJump: false, dive: false, dash: false };
  private invuln = 0;
  private deadTimer = 0;
  private squashT = 0;
  private stuckT = 0;
  private stuckX = 0;
  private forceJump = 0;
  private respawnPending = false;
  mode: 'ai' | 'human' = 'ai';
  human: HumanInput = { left: false, right: false, jump: false, jumpPressed: false, dive: false, dash: false };
  score = 0;
  coins = 0;
  lives = MAX_LIVES;
  episodes = 0;
  readonly reduced: boolean;
  readonly mobile: boolean;
  /** Called every rendered frame (brain views hook in here). */
  onFrame: ((now: number, dt: number) => void) | null = null;

  private sections: SectionInfo[];
  net: Network;
  private events: GameEvents;

  constructor(
    canvas: HTMLCanvasElement,
    sections: SectionInfo[],
    net: Network,
    events: GameEvents = {},
    opts: { reduced?: boolean; mobile?: boolean } = {},
  ) {
    this.sections = sections;
    this.net = net;
    this.events = events;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.reduced = !!opts.reduced;
    this.mobile = !!opts.mobile;
    this.particles = new Particles(this.mobile ? 80 : 260);
    this.visits = sections.map(() => 0);
    this.resize();
    this.cur = this.makeWorld(0);
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else if (!this.pausedExternally) this.start();
    });
  }

  get index(): number {
    return this.transition ? this.transition.to.index : this.cur.index;
  }

  get runner(): Runner {
    return this.cur.runner;
  }

  /** Activations of the driving network (for the brain visual). */
  get acts(): Float32Array[] {
    return this.net.acts;
  }

  private anchor(index: number): number {
    if (this.mobile) return 0.3;
    return index === 0 ? 0.7 : 0.4;
  }

  private makeWorld(index: number): WorldState {
    const s = this.sections[index];
    const seed = mixSeed(index + 1, 7919 * this.visits[index]++);
    const level = generateLevel(seed, s.theme, this.mobile ? 180 : 240);
    const runner = createRunner(6 * TILE, level);
    return { index, level, runner, camX: runner.x - this.view.w * this.anchor(index), time: 0 };
  }

  resize(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = this.mobile || vw < 700 ? 2 : Math.max(2, Math.min(4, Math.round(vh / 300)));
    this.scale = s;
    const w = Math.ceil(vw / s);
    const h = Math.ceil(vh / s);
    this.view = { w, h };
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = `${w * s}px`;
    this.canvas.style.height = `${h * s}px`;
    this.ctx.imageSmoothingEnabled = false;
    document.documentElement.style.setProperty('--ground-px', `${2 * TILE * s}px`);
    if (!this.running) this.render(performance.now(), 0);
  }

  start(): void {
    if (this.running || this.pausedExternally) return;
    this.running = true;
    this.last = performance.now();
    if (this.reduced) {
      this.running = false;
      this.render(this.last, 0);
      return;
    }
    const loop = (now: number) => {
      if (!this.running) return;
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Pause for overlays (Training Lab) that need the CPU. */
  pause(p: boolean): void {
    this.pausedExternally = p;
    if (p) this.stop();
    else this.start();
  }

  setMode(mode: 'ai' | 'human'): void {
    this.mode = mode;
    this.human = { left: false, right: false, jump: false, jumpPressed: false, dive: false, dash: false };
  }

  /** Make the runner hop (world map click). */
  hop(): void {
    this.forceJump = 2;
  }

  /** Go to a section's level with a transition. */
  goTo(index: number): void {
    if (index < 0 || index >= this.sections.length) return;
    if (this.transition) {
      this.queued = index === this.transition.to.index ? null : index;
      return;
    }
    if (index === this.cur.index) return;
    this.events.world?.(index);
    if (this.reduced) {
      this.cur = this.makeWorld(index);
      this.particles.clear();
      this.render(performance.now(), 0);
      this.events.landed?.(index);
      return;
    }
    const dir: 1 | -1 = index > this.cur.index ? 1 : -1;
    const from = this.cur;
    const to = this.makeWorld(index);
    const r = from.runner;
    const top = worldTop(this.view);
    if (dir > 0) {
      // Open the floor under the runner.
      const c = Math.floor((r.x + RUNNER_W / 2) / TILE);
      for (let k = c - 1; k <= c + 1; k++) if (k >= 0 && k < from.level.cols) from.level.heights[k] = 0;
      sfx.fall();
    } else {
      sfx.spring();
    }
    this.transition = {
      dir,
      t: 0,
      dur: 1.15,
      from,
      to,
      startX: r.x - from.camX,
      startY: top + r.y,
      landed: false,
    };
    this.particles.clear();
  }

  private frame(now: number): void {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (this.transition) {
      this.updateTransition(dt);
    } else {
      this.acc += dt;
      let n = 0;
      while (this.acc >= DT && n < 6) {
        this.step();
        this.acc -= DT;
        n++;
      }
      if (n === 6) this.acc = 0;
      this.updateCamera(dt);
    }
    this.particles.update(dt);
    if (this.squashT > 0) this.squashT -= dt;
    this.render(now, dt);
    this.onFrame?.(now, dt);
  }

  private updateCamera(dt: number): void {
    const w = this.cur;
    const target = w.runner.x - this.view.w * this.anchor(w.index);
    w.camX += (target - w.camX) * Math.min(1, dt * 5);
  }

  private step(): void {
    const w = this.cur;
    const r = w.runner;
    w.time += DT;
    stepEnemies(w.level, w.time);

    if (this.invuln > 0) this.invuln -= DT;
    if (r.dead) {
      this.deadTimer -= DT;
      if (this.deadTimer <= 0 && this.respawnPending) this.respawn();
      return;
    }
    if (r.finished) {
      this.deadTimer -= DT;
      if (this.deadTimer <= 0) this.nextLevel();
      return;
    }

    // Senses → network → action. The network always runs so the brain
    // visual shows live activations, even in YOU PLAY mode.
    sense(r, w.level, this.input);
    const out = forward(this.net, this.input);
    const a = this.action;
    if (this.mode === 'human') {
      const h = this.human;
      a.speed = (h.right ? 1 : 0) - (h.left ? 1 : 0);
      a.jump = h.jumpPressed;
      a.doubleJump = h.jumpPressed;
      a.dive = h.dive;
      a.dash = h.dash;
      h.jumpPressed = false;
      h.dash = false;
    } else {
      outputsToAction(out, a);
      if (this.forceJump > 0) {
        a.jump = true;
        this.forceJump--;
      }
    }
    const ev = stepRunner(r, w.level, a, this.invuln > 0);
    this.handleEvents(ev, r);

    // Stuck detection (AI only): warp forward instead of freezing.
    if (this.mode === 'ai') {
      if (r.x > this.stuckX + TILE) {
        this.stuckX = r.x;
        this.stuckT = 0;
      } else if ((this.stuckT += DT) > 4) {
        this.warpForward();
      }
    }
  }

  private handleEvents(ev: number, r: Runner): void {
    if (!ev) return;
    const cx = r.x + RUNNER_W / 2;
    const feet = r.y + RUNNER_H;
    const fx = !this.mobile;
    if (ev & EV.JUMP) sfx.jump();
    if (ev & EV.DOUBLE_JUMP) {
      sfx.doubleJump();
      this.particles.burst(cx, feet, fx ? 10 : 4, '#F5F2FF', 50, { gravity: 40 });
      this.events.skill?.('double');
    }
    if (ev & EV.DIVE) this.events.skill?.('dive');
    if (ev & EV.DASH) {
      sfx.dash();
      this.events.skill?.('dash');
    }
    if (ev & EV.LAND) {
      this.squashT = 0.14;
      if (fx) this.particles.dust(cx, feet, 6);
    }
    if (ev & EV.GAP_CLEARED) this.events.skill?.('gap');
    if (ev & EV.WALL_CLIMB) this.events.skill?.('wall');
    if (ev & EV.COIN) {
      this.coins++;
      this.score += 100;
      sfx.coin();
      this.particles.burst(cx, r.y, fx ? 8 : 3, '#FFD447', 70);
      this.events.skill?.('coin');
      this.events.score?.(this.score, this.coins);
    }
    if (ev & (EV.STOMP | EV.SMASH)) {
      this.score += 200;
      sfx.stomp();
      this.particles.burst(cx, feet, fx ? 12 : 5, '#FF5C8A', 90, { gravity: 120 });
      this.events.skill?.(ev & EV.SMASH ? 'dash' : 'stomp');
      this.events.score?.(this.score, this.coins);
    }
    if (ev & EV.DIE) {
      sfx.die();
      this.particles.burst(cx, Math.min(r.y, WORLD_H - 8), fx ? 24 : 8, '#FF5C8A', 120, { gravity: 200 });
      this.lives--;
      this.episodes++;
      this.events.episode?.(this.episodes);
      if (this.lives <= 0) {
        this.lives = MAX_LIVES;
        this.events.toast?.('GAME OVER? <b>NAH.</b> CONTINUE!');
      }
      this.events.lives?.(this.lives, true);
      this.deadTimer = 0.9;
      this.respawnPending = true;
    }
    if (ev & EV.FINISH) {
      this.score += 1000;
      this.episodes++;
      sfx.levelUp();
      this.particles.burst(cx, r.y, fx ? 30 : 10, '#FFD447', 140, { gravity: 80 });
      this.events.episode?.(this.episodes);
      this.events.score?.(this.score, this.coins);
      this.events.toast?.(`<b>LEVEL CLEAR!</b> +1000`);
      this.deadTimer = 1.2;
    }
  }

  /** Find a safe standing column at or before `col`. */
  private safeCol(level: Level, col: number, dir: 1 | -1 = -1): number {
    for (let c = col, n = 0; c >= 2 && c < level.cols - 3 && n < 60; c += dir, n++) {
      const h = heightAt(level, c);
      if (h > 0 && heightAt(level, c + 1) === h && heightAt(level, c + 2) === h && heightAt(level, c - 1) === h) {
        const x = c * TILE;
        const enemyNear = level.enemies.some((e) => e.alive && Math.abs(e.x - x) < 3 * TILE);
        if (!enemyNear) return c;
      }
    }
    return Math.max(3, Math.min(col, level.cols - 10));
  }

  private respawn(): void {
    const w = this.cur;
    const dead = w.runner;
    const col = this.safeCol(w.level, Math.floor(dead.x / TILE) - 2);
    const r = createRunner(col * TILE, w.level);
    r.maxX = dead.maxX;
    w.runner = r;
    this.invuln = 1.6;
    this.respawnPending = false;
    this.stuckX = r.x;
    this.stuckT = 0;
    this.particles.burst(r.x + 5, r.y + 7, this.mobile ? 6 : 16, '#3DDCFF', 60);
  }

  private warpForward(): void {
    const w = this.cur;
    const r = w.runner;
    const col = this.safeCol(w.level, Math.floor(r.x / TILE) + 4, 1);
    this.particles.burst(r.x + 5, r.y + 7, 12, '#3DDCFF', 60);
    const nr = createRunner(col * TILE, w.level);
    nr.maxX = Math.max(r.maxX, nr.x);
    nr.coins = r.coins;
    w.runner = nr;
    this.stuckX = nr.x;
    this.stuckT = 0;
    this.invuln = 1;
  }

  private nextLevel(): void {
    const idx = this.cur.index;
    this.cur = this.makeWorld(idx);
    this.stuckX = this.cur.runner.x;
    this.stuckT = 0;
    this.particles.clear();
  }

  private updateTransition(dt: number): void {
    const tr = this.transition!;
    tr.t += dt;
    tr.to.time += dt;
    stepEnemies(tr.to.level, tr.to.time);
    const p = tr.t / tr.dur;
    if (p >= 0.86 && !tr.landed) {
      tr.landed = true;
      sfx.land();
      this.squashT = 0.2;
      const r = tr.to.runner;
      this.particles.dust(r.x + RUNNER_W / 2, r.y + RUNNER_H, this.mobile ? 6 : 14);
      this.events.landed?.(tr.to.index);
    }
    if (p >= 1) {
      this.cur = tr.to;
      this.transition = null;
      this.stuckX = this.cur.runner.x;
      this.stuckT = 0;
      this.invuln = 0.5;
      if (this.queued !== null) {
        const q = this.queued;
        this.queued = null;
        this.goTo(q);
      }
    }
  }

  private render(now: number, dt: number): void {
    void dt;
    const ctx = this.ctx;
    const { view } = this;
    const t = now / 1000;
    ctx.imageSmoothingEnabled = false;
    if (this.transition) {
      this.renderTransition(ctx, t);
      return;
    }
    const w = this.cur;
    const hide = w.runner.dead;
    drawWorld(ctx, view, w.level, w.runner, this.particles, {
      camX: w.camX,
      offsetY: 0,
      time: t,
      hideRunner: hide,
      blink: this.invuln > 0,
      squash: this.squashT > 0 ? 0.8 : 1,
    });
  }

  private renderTransition(ctx: CanvasRenderingContext2D, t: number): void {
    const tr = this.transition!;
    const { view } = this;
    const H = view.h;
    const p = Math.min(1, tr.t / tr.dur);
    const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const mid = ease((p - 0.15) / 0.7);
    const shift = mid * H;
    const top = worldTop(view);
    const toR = tr.to.runner;
    const landX = toR.x - tr.to.camX;
    const landY = top + toR.y;

    if (tr.dir > 0) {
      drawWorld(ctx, view, tr.from.level, null, null, { camX: tr.from.camX, offsetY: -shift, time: t, hideRunner: true });
      if (shift > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, H - shift, view.w, shift);
        ctx.clip();
        drawWorld(ctx, view, tr.to.level, null, this.particles, { camX: tr.to.camX, offsetY: H - shift, time: t, hideRunner: true });
        ctx.restore();
        // Rock band between the worlds.
        ctx.fillStyle = '#0A0719';
        ctx.fillRect(0, H - shift - 6, view.w, 6);
      }
    } else {
      drawWorld(ctx, view, tr.from.level, null, null, { camX: tr.from.camX, offsetY: shift, time: t, hideRunner: true });
      if (shift > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, view.w, shift);
        ctx.clip();
        drawWorld(ctx, view, tr.to.level, null, this.particles, { camX: tr.to.camX, offsetY: shift - H, time: t, hideRunner: true });
        ctx.restore();
        ctx.fillStyle = '#0A0719';
        ctx.fillRect(0, shift, view.w, 6);
      }
    }

    // Runner path in screen space.
    let x: number;
    let y: number;
    let rot = 0;
    if (p < 0.15) {
      const q = p / 0.15;
      x = tr.startX;
      if (tr.dir > 0) {
        y = tr.startY + q * q * 40;
      } else {
        drawSpring(ctx, tr.startX - 0, tr.startY + RUNNER_H + 1, Math.sin(q * Math.PI));
        y = tr.startY - q * 10;
      }
    } else if (p < 0.86) {
      const q = (p - 0.15) / 0.71;
      x = tr.startX + (landX - tr.startX) * ease(q);
      const midY = H * 0.45;
      if (q < 0.5) y = (tr.dir > 0 ? tr.startY + 40 : tr.startY - 10) + (midY - (tr.dir > 0 ? tr.startY + 40 : tr.startY - 10)) * ease(q * 2);
      else y = midY + (landY - midY) * ease((q - 0.5) * 2);
      rot = tr.dir * q * Math.PI * 4;
      // Motion lines.
      ctx.fillStyle = 'rgba(245,242,255,0.55)';
      const n = this.mobile ? 6 : 14;
      for (let i = 0; i < n; i++) {
        const lx = (i * 53 + Math.floor(t * 90) * 7) % view.w;
        const ly = ((i * 97 + (tr.dir > 0 ? -1 : 1) * t * 900) % H + H) % H;
        ctx.fillRect(lx, ly, 1, 14 + (i % 3) * 6);
      }
    } else {
      x = landX;
      y = landY;
    }
    const frame = p < 0.86 ? 'jump' : 'idle';
    drawRunnerSprite(ctx, x, y, frame, 1, { rot, squash: p >= 0.86 && this.squashT > 0 ? 0.75 : 1 });
  }

  /** Static screenshot of the current scene (used under reduced motion). */
  renderNow(): void {
    this.render(performance.now(), 0);
  }
}
