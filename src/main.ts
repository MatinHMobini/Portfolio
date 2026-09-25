/**
 * Pixel Quest entry point. The HTML (all real content) is already in
 * the page; this boots the intro, the game layer, the AI brain and all
 * the interactive bits on top of it.
 */
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
game.onFrame = (now, dt) => brainUI!.frame(now, dt);

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
youPlay.onChange = (on) => brainUI!.setHuman(on);

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
  // Static scenes, no animation loop.
  game.renderNow();
  initDialog();
} else if (root.classList.contains('intro-pending')) {
  // Draw one frame under the intro so the page is ready when it ends.
  game.renderNow();
  void runIntro({ firstName: content.firstName, touch }).then(() => {
    game.start();
    initDialog();
  });
} else {
  game.start();
  initDialog();
}

// Friendly console easter egg for curious devs.
console.log(
  '%cPIXEL QUEST%c\nA 223-weight neural net is playing this page. Try ↑↑↓↓←→←→BA.',
  'font: 16px monospace; color: #FFD447; background: #100C26; padding: 4px 8px',
  'color: #B3ADD6',
);
