/**
 * Visual themes, one per level. Each theme knows how to paint its
 * parallax background, its ground tiles and its pits. Everything is
 * drawn procedurally at game-pixel resolution.
 */
import { TILE } from './constants.ts';
import type { ThemeId } from './level.ts';
import { createRng } from './rng.ts';
import {
  sprite, recolor, MOON_GRID, TORCH_GRID, ORE_GRID, GEAR_GRID, CHIP_GRID, BUSH_GRID, PAL,
} from './sprites.ts';

export interface Theme {
  id: ThemeId;
  /** Sky bands top → bottom. */
  sky: string[];
  pit: 'void' | 'lava' | 'cloud';
  top: HTMLCanvasElement;
  fill: HTMLCanvasElement;
  /** Draw background. `groundY` = screen y of base ground level, `camX` in game px. */
  background(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, groundY: number, t: number): void;
  prop(kind: number): HTMLCanvasElement;
}

const LAYER_W = 640;

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function skyBands(ctx: CanvasRenderingContext2D, bands: string[], w: number, h: number) {
  const bh = Math.ceil(h / bands.length);
  bands.forEach((c, i) => rect(ctx, c, 0, i * bh, w, bh + 1));
}

/** Tile a layer horizontally with parallax. */
function tileLayer(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement, w: number, y: number, offset: number) {
  let x = -Math.floor(((offset % layer.width) + layer.width) % layer.width);
  for (; x < w; x += layer.width) ctx.drawImage(layer, x, Math.round(y));
}

/** Stepped pixel mountains like the mockup. */
function mountainLayer(seed: number, height: number, stepW: number, color: string, amp: number): HTMLCanvasElement {
  const [c, ctx] = canvas(LAYER_W, height);
  const rng = createRng(seed);
  ctx.fillStyle = color;
  let hh = height * 0.5;
  for (let x = 0; x < LAYER_W; x += stepW) {
    // Make the ends match so the layer tiles seamlessly.
    const edge = x < stepW * 2 || x > LAYER_W - stepW * 3;
    hh = edge ? height * 0.45 : Math.max(8, Math.min(height - 4, hh + rng.int(-1, 1) * amp));
    ctx.fillRect(x, height - hh, stepW, hh);
  }
  return c;
}

function starsLayer(seed: number, h: number, n: number): HTMLCanvasElement {
  const [c, ctx] = canvas(LAYER_W, h);
  const rng = createRng(seed);
  for (let i = 0; i < n; i++) {
    const s = rng.chance(0.15) ? 2 : 1;
    ctx.globalAlpha = rng.range(0.3, 0.95);
    rect(ctx, PAL.W, rng.int(0, LAYER_W - 2), rng.int(0, h - 2), s, s);
  }
  ctx.globalAlpha = 1;
  return c;
}

function cloudShape(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, main: string, shade: string) {
  const h = Math.round(w * 0.32);
  rect(ctx, main, x + w * 0.15, y + h * 0.3, w * 0.7, h * 0.7);
  rect(ctx, main, x, y + h * 0.55, w, h * 0.45);
  rect(ctx, main, x + w * 0.3, y, w * 0.35, h * 0.5);
  rect(ctx, shade, x, y + h * 0.85, w, h * 0.15);
}

function cloudsLayer(seed: number, h: number, n: number, main: string, shade: string, minW: number, maxW: number) {
  const [c, ctx] = canvas(LAYER_W, h);
  const rng = createRng(seed);
  for (let i = 0; i < n; i++) {
    const w = rng.int(minW, maxW);
    const x = Math.round((i / n) * LAYER_W + rng.int(0, 30));
    cloudShape(ctx, x % (LAYER_W - w), rng.int(0, h - w * 0.4), w, main, shade);
  }
  return c;
}

// ─── Tiles ───────────────────────────────────────────────────────
function brickTile(base: string, mortar: string, topColor: string | null, hl: string): HTMLCanvasElement {
  const [c, ctx] = canvas(TILE, TILE);
  rect(ctx, base, 0, 0, TILE, TILE);
  rect(ctx, mortar, 0, 7, TILE, 1);
  rect(ctx, mortar, 0, 15, TILE, 1);
  rect(ctx, mortar, 7, 0, 1, 7);
  rect(ctx, mortar, 15, 8, 1, 7);
  rect(ctx, hl, 1, 1, 5, 1);
  rect(ctx, hl, 9, 9, 5, 1);
  if (topColor) {
    rect(ctx, topColor, 0, 0, TILE, 3);
    rect(ctx, mortar, 0, 3, TILE, 1);
  }
  return c;
}

function tilesFor(id: ThemeId): [HTMLCanvasElement, HTMLCanvasElement] {
  switch (id) {
    case 'night':
      return [brickTile('#3B3380', '#100C26', '#5B4FC4', '#4A42A0'), brickTile('#3B3380', '#100C26', null, '#4A42A0')];
    case 'sky': {
      const [t, tc] = canvas(TILE, TILE);
      rect(tc, '#D9D4F5', 0, 0, TILE, TILE);
      rect(tc, PAL.W, 0, 0, TILE, 6);
      rect(tc, PAL.W, 2, 6, 5, 2);
      rect(tc, PAL.W, 10, 6, 4, 1);
      rect(tc, '#B3ADD6', 4, 11, 3, 1);
      rect(tc, '#B3ADD6', 11, 13, 3, 1);
      const [f, fc] = canvas(TILE, TILE);
      rect(fc, '#D9D4F5', 0, 0, TILE, TILE);
      rect(fc, '#B3ADD6', 3, 4, 3, 1);
      rect(fc, '#B3ADD6', 10, 10, 4, 1);
      rect(fc, '#C6C0EA', 1, 13, 2, 1);
      return [t, f];
    }
    case 'mine': {
      const rock = (top: boolean) => {
        const [c, ctx] = canvas(TILE, TILE);
        rect(ctx, '#4A4470', 0, 0, TILE, TILE);
        rect(ctx, '#2A2266', 3, 5, 5, 1);
        rect(ctx, '#2A2266', 7, 6, 1, 3);
        rect(ctx, '#2A2266', 10, 11, 4, 1);
        rect(ctx, '#5E5890', 1, 9, 3, 2);
        rect(ctx, '#5E5890', 11, 2, 3, 2);
        if (top) {
          rect(ctx, '#7A74A8', 0, 0, TILE, 2);
          rect(ctx, '#8B5A2B', 0, 2, TILE, 1);
          rect(ctx, '#2A2266', 0, 3, TILE, 1);
        }
        return c;
      };
      return [rock(true), rock(false)];
    }
    case 'factory': {
      const plate = (top: boolean) => {
        const [c, ctx] = canvas(TILE, TILE);
        rect(ctx, '#4A4470', 0, 0, TILE, TILE);
        rect(ctx, '#3B3380', 0, 15, TILE, 1);
        rect(ctx, '#3B3380', 15, 0, 1, TILE);
        rect(ctx, '#7A74A8', 2, 2, 1, 1);
        rect(ctx, '#7A74A8', 12, 2, 1, 1);
        rect(ctx, '#7A74A8', 2, 12, 1, 1);
        rect(ctx, '#7A74A8', 12, 12, 1, 1);
        if (top) {
          for (let x = 0; x < TILE; x += 4) {
            rect(ctx, PAL.Y, x, 0, 2, 3);
            rect(ctx, PAL.K, x + 2, 0, 2, 3);
          }
          rect(ctx, '#100C26', 0, 3, TILE, 1);
        }
        return c;
      };
      return [plate(true), plate(false)];
    }
    case 'circuit': {
      const pcb = (top: boolean) => {
        const [c, ctx] = canvas(TILE, TILE);
        rect(ctx, '#16113A', 0, 0, TILE, TILE);
        rect(ctx, '#1F8FB0', 3, 4, 1, 9);
        rect(ctx, '#1F8FB0', 3, 12, 8, 1);
        rect(ctx, '#1F8FB0', 10, 7, 1, 6);
        rect(ctx, PAL.C, 10, 6, 2, 2);
        rect(ctx, '#2A2266', 13, 1, 2, 2);
        if (top) {
          rect(ctx, PAL.C, 0, 0, TILE, 2);
          rect(ctx, '#1F8FB0', 0, 2, TILE, 1);
        }
        return c;
      };
      return [pcb(true), pcb(false)];
    }
    case 'castle':
      return [brickTile('#3B2250', '#100C26', '#6A3A78', '#4C2E66'), brickTile('#3B2250', '#100C26', null, '#4C2E66')];
  }
}

// ─── Backgrounds ────────────────────────────────────────────────
function makeBackground(id: ThemeId): Theme['background'] {
  switch (id) {
    case 'night': {
      const stars = starsLayer(11, 220, 70);
      const far = mountainLayer(21, 110, 40, '#1E1848', 14);
      const near = mountainLayer(22, 70, 40, '#2A2266', 10);
      const moon = sprite('moon', MOON_GRID);
      return (ctx, w, h, camX, groundY, t) => {
        skyBands(ctx, ['#100C26', '#130F2E', '#171236', '#1A1540'], w, h);
        tileLayer(ctx, stars, w, 0, camX * 0.03);
        tileLayer(ctx, stars, w, 220, camX * 0.03 + 200);
        // Twinkle a few stars.
        for (let i = 0; i < 6; i++) {
          const a = (Math.sin(t * 2 + i * 1.7) + 1) / 2;
          ctx.globalAlpha = a;
          const x = ((i * 97 + 40) % Math.max(1, w - 10)) | 0;
          const y = ((i * 53 + 20) % Math.max(1, groundY - 140)) | 0;
          rect(ctx, PAL.W, x, y, 1, 3);
          rect(ctx, PAL.W, x - 1, y + 1, 3, 1);
        }
        ctx.globalAlpha = 1;
        // Narrow (phone) screens: tuck the moon in the top-right corner, clear of the text.
        if (w < 350) ctx.drawImage(moon, w - 44, 36, 32, 32);
        else ctx.drawImage(moon, Math.round(w * 0.6), Math.max(30, Math.round(groundY - 200)), 32, 32);
        tileLayer(ctx, far, w, groundY - 110 + 20, camX * 0.12);
        tileLayer(ctx, near, w, groundY - 70 + 20, camX * 0.25);
      };
    }
    case 'sky': {
      const farClouds = cloudsLayer(31, 140, 7, '#8B82E0', '#766CD0', 30, 60);
      const nearClouds = cloudsLayer(32, 120, 5, '#E4E0FA', '#B3ADD6', 50, 90);
      const sun = sprite('sun', recolor(MOON_GRID, { Y: 'W', y: 'L' }), { ...PAL, W: '#FFF3B8', L: '#FFD447' });
      return (ctx, w, h, camX, groundY) => {
        skyBands(ctx, ['#2A2266', '#3B3380', '#4A42A0', '#5B4FC4', '#6F63D6', '#8A7FE0'], w, h);
        ctx.drawImage(sun, Math.round(w * 0.12), Math.max(10, groundY - 230), 24, 24);
        tileLayer(ctx, farClouds, w, groundY - 230, camX * 0.1);
        tileLayer(ctx, nearClouds, w, groundY - 140, camX * 0.3);
      };
    }
    case 'mine': {
      const [wall, wc] = canvas(LAYER_W, 240);
      rect(wc, '#16113A', 0, 0, LAYER_W, 240);
      const rng = createRng(41);
      for (let i = 0; i < 90; i++) rect(wc, rng.chance(0.5) ? '#1C1645' : '#211A50', rng.int(0, LAYER_W), rng.int(0, 240), rng.int(6, 22), rng.int(4, 12));
      for (let x = 40; x < LAYER_W; x += 160) {
        rect(wc, '#5C3A1E', x, 30, 6, 210);
        rect(wc, '#5C3A1E', x + 60, 30, 6, 210);
        rect(wc, '#8B5A2B', x - 6, 26, 78, 8);
      }
      const ore = sprite('ore', ORE_GRID);
      for (let i = 0; i < 10; i++) wc.drawImage(ore, rng.int(0, LAYER_W - 8), rng.int(40, 220));
      const torch = sprite('torch', TORCH_GRID);
      return (ctx, w, h, camX, groundY, t) => {
        rect(ctx, '#0A0719', 0, 0, w, h);
        tileLayer(ctx, wall, w, groundY - 240, camX * 0.45);
        // Torches with flickering glow, tied to the wall layer.
        const off = camX * 0.45;
        for (let k = -1; k < w / 160 + 1; k++) {
          const base = Math.floor(off / 160) + k;
          const x = base * 160 + 100 - off;
          const y = groundY - 150;
          const flick = 0.18 + Math.sin(t * 9 + base) * 0.05;
          ctx.globalAlpha = flick;
          rect(ctx, '#FF9F43', x - 14, y - 12, 34, 30);
          ctx.globalAlpha = flick * 0.6;
          rect(ctx, '#FF9F43', x - 22, y - 20, 50, 46);
          ctx.globalAlpha = 1;
          ctx.drawImage(torch, Math.round(x), y);
        }
      };
    }
    case 'factory': {
      const [wall, wc] = canvas(LAYER_W, 260);
      rect(wc, '#1C1645', 0, 0, LAYER_W, 260);
      for (let x = 0; x < LAYER_W; x += 64) rect(wc, '#2A2266', x, 0, 2, 260);
      for (let y = 20; y < 260; y += 48) rect(wc, '#2A2266', 0, y, LAYER_W, 2);
      rect(wc, '#3B3380', 0, 90, LAYER_W, 8);
      rect(wc, '#4A4470', 0, 92, LAYER_W, 3);
      rect(wc, '#3B3380', 0, 150, LAYER_W, 6);
      const gear = sprite('gear', GEAR_GRID);
      const gearPos = [60, 250, 470];
      return (ctx, w, h, camX, groundY, t) => {
        rect(ctx, '#100C26', 0, 0, w, h);
        tileLayer(ctx, wall, w, groundY - 260, camX * 0.4);
        // Background conveyor with boxes.
        const by = groundY - 60;
        rect(ctx, '#2A2266', 0, by, w, 6);
        const shift = (t * 20 + camX * 0.4) % 40;
        for (let x = -40; x < w + 40; x += 40) {
          rect(ctx, '#3B3380', Math.round(x - shift), by + 1, 20, 2);
          rect(ctx, '#8B5A2B', Math.round(x - shift + 6), by - 10, 12, 10);
          rect(ctx, '#5C3A1E', Math.round(x - shift + 6), by - 6, 12, 1);
        }
        // Spinning gears (alternating frames keep the pixels crisp).
        const off = camX * 0.4;
        for (let k = -1; k < w / LAYER_W + 1; k++) {
          for (const gx of gearPos) {
            const x = Math.round(k * LAYER_W + gx - (off % LAYER_W));
            const y = groundY - 200;
            ctx.save();
            ctx.translate(x + 12, y + 14);
            ctx.rotate(Math.floor(t * 4) * (Math.PI / 8));
            ctx.drawImage(gear, -12, -14, 24, 28);
            ctx.restore();
          }
        }
        // Blinking lights.
        for (let i = 0; i < 8; i++) {
          const on = Math.floor(t * 2 + i) % 3 === 0;
          rect(ctx, on ? PAL.G : '#1F4A2A', ((i * 83) % Math.max(1, w)) | 0, groundY - 120, 3, 3);
        }
      };
    }
    case 'circuit': {
      const [board, bc] = canvas(LAYER_W, 260);
      rect(bc, '#0A0719', 0, 0, LAYER_W, 260);
      const rng = createRng(51);
      for (let x = 0; x < LAYER_W; x += 16) for (let y = 0; y < 260; y += 16) rect(bc, '#120E30', x, y, 1, 1);
      const traces: [number, number, number, number][] = [];
      for (let i = 0; i < 26; i++) {
        const x = rng.int(0, LAYER_W / 8) * 8;
        const y = rng.int(1, 30) * 8;
        const len = rng.int(3, 12) * 8;
        const horiz = rng.chance(0.6);
        rect(bc, '#123A5A', x, y, horiz ? len : 2, horiz ? 2 : len);
        rect(bc, '#1F8FB0', x - 1, y - 1, 4, 4);
        traces.push([x, y, horiz ? len : 0, horiz ? 0 : len]);
      }
      const chip = sprite('chip', CHIP_GRID);
      for (let i = 0; i < 6; i++) bc.drawImage(chip, rng.int(10, LAYER_W - 20), rng.int(20, 200), 14, 14);
      return (ctx, w, h, camX, groundY, t) => {
        rect(ctx, '#07051A', 0, 0, w, h);
        const off = camX * 0.35;
        tileLayer(ctx, board, w, groundY - 260, off);
        // Signal pulses running along traces.
        for (let k = -1; k < w / LAYER_W + 1; k++) {
          traces.forEach(([x, y, dx, dy], i) => {
            const p = (t * 0.6 + i * 0.37) % 1;
            const px = Math.round(k * LAYER_W + x + dx * p - (off % LAYER_W));
            const py = Math.round(groundY - 260 + y + dy * p);
            rect(ctx, PAL.C, px, py, 3, 3);
          });
        }
      };
    }
    case 'castle': {
      const [wall, wc] = canvas(LAYER_W, 260);
      rect(wc, '#1A0B22', 0, 0, LAYER_W, 260);
      for (let y = 0; y < 260; y += 12) {
        const o = (y / 12) % 2 ? 12 : 0;
        for (let x = -o; x < LAYER_W; x += 24) rect(wc, '#24112E', x + 1, y + 1, 22, 10);
      }
      for (let x = 50; x < LAYER_W; x += 150) {
        rect(wc, '#0E0614', x, 60, 22, 40);
        rect(wc, '#0E0614', x + 4, 54, 14, 6);
        rect(wc, '#FF9F43', x + 4, 70, 14, 26);
        rect(wc, '#FFD447', x + 8, 78, 6, 14);
      }
      for (let x = 0; x < LAYER_W; x += 24) rect(wc, '#1A0B22', x, 0, 12, 10);
      return (ctx, w, h, camX, groundY, t) => {
        skyBands(ctx, ['#0E0614', '#140818', '#1A0B22', '#24102A', '#3A1230'], w, h);
        tileLayer(ctx, wall, w, groundY - 250, camX * 0.35);
        // Embers rising.
        for (let i = 0; i < 18; i++) {
          const p = (t * 0.15 + i * 0.137) % 1;
          const x = (i * 61 + Math.sin(t + i) * 8) % Math.max(1, w);
          const y = groundY + 20 - p * (groundY + 20);
          ctx.globalAlpha = 1 - p;
          rect(ctx, i % 3 ? PAL.O : PAL.Y, x | 0, y | 0, 2, 2);
        }
        ctx.globalAlpha = 1;
      };
    }
  }
}

const PROPS: Record<ThemeId, string[][]> = {
  night: [BUSH_GRID as unknown as string[]],
  sky: [],
  mine: [TORCH_GRID as unknown as string[], ORE_GRID as unknown as string[]],
  factory: [GEAR_GRID as unknown as string[]],
  circuit: [CHIP_GRID as unknown as string[]],
  castle: [TORCH_GRID as unknown as string[]],
};

const themes = new Map<ThemeId, Theme>();

export function getTheme(id: ThemeId): Theme {
  let th = themes.get(id);
  if (!th) {
    const [top, fill] = tilesFor(id);
    const sky: Record<ThemeId, string[]> = {
      night: ['#100C26'],
      sky: ['#5B4FC4'],
      mine: ['#0A0719'],
      factory: ['#100C26'],
      circuit: ['#07051A'],
      castle: ['#1A0B22'],
    };
    th = {
      id,
      sky: sky[id],
      pit: id === 'castle' ? 'lava' : id === 'sky' ? 'cloud' : 'void',
      top,
      fill,
      background: makeBackground(id),
      prop: (kind) => {
        const list = PROPS[id];
        if (!list.length) return sprite('none', ['.']);
        const g = list[kind % list.length];
        return sprite(`prop:${id}:${kind % list.length}`, g);
      },
    };
    themes.set(id, th);
  }
  return th;
}
