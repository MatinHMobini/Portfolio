# PIXEL QUEST · Matin Mobini's portfolio

A retro-arcade (16-bit, CRT) portfolio where **every section is a playable level**, and the little
runner is driven by a **real neural network trained with neuroevolution**.

Live: https://matinhmobini.github.io/Portfolio/

```
World 0   Intro       pixel bedroom → spawn → terminal → ./matin_portfolio.exe → boot
World 1-1 Hero        night overworld, HUD, world map, typewriter dialog
World 1-2 Status      sky level: about, photo, skill bars that level up, quests
World 1-3 High Scores underground mine: work experience as an arcade table
World 1-4 Cartridges  tech factory with conveyor belts: projects as game cartridges
World 1-5 Neural Net  circuit world: the live brain, ML readouts, Training Lab
World 1-6 Continue?   boss castle with lava: countdown + contact form
```

## Quick start

Needs Node.js 22.6+ (LTS recommended).

```bash
npm install
npm run dev        # http://localhost:5173/Portfolio/
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve `dist/` at http://localhost:4173/Portfolio/ |
| `npm run train` | Retrain the AI; writes `src/ai/champion.json` |
| `npm run evaluate` | Test the trained AI on levels it has never seen |

Add `?nointro` to the URL to skip the intro while developing.

## Edit your content

Everything you'd want to change (name, bio, jobs, projects, skills, links, Formspree id) is in
**`src/content.ts`**. Your photo is `public/photo.jpg`, your CV is `public/cv.pdf`.
Search for `[PLACEHOLDER` to find the gaps still to fill.

## How the AI works (short version)

- `src/ai/network.ts`: a multilayer perceptron, 8 senses → 10 → 8 → 5 actions (223 weights).
- `src/ai/neuroevolution.ts`: genetic algorithm (tournament selection, elitism, neuron-level
  crossover, gaussian mutation).
- `scripts/train.ts`: evolves a population on seeded levels of all six themes using the **same**
  physics and level code as the browser, then saves the champion.
- In the browser the champion drives the runner every frame; the brain diagram shows its live
  activations, and the **Training Lab** runs the same algorithm live in a Web Worker.

## More docs

- **[GUIDE.md](GUIDE.md)**: step-by-step guide from installing the tools to deploying on GitHub Pages.
- **[docs/SPEC.md](docs/SPEC.md)**: full design spec, decisions and placeholders.

## Secrets

↑ ↑ ↓ ↓ ← → ← → B A (or tap the hearts 5×) lets you play instead of the AI.

Tech: Vite, TypeScript, Canvas 2D, Web Audio, Web Workers. Zero runtime dependencies.
