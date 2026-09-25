/**
 * Evaluate the trained champion on levels it has never seen.
 *
 *   npm run evaluate
 *   npm run evaluate -- --levels 10
 *
 * Plays N fresh seeded levels per theme and reports, per theme, how
 * many it finished and how it failed (pit, enemy, stuck, timeout).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mixSeed } from '../src/game/rng.ts';
import { generateLevel, cloneLevel, THEME_IDS } from '../src/game/level.ts';
import { createNetwork, forward } from '../src/ai/network.ts';
import { outputsToAction, stepLimit } from '../src/ai/policy.ts';
import { createRunner, stepEnemies, stepRunner, EV, type Action } from '../src/game/physics.ts';
import { sense, N_SENSES } from '../src/game/senses.ts';
import { TILE, DT, WORLD_H } from '../src/game/constants.ts';

const i = process.argv.indexOf('--levels');
const PER_THEME = i >= 0 ? Number(process.argv[i + 1]) : 5;

const here = dirname(fileURLToPath(import.meta.url));
const champ = JSON.parse(readFileSync(resolve(here, '../src/ai/champion.json'), 'utf8'));
const net = createNetwork(champ.layers, champ.weights);
console.log(`Champion: ${champ.meta.generations} generations, ${champ.meta.params} params, trained ${champ.meta.trainedAt}`);

let total = 0;
let finished = 0;
for (const [ti, theme] of THEME_IDS.entries()) {
  const outcome: Record<string, number> = { finish: 0, pit: 0, enemy: 0, stuck: 0, timeout: 0 };
  let progress = 0;
  for (let k = 0; k < PER_THEME; k++) {
    const lv = cloneLevel(generateLevel(mixSeed(70000 + k, ti), theme, 260));
    const r = createRunner(3 * TILE, lv);
    const input = new Float32Array(N_SENSES);
    const a: Action = { speed: 0, jump: false, doubleJump: false, dive: false, dash: false };
    let time = 0;
    let lastX = 0;
    let stuck = 0;
    let result = 'timeout';
    while (r.steps < stepLimit(lv)) {
      stepEnemies(lv, time);
      time += DT;
      sense(r, lv, input);
      outputsToAction(forward(net, input), a);
      const ev = stepRunner(r, lv, a);
      if (ev & EV.DIE) {
        result = r.y > WORLD_H ? 'pit' : 'enemy';
        break;
      }
      if (ev & EV.FINISH) {
        result = 'finish';
        break;
      }
      if (r.maxX > lastX + TILE) {
        lastX = r.maxX;
        stuck = 0;
      } else if (++stuck > 240) {
        result = 'stuck';
        break;
      }
    }
    outcome[result]++;
    progress += Math.min(1, r.maxX / (lv.finishCol * TILE));
  }
  total += PER_THEME;
  finished += outcome.finish;
  const fails = Object.entries(outcome).filter(([k, v]) => k !== 'finish' && v > 0).map(([k, v]) => `${k} ${v}`).join(', ');
  console.log(`${theme.padEnd(8)} finished ${outcome.finish}/${PER_THEME}  avg progress ${((progress / PER_THEME) * 100).toFixed(0)}%  ${fails ? `(fails: ${fails})` : ''}`);
}
console.log(`TOTAL    finished ${finished}/${total} unseen levels`);
