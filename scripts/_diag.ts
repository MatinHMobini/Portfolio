import { readFileSync } from 'node:fs';
import { mixSeed } from '../src/game/rng.ts';
import { generateLevel, THEME_IDS, cloneLevel, heightAt } from '../src/game/level.ts';
import { createNetwork } from '../src/ai/network.ts';
import { forward } from '../src/ai/network.ts';
import { outputsToAction } from '../src/ai/policy.ts';
import { createRunner, stepEnemies, stepRunner, EV } from '../src/game/physics.ts';
import { sense } from '../src/game/senses.ts';
import { TILE, DT } from '../src/game/constants.ts';
const ch = JSON.parse(readFileSync('src/ai/champion.json', 'utf8'));
const net = createNetwork(ch.layers, ch.weights);
const causes: Record<string, number> = {};
for (let k = 0; k < 5; k++) THEME_IDS.forEach((t, i) => {
  const lv = cloneLevel(generateLevel(mixSeed(5000 + k, i), t, 260));
  const r = createRunner(3 * TILE, lv);
  const inp = new Float32Array(8); const a = { speed: 0, jump: false, doubleJump: false, dive: false, dash: false };
  let time = 0, lastX = 0, stuck = 0, cause = 'timeout'; const acts = [0,0,0,0,0];
  while (r.steps < 4000) {
    stepEnemies(lv, time); time += DT; sense(r, lv, inp); outputsToAction(forward(net, inp), a);
    if (a.jump) acts[1]++; if (a.doubleJump) acts[2]++; if (a.dive) acts[3]++; if (a.dash) acts[4]++;
    const ev = stepRunner(r, lv, a);
    if (ev & EV.DIE) { cause = r.y > 200 ? 'pit' : 'enemy'; break; }
    if (ev & EV.FINISH) { cause = 'finish'; break; }
    if (r.maxX > lastX + 16) { lastX = r.maxX; stuck = 0; } else if (++stuck > 240) { cause = 'stuck'; break; }
  }
  const col = Math.floor(r.x / TILE);
  const ctx = Array.from({length: 10}, (_, d) => heightAt(lv, col - 2 + d)).join('');
  causes[t + ':' + cause] = (causes[t + ':' + cause] || 0) + 1;
  if (cause !== 'finish') console.log(t, cause, 'col', col, 'terrain', ctx, 'vy', r.vy.toFixed(0), 'acts', acts.join(','));
});
console.log(causes);
