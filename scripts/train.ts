/**
 * Offline neuroevolution trainer.
 *
 *   npm run train                 (default: 220 generations)
 *   npm run train -- --gens 400 --pop 120 --seed 7
 *
 * Uses the exact same level generator, physics and network as the
 * browser, trains a population with a genetic algorithm across seeded
 * levels of every theme, then writes the best brain to
 * src/ai/champion.json (weights + training metadata).
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRng, mixSeed } from '../src/game/rng.ts';
import { generateLevel, THEME_IDS, type Level } from '../src/game/level.ts';
import { createNetwork, DEFAULT_LAYERS, paramCount } from '../src/ai/network.ts';
import { runEpisode } from '../src/ai/policy.ts';
import { DEFAULT_GA, nextGeneration, randomPopulation, rank, stats } from '../src/ai/neuroevolution.ts';
import { SENSE_NAMES, ACTION_NAMES } from '../src/game/senses.ts';

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}

const GENS = arg('gens', 220);
const POP = arg('pop', 100);
const SEED = arg('seed', 2026);
const COLS = 200;
const layers = [...DEFAULT_LAYERS];

const rng = createRng(SEED);
const opts = { ...DEFAULT_GA, populationSize: POP };

// Six fixed levels (one per theme) plus six that rotate every 10 generations.
const fixed: Level[] = THEME_IDS.map((t, i) => generateLevel(mixSeed(SEED, 100 + i), t, COLS));
const rotating = (block: number): Level[] =>
  THEME_IDS.map((t, i) => generateLevel(mixSeed(SEED, 1000 + block * 17 + i), t, COLS));
const holdout: Level[] = [];
for (let k = 0; k < 3; k++) THEME_IDS.forEach((t, i) => holdout.push(generateLevel(mixSeed(9999 + k, i), t, 260)));

function evaluate(genome: Float32Array, levels: Level[]): number {
  const net = createNetwork(layers, genome);
  let total = 0;
  for (const lv of levels) total += runEpisode(net, lv).fitness;
  return total / levels.length;
}

function holdoutReport(genome: Float32Array) {
  const net = createNetwork(layers, genome);
  let finished = 0;
  let dist = 0;
  let fit = 0;
  for (const lv of holdout) {
    const r = runEpisode(net, lv);
    if (r.finished) finished++;
    dist += r.distance / (lv.cols - 8);
    fit += r.fitness;
  }
  return { levels: holdout.length, finished, avgProgress: dist / holdout.length, avgFitness: fit / holdout.length };
}

console.log(`Pixel Quest trainer: ${POP} brains x ${GENS} generations, ${paramCount(layers)} params each`);
const t0 = Date.now();
let pop = randomPopulation(layers, POP, rng);
const history: { gen: number; best: number; mean: number }[] = [];
let fitness = new Float64Array(POP);
let levels: Level[] = [];

for (let gen = 0; gen < GENS; gen++) {
  levels = [...fixed, ...rotating(Math.floor(gen / 10))];
  fitness = new Float64Array(pop.length);
  for (let i = 0; i < pop.length; i++) fitness[i] = evaluate(pop[i], levels);
  const s = stats(gen, fitness);
  history.push({ gen, best: round(s.best, 2), mean: round(s.mean, 2) });
  if (gen % 10 === 0 || gen === GENS - 1) {
    console.log(`gen ${String(gen).padStart(4)}  best ${s.best.toFixed(1).padStart(7)}  mean ${s.mean.toFixed(1).padStart(7)}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  if (gen < GENS - 1) pop = nextGeneration(layers, pop, fitness, opts, rng);
}

// Pick the champion among the top 8 of the final generation by held-out performance.
const top = rank(fitness).slice(0, 8);
let champ = top[0];
let champReport = holdoutReport(pop[champ]);
for (const i of top.slice(1)) {
  const rep = holdoutReport(pop[i]);
  if (rep.avgFitness > champReport.avgFitness) {
    champ = i;
    champReport = rep;
  }
}
console.log('Held-out evaluation:', champReport);

const out = {
  version: 1,
  layers,
  senses: SENSE_NAMES,
  actions: ACTION_NAMES,
  weights: Array.from(pop[champ], (w) => round(w, 5)),
  meta: {
    generations: GENS,
    populationSize: POP,
    seed: SEED,
    params: paramCount(layers),
    episodesTrained: GENS * POP * levels.length,
    trainingLevels: levels.length,
    finalFitness: round(fitness[champ], 2),
    holdout: { ...champReport, avgProgress: round(champReport.avgProgress, 3), avgFitness: round(champReport.avgFitness, 2) },
    seconds: Math.round((Date.now() - t0) / 1000),
    trainedAt: new Date().toISOString().slice(0, 10),
  },
  history,
};

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '../src/ai/champion.json');
writeFileSync(file, JSON.stringify(out));
console.log(`Saved champion to ${file}`);

function round(v: number, d: number): number {
  const m = 10 ** d;
  return Math.round(v * m) / m;
}
