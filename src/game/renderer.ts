/**
 * Draws a level world (background, tiles, coins, enemies, runner,
 * particles) at game-pixel resolution onto a 2D context.
 */
import { TILE, WORLD_H, RUNNER_W, RUNNER_H } from './constants.ts';
import { heightAt, type Level } from './level.ts';
import type { Runner } from './physics.ts';
import { getTheme } from './themes.ts';
import {
  sprite, playerSprite, enemySprite, squashedSprite, COIN_GRIDS, FLAG_GRID, SPRING_GRID, PAL, type PlayerFrame,
} from './sprites.ts';
import type { Particles } from './particles.ts';

export interface View {
  w: number;
  h: number;
  /** Game pixels kept free at the bottom (phone level bar / touch pad); the ground sits above it. */
  inset?: number;
}

export interface DrawOptions {
  camX: number;
  /** Screen y offset of the whole world (used by fall/launch transitions). */
  offsetY: number;
  time: number;
  /** Hide the runner (the transition draws it separately). */
  hideRunner?: boolean;
  /** Runner blink (respawn invulnerability). */
  blink?: boolean;
  /** Squash factor for landing (1 = none). */
  squash?: number;
  /** Extra ghost runners (Training Lab). */
  ghosts?: { x: number; y: number; alive: boolean; best: boolean; onGround: boolean; vy: number }[];
  /** Show the conveyor/terrain only, no background (Training Lab uses a flat bg). */
  simpleBg?: boolean;
}

/** Screen Y where world y=0 is, so that the world's bottom sits at the bottom of the view (minus any inset). */
export function worldTop(view: View): number {
  return view.h - WORLD_H - (view.inset ?? 0);
}

export function runnerFrame(r: Pick<Runner, 'onGround' | 'vx' | 'vy' | 'diving'>, time: number): PlayerFrame {
  if (!r.onGround) {
    if (r.diving) return 'dive';
    return 'jump';
  }
  if (Math.abs(r.vx) < 8) return 'idle';
  const f = Math.floor(time * (6 + Math.abs(r.vx) / 20)) % 4;
  return (['run1', 'run2', 'run3', 'run2'] as const)[f];
}

export function drawRunnerSprite(
  ctx: CanvasRenderingContext2D, x: number, y: number, frame: PlayerFrame, face: 1 | -1, opts: { squash?: number; rot?: number; alpha?: number } = {},
): void {
  const img = playerSprite(frame);
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  const cx = Math.round(x + RUNNER_W / 2);
  const by = Math.round(y + RUNNER_H);
  ctx.translate(cx, by);
  if (opts.rot) {
    ctx.translate(0, -8);
    ctx.rotate(opts.rot);
    ctx.translate(0, 8);
  }
  const sq = opts.squash ?? 1;
  ctx.scale(face * (2 - sq), sq);
  ctx.drawImage(img, -6, -15);
  ctx.restore();
}

export function drawWorld(
  ctx: CanvasRenderingContext2D, view: View, level: Level, runner: Runner | null, particles: Particles | null, o: DrawOptions,
): void {
  const theme = getTheme(level.theme);
  const top = worldTop(view) + o.offsetY;
  const camX = Math.round(o.camX);
  const groundBaseY = top + WORLD_H - 2 * TILE;

  ctx.save();
  // Clip to this world's vertical band (from its top of sky to bottom).
  if (!o.simpleBg) {
    ctx.save();
    ctx.translate(0, o.offsetY);
    theme.background(ctx, view.w, view.h, camX, groundBaseY - o.offsetY, o.time);
    ctx.restore();
  } else {
    ctx.fillStyle = '#100C26';
    ctx.fillRect(0, top, view.w, view.h);
  }

  // Tiles.
  const c0 = Math.floor(camX / TILE) - 1;
  const c1 = c0 + Math.ceil(view.w / TILE) + 2;
  const bottom = top + WORLD_H + Math.max(0, view.h - (top + WORLD_H)) + TILE;
  for (let c = c0; c <= c1; c++) {
    const h = heightAt(level, c);
    const x = c * TILE - camX;
    if (h <= 0) {
      drawPit(ctx, theme.pit, x, top, o.time, c);
      continue;
    }
    const sy = top + WORLD_H - h * TILE;
    ctx.drawImage(theme.top, x, sy);
    for (let y = sy + TILE; y < bottom; y += TILE) ctx.drawImage(theme.fill, x, y);
    // Conveyor belt surface.
    if (c >= 0 && c < level.cols && level.belts[c] !== 0) {
      const dir = level.belts[c];
      ctx.fillStyle = PAL.K;
      ctx.fillRect(x, sy, TILE, 4);
      ctx.fillStyle = '#7A74A8';
      const shift = Math.floor(((o.time * 45 * dir) % 8) + 8) % 8;
      for (let k = -8; k < TILE; k += 8) {
        const bx = x + ((k + shift) % 16);
        if (bx >= x && bx < x + TILE - 2) ctx.fillRect(bx, sy + 1, 3, 2);
      }
    }
  }

  // Props (decoration sitting on the ground).
  for (const pr of level.props) {
    const x = pr.col * TILE - camX;
    if (x < -32 || x > view.w + 32) continue;
    const h = heightAt(level, pr.col);
    if (h <= 0) continue;
    const img = theme.prop(pr.kind);
    if (img.width <= 1) continue;
    ctx.drawImage(img, x + 4, top + WORLD_H - h * TILE - img.height);
  }

  // Finish flag.
  const fx = level.finishCol * TILE - camX;
  if (fx > -40 && fx < view.w + 40) {
    const fh = heightAt(level, level.finishCol);
    const gy = top + WORLD_H - fh * TILE;
    ctx.fillStyle = PAL.W;
    ctx.fillRect(fx, gy - 64, 2, 64);
    ctx.fillStyle = PAL.Y;
    ctx.fillRect(fx - 1, gy - 67, 4, 4);
    const wave = Math.floor(o.time * 4) % 2;
    ctx.drawImage(sprite('flag', FLAG_GRID), fx + 1, gy - 62 + wave);
  }

  // Coins.
  const coinFrame = Math.floor(o.time * 8) % 4;
  const coinImg = sprite(`coin${coinFrame}`, COIN_GRIDS[coinFrame]);
  for (const cn of level.coins) {
    if (cn.taken) continue;
    const x = cn.x - camX;
    if (x < -10 || x > view.w + 10) continue;
    ctx.drawImage(coinImg, Math.round(x), Math.round(top + cn.y + Math.sin(o.time * 3 + cn.x) * 1.5));
  }

  // Enemies.
  const ef = Math.floor(o.time * 5) % 2;
  for (const e of level.enemies) {
    const x = Math.round(e.x - camX);
    if (x < -20 || x > view.w + 20) continue;
    if (!e.alive) {
      if (e.deadT < 0.5) {
        ctx.globalAlpha = 1 - e.deadT * 2;
        ctx.drawImage(squashedSprite(level.theme), x, Math.round(top + e.y + e.h - 11));
        ctx.globalAlpha = 1;
      }
      continue;
    }
    const img = enemySprite(level.theme, e.kind, ef);
    ctx.save();
    ctx.translate(x + e.w / 2, Math.round(top + e.y));
    ctx.scale(e.vx < 0 ? -1 : 1, 1);
    ctx.drawImage(img, -6, e.h - img.height);
    ctx.restore();
  }

  // Ghost runners (Training Lab).
  if (o.ghosts) {
    for (const g of o.ghosts) {
      if (g.best) continue;
      const frame = g.onGround ? (['run1', 'run2', 'run3', 'run2'] as const)[Math.floor(o.time * 10 + g.x) % 4] : 'jump';
      drawRunnerSprite(ctx, g.x - camX, top + g.y, frame, 1, { alpha: g.alive ? 0.28 : 0.08 });
    }
    for (const g of o.ghosts) {
      if (!g.best) continue;
      const frame = g.onGround ? (['run1', 'run2', 'run3', 'run2'] as const)[Math.floor(o.time * 10) % 4] : 'jump';
      ctx.fillStyle = PAL.Y;
      ctx.fillRect(Math.round(g.x - camX + 2), Math.round(top + g.y - 12), 6, 2);
      ctx.fillRect(Math.round(g.x - camX + 4), Math.round(top + g.y - 10), 2, 2);
      drawRunnerSprite(ctx, g.x - camX, top + g.y, frame, 1, { alpha: 1 });
    }
  }

  // Runner.
  if (runner && !o.hideRunner && !(o.blink && Math.floor(o.time * 12) % 2 === 0)) {
    const frame = runnerFrame(runner, o.time);
    if (runner.dashT > 0) {
      // Dash afterimages.
      for (let i = 1; i <= 3; i++) {
        drawRunnerSprite(ctx, runner.x - camX - i * 6 * runner.face, top + runner.y, frame, runner.face, { alpha: 0.35 / i });
      }
    }
    drawRunnerSprite(ctx, runner.x - camX, top + runner.y, frame, runner.face, { squash: o.squash });
  }

  if (particles) particles.draw(ctx, camX, top);
  ctx.restore();
}

function drawPit(ctx: CanvasRenderingContext2D, kind: 'void' | 'lava' | 'cloud', x: number, top: number, t: number, c: number) {
  if (kind === 'lava') {
    const ly = top + WORLD_H - 10;
    ctx.fillStyle = '#FF5C2A';
    ctx.fillRect(x, ly, TILE, 400);
    ctx.fillStyle = PAL.O;
    const wave = Math.round(Math.sin(t * 3 + c) * 1.5);
    ctx.fillRect(x, ly + wave, TILE, 3);
    ctx.fillStyle = PAL.Y;
    if ((c + Math.floor(t * 2)) % 3 === 0) ctx.fillRect(x + 6, ly - 2 + wave, 3, 3);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = PAL.O;
    ctx.fillRect(x, ly - 24, TILE, 24);
    ctx.globalAlpha = 1;
  } else if (kind === 'void') {
    ctx.fillStyle = 'rgba(5,3,15,0.85)';
    ctx.fillRect(x, top + WORLD_H - 2 * TILE + 6, TILE, 400);
  }
}

/** A spring drawn under the runner when launching upward. */
export function drawSpring(ctx: CanvasRenderingContext2D, x: number, y: number, compress: number) {
  const img = sprite('spring', SPRING_GRID);
  const h = Math.max(3, Math.round(img.height * (1 - compress * 0.5)));
  ctx.drawImage(img, Math.round(x), Math.round(y - h), img.width, h);
}
