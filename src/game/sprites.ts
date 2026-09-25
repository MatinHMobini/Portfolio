/**
 * All pixel art is defined here as palette-indexed string grids and
 * rendered once into small offscreen canvases. No image files needed.
 *
 * Each character in a grid is a palette key; '.' is transparent.
 */

export const PAL: Record<string, string> = {
  K: '#100C26', // outline / darkest
  W: '#F5F2FF', // white
  Y: '#FFD447', // accent yellow
  y: '#C99A1E', // yellow shade
  P: '#FF5C8A', // pink
  p: '#B24A68', // dark pink
  S: '#F2B38A', // skin
  s: '#D98E66', // skin shade
  H: '#3A2A1A', // hair
  U: '#5B4FC4', // purple
  u: '#3B3380', // mid purple
  D: '#2A2266', // dark purple
  B: '#1C1645', // panel
  C: '#3DDCFF', // cyan
  c: '#1F8FB0', // dark cyan
  G: '#7CFF6B', // green
  g: '#3FAF3A', // dark green
  O: '#FF9F43', // orange
  R: '#E8364F', // red
  r: '#9E1F35', // dark red
  L: '#B3ADD6', // muted light
  M: '#7A74A8', // metal
  m: '#4A4470', // metal dark
  o: '#8B5A2B', // wood
  b: '#5C3A1E', // wood dark
};

export type Grid = readonly string[];

export function gridToCanvas(grid: Grid, palette: Record<string, string> = PAL, scale = 1): HTMLCanvasElement {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const cv = document.createElement('canvas');
  cv.width = w * scale;
  cv.height = h * scale;
  const ctx = cv.getContext('2d')!;
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const k = row[x];
      if (k === '.' || k === ' ') continue;
      const col = palette[k];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return cv;
}

/** Replace palette keys in a grid (for recolouring enemies per theme). */
export function recolor(grid: Grid, map: Record<string, string>): string[] {
  return grid.map((row) => row.replace(/./g, (ch) => map[ch] ?? ch));
}

// ─── Player (12 x 15) ────────────────────────────────────────────
const HEAD = [
  '...YYYYYY...',
  '..YHHHHHHY..',
  '..HHHHHHHH..',
  '.YHSSSSSSHY.',
  '.YHSKSSKSHY.',
  '.Y.SSSSSS.Y.',
  '...SSppSS...',
  '.....SS.....',
];
const BODY_CONTROLLER = [
  '..PPPPPPPP..',
  '.PPPPPPPPPP.',
  'SPPWKWWPWPPS',
  'SPPWWWWWWPPS',
];
const BODY_ARMS_UP = [
  'S.PPPPPPPP.S',
  'SPPPPPPPPPPS',
  '.PPWKWWPWPP.',
  '.PPWWWWWWPP.',
];
const BODY_TYPE_A = [
  '..PPPPPPPP..',
  '.PPPPPPPPPP.',
  '.PPPPPPPPPSS',
  '.PPPPPPPPPP.',
];
const BODY_TYPE_B = [
  '..PPPPPPPP..',
  '.PPPPPPPPPP.',
  '.PPPPPPPPPP.',
  '.PPPPPPPPPSS',
];
const LEGS_STAND = ['...UU..UU...', '...UU..UU...', '..WWW..WWW..'];
const LEGS_RUN1 = ['...UU..UU...', '..UU....UU..', '.WW......WW.'];
const LEGS_RUN2 = ['....UUUU....', '....UU.UU...', '...WWW.WW...'];
const LEGS_RUN3 = ['...UUUUU....', '...UU..UU...', '..WW...WWW..'];
const LEGS_JUMP = ['..UUU..UUU..', '..WW....WW..', '............'];
const LEGS_DIVE = ['....UUUU....', '....UUUU....', '....WWWW....'];
const LEGS_SIT = ['...UUUUUUU..', '........UU..', '........WW..'];

const frame = (...parts: string[][]) => parts.flat();

export const PLAYER_GRIDS = {
  idle: frame(HEAD, BODY_CONTROLLER, LEGS_STAND),
  run1: frame(HEAD, BODY_CONTROLLER, LEGS_RUN1),
  run2: frame(HEAD, BODY_CONTROLLER, LEGS_RUN2),
  run3: frame(HEAD, BODY_CONTROLLER, LEGS_RUN3),
  jump: frame(HEAD, BODY_ARMS_UP, LEGS_JUMP),
  dive: frame(HEAD, BODY_CONTROLLER, LEGS_DIVE),
  sit: frame(HEAD, BODY_CONTROLLER, LEGS_SIT),
  typeA: frame(HEAD, BODY_TYPE_A, LEGS_SIT),
  typeB: frame(HEAD, BODY_TYPE_B, LEGS_SIT),
};
export type PlayerFrame = keyof typeof PLAYER_GRIDS;

// ─── Enemies ─────────────────────────────────────────────────────
export const WALKER_GRIDS = [
  [
    '....KKKK....',
    '..KKGGGGKK..',
    '.KGGGGGGGGK.',
    '.KGWKGGWKGK.',
    'KGGWKGGWKGGK',
    'KGGGGGGGGGGK',
    'KGgGGGGGGgGK',
    'KGGgggggGGGK',
    '.KGGGGGGGGK.',
    '..KgK..KgK..',
    '..KK....KK..',
  ],
  [
    '............',
    '....KKKK....',
    '..KKGGGGKK..',
    '.KGWKGGWKGK.',
    'KGGWKGGWKGGK',
    'KGGGGGGGGGGK',
    'KGgGGGGGGgGK',
    'KGGgggggGGGK',
    'KGGGGGGGGGGK',
    '.KgK.KK.KgK.',
    '.KK......KK.',
  ],
];
export const FLYER_GRIDS = [
  [
    'K..........K',
    'KK..KKKK..KK',
    'KGK.KGGK.KGK',
    'KGGKGGGGKGGK',
    '.KGGWKWKGGK.',
    '..KGGGGGGK..',
    '...KGppGK...',
    '....KKKK....',
    '............',
  ],
  [
    '............',
    '....KKKK....',
    '...KGGGGK...',
    '..KGWKWKGK..',
    '.KGGGGGGGGK.',
    'KGGKGppGKGGK',
    'KGK.KGGK.KGK',
    'KK...KK...KK',
    'K..........K',
  ],
];
export const SQUASHED_GRID = [
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
  '..KKKKKKKK..',
  '.KGWKGGWKGK.',
  'KGGGGGGGGGGK',
  'KKKKKKKKKKKK',
];

// ─── Items / icons ───────────────────────────────────────────────
export const COIN_GRIDS = [
  ['..KKKK..', '.KYYYYK.', 'KYYWYYyK', 'KYWYYYyK', 'KYYYYYyK', 'KYYYYyyK', '.KyyyyK.', '..KKKK..'],
  ['...KK...', '..KYYK..', '..KWYK..', '..KYYK..', '..KYYK..', '..KYyK..', '..KyyK..', '...KK...'],
  ['...KK...', '...KK...', '...KK...', '...KK...', '...KK...', '...KK...', '...KK...', '...KK...'],
  ['...KK...', '..KYYK..', '..KYWK..', '..KYYK..', '..KYYK..', '..KyYK..', '..KyyK..', '...KK...'],
];

export const HEART_GRID = ['.PP.PP.', 'PWPPPPP', 'PPPPPPP', '.PPPPP.', '..PPP..', '...P...'];
export const HEART_EMPTY_GRID = ['.uu.uu.', 'uDuuDDu', 'uDDDDDu', '.uDDDu.', '..uDu..', '...u...'];
export const CASTLE_GRID = ['P.P.P.P', 'PPPPPPP', 'PPPPPPP', 'PPPKPPP', 'PPKKKPP', 'PPKKKPP'];
export const STAR_GRID = ['..W..', '..W..', 'WWWWW', '..W..', '..W..'];
export const BIG_STAR_GRID = ['...Y...', '...Y...', '..YYY..', 'YYYWYYY', '..YYY..', '...Y...', '...Y...'];

export const MOON_GRID = [
  '.....YYYYYY.....',
  '...YYYYYYYYYY...',
  '..YYYYYYYYYYYY..',
  '.YYYYyyyYYYYYYY.',
  '.YYYyyyyYYYYYYY.',
  'YYYYYyyYYYYYYYYY',
  'YYYYYYYYYYyyYYYY',
  'YYYYYYYYYYyyYYYY',
  'YYYYYYYYYYYYYYYY',
  'YYYYYYYYYYYYYYYY',
  'YYYYYYyyyYYYYYYY',
  '.YYYYYyyyYYYYYY.',
  '.YYYYYYYYYYYYYY.',
  '..YYYYYYYYYYYY..',
  '...YYYYYYYYYY...',
  '.....YYYYYY.....',
];

export const FLAG_GRID = [
  'WPPPPPPP..',
  'WPPPPPPPPP',
  'WPPWWPPPPP',
  'WPWWWWPPPP',
  'WPPWWPPPPP',
  'WPPPPPPPPP',
  'WPPPPPPP..',
  'W.........',
];

export const SPRING_GRID = ['YYYYYYYYYY', 'KKKKKKKKKK', '.WWWWWWWW.', '..MMMMMM..', '.WWWWWWWW.', '..MMMMMM..', 'mmmmmmmmmm'];

export const TORCH_GRID = ['..Y..', '.YOY.', '.ORO.', '..O..', '.ooo.', '..o..', '..b..', '..b..'];
export const ORE_GRID = ['..C...', '.CWC..', 'CCcC.C', '.Cc.CW', '..c.Cc'];
export const GEAR_GRID = ['..MM..', 'MMMMMM', 'MMmmMM', 'MmKKmM', 'MMmmMM', 'MMMMMM', '..MM..'];
export const CHIP_GRID = ['.W.W.W.', 'KKKKKKK', 'KmmmmmK', 'KmCCCmK', 'KmmmmmK', 'KKKKKKK', '.W.W.W.'];
export const BUSH_GRID = ['..gg..', '.gGGg.', 'gGGGGg', 'gGgGGg'];
export const BUBBLE_GRID = ['.OO.', 'OYYO', 'OYYO', '.OO.'];

/** Cache of rendered canvases keyed by name. */
const cache = new Map<string, HTMLCanvasElement>();

export function sprite(key: string, grid: Grid, palette?: Record<string, string>): HTMLCanvasElement {
  let cv = cache.get(key);
  if (!cv) {
    cv = gridToCanvas(grid, palette);
    cache.set(key, cv);
  }
  return cv;
}

export function playerSprite(f: PlayerFrame): HTMLCanvasElement {
  return sprite(`player:${f}`, PLAYER_GRIDS[f]);
}

/** Enemy colours per theme: [main, shade]. */
export const ENEMY_COLORS: Record<string, [string, string]> = {
  night: ['G', 'g'],
  sky: ['C', 'c'],
  mine: ['O', 'b'],
  factory: ['M', 'm'],
  circuit: ['C', 'U'],
  castle: ['R', 'r'],
};

export function enemySprite(theme: string, kind: 'walker' | 'flyer', frameIdx: number): HTMLCanvasElement {
  const [main, shade] = ENEMY_COLORS[theme] ?? ['G', 'g'];
  const grids = kind === 'walker' ? WALKER_GRIDS : FLYER_GRIDS;
  const g = grids[frameIdx % grids.length];
  return sprite(`enemy:${theme}:${kind}:${frameIdx % grids.length}`, recolor(g, { G: main, g: shade }));
}

export function squashedSprite(theme: string): HTMLCanvasElement {
  const [main, shade] = ENEMY_COLORS[theme] ?? ['G', 'g'];
  return sprite(`squash:${theme}`, recolor(SQUASHED_GRID, { G: main, g: shade }));
}

/** A data: URL of a grid, for use in CSS / <img> (favicon, HUD hearts). */
export function gridDataUrl(grid: Grid, scale: number): string {
  return gridToCanvas(grid, PAL, scale).toDataURL();
}
