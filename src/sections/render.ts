/**
 * Renders every section of the site to an HTML string from content.ts.
 *
 * This runs at BUILD time (see the plugin in vite.config.ts), so the
 * final index.html already contains all the text: the site is readable
 * and crawlable without JavaScript. main.ts then adds the game layer
 * and interactivity on top.
 *
 * Keep this file free of DOM APIs: it runs in Node.
 */
import type { Content, Project } from '../content.ts';

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export interface SectionMeta {
  id: string;
  world: string;
  theme: string;
  nav: string;
  short: string;
}

/** Section order = level order. `theme` must be a ThemeId. */
export const SECTIONS: SectionMeta[] = [
  { id: 'top', world: '1', theme: 'night', nav: 'HOME', short: 'HOME' },
  { id: 'about', world: '2', theme: 'sky', nav: 'ABOUT', short: 'ABOUT' },
  { id: 'xp', world: '3', theme: 'mine', nav: 'EXPERIENCE', short: 'EXP' },
  { id: 'projects', world: '4', theme: 'factory', nav: 'PROJECTS', short: 'PROJECTS' },
  { id: 'brain', world: '5', theme: 'circuit', nav: 'AI BRAIN', short: 'AI' },
  { id: 'contact', world: '6', theme: 'castle', nav: 'CONTACT', short: 'CONTACT' },
];

const HEART = '<svg class="px" viewBox="0 0 7 6" aria-hidden="true"><path d="M1 0h2v1h1v-1h2v1h1v2h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-2h1z"/></svg>';
const CASTLE = '<svg class="px" viewBox="0 0 7 6" aria-hidden="true"><path d="M0 0h1v1h1v-1h1v1h1v-1h1v1h1v-1h1v6h-3v-2h-1v2h-3z"/></svg>';
const PLAY = '<svg class="px" viewBox="0 0 8 8" aria-hidden="true"><path d="M1 0h2v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-2z"/></svg>';
/** Locked, non-clickable badge for projects whose code is in a private repo. */
export const PRIVATE_BADGE =
  '<span class="btn btn--ghost btn--sm btn--locked" title="The code is in a private repository"><svg class="px" viewBox="0 0 8 8" aria-hidden="true"><path fill-rule="evenodd" d="M2 0h4v1h1v3h1v4h-8v-4h1v-3h1zM3 1v3h2v-3zM3 5v2h2v-2z"/></svg>PRIVATE REPO</span>';
const EXT = '<span class="sr-only"> (opens in a new tab)</span>';
const LINKEDIN_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>';
const GITHUB_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3"/></svg>';

const ordinal = (n: number) => `${n}${n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH'}`;

export function renderHud(c: Content): string {
  return `
<header class="hud" id="hud">
  <div class="hud__cell"><span class="hud__k">PLAYER 1</span><span class="hud__v">${esc(c.gamertag)}</span></div>
  <div class="hud__cell"><span class="hud__k">SCORE</span><span class="hud__v" data-hud="score">000000</span></div>
  <div class="hud__cell hud__coins"><span class="hud__k">COINS</span><span class="hud__v"><span class="coin-ico" aria-hidden="true"></span>&times;<span data-hud="coins">00</span></span></div>
  <div class="hud__cell"><span class="hud__k">WORLD</span><span class="hud__v" data-hud="world">1</span></div>
  <div class="hud__cell hud__lives"><span class="hud__k">LIVES</span>
    <button class="hud__hearts" type="button" data-hud="lives" aria-label="Lives: 3">${HEART}${HEART}${HEART}</button>
  </div>
  <div class="hud__toggles">
    <button class="tgl" type="button" data-toggle="sound" aria-pressed="false" aria-label="Sound">SND <span class="tgl__s">OFF</span></button>
    <button class="tgl" type="button" data-toggle="crt" aria-pressed="true" aria-label="CRT effect">CRT <span class="tgl__s">ON</span></button>
    <a class="tgl tgl--icon" href="${esc(c.links.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn profile (opens in a new tab)">${LINKEDIN_ICON}</a>
    <a class="tgl tgl--icon" href="${esc(c.links.github)}" target="_blank" rel="noopener" aria-label="GitHub profile (opens in a new tab)">${GITHUB_ICON}</a>
  </div>
</header>`;
}

function worldMap(): string {
  const nodes = SECTIONS.map((s, i) => {
    const last = i === SECTIONS.length - 1;
    const box = last ? CASTLE : s.world;
    return `${i ? '<span class="wm__path" aria-hidden="true"></span>' : ''}<a class="wm__node${i === 0 ? ' is-here' : ''}${last ? ' is-castle' : ''}" href="#${s.id}" data-goto="${i}"><span class="wm__box">${box}</span><span class="wm__label">${esc(s.nav)}</span></a>`;
  }).join('');
  return `<nav class="wm" aria-label="World map"><span class="k-label">WORLD MAP</span><div class="wm__row">${nodes}</div></nav>`;
}

export function renderHero(c: Content): string {
  const [first, ...rest] = c.name.split(' ');
  const stats = c.stats
    .map((s) => {
      const v = s.label === 'PROJECTS' ? String(c.projects.length) : s.value;
      return `<li><span class="stat__v${v === '∞' ? ' stat__v--inf' : ''}">${esc(v)}</span><span class="stat__k">${esc(s.label)}</span></li>`;
    })
    .join('');
  return `
<section class="level level--hero" id="top" data-world="1" data-theme="night" aria-labelledby="hero-title">
  <div class="hero">
    <div class="hero__main">
      <p class="k-label hero__kicker">PLAYER 1 · READY</p>
      <h1 class="hero__title" id="hero-title"><span>${esc(first)}</span> <span>${esc(rest.join(' '))}</span></h1>
      <p class="hero__sub">${esc(c.role)} <span class="hero__slash">//</span> BUILDS ${esc(c.builds)}</p>
      <ul class="stats" aria-label="Stats">${stats}</ul>
      <div class="hero__ctas">
        <a class="btn btn--primary" href="#about" data-goto="1"><span class="blink" aria-hidden="true">▶</span>PRESS START</a>
        <a class="btn btn--ghost" href="#contact" data-goto="5">CONTACT</a>
      </div>
      ${worldMap()}
    </div>
    <div class="dialog rpg" id="dialog" aria-live="polite">
      <span class="dialog__name">${esc(c.name)}</span>
      <p class="dialog__text" data-lines="${esc(JSON.stringify(c.dialog))}">${esc(c.dialog.join(' '))}</p>
      <button class="dialog__next" type="button" aria-label="Next line"><span class="blink">▼</span></button>
    </div>
  </div>
</section>`;
}

export function renderAbout(c: Content): string {
  const skills = c.skills
    .map((s) => {
      const lvl = Math.max(1, Math.min(10, Math.round(s.level)));
      const blocks = Array.from({ length: 10 }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
      return `<li class="skill" data-level="${lvl}"><span class="skill__n">${esc(s.name)}</span><span class="skill__bar" role="img" aria-label="${esc(s.name)}: level ${lvl} of 10">${blocks}</span><span class="skill__up" aria-hidden="true">LEVEL UP!</span></li>`;
    })
    .join('');
  const quests = c.quests
    .map((q) => `<li><span class="quest__mark" aria-hidden="true">!</span><span><b class="quest__name">${esc(q.name)}</b> ${esc(q.text)}</span></li>`)
    .join('');
  const also = c.alsoSpeaks.map((a) => `<li>${esc(a)}</li>`).join('');
  return `
<section class="level" id="about" data-world="2" data-theme="sky" aria-labelledby="about-title">
  <div class="level__head">
    <div><p class="k-label">WORLD 2</p><h2 class="h2" id="about-title">ABOUT</h2><p class="level__sub">WHO I AM, WHAT I'M GOOD AT AND WHAT I'M LEARNING.</p></div>
    <a class="btn btn--ghost btn--sm" href="${esc(c.proudMoment.url)}" target="_blank" rel="noopener">${PLAY}${esc(c.proudMoment.label)}${EXT}</a>
  </div>
  <div class="about">
    <div class="rpg about__card">
      <div class="about__id">
        <div class="photo"><img src="${esc(c.photo)}" alt="Photo of ${esc(c.fullName)}" width="150" height="150" loading="lazy" decoding="async"></div>
        <dl class="about__dl">
          <dt>NAME</dt><dd>${esc(c.name)}</dd>
          <dt>CLASS</dt><dd>${esc(c.className)}</dd>
          <dt>HOME</dt><dd>${esc(c.location)}</dd>
          <dt>LIKES</dt><dd>${esc(c.likes)}</dd>
        </dl>
      </div>
      <p class="about__bio">${esc(c.bio)}</p>
      <div><p class="k-label">ALSO SPEAKS</p><ul class="chips">${also}</ul></div>
    </div>
    <div class="rpg about__skills">
      <h3 class="h3">SKILLS</h3>
      <ul class="skills">${skills}</ul>
      <hr class="rule">
      <h3 class="k-label">ACTIVE QUESTS</h3>
      <ul class="quests">${quests}</ul>
    </div>
  </div>
</section>`;
}

export function renderExperience(c: Content): string {
  const rows = c.experience
    .map((j, i) => {
      const id = `job-${i}`;
      const ach = j.achievements.map((a) => `<li>+ ${esc(a)}</li>`).join('');
      const tech = j.tech.map((t) => `<li>${esc(t)}</li>`).join('');
      const now = /NOW/.test(j.years);
      const cells = `<span class="score__rank">${ordinal(i + 1)}</span><span class="score__team">${esc(j.team)}${j.type ? `<small class="score__type">${esc(j.type)}</small>` : ''}</span><span class="score__role">${esc(j.role)}</span><span class="score__years">${esc(j.years)}${now ? '<span class="blink" aria-hidden="true">_</span>' : ''}</span>`;
      // A job with no details yet is a plain row (nothing to expand).
      if (!ach && !tech) return `<li class="score${i === 0 ? ' is-top' : ''}"><div class="score__row">${cells}</div></li>`;
      return `<li class="score${i === 0 ? ' is-top' : ''}">
        <button class="score__row" type="button" aria-expanded="true" aria-controls="${id}">${cells}</button>
        <div class="score__more" id="${id}">${ach ? `<ul class="score__ach">${ach}</ul>` : ''}${tech ? `<ul class="chips chips--sm">${tech}</ul>` : ''}</div>
      </li>`;
    })
    .join('');
  const n = c.experience.length + 1;
  return `
<section class="level" id="xp" data-world="3" data-theme="mine" aria-labelledby="xp-title">
  <div class="level__head level__head--center">
    <div><p class="k-label">WORLD 3</p><h2 class="h2" id="xp-title">EXPERIENCE</h2><p class="level__sub">WHERE I'VE WORKED AND STUDIED.</p></div>
  </div>
  <div class="scores">
    <div class="scores__head" aria-hidden="true"><span>RANK</span><span>TEAM</span><span>ROLE</span><span>YEARS</span></div>
    <ol class="scores__list">${rows}
      <li class="score score--coin">
        <a class="score__row" href="#contact" data-goto="5">
          <span class="score__rank">${ordinal(n)}</span><span class="score__team">YOUR TEAM?</span><span class="score__role">${esc(c.wantedRole)}</span><span class="score__years"><span class="blink">INSERT COIN</span></span>
        </a>
      </li>
    </ol>
  </div>
</section>`;
}

function cartridge(p: Project, i: number): string {
  const shot = p.screenshots[0]
    ? `<img src="${esc(p.screenshots[0])}" alt="" loading="lazy" decoding="async">`
    : `<span class="cart__ph" aria-hidden="true">${esc(p.name.split(' ').map((w) => w[0]).join('').slice(0, 3))}</span>`;
  return `
<article class="cart-slot" data-cat="${esc(p.category)}" data-idx="${i}">
  <span class="cart-slot__p1 blink" aria-hidden="true">▼ P1</span>
  <button class="cart cart--${p.color}" type="button" data-project="${esc(p.id)}" aria-haspopup="dialog">
    <span class="cart__grip" aria-hidden="true"></span>
    <span class="cart__label">
      <span class="cart__shot">${shot}</span>
      <span class="cart__name">${esc(p.name)}</span>
      <span class="cart__meta">${esc(p.year)} · ${esc(p.tech.slice(0, 2).join(' · '))}</span>
      <span class="cart__cta" aria-hidden="true"><span class="blink">▶</span> <span class="cart__cta-click">CLICK</span><span class="cart__cta-tap">TAP</span> FOR DETAILS</span>
    </span>
    <span class="sr-only">Open details for ${esc(p.name)}</span>
  </button>
  <p class="cart-slot__line">${esc(p.tagline)}</p>
  <div class="cart-slot__btns">
    ${p.siteUrl ? `<a class="btn btn--ghost btn--sm" href="${esc(p.siteUrl)}" target="_blank" rel="noopener">VISIT SITE${EXT}</a>` : ''}
    ${p.codeUrl ? `<a class="btn btn--ghost btn--sm" href="${esc(p.codeUrl)}" target="_blank" rel="noopener">VIEW CODE${EXT}</a>` : ''}
    ${p.privateRepo ? PRIVATE_BADGE : ''}
  </div>
</article>`;
}

export function renderProjects(c: Content): string {
  const cats = ['ALL', ...new Set(c.projects.map((p) => p.category))];
  const filters = cats
    .map((cat, i) => `<button class="filter${i === 0 ? ' is-on' : ''}" type="button" data-filter="${esc(cat)}" aria-pressed="${i === 0}">${esc(cat)}</button>`)
    .join('');
  return `
<section class="level" id="projects" data-world="4" data-theme="factory" aria-labelledby="projects-title">
  <div class="level__head">
    <div><p class="k-label">WORLD 4</p><h2 class="h2" id="projects-title">PROJECTS</h2><p class="level__sub">MY CODING PROJECTS. CLICK A CARTRIDGE FOR DETAILS.</p></div>
  </div>
  <div class="filters" role="group" aria-label="Filter projects by category">${filters}</div>
  <div class="carts" id="carts">${c.projects.map(cartridge).join('')}</div>
  <p class="carts__hint" aria-hidden="true">◀ SWIPE ▶</p>
</section>`;
}

export function renderBrain(): string {
  return `
<section class="level" id="brain" data-world="5" data-theme="circuit" aria-labelledby="brain-title">
  <div class="level__head">
    <div><p class="k-label">WORLD 5</p><h2 class="h2" id="brain-title">NEURAL NET</h2><p class="level__sub">THE AI THAT PLAYS THIS SITE. IT'S A REAL NETWORK, TRAINED BY EVOLUTION.</p></div>
    <div class="brain__ctas">
      <button class="btn btn--primary btn--sm" type="button" data-open-lab>TRAIN IT YOURSELF</button>
      <button class="btn btn--ghost btn--sm" type="button" data-you-play>▶ PLAY IT YOURSELF</button>
    </div>
  </div>
  <div class="brain">
    <div class="rpg brain__net">
      <div class="brain__bar"><span class="k-label">LIVE BRAIN</span><span class="brain__mode" data-brain="mode">AI DRIVING</span></div>
      <canvas class="brain__canvas" data-brain-canvas="section" role="img" aria-label="Live diagram of the neural network that controls the runner: 8 senses on the left, two hidden layers, 5 actions on the right."></canvas>
      <noscript><p>The live network diagram needs JavaScript.</p></noscript>
    </div>
    <div class="brain__side">
      <div class="rpg readouts">
        <dl>
          <dt>GENERATION</dt><dd data-brain="gen">-</dd>
          <dt>FITNESS</dt><dd data-brain="fit">-</dd>
          <dt>PARAMS</dt><dd data-brain="params">-</dd>
          <dt>EPISODES</dt><dd data-brain="episodes">0</dd>
          <dt>SKILLS</dt><dd data-brain="skills">0/8</dd>
        </dl>
        <p class="k-label">TRAINING FITNESS</p>
        <canvas class="chart" data-brain-chart role="img" aria-label="Chart of best and average fitness per generation during training"></canvas>
        <p class="chart__key"><span class="key key--y"></span>BEST <span class="key key--p"></span>AVERAGE</p>
      </div>
      <div class="skills-box">
        <h3 class="skills-box__title">SKILLS THE AI HAS SHOWN YOU <span class="skills-box__count" data-brain="skills">0/8</span></h3>
        <p class="skills-box__hint">Each one unlocks the first time you see the runner do it.</p>
        <ul class="skill-list" data-brain="skill-list" aria-label="Skills learned"></ul>
      </div>
    </div>
  </div>
  <details class="rpg how">
    <summary>HOW IT WORKS</summary>
    <div class="how__body">
      <p><b>The brain.</b> A small neural network (a multilayer perceptron: 8 inputs, hidden layers of 10 and 8 neurons, 5 outputs, 223 weights) controls the runner. Every frame it reads 8 senses: distance to the next gap, gap width, distance and height of the nearest enemy, a coin above, a wall ahead, whether it's on the ground, and its vertical speed. Its 5 outputs decide how fast to run and whether to jump, double jump, dive or dash.</p>
      <p><b>How it learned.</b> Nobody hand-coded the moves. The weights were found offline with neuroevolution: a genetic algorithm ran a population of networks on seeded levels of all six themes, scored each one (distance, coins and stomps, minus a penalty for dying), kept the best, and bred the next generation with crossover and random mutation. The script is <code>npm run train</code>; the chart shows its best and average fitness per generation. The same physics code runs here and in training, so the site plays exactly the brain that was trained.</p>
      <p><b>The growing map.</b> The full network drives the runner the whole time. The map starts mostly hidden and reveals a pathway (the strongest weighted connections from the relevant senses to an action) the first time you see the runner use that behaviour. Yellow edges are positive weights, pink are negative, thicker means stronger; squares glow with live activation.</p>
      <p><b>Watch it learn.</b> Press <b>TRAIN IT YOURSELF</b> to open the Training Lab: a fresh population of ghost runners starts from random weights and learns a level live, generation after generation, in your browser.</p>
      <p><b>Your turn.</b> Press <b>PLAY IT YOURSELF</b> to give the AI a break and take the controls.</p>
    </div>
  </details>
</section>`;
}

export function renderContact(c: Content): string {
  return `
<section class="level" id="contact" data-world="6" data-theme="castle" aria-labelledby="contact-title">
  <div class="contact">
    <div class="contact__left">
      <p class="k-label">WORLD 6 · BOSS CASTLE</p>
      <h2 class="h2 h2--pink" id="contact-title">CONTINUE?</h2>
      <p class="countdown" aria-hidden="true"><span data-countdown>9</span></p>
      <p class="contact__text">GET IN TOUCH BEFORE THE TIMER HITS ZERO. OPEN TO ${esc(c.openTo)}.</p>
      <div class="contact__links">
        <a class="btn btn--ghost btn--sm" href="${esc(c.links.linkedin)}" target="_blank" rel="noopener">LINKEDIN${EXT}</a>
        <a class="btn btn--ghost btn--sm" href="${esc(c.links.github)}" target="_blank" rel="noopener">GITHUB${EXT}</a>
        <a class="btn btn--ghost btn--sm" href="mailto:${esc(c.links.email)}">EMAIL</a>
      </div>
    </div>
    <form class="rpg form" id="contact-form" novalidate ${c.formspreeId ? `action="https://formspree.io/f/${esc(c.formspreeId)}" method="POST"` : `action="mailto:${esc(c.links.email)}" method="GET"`}>
      <h3 class="h3">NEW MESSAGE</h3>
      <div class="field"><label for="f-name">ENTER NAME</label><input id="f-name" name="name" type="text" autocomplete="name" placeholder="AAA" required maxlength="80"><span class="field__err" id="f-name-err" aria-live="polite"></span></div>
      <div class="field"><label for="f-email">EMAIL</label><input id="f-email" name="email" type="email" autocomplete="email" placeholder="YOU@COMPANY.COM" required maxlength="120"><span class="field__err" id="f-email-err" aria-live="polite"></span></div>
      <div class="field"><label for="f-msg">MESSAGE</label><textarea id="f-msg" name="message" placeholder="WHAT'S THE QUEST?" required maxlength="4000" rows="5"></textarea><span class="field__err" id="f-msg-err" aria-live="polite"></span></div>
      <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
      <button class="btn btn--primary btn--block" type="submit">INSERT COIN ▶ SEND</button>
      <p class="form__status" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`;
}

export function renderFooter(c: Content): string {
  const year = new Date().getFullYear();
  return `
<footer class="credits" id="credits">
  <div class="credits__roll" aria-label="Credits">
    <p class="k-label">CREDITS</p>
    <dl>
      <dt>DESIGN &amp; CODE</dt><dd>${esc(c.name)}</dd>
      <dt>AI PILOT</dt><dd>223-WEIGHT NEURAL NET</dd>
      <dt>TRAINED BY</dt><dd>NEUROEVOLUTION</dd>
      <dt>SOUND</dt><dd>WEB AUDIO SYNTH</dd>
    </dl>
    <p class="credits__note">${esc(c.footerNote)}</p>
    <p class="credits__secret">PSST… ↑ ↑ ↓ ↓ ← → ← → B A <span class="credits__or">(OR TAP THE HEARTS 5×)</span></p>
  </div>
  <div class="credits__flag" aria-hidden="true"><span class="flag__pole"></span><span class="flag__cloth"></span><span class="flag__base"></span></div>
  <div class="credits__bar"><span>THANKS FOR PLAYING</span><span>© ${year} ${esc(c.name)}</span><span>CREDITS 00</span></div>
</footer>`;
}

export function renderLevelBar(): string {
  const items = SECTIONS.slice(1)
    .map((s, i) => `<a href="#${s.id}" data-goto="${i + 1}" data-bar="${i + 1}"><span class="lb__w">${s.world}</span>${esc(s.short)}</a>`)
    .join('');
  return `<nav class="level-bar" aria-label="Levels">${items}</nav>`;
}

export function renderApp(c: Content): string {
  return [
    '<a class="skip-link" href="#main">SKIP TO CONTENT</a>',
    '<div class="game-wrap" aria-hidden="true"><canvas id="game" class="game"></canvas></div>',
    renderHud(c),
    '<main id="main">',
    renderHero(c),
    renderAbout(c),
    renderExperience(c),
    renderProjects(c),
    renderBrain(),
    renderContact(c),
    '</main>',
    renderFooter(c),
    renderLevelBar(),
    '<button class="brain-widget" type="button" id="brain-widget" aria-label="Open the AI brain: see the neural network that plays this game" aria-haspopup="dialog"><canvas width="32" height="32" aria-hidden="true"></canvas><span class="brain-widget__label">AI BRAIN<small>CLICK ME</small></span><span class="brain-tip" aria-hidden="true">An <b>AI</b> is playing this game! Click to see its brain think live.</span></button>',
    '<div class="quip" id="quip" aria-hidden="true"></div>',
    '<div class="toasts" id="toasts" role="status" aria-live="polite"></div>',
    '<div class="world-card" id="world-card" aria-hidden="true"><span class="world-card__w"></span><span class="world-card__n"></span></div>',
    '<div class="crt" aria-hidden="true"></div>',
  ].join('\n');
}
