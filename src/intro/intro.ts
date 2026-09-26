/**
 * World 0: the intro.
 *
 * A dark pixel bedroom → "PRESS ANY KEY TO SPAWN" → the character beams
 * in, walks to the desk, sits and types → the camera pushes into the CRT
 * → a terminal runs ./<name>_portfolio.exe → boot log + progress bar →
 * glitch, flash, and the real site boots.
 *
 * Plays in full on every page load. Skip button + Esc always work.
 * Reduced motion skips it. `short: true` gives a ~1.5 s terminal-only
 * version (not used by default).
 */
import { drawRunnerSprite } from '../game/renderer.ts';
import { sprite, MOON_GRID, PAL, type PlayerFrame } from '../game/sprites.ts';
import { sfx } from '../audio/sfx.ts';

const SW = 320;
const SH = 180;
const FLOOR = 146;
const CHAIR_X = 206;
const SPAWN_X = 86;
const SCREEN = { x: 231, y: 84, w: 30, h: 22 };
interface Options {
  firstName: string;
  touch: boolean;
  /** Champion generation count, shown in the boot log. */
  generations: number;
  /** Skip the bedroom and go straight to the quick terminal boot. */
  short?: boolean;
}

const bootLines = (gens: number) => [
  'LOADING SPRITES........ OK',
  'COMPILING SHADERS...... OK',
  'MOUNTING /PROJECTS..... OK',
  'SPAWNING ENEMIES....... OK',
  `TRAINING NEURAL NET.... GEN ${gens} OK`,
  'INSERTING COIN......... OK',
  'STARTING WORLD 1-1',
];

function drawRoom(ctx: CanvasRenderingContext2D, t: number, monitorOn: number, showCode = true) {
  const r = (c: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  // Wall + floor.
  r('#140F33', 0, 0, SW, FLOOR);
  for (let y = 8; y < FLOOR; y += 24) r('#17123A', 0, y, SW, 1);
  r('#221A55', 0, FLOOR - 4, SW, 4);
  r('#1E1848', 0, FLOOR, SW, SH - FLOOR);
  for (let x = 0; x < SW; x += 32) r('#18133E', x, FLOOR, 1, SH - FLOOR);
  for (let y = FLOOR + 10; y < SH; y += 10) r('#18133E', 0, y, SW, 1);
  // Rug.
  r('#3B1F4A', 70, FLOOR + 14, 110, 10);
  r('#FF5C8A', 72, FLOOR + 16, 106, 1);
  r('#FF5C8A', 72, FLOOR + 21, 106, 1);

  // Window with the night sky.
  r('#5B4FC4', 26, 30, 58, 50);
  r('#0A0719', 30, 34, 50, 42);
  ctx.drawImage(sprite('moon', MOON_GRID), 60, 38, 12, 12);
  for (let i = 0; i < 7; i++) {
    const a = (Math.sin(t * 2 + i * 2.1) + 1) / 2;
    ctx.globalAlpha = 0.3 + a * 0.7;
    r(PAL.W, 33 + ((i * 17) % 44), 38 + ((i * 11) % 34), 1, 1);
  }
  ctx.globalAlpha = 1;
  r('#5B4FC4', 54, 34, 2, 42);
  r('#5B4FC4', 30, 54, 50, 2);
  r('#3B3380', 22, 80, 66, 4);

  // Poster.
  r('#2A2266', 108, 30, 34, 44);
  r('#FF5C8A', 110, 32, 30, 40);
  r('#FFD447', 114, 38, 22, 6);
  r('#100C26', 118, 50, 4, 4);
  r('#100C26', 128, 50, 4, 4);
  r('#100C26', 116, 60, 18, 3);
  r('#F5F2FF', 112, 66, 26, 2);

  // Shelf with cartridges.
  r('#5C3A1E', 150, 60, 40, 3);
  ['#FFD447', '#FF5C8A', '#3DDCFF', '#7CFF6B', '#FFD447'].forEach((c, i) => r(c, 153 + i * 7, 50, 5, 10));

  // Bed (left).
  r('#3B3380', 0, 120, 60, 26);
  r('#5B4FC4', 0, 116, 60, 8);
  r('#F5F2FF', 4, 110, 18, 8);
  r('#2A2266', 0, 140, 60, 6);

  // Desk.
  r('#8B5A2B', 196, 112, 108, 5);
  r('#5C3A1E', 196, 117, 108, 2);
  r('#5C3A1E', 200, 119, 4, FLOOR - 119);
  r('#5C3A1E', 296, 119, 4, FLOOR - 119);
  r('#6B4424', 262, 119, 32, 18);
  r('#8B5A2B', 276, 126, 4, 2);
  // Lamp.
  r('#3B3380', 286, 96, 3, 16);
  r('#5B4FC4', 280, 90, 14, 7);
  // CRT monitor.
  r('#7A74A8', 224, 76, 44, 36);
  r('#4A4470', 224, 108, 44, 4);
  r('#100C26', SCREEN.x - 1, SCREEN.y - 1, SCREEN.w + 2, SCREEN.h + 2);
  const glow = monitorOn;
  r(glow > 0 ? '#0B2A22' : '#07051A', SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
  if (glow > 0) {
    ctx.globalAlpha = glow;
    r('#12382C', SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    if (showCode) for (let i = 0; i < 4; i++) r('#7CFF6B', SCREEN.x + 2, SCREEN.y + 3 + i * 4, 6 + ((i * 7 + Math.floor(t * 6)) % 18), 1);
    if (showCode && Math.floor(t * 2) % 2) r('#7CFF6B', SCREEN.x + 2, SCREEN.y + 18, 3, 2);
    // Light spill on the wall and desk.
    ctx.globalAlpha = 0.12 * glow;
    r('#7CFF6B', 206, 60, 80, 56);
    ctx.globalAlpha = 1;
  }
  r('#3B3380', 240, 112, 12, 2);
  // Keyboard.
  r('#B3ADD6', 226, 109, 30, 3);
  // Chair back (drawn behind the sitter).
  r('#3B3380', CHAIR_X - 8, 100, 5, 30);
}

function drawChairFront(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#5B4FC4';
  ctx.fillRect(CHAIR_X - 8, 128, 26, 4);
  ctx.fillStyle = '#3B3380';
  ctx.fillRect(CHAIR_X + 3, 132, 3, FLOOR - 134);
  ctx.fillRect(CHAIR_X - 4, FLOOR - 2, 18, 2);
}

export function runIntro(opts: Options): Promise<void> {
  return new Promise((resolve) => {
    const short = !!opts.short;
    const root = document.createElement('div');
    root.className = 'intro';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Intro animation');
    root.innerHTML = `
      <canvas class="intro__canvas" aria-hidden="true"></canvas>
      <div class="intro__prompt" aria-live="polite"><span class="blink">${opts.touch ? 'TAP TO SPAWN' : 'PRESS ANY KEY TO SPAWN'}</span></div>
      <div class="intro__term" aria-hidden="true"><pre class="intro__out"></pre><div class="intro__bar"><i></i></div></div>
      <div class="intro__flash" aria-hidden="true"></div>
      <button class="intro__skip" type="button">SKIP ▶▶</button>`;
    document.body.appendChild(root);
    document.documentElement.classList.add('intro-on');
    document.documentElement.classList.remove('intro-pending');

    const canvas = root.querySelector('canvas')!;
    const ctx = canvas.getContext('2d')!;
    const scene = document.createElement('canvas');
    scene.width = SW;
    scene.height = SH;
    const sctx = scene.getContext('2d')!;
    const prompt = root.querySelector<HTMLElement>('.intro__prompt')!;
    const term = root.querySelector<HTMLElement>('.intro__term')!;
    const out = root.querySelector<HTMLElement>('.intro__out')!;
    const bar = root.querySelector<HTMLElement>('.intro__bar i')!;
    const flash = root.querySelector<HTMLElement>('.intro__flash')!;
    const skipBtn = root.querySelector<HTMLButtonElement>('.intro__skip')!;
    skipBtn.focus({ preventScroll: true });

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    type Phase = 'wait' | 'spawn' | 'walk' | 'sit' | 'type' | 'zoom' | 'boot' | 'glitch' | 'done';
    let phase: Phase = 'wait';
    let phaseT = 0;
    let last = performance.now();
    let raf = 0;
    let finished = false;
    const particles: { x: number; y: number; vy: number; life: number }[] = [];
    const cmd = `> ./${opts.firstName.toLowerCase()}_portfolio.exe`;
    let typed = 0;
    let bootIdx = 0;
    const BOOT_LINES = bootLines(opts.generations);
    let zoom = short ? 1 : 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey, true);
      root.classList.add('is-out');
      document.documentElement.classList.remove('intro-on');
      document.documentElement.classList.add('booting');
      window.setTimeout(() => document.documentElement.classList.remove('booting'), 900);
      window.setTimeout(() => root.remove(), 450);
      resolve();
    };

    const setPhase = (p: Phase) => {
      phase = p;
      phaseT = 0;
      if (p === 'spawn') {
        prompt.remove();
        sfx.spawn();
      }
      if (p === 'boot') {
        term.classList.add('is-on');
        if (short) {
          out.textContent = `${cmd}\n`;
          typed = cmd.length;
        }
      }
      if (p === 'glitch') {
        sfx.glitch();
        root.classList.add('is-glitch');
        flash.classList.add('is-on');
      }
    };

    const spawn = () => {
      if (phase === 'wait') setPhase('spawn');
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
        return;
      }
      if (phase === 'wait' && e.key !== 'Tab') {
        e.preventDefault();
        spawn();
      }
    };
    window.addEventListener('keydown', onKey, true);
    root.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.intro__skip')) return;
      spawn();
    });
    skipBtn.addEventListener('click', finish);

    if (short) {
      prompt.remove();
      setPhase('boot');
    }

    const walkDur = 1.3;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      phaseT += dt;
      const t = now / 1000;

      // ── Scene ──
      let px = SPAWN_X;
      let pf: PlayerFrame = 'idle';
      let visible = true;
      let alpha = 1;
      let monitor = 0;
      switch (phase) {
        case 'wait':
          visible = false;
          break;
        case 'spawn': {
          const q = phaseT / 0.9;
          alpha = q < 0.4 ? 0 : Math.min(1, (q - 0.4) / 0.5) * (Math.floor(t * 30) % 2 ? 1 : 0.5);
          if (Math.random() < 0.8) particles.push({ x: SPAWN_X + Math.random() * 14 - 2, y: FLOOR - Math.random() * 30, vy: -20 - Math.random() * 40, life: 0.6 });
          if (phaseT > 0.9) setPhase('walk');
          break;
        }
        case 'walk': {
          const q = Math.min(1, phaseT / walkDur);
          px = SPAWN_X + (CHAIR_X - SPAWN_X) * q;
          pf = (['run1', 'run2', 'run3', 'run2'] as const)[Math.floor(phaseT * 8) % 4];
          if (q >= 1) setPhase('sit');
          break;
        }
        case 'sit':
          px = CHAIR_X;
          pf = 'sit';
          monitor = Math.min(1, phaseT / 0.3);
          if (phaseT > 0.35) setPhase('type');
          break;
        case 'type':
          px = CHAIR_X;
          pf = Math.floor(phaseT * 10) % 2 ? 'typeA' : 'typeB';
          monitor = 1;
          if (Math.floor(phaseT * 10) !== Math.floor((phaseT - dt) * 10)) sfx.blip();
          if (phaseT > 0.5) setPhase('zoom');
          break;
        case 'zoom':
          px = CHAIR_X;
          pf = Math.floor(phaseT * 10) % 2 ? 'typeA' : 'typeB';
          monitor = 1;
          zoom = Math.min(1, phaseT / 0.9);
          if (zoom >= 0.75) term.classList.add('is-on');
          if (zoom >= 1) setPhase('boot');
          break;
        case 'boot': {
          monitor = 1;
          zoom = 1;
          pf = 'typeA';
          px = CHAIR_X;
          // Type the command, then scroll the boot log.
          const cps = short ? 200 : 26;
          if (typed < cmd.length) {
            const n = Math.min(cmd.length, Math.floor(phaseT * cps));
            if (n > typed) {
              typed = n;
              sfx.blip();
              out.textContent = `${cmd.slice(0, typed)}█`;
            }
          } else {
            const tAfter = phaseT - cmd.length / cps;
            const perLine = short ? 0.12 : 0.28;
            const lines = Math.min(BOOT_LINES.length, Math.floor(tAfter / perLine));
            if (lines > bootIdx) {
              bootIdx = lines;
              sfx.tick();
            }
            out.textContent = `${cmd}\n${BOOT_LINES.slice(0, bootIdx).join('\n')}${bootIdx < BOOT_LINES.length ? '\n█' : ''}`;
            const prog = Math.min(1, tAfter / (perLine * BOOT_LINES.length));
            bar.style.width = `${Math.round(prog * 20) * 5}%`;
            if (prog >= 1 && tAfter > perLine * BOOT_LINES.length + 0.25) setPhase('glitch');
          }
          break;
        }
        case 'glitch':
          monitor = 1;
          zoom = 1 + phaseT * 3;
          if (phaseT > (short ? 0.3 : 0.55)) {
            setPhase('done');
            finish();
          }
          break;
      }

      sctx.imageSmoothingEnabled = false;
      drawRoom(sctx, t, monitor, zoom < 0.3);
      if (phase === 'spawn') {
        // Beam of light.
        const q = phaseT / 0.9;
        sctx.globalAlpha = Math.sin(Math.min(1, q) * Math.PI) * 0.8;
        sctx.fillStyle = '#3DDCFF';
        sctx.fillRect(SPAWN_X - 2, 0, 14, FLOOR);
        sctx.fillStyle = '#F5F2FF';
        sctx.fillRect(SPAWN_X + 3, 0, 4, FLOOR);
        sctx.globalAlpha = 1;
      }
      for (const p of particles) {
        p.life -= dt;
        p.y += p.vy * dt;
        sctx.globalAlpha = Math.max(0, p.life / 0.6);
        sctx.fillStyle = '#3DDCFF';
        sctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      sctx.globalAlpha = 1;
      while (particles.length && particles[0].life <= 0) particles.shift();
      if (visible) {
        const seated = pf === 'sit' || pf === 'typeA' || pf === 'typeB';
        drawRunnerSprite(sctx, px - 5, (seated ? 131 : FLOOR) - 14, pf, 1, { alpha });
      }
      drawChairFront(sctx);
      // Darkness vignette until the monitor lights the room.
      sctx.fillStyle = `rgba(4,2,12,${0.45 - monitor * 0.2})`;
      sctx.fillRect(0, 0, SW, SH);

      // ── Camera ──
      const vw = canvas.width;
      const vh = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#07051A';
      ctx.fillRect(0, 0, vw, vh);
      // Portrait phones: zoom in on the room and pan with the character.
      const portrait = vw < vh;
      const base = portrait ? vw / (SW * 0.6) : Math.min(vw / SW, vh / SH);
      const half = vw / base / 2;
      const camX = portrait ? Math.max(half, Math.min(SW - half, px + 20)) : SW / 2;

      const cz = Math.min(zoom, 1);
      const ez = cz < 0.5 ? 2 * cz * cz : 1 - Math.pow(-2 * cz + 2, 2) / 2;
      const target = (vw * 0.92) / SCREEN.w / base;
      const s = base * (1 + (target - 1) * ez) * (zoom > 1 ? zoom : 1);
      const fx = camX + (SCREEN.x + SCREEN.w / 2 - camX) * ez;
      const fy = SH / 2 + (SCREEN.y + SCREEN.h / 2 - SH / 2) * ez;

      ctx.setTransform(s, 0, 0, s, vw / 2 - fx * s, vh / 2 - fy * s);
      ctx.drawImage(scene, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (!finished) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  });
}
