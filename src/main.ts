/**
 * Pixel Quest entry point. The HTML (all real content) is already in
 * the page; this boots the intro, the game layer, the AI brain and all
 * the interactive bits on top of it.
 */
import './dev/raf-shim.ts';
import './styles/base.css';
import './styles/sections.css';
import './styles/overlays.css';
import './styles/responsive.css';

import { content } from './content.ts';
import champion from './ai/champion.json';
import { SECTIONS } from './sections/render.ts';
import { Game, type SectionInfo } from './game/game.ts';
import type { ThemeId } from './game/level.ts';
import { createNetwork } from './ai/network.ts';
import { BrainState } from './ai/brain-state.ts';
import { BrainUI } from './ai/brain-ui.ts';
import { Hud } from './ui/hud.ts';
import { toast } from './ui/toasts.ts';
import { YouPlay } from './ui/you-play.ts';
import { runIntro } from './intro/intro.ts';
import {
  initDialog, initNavigation, initActiveSection, initStatus, initScores, initCartridges,
  initCountdown, initContactForm, initCredits,
} from './sections/interactions.ts';
import type { TrainingLab } from './ai/training-lab.ts';

const root = document.documentElement;
const reduced = root.classList.contains('reduced');
const mobile = window.matchMedia('(max-width: 700px)').matches || window.matchMedia('(pointer: coarse)').matches;
const touch = window.matchMedia('(pointer: coarse)').matches;

const sectionEls = SECTIONS.map((s) => document.getElementById(s.id)!).filter(Boolean);
const sectionInfo: SectionInfo[] = SECTIONS.map((s) => ({ theme: s.theme as ThemeId, world: s.world, name: s.nav }));

// ── The brain: the trained champion network ──
const net = createNetwork(champion.layers, champion.weights);
const brain = new BrainState(net);

// ── HUD + game ──
const hud = new Hud();
const worldCard = document.getElementById('world-card')!;
const canvas = document.getElementById('game') as HTMLCanvasElement;

let brainUI: BrainUI | null = null;

const game = new Game(canvas, sectionInfo, net, {
  score: (s, c) => hud.setScore(s, c),
  lives: (n, hit) => hud.setLives(n, hit),
  world: (i) => {
    hud.setWorld(SECTIONS[i].world);
    document.querySelectorAll('.level-bar a').forEach((a) => a.classList.toggle('is-on', Number((a as HTMLElement).dataset.bar) === i));
  },
  skill: (id) => brain.learn(id, performance.now()),
  episode: (n) => brainUI?.setEpisodes(n),
  toast: (html) => toast(html),
  landed: (i) => {
    worldCard.querySelector('.world-card__w')!.textContent = `WORLD ${SECTIONS[i].world}`;
    worldCard.querySelector('.world-card__n')!.textContent = SECTIONS[i].nav;
    worldCard.classList.remove('is-on');
    void worldCard.offsetWidth;
    worldCard.classList.add('is-on');
  },
}, { reduced, mobile });

brain.learn('run', 0);

brainUI = new BrainUI(game, brain, net, champion.meta, champion.history);
// The hero dialog box floats above the runner (wide screens only). It follows a
// steady anchor (the ground under the runner, not the runner itself) and eases
// toward it slowly, so jumps and double jumps don't make it shake.
const dialog = document.getElementById('dialog');
const hero = document.getElementById('top');
let dialogX = -1;
let dialogY = -1;
let lastDialogT = 0;
const trackDialog = (now: number) => {
  if (!dialog || !hero || window.innerWidth <= 980 || game.index !== 0 || game.inTransition) return;
  const hr = hero.getBoundingClientRect();
  if (hr.bottom < 0) return;
  const p = game.runnerAnchorCss();
  const dw = dialog.offsetWidth;
  const dh = dialog.offsetHeight;
  const tx = Math.max(0, Math.min(window.innerWidth - dw - 24, p.x - dw / 2));
  const ty = p.y - dh - 30;
  // Frame-rate independent easing: about 1.5 s to settle.
  const dt = lastDialogT ? Math.min(0.1, (now - lastDialogT) / 1000) : 0;
  lastDialogT = now;
  const k = 1 - Math.exp(-dt * 2.5);
  dialogX = dialogX < 0 ? tx : dialogX + (tx - dialogX) * k;
  dialogY = dialogY < 0 ? ty : dialogY + (ty - dialogY) * k;
  const box = (dialog.offsetParent as HTMLElement | null)?.getBoundingClientRect() ?? hr;
  // Keep it inside the hero section.
  const y = Math.min(Math.max(hr.top + 90, dialogY), hr.bottom - dh - 140);
  dialog.style.left = `${Math.round(dialogX - box.left)}px`;
  dialog.style.top = `${Math.round(y - box.top)}px`;
  dialog.style.right = 'auto';
  dialog.style.bottom = 'auto';
};
// Rare enemy jokes: a speech bubble that follows the talking enemy.
const quipEl = document.getElementById('quip')!;
let quipText = '';
const trackQuip = () => {
  const q = game.quipCss();
  if (!q) {
    quipEl.classList.remove('is-on');
    return;
  }
  if (q.text !== quipText) {
    quipText = q.text;
    quipEl.textContent = q.text;
  }
  const w = quipEl.offsetWidth;
  const x = Math.max(8, Math.min(window.innerWidth - w - 8, q.x - w / 2));
  quipEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(q.y - quipEl.offsetHeight - 14)}px)`;
  quipEl.classList.add('is-on');
};
game.onFrame = (now, dt) => {
  brainUI!.frame(now, dt);
  trackDialog(now);
  trackQuip();
};

// ── Training Lab (created on first open) ──
let lab: TrainingLab | null = null;
brainUI.onOpenLab = async () => {
  if (!lab) {
    const { TrainingLab } = await import('./ai/training-lab.ts');
    lab = new TrainingLab(champion.weights, champion.layers);
    lab.onOpenChange = (open) => game.pause(open);
  }
  lab.open();
};

// ── YOU PLAY secret ──
const youPlay = new YouPlay(game, hud.heartsButton);
brainUI.onYouPlay = () => youPlay.enter();

// On phones the ground sits above the bottom level bar (and above the
// touch D-pad in YOU PLAY) so the runner is never hidden behind them.
const hasTouchPad = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const updateInset = () => {
  const phone = window.innerWidth <= 700;
  const bar = phone ? 68 : 0;
  const pad = youPlay.active && hasTouchPad ? 96 : 0;
  game.setBottomInset(bar + pad);
};
youPlay.onChange = (on) => {
  brainUI!.setHuman(on);
  updateInset();
};
window.addEventListener('resize', updateInset);
updateInset();

// ── Sections ──
initNavigation(game, sectionEls);
initStatus();
initScores();
initCartridges(content);
initCountdown();
initContactForm(content);
initCredits();
initActiveSection(sectionEls, (i) => game.goTo(i));

if (reduced) {
  // Static scenes, no animation loop: draw the game and brain views once.
  game.renderNow();
  brainUI.frame(performance.now(), 0);
  initDialog();
} else if (root.classList.contains('intro-pending')) {
  // Draw one frame under the intro so the page is ready when it ends.
  game.renderNow();
  void runIntro({ firstName: content.firstName, touch, generations: champion.meta.generations }).then(() => {
    game.start();
    initDialog();
    brainUI!.startTips();
  });
} else {
  game.start();
  initDialog();
  brainUI.startTips();
}

// Friendly console easter egg for curious devs.
console.log(
  '%cPIXEL QUEST%c\nA 223-weight neural net is playing this page. Try ↑↑↓↓←→←→BA.',
  'font: 16px monospace; color: #FFD447; background: #100C26; padding: 4px 8px',
  'color: #B3ADD6',
);

// Dev-only handle for testing in the browser console (removed from production builds).
if (import.meta.env.DEV) (window as unknown as { __pq: unknown }).__pq = { game, brainUI, youPlay };
