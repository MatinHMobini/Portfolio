# Pixel Quest: the complete guide

From "I have a Windows 11 laptop" to "my new portfolio is live at
**https://matinhmobini.github.io/Portfolio/**". Every step says what to click, what to type and
what you should see. Nothing here assumes prior experience.

> **Conventions**
> - `Grey boxes` are things you type. Type them exactly, then press **Enter**.
> - "Terminal" means the terminal panel inside VS Code (you'll open it in part B).
> - Your project lives in **`C:\Users\mobin\Projects\Portfolio`**.

Contents

- [A. Install the tools](#a-install-the-tools)
- [B. Open the project in VS Code](#b-open-the-project-in-vs-code) (+ how it was created from scratch)
- [C. Run it on your computer](#c-run-it-on-your-computer)
- [D. Project tour](#d-project-tour)
- [E. Make it yours](#e-make-it-yours)
- [F. Retrain the AI, test, build](#f-retrain-the-ai-test-build)
- [G. Deploy to GitHub Pages](#g-deploy-to-github-pages)
- [H. Updating later + troubleshooting](#h-updating-later--troubleshooting)

---

## A. Install the tools

You need three programs. Install them in this order.

### A1. Visual Studio Code (the editor)

1. Go to **https://code.visualstudio.com/**
2. Click the big blue **Download for Windows** button. A file like `VSCodeUserSetup-x64-….exe`
   downloads.
3. Open it. Accept the agreement → **Next**.
4. On **Select Additional Tasks**, tick:
   - ☑ **Add "Open with Code" action to Windows Explorer file context menu**
   - ☑ **Add "Open with Code" action to Windows Explorer directory context menu**
   - ☑ **Add to PATH** (already ticked; keep it)
5. **Next** → **Install** → **Finish**.

**Check it worked:** VS Code opens with a Welcome tab.

### A2. Node.js LTS (runs the project's tools)

1. Go to **https://nodejs.org/en/download**
2. Choose the **LTS** version (Long Term Support; version 22 or newer), platform **Windows**,
   and click **Windows Installer (.msi)** for x64.
3. Open the `.msi`. **Next** → accept → **Next** → keep the default folder → **Next**.
4. On **Custom Setup** keep everything as is → **Next**.
5. On **Tools for Native Modules** you can leave the box **unticked** (not needed) → **Next** →
   **Install** → **Finish**.

**Check it worked:** open the Start menu, type **PowerShell**, open **Windows PowerShell**, and type:

```
node -v
```
You should see something like `v24.x.x` (any number 22.6 or higher is fine). Then:

```
npm -v
```
You should see a version like `11.x.x`.

> If PowerShell says `npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running
> scripts is disabled`, see [Troubleshooting → PowerShell blocks npm](#powershell-blocks-npm).

### A3. Git (version control, talks to GitHub)

1. Go to **https://git-scm.com/downloads/win**
2. Click **Click here to download** (the 64-bit Git for Windows Setup).
3. Open it and click **Next** through the screens. The defaults are good. Two screens to double-check:
   - **Choosing the default editor used by Git** → pick **Use Visual Studio Code as Git's default
     editor**.
   - **Adjusting the name of the initial branch in new repositories** → pick **Override the default
     branch name** and type `main`.
4. **Install** → **Finish**.

**Check it worked:** close and reopen PowerShell, then:

```
git --version
```
You should see `git version 2.x.x`.

### A4. This project uses your personal GitHub only

This project is tied to your **personal** GitHub account, **MatinHMobini**, and never your work
account. It's already set up **inside this project folder only** (your other repos are untouched):

| Setting | Value | Why |
| --- | --- | --- |
| `user.name` | `MatinHMobini` | name on every commit |
| `user.email` | `hmobinimatin@gmail.com` | email on every commit |
| `user.useConfigOnly` | `true` | Git refuses to commit if this project's identity is missing, instead of silently falling back to another one |
| `credential.https://github.com.username` | `MatinHMobini` | when pushing, Git asks for / uses the MatinHMobini login, not another saved GitHub login |

All existing commits are authored by `MatinHMobini <hmobinimatin@gmail.com>`.

Check it any time from the project folder:

```
cd C:\Users\mobin\Projects\Portfolio
git config --local --list
git log --format="%an <%ae>"
```

You should only ever see `MatinHMobini` / `hmobinimatin@gmail.com`.

> **Keep your email private (optional):** GitHub → Settings → Emails gives you a
> `…@users.noreply.github.com` address. To use it here:
> `git config user.email "12345+MatinHMobini@users.noreply.github.com"` (your real number is on
> that page). New commits will use it.

> **If you clone this project somewhere else,** these settings don't travel with it. Run the same
> commands in the new folder:
> ```
> git config user.name "MatinHMobini"
> git config user.email "hmobinimatin@gmail.com"
> git config user.useConfigOnly true
> git config credential.https://github.com.username MatinHMobini
> ```

---

## B. Open the project in VS Code

1. Open **VS Code**.
2. **File → Open Folder…** → go to `C:\Users\mobin\Projects\Portfolio` → **Select Folder**.
3. If VS Code asks **Do you trust the authors of the files in this folder?** click
   **Yes, I trust the authors** (it's your project).
4. Open the terminal: **Terminal → New Terminal** (or press **Ctrl + `**, the key left of **1**).
   A panel opens at the bottom showing something like
   `PS C:\Users\mobin\Projects\Portfolio>`. This is where you type the commands in this guide.

Recommended extensions (optional, click **Extensions** in the left bar and search):
**ESLint** is not needed; **Prettier** is nice for formatting; **Error Lens** shows errors inline.

### B1. For learning: how this project was created from scratch

You don't need to do this (the project already exists), but this is how you'd start a new one
exactly like it:

1. Open a terminal in the folder where you keep projects:
   ```
   cd C:\Users\mobin\Projects
   ```
2. Create a Vite project with the TypeScript template:
   ```
   npm create vite@latest my-new-site -- --template vanilla-ts
   ```
   `npm create vite` downloads Vite's project generator. `vanilla-ts` means "plain TypeScript,
   no framework" (no React, no Vue).
3. Go into it and install:
   ```
   cd my-new-site
   npm install
   npm run dev
   ```
4. Then, to turn it into this kind of site, you would:
   - add `base: '/Portfolio/'` in a `vite.config.ts` (explained in [part G](#why-base-matters)),
   - add the test runner: `npm install -D vitest`,
   - replace the starter files with your own `index.html`, `src/main.ts`, styles, etc.

---

## C. Run it on your computer

In the VS Code terminal:

```
npm install
```

This downloads the tools listed in `package.json` (Vite, TypeScript, Vitest) into a
`node_modules` folder. It takes a minute the first time. You'll see `added … packages`.
(A line like `npm notice New major version of npm available` is harmless.)

Now start the development server:

```
npm run dev
```

You should see:

```
  VITE v8.x  ready in 500 ms
  ➜  Local:   http://localhost:5173/Portfolio/
```

**Ctrl + click** the link (or open it in Chrome/Edge). You should see the dark pixel bedroom and
**PRESS ANY KEY TO SPAWN**. Press a key and watch the intro, then scroll through the levels.

- While `npm run dev` is running, **every time you save a file the page updates by itself**.
- Handy dev URL: **http://localhost:5173/Portfolio/?nointro** skips the intro.
- The full intro plays every time the page loads. **SKIP ▶▶** or **Esc** jumps straight to the site.

**To stop the server:** click in the terminal and press **Ctrl + C** (if it asks
`Terminate batch job (Y/N)?` type `Y`).

---

## D. Project tour

```
Portfolio/
├─ index.html              The page shell. <!--APP--> gets replaced with your content at build time.
├─ vite.config.ts          Vite settings: base path /Portfolio/ + the plugin that renders content.ts.
├─ package.json            Project name, scripts (dev/build/test/train) and dev tools.
├─ tsconfig.json           TypeScript settings.
├─ README.md               Short overview.
├─ GUIDE.md                This guide.
├─ docs/SPEC.md            The full design spec, decisions and placeholders.
├─ .github/workflows/
│  └─ deploy.yml           GitHub Actions: tests, builds and publishes the site on every push to main.
├─ public/                 Files copied as-is to the site.
│  ├─ photo.jpg            Your photo (ABOUT page).
│  ├─ cv.pdf               Your CV (LOAD MATIN'S RESUME button). Currently a placeholder!
│  ├─ projects/*.jpg       Project screenshots.
│  ├─ favicon.png          Browser tab icon (your MM logo).
│  ├─ icon-192.png         Phone home-screen icon.
│  └─ og.png               Preview image when the link is shared (LinkedIn, Discord…).
├─ scripts/
│  ├─ train.ts             Trains the AI brain (npm run train).
│  └─ evaluate.ts          Tests the brain on unseen levels (npm run evaluate).
├─ tests/                  Automated tests (npm test).
└─ src/
   ├─ content.ts           ★ ALL your text, links, jobs, projects, skills. Edit this one.
   ├─ main.ts              Starts everything.
   ├─ sections/
   │  ├─ render.ts         Turns content.ts into the HTML of each section.
   │  └─ interactions.ts   Section behaviours (dialog typing, skill bars, cartridges, form...).
   ├─ game/                The game engine
   │  ├─ constants.ts      Physics numbers (gravity, jump strength, speeds).
   │  ├─ level.ts          Seeded level generator + per-theme difficulty.
   │  ├─ physics.ts        Movement, collisions, enemies, coins.
   │  ├─ senses.ts         The 8 inputs the AI sees.
   │  ├─ sprites.ts        All pixel art, drawn from text grids.
   │  ├─ themes.ts         Backgrounds and tiles of the 6 worlds.
   │  ├─ renderer.ts       Draws a level.
   │  ├─ particles.ts      Dust, sparkles, beams.
   │  ├─ rng.ts            Seeded random numbers (same seed = same level).
   │  └─ game.ts           The live runner behind the page + level transitions.
   ├─ ai/                  The AI
   │  ├─ network.ts        The neural network.
   │  ├─ neuroevolution.ts The genetic algorithm.
   │  ├─ policy.ts         Network outputs → actions; runs training episodes.
   │  ├─ champion.json     The trained brain (weights + training history).
   │  ├─ brain-state.ts    Which pathways are revealed ("NEW SKILL LEARNED").
   │  ├─ brain-visual.ts   Draws the network.
   │  ├─ brain-ui.ts       Brain section, floating widget and panel.
   │  ├─ lab-sim.ts        Training Lab simulation.
   │  ├─ lab.worker.ts     Runs the Training Lab in a background thread.
   │  └─ training-lab.ts   Training Lab screen.
   ├─ intro/intro.ts       World 0 intro (bedroom → terminal → boot).
   ├─ audio/sfx.ts         Sound effects, synthesised live.
   ├─ ui/                  HUD, toasts, Konami code, YOU PLAY mode.
   ├─ styles/              CSS: base (colours, buttons), sections, overlays, responsive (phone).
   └─ dev/raf-shim.ts      Test helper for development only (not in the real site).
```

---

## E. Make it yours

### E1. Edit your text: `src/content.ts`

Open `src/content.ts`. Everything on the site comes from here. Keep the quotes and commas as they
are and only change the text between quotes.

| Field | Where it shows |
| --- | --- |
| `name`, `fullName`, `firstName` | hero title, dialog box, credits, page title; `firstName` goes in `./matin_portfolio.exe` |
| `gamertag` | HUD "PLAYER 1" |
| `role`, `builds` | hero subtitle "ROLE // BUILDS …" |
| `dialog` | the lines the RPG dialog box types out |
| `location`, `className`, `likes`, `bio` | ABOUT page |
| `stats` | the GPA / PROJECTS / PASSION strip (PROJECTS is counted automatically) |
| `skills` | skill bars; `level` is 1–10 blocks |
| `alsoSpeaks` | the small chips under your bio |
| `quests` | ACTIVE QUESTS list |
| `experience` | EXPERIENCE rows (first = 1ST); `achievements` show under each row (all open by default; clicking a row folds it) |
| `wantedRole`, `openTo` | the "INSERT COIN" row and the contact text |
| `projects` | the cartridges (see E4) |
| `links` | LinkedIn / GitHub / email buttons |
| `formspreeId` | contact form (see E6) |

**Find what's unfinished:** press **Ctrl + Shift + F** in VS Code and search for `[PLACEHOLDER`.
Currently: your *likes*, one *active quest*, your university *start year*, and a line for the
*Segmentation Lab* project. Skill levels and "wanted role" are guesses too; adjust them.

Save (**Ctrl + S**). If `npm run dev` is running, the page reloads with your change.

### E2. Your photo

Replace `public/photo.jpg` with your own picture (keep the name `photo.jpg`, or change `photo` in
`content.ts`). A square image around 400×400 px looks best. It "de-pixelates" when it scrolls in.

### E3. Your CV

Export your CV as PDF, name it `cv.pdf`, and copy it over `public/cv.pdf` (replace the file). The
**LOAD MATIN'S RESUME** button downloads it (the label is `cvLabel` in `content.ts`).

### E4. Add, remove or edit projects

Each project in `content.ts` looks like this:

```ts
{
  id: 'house-price',                 // unique, lowercase, no spaces
  name: 'HOUSE PRICE PREDICTOR',     // cartridge label
  year: '2024',
  category: 'AI/ML',                 // 'WEB' | 'MOBILE' | 'AI/ML' | 'GAMES & ALGOS'
  tagline: 'One short line under the cartridge.',
  description: 'The longer text in the pop-up.',
  tech: ['Python', 'pandas'],
  screenshots: ['projects/house-price.jpg'],   // files in public/projects, or [] for pixel initials
  playUrl: 'https://…',              // optional: kept for later, not shown on the site
  codeUrl: 'https://github.com/…',   // optional: shows CODE
  siteUrl: 'https://…',              // optional: shows VISIT SITE (project website)
  privateRepo: true,                 // optional: shows a locked PRIVATE REPO badge
  color: 'cyan',                     // 'yellow' | 'pink' | 'cyan' label border
},
```

- **Add:** copy a whole `{ … },` block, paste it where you want it in the list, change the values.
  Put screenshots in `public/projects/` (JPG or PNG, about 800 px wide).
- **Remove:** delete the whole `{ … },` block.
- **Reorder:** move blocks; the first one is selected (▼ P1) by default.
- Categories used by any project automatically get a filter button.
- Projects with category `AI/ML` are also linked from the NEURAL NET section.

Experience entries and skills work the same way (copy a block, change it, or delete it).

### E5. Change colours

Colours live at the top of `src/styles/base.css` under `:root`:

```css
--yellow: #ffd447;   /* primary accent */
--pink: #ff5c8a;     /* shadows, labels */
--cyan: #3ddcff;     /* focus rings, small highlights */
--bg: #100c26;       /* page background */
```

Change a value, save, done. (The pixel art and game worlds use their own palette in
`src/game/sprites.ts` → `PAL` and `src/game/themes.ts`.)

### E6. Make the contact form actually send email (Formspree)

GitHub Pages can't send email by itself. Until you set this up, the form opens the visitor's email
app instead (that works, but a real form is nicer).

1. Go to **https://formspree.io/** → **Get Started** → sign up (free plan is fine).
2. Click **+ New Form**, name it `Portfolio`, and use the email address where you want to receive
   messages. Confirm that email when Formspree asks.
3. Formspree shows your endpoint, like `https://formspree.io/f/abcdwxyz`. The part after `/f/`
   (`abcdwxyz`) is your **form id**.
4. In `src/content.ts` set:
   ```ts
   formspreeId: 'abcdwxyz',
   ```
5. Save, deploy (part G). On the live site, send yourself a test message. The first submission may
   ask you to confirm in the Formspree dashboard.

### E7. Other easy tweaks

- **Page title / description / share text:** `index.html` (uses your name and role from
  `content.ts` automatically).
- **Share image:** replace `public/og.png` (1200×630).
- **Section names / order / themes:** `SECTIONS` at the top of `src/sections/render.ts`.
- **Game difficulty per world:** `THEME_PARAMS` in `src/game/level.ts` (then retrain, part F).

---

## F. Retrain the AI, test, build

### F1. Retrain the brain

```
npm run train
```

This runs the genetic algorithm in your terminal: 150 brains × 700 generations on levels of all six
worlds. It prints progress every 10 generations and takes about 15 minutes. At the end it tests the
best brains on 18 levels they have never seen, and saves the winner to `src/ai/champion.json`
(the site reloads with the new brain).

Quick experiments:

```
npm run train -- --gens 100 --pop 80
npm run train -- --seed 7
```

Then check how good it is:

```
npm run evaluate
```

This prints, per world, how many unseen levels the champion finished and how it failed.

> **Retrain whenever you change physics or level generation** (`constants.ts`, `physics.ts`,
> `level.ts`, `senses.ts`): the brain learned the old rules.

### F2. Run the tests

```
npm test
```

You should see all tests pass (green `✓`, `Tests  NN passed`). The same tests run automatically on
GitHub before every deployment; if one fails, the site is not deployed (so a mistake can't break the
live site).

### F3. Build and preview the real site

```
npm run build
```

This type-checks everything and creates the final site in the `dist/` folder. Then:

```
npm run preview
```

Open **http://localhost:4173/Portfolio/**. This is exactly what GitHub Pages will serve. Stop with
**Ctrl + C**.

---

## G. Deploy to GitHub Pages

Your old portfolio is in the GitHub repository **MatinHMobini/Portfolio**, served at
https://matinhmobini.github.io/Portfolio/. We'll back it up, put the new project in its place,
and let GitHub Actions build and publish it.

### G1. Back up the old site (do this first!)

**Option 1: a backup branch on GitHub (recommended).**

In a PowerShell or VS Code terminal:

```
cd C:\Users\mobin\Projects
git clone https://MatinHMobini@github.com/MatinHMobini/Portfolio.git Portfolio-old
cd Portfolio-old
git config user.name "MatinHMobini"
git config user.email "hmobinimatin@gmail.com"
git branch -a
```

The `MatinHMobini@` in the address tells Git which GitHub account to log in as, so it can't pick
up any other GitHub login saved on this computer.

`git branch -a` lists the branches. Note which one has a `*` (usually `main`) and whether there is a
`remotes/origin/gh-pages` (that would be the built old site). Now save the old source as a branch
called `old-site`:

```
git checkout -b old-site
git push -u origin old-site
```

Git may open a browser window asking you to sign in to GitHub. **Make sure it says MatinHMobini
before you click Authorize.** If that browser is signed in to your work GitHub, sign out of it
there first, or copy the sign-in link into a private/incognito window and sign in as MatinHMobini.
Check on GitHub: your repo's branch dropdown now shows **old-site**. The old code is safe forever.

> **If Git ever pushes as the wrong account** (you get "Permission denied to <another account>" or
> similar), remove the saved GitHub login and try again: Start menu → **Credential Manager** →
> **Windows Credentials** → find `git:https://github.com` (and any `git:https://…@github.com`) →
> **Remove**. The next push will ask you to sign in; choose **MatinHMobini**.

**Option 2 (extra): a ZIP.** On https://github.com/MatinHMobini/Portfolio click the green **Code**
button → **Download ZIP**, and keep the file somewhere safe.

### G2. Put the new project in the repository

We connect your new project folder to the GitHub repository, then make one commit that says
"replace the old site with this", keeping the old history underneath. No force-pushing, nothing is
lost.

```
cd C:\Users\mobin\Projects\Portfolio
git status
```

If `git status` lists changed files, save them in a commit first:

```
git add -A
git commit -m "My edits"
```

Now connect and combine:

```
git remote add origin https://MatinHMobini@github.com/MatinHMobini/Portfolio.git
git fetch origin
git merge origin/main --allow-unrelated-histories -s ours -m "Replace old portfolio with Pixel Quest"
```

What that does: `remote add` tells this folder where the GitHub repo is. `fetch` downloads its
history. `merge … -s ours` records the old history as part of this project while **keeping all of
the new files exactly as they are**.

> If your old repo's main branch is called `master` instead of `main` (you saw it in G1), use
> `origin/master` in the merge command, and later push with `git push -u origin main:master`, or
> rename the default branch on GitHub (Settings → General → Default branch).

Upload it:

```
git push -u origin main
```

### G3. Tell GitHub Pages to use GitHub Actions

1. Open https://github.com/MatinHMobini/Portfolio → **Settings** (top tab) → **Pages** (left menu).
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
   (Before, it was probably "Deploy from a branch" using `gh-pages`. You don't need that branch any
   more, but leave it alone; it's harmless.)

That's the only setting. The workflow file `.github/workflows/deploy.yml` does the rest.

### G4. Watch it build

1. Click the **Actions** tab of the repository.
2. You'll see a run called **Deploy to GitHub Pages** (if it didn't start because you changed the
   Pages source after pushing, click the workflow on the left → **Run workflow** → **Run workflow**).
3. Click it. It has two jobs: **build** (installs, tests, builds) and **deploy**. Each step gets a
   green ✓. It takes 1–2 minutes.
4. When it's done, the **deploy** box shows the URL.

### G5. Open your live site

Go to **https://matinhmobini.github.io/Portfolio/**. If you still see the old site, press
**Ctrl + F5** (hard refresh) or open it in a private window: browsers and GitHub's CDN cache for a
few minutes.

Test it on your phone too, and share the link: LinkedIn will show the `og.png` preview.

<a id="why-base-matters"></a>
**Why `base: '/Portfolio/'` matters:** the site lives in a sub-folder of your GitHub Pages domain
(`/Portfolio/`). `vite.config.ts` tells Vite to prefix every file path with `/Portfolio/`. If you
ever rename the repository, change `base` to `'/NewName/'` (or `'/'` for a repo named
`matinhmobini.github.io`).

---

## H. Updating later + troubleshooting

### H1. The everyday update loop

1. `npm run dev`, make your changes, look at them in the browser.
2. `npm test` (and `npm run build` if you changed code).
3. Save to Git and upload:
   ```
   git add -A
   git commit -m "Describe what you changed"
   git push
   ```
4. GitHub Actions rebuilds and redeploys automatically (Actions tab). Live in ~2 minutes.

You can also use VS Code's **Source Control** panel (the branch icon on the left): type a message,
click **✓ Commit**, then **Sync Changes**. If VS Code asks to sign in to GitHub, or if the
**Accounts** icon (bottom-left person icon) shows your work account, sign out of it there and sign
in as **MatinHMobini**, or just use the terminal commands above.

### H2. Troubleshooting

<a id="powershell-blocks-npm"></a>
**PowerShell blocks npm** (`npm.ps1 cannot be loaded because running scripts is disabled`).
Windows blocks PowerShell scripts by default. Either use **Command Prompt** instead (in VS Code:
the **˅** next to the **+** in the terminal panel → **Command Prompt**), or allow scripts for your
user only by running this once in PowerShell:
```
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
and answer `Y`.

**Blank page or 404s for `.js`/`.css` files on the live site.** The `base` in `vite.config.ts`
doesn't match the repository name. It must be `/Portfolio/` (capital P, with both slashes) for
`matinhmobini.github.io/Portfolio/`. Also make sure Pages **Source** is **GitHub Actions**, not a
branch (a branch would serve the unbuilt source code).

**The Actions run fails.**
- Red ✗ on **Run the tests**: open it to read which test failed; run `npm test` locally to fix.
- Red ✗ on **Install dependencies** (`npm ci` complains about the lock file): run `npm install`
  locally, commit the updated `package-lock.json`, push again.
- **deploy** fails with a permissions or environment error: repo **Settings → Actions → General →
  Workflow permissions** → **Read and write permissions** → Save; and in **Settings →
  Environments → github-pages**, make sure `main` is allowed to deploy. Then **Re-run jobs**.
- An action reports it is deprecated: update the version numbers in
  `.github/workflows/deploy.yml` (e.g. `actions/checkout@v5` → the newest major on its GitHub page).

**I pushed but the site didn't change.** Wait for the Actions run to finish, then **Ctrl + F5**.
GitHub's CDN can take a few minutes.

**Fonts look like normal text.** The pixel fonts come from Google Fonts. Check your internet
connection or ad/script blockers; the site still works with fallback fonts.

**No sound.** Sound is **off by default** (HUD **SND** button). Browsers only allow audio after you
click or press a key on the page, so turn it on with a click.

**The intro doesn't play.** Check the address doesn't end in `?nointro`. If your system has "reduce motion" turned on (Windows Settings →
Accessibility → Visual effects → Animation effects **off**), the intro and animations are skipped
on purpose.

**The runner keeps dying.** It's a neural network, not a script; it's good but not perfect. You can
retrain (`npm run train`) or make levels easier in `THEME_PARAMS` (`src/game/level.ts`), then
retrain.

**`npm run train` says `Unknown file extension ".ts"`.** Your Node.js is older than 22.6. Install
the current LTS (part A2).

**Port 5173 is already in use.** Another dev server is still running. Close the other terminal, or
Vite will pick the next free port and print it.

**Secret mode:** type ↑ ↑ ↓ ↓ ← → ← → B A on the site (or tap the hearts 5 times on a phone) to play
yourself. Esc gives control back to the AI.
