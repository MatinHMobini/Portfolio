/**
 * Shared simulation constants. Units are "game pixels"; one tile is
 * TILE game pixels. Physics runs at a fixed 60 steps per second in
 * both the browser and the headless trainer, so a brain trained
 * offline behaves identically on the site.
 */
export const TILE = 16;
/** Level height in tiles. Ground heights are measured up from the bottom. */
export const ROWS = 12;
export const WORLD_H = ROWS * TILE;

export const DT = 1 / 60;

export const GRAVITY = 1500;
export const MAX_FALL = 620;
export const RUN_MAX = 150;
export const RUN_ACCEL = 900;
export const JUMP_V = 390;
export const DOUBLE_JUMP_V = 340;
export const DIVE_V = 540;
export const DASH_V = 290;
export const DASH_TIME = 0.22;
export const DASH_COOLDOWN = 0.9;
export const STOMP_BOUNCE = 300;
/** Minimum time in the air before a double jump is allowed. */
export const DOUBLE_JUMP_DELAY = 0.14;
export const BELT_SPEED = 45;

export const RUNNER_W = 10;
export const RUNNER_H = 14;

export const ENEMY_SPEED = 28;
