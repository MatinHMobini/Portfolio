# Pixel Quest · Design spec

Owner: Matin Mobini (GitHub `MatinHMobini`), deployed at https://matinhmobini.github.io/Portfolio/.
This document describes what was built, how, the decisions made along the way and what is still a
placeholder. It reflects the code in this repository.

---

## 1. Goals

- A gamer-themed personal portfolio that is **impressive first** (desktop visuals lead), and still
  works well on phones.
- Show the owner's AI/ML side with a **real** machine-learning component, not a fake animation.
- Real content (from the old site and GitHub), edited in one file.
- Fast, accessible, readable without JavaScript, deployable to GitHub Pages with zero servers.

## 2. Visual design: concept B "Pixel Quest"

Chosen from the design canvas (concepts A and C were not chosen).

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#100C26` | page background |
| `--panel` | `#1C1645` | RPG windows |
| `--row` | `#16113A` | table rows |
| `--dark` / `--mid` | `#2A2266` / `#3B3380` | depth, empty blocks |
| `--border` | `#5B4FC4` | purple outer border |
| `--text` | `#F5F2FF` | text, window border |
| `--muted` / `--muted-2` | `#B3ADD6` / `#9D97C7` | secondary text |
| `--body` | `#E4E0FA` | long text |
| `--yellow` | `#FFD447` | primary accent |
| `--pink` | `#FF5C8A` | secondary accent, hard shadows |
| `--cyan` | `#3DDCFF` | sparingly (focus rings, kicker) |

- **RPG window**: 4px `#F5F2FF` border + `box-shadow: 0 0 0 4px #100C26, 0 0 0 8px #5B4FC4`.
- **Primary button**: yellow fill, dark text, Press Start 2P, hard pink shadow `6px 6px 0`.
  Secondary: 4px white outline. Buttons "press" with a stepped translate.
- **Type**: "Press Start 2P" for display, "VT323" for body (22–36px). Headings yellow with a hard
  pink text-shadow.
- **CRT**: scanline overlay + vignette + a subtle flicker; the **CRT** toggle in the HUD turns it off
  (remembered in `localStorage`).
- **Animation style**: `steps()` timing everywhere so motion feels like sprite frames.
- All **pixel art is code**: palette-indexed string grids in `src/game/sprites.ts` (character,
  enemies, coins, hearts, castle, moon/sun, flag, spring, torch, ore, gear, chip, bush) and
  procedural tiles and backgrounds in `src/game/themes.ts`. Rendering uses integer scaling,
  `imageSmoothingEnabled = false` and `image-rendering: pixelated`.
- Player sprite: yellow headset, dark brown hair `#3A2A1A`, skin `#F2B38A`, pink hoodie, white
  controller, purple pants, white shoes. Frames: idle, run ×3, jump, dive (stomp), sit, type ×2;
  landing squash and falling spin are transforms.

## 3. Architecture

```
index.html            shell; <!--APP--> is replaced at build time with the rendered site
vite.config.ts        base '/Portfolio/' + plugin that renders content.ts into index.html
src/content.ts        ALL copy and personal data
src/main.ts           boots everything
src/sections/         render.ts (HTML strings, runs in Node at build time), interactions.ts
src/game/             constants, rng, level, physics, senses (shared with training)
                      sprites, themes, renderer, particles, game (browser only)
src/ai/               network, neuroevolution, policy (shared with training)
                      champion.json (the trained brain), brain-state, brain-visual, brain-ui,
                      lab-sim, lab.worker, training-lab
src/intro/intro.ts    World 0
src/audio/sfx.ts      Web Audio synth
src/ui/               hud, toasts, konami, you-play
src/styles/           base, sections, overlays, responsive
src/dev/raf-shim.ts   dev-only test helper (stripped from production)
scripts/train.ts      offline neuroevolution trainer
scripts/evaluate.ts   champion evaluation on unseen levels
tests/                Vitest unit tests
public/               photo, CV, project screenshots, favicon, og image
```

**Decision: content rendered at build time.** The brief asked for one editable content file *and*
for the content to be readable without JavaScript. A tiny Vite plugin imports `src/content.ts`,
renders every section to HTML with pure functions (`src/sections/render.ts`) and injects it into
`index.html`. JavaScript then only *enhances* the page. Editing `content.ts` restarts the dev server
automatically.

**Decision: one shared simulation.** `constants.ts`, `rng.ts`, `level.ts`, `physics.ts`,
`senses.ts`, `network.ts`, `neuroevolution.ts` and `policy.ts` have no DOM code. They are imported by
the browser, by the Training Lab worker and by `scripts/train.ts` (Node runs the TypeScript directly
with type stripping), so the champion plays on the site exactly as it did in training. The
`erasableSyntaxOnly` TypeScript flag enforces Node-compatible syntax.

**Dependencies**: zero at runtime. Dev: `vite`, `typescript`, `vitest`, `@types/node` (needed for the
Node scripts and tests). No `tsx`: Node's built-in type stripping runs the trainer.

## 4. Sections (levels)

| World | Section | Level theme | Highlights |
| --- | --- | --- | --- |
| 0 | Intro | pixel bedroom | spawn beam, walk, sit, type, camera push-in, terminal, boot log, glitch |
| 1 | Home | night overworld | stars, moon, stepped mountains, brick ground; HUD; world map; dialog |
| 2 | ABOUT | sky / clouds | photo de-pixelates, NAME/CLASS/HOME/LIKES, bio, 10-block skill bars + LEVEL UP!, quests, LOAD MATIN'S RESUME |
| 3 | EXPERIENCE | underground mine | torches, ore, beams; arcade-table rows, all open by default (click folds); dashed INSERT COIN row → contact |
| 4 | PROJECTS | tech factory | conveyor belts (real physics), gears; cartridge cards, ▼ P1 marker, hover lift, insert-into-console animation, detail modal, category filter, phone carousel; VIEW CODE only (no PLAY links) |
| 5 | NEURAL NET | circuit board | live brain, readouts, fitness chart, labelled skills box, HOW IT WORKS, TRAIN IT YOURSELF, PLAY IT YOURSELF |
| 6 | CONTINUE? | boss castle, lava pits | real 9→0 countdown → "GAME OVER… JUST KIDDING", links, form with INSERT COIN ▶ SEND + 1UP |
| - | Footer | - | credits roll, waving victory flag, secret hint |

**Decision: page numbering and titles (owner, 2026-09-25).** Pages are numbered 1–6 (not 1-1 … 1-6)
everywhere: HUD, world map, section labels, WORLD cards, phone bar. Pages 2–4 use plain titles
that match the world map (ABOUT, EXPERIENCE, PROJECTS) so every visitor understands them; HOME,
NEURAL NET and CONTINUE? keep their game-style titles.

**Decision: HUD score.** The mockup's HUD said "SCORE [N] PROJECTS". The persistent HUD instead
shows a live game score (coins, stomps, level clears) plus a coin counter, and the hero shows a
stats strip (GPA, projects, jobs) so the project count is still visible.

**Decision: hero dialog follows the runner.** On wide screens the RPG dialog box floats above the
runner's head (smoothed), matching the mockup where the box sits above the character. On narrower
screens it sits in the page flow. Lines type out letter by letter with blips; click or ▼ advances;
passive visitors get auto-advance.

## 5. The live level runner

- A fixed canvas behind the content renders at game resolution (scale 2–4 CSS px per game pixel,
  chosen from the viewport height; always 2 on phones) and is upscaled crisply.
- Each section has its own seeded level (`generateLevel(seed, theme)`), with theme-specific gap
  sizes, steps, pillars, enemy density, flyer share, belts and max terrain height (the hero level is
  kept low so it never covers the world map).
- Fixed 60 Hz simulation with an accumulator; `requestAnimationFrame` render; pauses when the tab is
  hidden and while the Training Lab is open.
- Section change (scroll position crosses 55% of the viewport):
  - **down**: the floor under the runner opens, the runner falls spinning with motion lines while
    the old world scrolls up and the new world rises in, lands with a dust puff; a WORLD N card
    flashes.
  - **up**: a spring appears, the runner is launched up into the previous world.
  - Rapid scrolling queues the next transition.
- Lives: dying (pit/enemy) costs a heart and respawns at a safe spot with blinking invulnerability;
  at zero hearts a "GAME OVER? NAH. CONTINUE!" toast refills them. If the AI is stuck for 4 s it
  warps forward. Reaching the flag gives +1000 and generates the next level.
- Enemies: walkers (stomp from above, head-bonk from below, or dash through) and flyers that hover
  high enough to run under. Coins +100, stomps +200.
- Phones: shorter levels, fewer particles, runner placed further left.
- Reduced motion: no loop; a static scene is drawn for each section.

## 6. The AI brain (real ML)

**Network** (`src/ai/network.ts`): MLP 8 → 10 → 8 → 5, tanh hidden, sigmoid outputs, 223 weights in
one flat `Float32Array`.

**Senses** (`src/game/senses.ts`, normalised): gap distance, gap width, enemy distance, enemy relative
height, coin above/ahead, wall ahead (rise in the next 3 tiles), on-ground flag, vertical velocity.

**Actions** (`src/ai/policy.ts`): run speed (0.3–1 of max), jump, double jump, dive (stomp), dash
(> 0.5 = pressed).

**Training** (`scripts/train.ts`): neuroevolution with a seeded RNG. Defaults: population 150,
700 generations, tournament size 3, elitism 4, neuron-level crossover (rate 0.6), gaussian mutation
(10% of weights, σ 0.35) plus 1% weight resets. Each brain is scored on 12 levels per generation: 6
fixed (one per theme) plus 6 that rotate every 10 generations to avoid overfitting. Fitness =
distance (tiles) + 2·coins + 3·stomps − 15 if it died, +100 (+ a time bonus) for finishing. The final
champion is picked among the top 8 by performance on 18 held-out levels. Output: weights + metadata
(generations, population, params, episodes, held-out results, date) + best/mean fitness history.

Results of the shipped champion (700 generations × 150 brains, ~16 min on a laptop): it finished
12 of the 18 held-out levels during selection, and `npm run evaluate -- --levels 10` gives 36/60
fresh unseen levels finished: night 9/10, sky 7/10, mine 6/10, factory 5/10, castle 6/10,
circuit 3/10 (the enemy-heavy world). Run `npm run evaluate` for the per-theme breakdown. The champion is good, not perfect: it sometimes dies, which the lives system turns into
part of the show.

**Gameplay changes made to make learning work** (found by evaluating failures): flyers hover
1.7–2.6 tiles up so running under them is safe; hitting an enemy from below knocks it out; dashing
smashes enemies (gives DASH a purpose).

**Brain visual** (`brain-visual.ts`): pixel-square neurons labelled with senses/actions (short labels
on small canvases), edges yellow (positive) / pink (negative) with thickness by |weight|, neurons
glow with live activation, pulses travel along edges proportional to |weight × activation|.

**"It learns" / growing map** (`brain-state.ts`): skills are RUN, COIN GRAB, GAP JUMP, STOMP,
DOUBLE JUMP, WALL CLIMB, DIVE, DASH. The first time a behaviour happens on screen (physics event
flags), a "NEW SKILL LEARNED" toast pops and that skill's pathway is revealed: its senses, its
action(s) and the 2 strongest-weighted neurons per hidden layer on the way. Undiscovered neurons
show as faint dashed squares. **Honesty note**: the whole network always drives the runner; the
reveal is a visualisation of which pathways the visitor has seen used. The HOW IT WORKS text says
exactly this.

**ML readouts**: champion generation, final fitness, parameter count, episodes observed live
(deaths + level clears on this visit), skills learned, training fitness chart.

**Training Lab** (`training-lab.ts`, `lab-sim.ts`, `lab.worker.ts`): full-screen dialog; 20/50/100
ghost runners from random weights learn a 150-column level live with the same GA. Controls:
start/pause, speed 1× / 5× / 20× (steps per frame) / MAX (the worker runs flat out and streams
frames), mutation-rate slider, population size, new level (cycles themes), reset, load champion
(adds the pre-trained brain as a cyan ghost to race). Displays: generation, alive count, best/avg
fitness, number that cleared the level, log, fitness chart, and the leader's network live. Falls
back to the main thread if Workers are unavailable.

## 7. Intro (World 0)

`src/intro/intro.ts`. First visit: "PRESS ANY KEY TO SPAWN" (or "TAP TO SPAWN" on touch). Spawn beam
(0.9 s) → walk (1.3 s) → sit + monitor on → type → camera push-in (0.9 s) → terminal types
`> ./matin_portfolio.exe` → boot log with a stepped progress bar → glitch + flash + zoom through →
the site powers on (CRT turn-on). About 8 s after spawning.
Guardrails: SKIP button (focused) and Esc; `prefers-reduced-motion` skips it; `?nointro` skips it
for development.

**Decision (owner, 2026-09-25): the full intro plays on every page load**, replacing the brief's
"full once, then short" rule. The ~1.5 s terminal-only version still exists as
`runIntro({ short: true })` but is not used.
A dark cover hides the page before the intro starts and removes itself after 6 s if JavaScript
fails, so the content can never stay hidden.

## 8. Sound

`src/audio/sfx.ts`: jump, double jump, coin, stomp, dash, fall whoosh, land, spring, die, typewriter
blip, menu select, level-up, skill learned, coin insert, cartridge insert, 1UP, spawn, glitch,
countdown tick, game over. Square/triangle oscillators with pitch slides + band-passed noise. Muted
by default; SND toggle remembered in `localStorage`; per-sound throttling.

## 9. YOU PLAY (Konami secret)

↑ ↑ ↓ ↓ ← → ← → B A (detector in `src/ui/konami.ts`), or tap the HUD hearts 5 times within 2 s
(so phones can reach it). The visitor controls the runner: arrows/WASD, Space/W/↑ jump (again in the
air = double jump), ↓/S dive, Shift/X dash, Esc exits. Touch: on-screen D-pad + A (jump) / B (dash).
All page content turns fully transparent (and click-through) so the whole game is visible, the
YOU PLAY bar sits at the top under the HUD, and on touch screens the ground is lifted above the
D-pad. Besides the secret, a **PLAY IT YOURSELF** button in the brain popup and the NEURAL NET page
starts it; the brain shows HUMAN PLAYER. The network keeps
computing so the diagram stays live.

## 10. Contact form

Static hosting cannot send email. If `formspreeId` is set in `content.ts`, the form POSTs JSON to
Formspree (with a honeypot field); otherwise it opens the visitor's email app with a pre-filled
`mailto:`. Validation: name required, email format, message ≥ 10 characters; errors are announced
and linked with `aria-describedby`. Success plays the coin sound and a 1UP pop.

## 11. Phone

Stacked sections, sticky bottom level bar (2 ABOUT, 3 EXP, 4 PROJECTS, 5 AI, 6 CONTACT),
full-width buttons, swipeable cartridge carousel (scroll-snap), compact HUD, touch targets ≥ 44px,
lighter game layer, TAP wording, toasts docked above the bar one at a time.
Fixed during testing: the integer-scaled canvas and the carousel could widen the layout and make
phones zoom out; the canvas now sits in a clipping wrapper and the carousel uses paint containment.

## 12. Accessibility and quality

Semantic landmarks and headings; real buttons/links/labels; skip link; visible cyan focus rings;
native `<dialog>` for modals (focus trap + Esc); `aria-expanded` rows; `aria-pressed` toggles/filters;
`aria-live` for dialog text, toasts and form status; decorative canvases `aria-hidden`, the brain
canvases labelled `role="img"`; text contrast ≥ 4.5:1 on the dark background; reduced-motion
support; animations only run when visible; no console errors; meta description, Open Graph and
Twitter tags, favicon and touch icon from the owner's MM logo.

## 13. Testing

`npm test` (Vitest): network forward pass, GA (improves on a fixed seed, deterministic, elitism,
crossover, mutation, real runners improve), physics (ground, jump height, pits, walls, stomp, side
hit, dash smash, coins, belts, enemy patrol), seeded level generation (deterministic, constraints per
theme), RNG, Konami detector, content data shape (links, levels, files exist), build-time renderer
(content present, escaping, labels), Training Lab sim, champion shape + beats a random network, brain
reveal logic, sense normalisation.

Manual/automated browser checks were run at 1440×900 and 390×844 (headless Chrome): intro (full and
short), every section and transition, brain panel, Training Lab (1× and MAX), YOU PLAY, contact
validation and mailto fallback, reduced motion, no-JavaScript rendering of the production build,
and `npm run preview` under `/Portfolio/`.

## 14. Placeholders and assumptions (please review)

| Where | What |
| --- | --- |
| `content.ts` → `quests[2]` | `[PLACEHOLDER: A SIDE PROJECT IDEA]` (the first two are reasonable guesses: this site's neuroevolution and the SEG4180 applied-ML lab) |

| `content.ts` → Segmentation Lab description | ends with `[PLACEHOLDER: add a line about the dataset and results.]` |
| `content.ts` → `skills` levels | estimated from the old site (Java, Python, JS/TS, SQL, React, Android, ML); adjust |
| `content.ts` → `wantedRole`, `openTo` | guesses: "SOFTWARE / AI DEV", "INTERNSHIPS / FULL-TIME / FREELANCE" |
| `content.ts` → `formspreeId` | empty → mailto fallback until you create a Formspree form |
| `public/cv.pdf` | a one-page placeholder PDF; replace with your real CV |
| Project screenshots | Pixel Quest, Gambling Buddy, Segmentation Lab, HKFC, Parking Lot, Path Finder have none (pixel initials shown) |
| Gamertag | `MATINM` (Matin Mobini) |

Real content came from the old site (name, bio, GPA, Dean's Honour List, Merit Scholarship,
CrisperMe and Shoppers Drug Mart experience, the four projects and their screenshots, photo,
LinkedIn, GitHub, email) and the public GitHub profile and repositories (location, more projects,
READMEs). The phone number on the old site was intentionally not copied.

## 15. Owner updates (2026-09-25)

- Full intro on every page load (see §7).
- Projects show **VIEW CODE** only; the ▶ PLAY links were removed (`playUrl` stays in content.ts for later).
- Home runner sits slightly further left (64% of the width, was 70%); on phone widths the runner is
  always at 30%, checked live so resizing a desktop window also moves it.
- On phones the ground is drawn above the bottom level bar (and above the D-pad in YOU PLAY).
- GPA shown as 3.9/4; hobbies: gaming, basketball, gym; CV button reads "LOAD MATIN'S RESUME".
- Pages numbered 1–6; pages 2–4 titled ABOUT / EXPERIENCE / PROJECTS (see §4).
- Experience rows all start open.
- Favicon and touch icon use the owner's MM logo.
- The BRAIN button is bigger ("AI BRAIN · CLICK ME"), pulses with a glowing ring, and shows a speech
  bubble ("An AI is playing this game! Click to see its brain think live.") 2.5 s after boot and
  briefly every 45 s until it's clicked once.
- A labelled skills box ("SKILLS THE AI HAS SHOWN YOU x/8") above the 8 skill tiles, in both the
  NEURAL NET page and the brain popup; the "More AI/ML loot" links were removed.
- **Enemy jokes** (`src/game/quips.ts`): rarely, an enemy just ahead of the runner says a one-liner in
  a speech bubble for 3 s. First possible after 12 s, then at least 30 s apart plus ~20 s random, so
  roughly one a minute.

## 16. Owner updates (2026-09-26)

- **Experience now comes from the owner's resume** (LinkedIn blocks logged-out/automated reads, so
  the profile itself could not be used): Health Canada, Software Developer, Data Science & Analytics
  (May 2025 to now) and Junior Analyst (Jan to Apr 2025); CrisperMe (startup) Website Developer
  (Sep 2022 to Nov 2023); University of Ottawa (AI & ML concentration, graduating Dec 2026, VP of
  HKFC). The retail job was removed. The hero's JOBS stat counts roles only (\`education: true\`
  rows are skipped). The Health Canada tech chips are topic tags (the resume lists no stack for them).
- House Price (Kaggle data, Random Forest + GridSearchCV, RMSE 50,414), Cycling Club (2023, team of
  4 in 4 months) and HKFC (a uOttawa club the owner is part of) updated from the resume.
- Skills: Python is the top skill; AI / ML added; "also speaks" list from the resume.
- Active quests: Rally, the context-aware mental health RAG assistant, CropPilot.
- Wherever the owner's work is described, AI is written as AI/ML (hero, bio, dialog, wanted role,
  share image).
- Hero dialog: 11 lines (more jokes, "wanna see my loot" removed) that loop forever with a 5 s pause
  between lines; typing only happens while the home page is on screen.
- The dialog box follows a steady anchor (highest ground near the runner) with ~1.5 s easing, so
  jumps no longer shake it. Enemy joke bubbles anchor to the enemy's resting height.
- The AI BRAIN tip shows 2.5 s after boot, then 8 s out of every 18 s until the brain is opened.
- The skills counter uses the body font (the pixel font made 8 look like 0).
- LinkedIn and GitHub icon links in the HUD, right of SND and CRT (the WORLD cell is hidden on
  phones to make room; the bottom bar shows the current page).

## 17. Owner updates (2026-09-26, round 2)

- Experience from the owner's LinkedIn text: Adaptron Inc., AI Research & Robotics Engineer (co-op,
  May 2026 to now) is the current role, with details left empty for the owner to fill in (a job with
  no achievements/tech renders as a plain row with nothing to expand). Health Canada is now past
  (May 2025 to Jan 2026 and Jan to Apr 2025) with the LinkedIn bullets. A \`type\` field shows a small
  CO-OP tag under the company.
- Bio restored to the earlier wording, with nine-time Dean's Honour List and AI & Machine Learning.
- Player name MATINM; \`fullName\` is "Matin Mobini" (used in page metadata and the photo's alt text).
- Removed the "by day I build data science tools at Health Canada" dialog line.
- Brain popup: the explanation text sits under the network diagram, beside the buttons; the skills
  box moved up.
- World map / PRESS START / level bar scroll so the page's title block lands just under the HUD.
- The sky world's sun moved away from the page title (top-right corner on phones).
