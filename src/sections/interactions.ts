/**
 * Behaviour for every section. The markup comes from render.ts (built
 * into index.html); this file only enhances it.
 */
import type { Content, Project } from '../content.ts';
import { esc } from './render.ts';
import type { Game } from '../game/game.ts';
import { sfx } from '../audio/sfx.ts';
import { popText } from '../ui/toasts.ts';

const reduced = () => document.documentElement.classList.contains('reduced');

function onVisible(el: Element, fn: (visible: boolean) => void, threshold = 0.35): void {
  new IntersectionObserver(([e]) => fn(e.isIntersecting), { threshold }).observe(el);
}

// ─── Hero dialog typewriter ───────────────────────────────────────
export function initDialog(): void {
  const box = document.getElementById('dialog');
  const text = box?.querySelector<HTMLElement>('.dialog__text');
  const next = box?.querySelector<HTMLButtonElement>('.dialog__next');
  if (!box || !text || !next) return;
  const lines: string[] = JSON.parse(text.dataset.lines || '[]');
  if (!lines.length) return;
  let idx = 0;
  let timer = 0;
  let auto = 0;
  let typing = false;
  /** Pause after a line has finished typing, before the next one starts. */
  const HOLD_MS = 5000;
  // Only type while the home page is on screen (no blips while reading other pages).
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(box);

  const scheduleNext = (ms: number) => {
    clearTimeout(auto);
    auto = window.setTimeout(() => {
      if (!visible) scheduleNext(1000);
      else show((idx + 1) % lines.length);
    }, ms);
  };

  const show = (i: number) => {
    idx = i;
    clearInterval(timer);
    clearTimeout(auto);
    const line = lines[idx];
    if (reduced()) {
      text.textContent = line;
      scheduleNext(HOLD_MS + 1500);
      return;
    }
    let n = 0;
    typing = true;
    text.textContent = '';
    timer = window.setInterval(() => {
      n++;
      text.textContent = line.slice(0, n);
      if (line[n - 1] && line[n - 1] !== ' ') sfx.blip();
      if (n >= line.length) {
        clearInterval(timer);
        typing = false;
        // The lines loop forever, one after another.
        scheduleNext(HOLD_MS);
      }
    }, 45);
  };
  const advance = () => {
    if (typing) {
      clearInterval(timer);
      typing = false;
      text.textContent = lines[idx];
      scheduleNext(HOLD_MS);
      return;
    }
    sfx.select();
    show((idx + 1) % lines.length);
  };
  next.addEventListener('click', advance);
  box.addEventListener('click', (e) => {
    if (e.target !== next && !(e.target as HTMLElement).closest('.dialog__next')) advance();
  });
  show(0);
}

// ─── Navigation: world map, buttons, level bar ────────────────────
export function initNavigation(game: Game, sections: HTMLElement[]): void {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-goto]');
    if (!a) return;
    const idx = Number(a.dataset.goto);
    const target = sections[idx];
    if (!target) return;
    e.preventDefault();
    sfx.select();
    game.hop();
    a.closest('.wm')?.querySelectorAll('.wm__node').forEach((n) => n.classList.toggle('is-here', n === a));
    window.setTimeout(() => {
      // Land with the page's title block just under the HUD (not the section's padded edge).
      const head = idx === 0 ? null : target.querySelector<HTMLElement>('.level__head, .contact__left');
      const hudH = document.getElementById('hud')?.offsetHeight ?? 0;
      const top = head ? head.getBoundingClientRect().top + window.scrollY - hudH - 24 : 0;
      window.scrollTo({ top: Math.max(0, top), behavior: reduced() ? 'auto' : 'smooth' });
      history.replaceState(null, '', `#${target.id}`);
    }, reduced() ? 0 : 320);
  });
}

/** Tracks which section is "active" (its top has passed 55% of the viewport). */
export function initActiveSection(sections: HTMLElement[], onChange: (idx: number) => void): void {
  let current = -1;
  let ticking = false;
  const check = () => {
    ticking = false;
    const line = window.innerHeight * 0.55;
    let idx = 0;
    sections.forEach((s, i) => {
      if (s.getBoundingClientRect().top < line) idx = i;
    });
    // At the very bottom of the page the last section is active.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = sections.length - 1;
    if (idx !== current) {
      current = idx;
      onChange(idx);
    }
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', check);
  check();
}

// ─── 2 ABOUT: skill bars + photo reveal ────────────────────────
export function initStatus(): void {
  const list = document.querySelector('.skills');
  if (list) {
    let done = false;
    onVisible(list, (v) => {
      if (!v || done) return;
      done = true;
      const skills = [...list.querySelectorAll<HTMLElement>('.skill')];
      if (reduced()) {
        skills.forEach((s) => s.classList.add('is-filled'));
        return;
      }
      let delay = 0;
      skills.forEach((s) => {
        const blocks = [...s.querySelectorAll<HTMLElement>('.skill__bar i.on')];
        blocks.forEach((b, i) => {
          window.setTimeout(() => {
            b.classList.add('lit');
            if (i % 2 === 0) sfx.blip();
          }, delay + i * 55);
        });
        delay += blocks.length * 55;
        window.setTimeout(() => {
          s.classList.add('is-filled', 'is-leveled');
        }, delay);
        delay += 120;
      });
      window.setTimeout(() => sfx.levelUp(), delay);
    });
  }

  // Photo "de-pixelates" when it scrolls into view.
  const photo = document.querySelector<HTMLElement>('.photo');
  const img = photo?.querySelector('img');
  if (photo && img && !reduced()) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 150;
    cv.setAttribute('aria-hidden', 'true');
    photo.appendChild(cv);
    const ctx = cv.getContext('2d')!;
    const draw = (res: number) => {
      const tmp = document.createElement('canvas');
      tmp.width = tmp.height = res;
      const t = tmp.getContext('2d')!;
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      t.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, res, res);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, 150, 150);
    };
    const run = () => {
      const steps = [6, 10, 16, 26, 44, 80];
      steps.forEach((r, i) => window.setTimeout(() => draw(r), i * 140));
      window.setTimeout(() => cv.remove(), steps.length * 140 + 60);
    };
    const start = () => {
      draw(6);
      let started = false;
      onVisible(photo, (v) => {
        if (v && !started) {
          started = true;
          run();
        }
      });
    };
    if (img.complete && img.naturalWidth) start();
    else {
      img.loading = 'eager';
      img.addEventListener('load', start, { once: true });
      img.addEventListener('error', () => cv.remove(), { once: true });
    }
  }
}

// ─── 3 EXPERIENCE ──────────────────────────────────────────────
export function initScores(): void {
  document.querySelectorAll<HTMLButtonElement>('.scores button.score__row').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      const more = document.getElementById(btn.getAttribute('aria-controls')!);
      if (more) more.hidden = open;
      sfx.select();
    });
  });
}

// ─── 4 PROJECTS ─────────────────────────────────────────
export function initCartridges(content: Content): void {
  const wrap = document.getElementById('carts');
  if (!wrap) return;
  const slots = [...wrap.querySelectorAll<HTMLElement>('.cart-slot')];
  const select = (slot: HTMLElement) => {
    slots.forEach((s) => s.classList.toggle('is-selected', s === slot));
  };
  if (slots[0]) select(slots[0]);
  slots.forEach((slot) => {
    const btn = slot.querySelector<HTMLButtonElement>('.cart')!;
    slot.addEventListener('pointerenter', () => select(slot));
    btn.addEventListener('focus', () => select(slot));
    btn.addEventListener('click', () => {
      const p = content.projects.find((x) => x.id === btn.dataset.project);
      if (p) insertCartridge(btn, p);
    });
  });

  // Category filter.
  document.querySelectorAll<HTMLButtonElement>('.filter').forEach((f) => {
    f.addEventListener('click', () => {
      const cat = f.dataset.filter!;
      document.querySelectorAll('.filter').forEach((x) => {
        x.classList.toggle('is-on', x === f);
        x.setAttribute('aria-pressed', String(x === f));
      });
      slots.forEach((s) => (s.hidden = cat !== 'ALL' && s.dataset.cat !== cat));
      const first = slots.find((s) => !s.hidden);
      if (first) select(first);
      sfx.select();
    });
  });
}

let consoleEl: HTMLElement | null = null;
let busy = false;

/** The cartridge flies down into a pixel console, the LED lights, then the details open. */
function insertCartridge(btn: HTMLElement, p: Project): void {
  if (busy) return;
  if (reduced()) {
    openProject(p, btn);
    return;
  }
  busy = true;
  sfx.select();
  if (!consoleEl) {
    consoleEl = document.createElement('div');
    consoleEl.className = 'console';
    consoleEl.setAttribute('aria-hidden', 'true');
    consoleEl.innerHTML = '<span class="console__slot"></span><span class="console__name">PIXEL-STATION</span><span class="console__led"></span>';
    document.body.appendChild(consoleEl);
  }
  const cs = consoleEl;
  cs.classList.remove('is-on');
  requestAnimationFrame(() => cs.classList.add('is-up'));
  const r = btn.getBoundingClientRect();
  const clone = btn.cloneNode(true) as HTMLElement;
  clone.classList.add('cart-fly');
  clone.removeAttribute('id');
  clone.setAttribute('aria-hidden', 'true');
  Object.assign(clone.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: '0' });
  document.body.appendChild(clone);
  btn.style.visibility = 'hidden';
  window.setTimeout(() => {
    const slotY = window.innerHeight - 40 - 180 + 14;
    const dx = window.innerWidth / 2 - (r.left + r.width / 2);
    const dy = slotY - r.top - r.height * 0.55;
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.55)`;
    clone.style.clipPath = 'polygon(0 8%, 7% 8%, 7% 0, 93% 0, 93% 8%, 100% 8%, 100% 55%, 0 55%)';
    sfx.insertCart();
  }, 280);
  window.setTimeout(() => {
    cs.classList.add('is-on');
  }, 720);
  window.setTimeout(() => {
    clone.remove();
    btn.style.visibility = '';
    cs.classList.remove('is-up');
    busy = false;
    openProject(p, btn);
  }, 1000);
}

let projectDialog: HTMLDialogElement | null = null;

export function openProject(p: Project, returnFocus?: HTMLElement): void {
  if (!projectDialog) {
    projectDialog = document.createElement('dialog');
    projectDialog.className = 'modal';
    projectDialog.setAttribute('aria-labelledby', 'pm-title');
    document.body.appendChild(projectDialog);
    projectDialog.addEventListener('click', (e) => {
      if (e.target === projectDialog) projectDialog!.close();
    });
  }
  const d = projectDialog;
  const shots = p.screenshots.length
    ? p.screenshots.map((s) => `<img src="${esc(s)}" alt="Screenshot of ${esc(p.name)}" loading="lazy">`).join('')
    : `<div class="pm__ph" aria-hidden="true">${esc(p.name.split(' ').map((w) => w[0]).join('').slice(0, 3))}</div>`;
  const ext = '<span class="sr-only"> (opens in a new tab)</span>';
  d.innerHTML = `
    <div class="modal__head"><h2 class="modal__title" id="pm-title">${esc(p.name)}</h2><button class="modal__close" type="button" aria-label="Close">✕</button></div>
    <div class="modal__body">
      <div class="pm">
        <div class="pm__shots">${shots}</div>
        <div>
          <p class="pm__meta">${esc(p.year)} · ${esc(p.category)}</p>
          <p class="pm__desc">${esc(p.description)}</p>
          <p class="k-label">TECH</p>
          <ul class="chips">${p.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="pm__btns">
            ${p.siteUrl ? `<a class="btn btn--ghost btn--sm" href="${esc(p.siteUrl)}" target="_blank" rel="noopener">VISIT SITE${ext}</a>` : ''}
            ${p.codeUrl ? `<a class="btn btn--ghost btn--sm" href="${esc(p.codeUrl)}" target="_blank" rel="noopener">VIEW CODE${ext}</a>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  d.querySelector('.modal__close')!.addEventListener('click', () => d.close());
  d.onclose = () => returnFocus?.focus({ preventScroll: true });
  d.showModal();
}

// ─── 1-6 CONTINUE? ────────────────────────────────────────────────
export function initCountdown(): void {
  const num = document.querySelector<HTMLElement>('[data-countdown]');
  const wrap = num?.parentElement;
  if (!num || !wrap) return;
  let n = 9;
  let timer = 0;
  let visible = false;
  const tick = () => {
    if (!visible) return;
    if (n > 0) {
      n--;
      num.textContent = String(n);
      sfx.tick();
      timer = window.setTimeout(tick, 1000);
    } else {
      wrap.classList.add('is-over');
      num.textContent = 'GAME OVER… JUST KIDDING';
      sfx.gameOver();
      timer = window.setTimeout(() => {
        wrap.classList.remove('is-over');
        n = 9;
        num.textContent = '9';
        timer = window.setTimeout(tick, 1000);
      }, 2600);
    }
  };
  onVisible(wrap, (v) => {
    visible = v;
    clearTimeout(timer);
    if (v && !reduced()) timer = window.setTimeout(tick, 1000);
  });
}

export function initContactForm(content: Content): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;
  const status = form.querySelector<HTMLElement>('.form__status')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const fields = {
    name: form.querySelector<HTMLInputElement>('#f-name')!,
    email: form.querySelector<HTMLInputElement>('#f-email')!,
    message: form.querySelector<HTMLTextAreaElement>('#f-msg')!,
  };
  const setErr = (el: HTMLInputElement | HTMLTextAreaElement, msg: string) => {
    const err = document.getElementById(`${el.id}-err`)!;
    err.textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) el.setAttribute('aria-describedby', err.id);
    else el.removeAttribute('aria-describedby');
  };
  const validate = (): boolean => {
    let ok = true;
    const name = fields.name.value.trim();
    const email = fields.email.value.trim();
    const msg = fields.message.value.trim();
    setErr(fields.name, name ? '' : 'ENTER A NAME, PLAYER.');
    setErr(fields.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : 'THAT EMAIL LOOKS GLITCHED.');
    setErr(fields.message, msg.length >= 10 ? '' : 'MESSAGE NEEDS AT LEAST 10 CHARACTERS.');
    for (const el of [fields.name, fields.email, fields.message]) {
      if (el.getAttribute('aria-invalid') === 'true') {
        if (ok) el.focus();
        ok = false;
      }
    }
    return ok;
  };
  Object.values(fields).forEach((el) =>
    el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') validate();
    }),
  );

  const celebrate = () => {
    sfx.coinInsert();
    window.setTimeout(() => sfx.oneUp(), 250);
    const r = submit.getBoundingClientRect();
    popText('1UP', r.left + r.width / 2 - 20, r.top - 10);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form__status';
    if (!validate()) {
      status.textContent = 'FIX THE RED FIELDS AND INSERT COIN AGAIN.';
      status.classList.add('is-err');
      return;
    }
    const name = fields.name.value.trim();
    const email = fields.email.value.trim();
    const message = fields.message.value.trim();
    if (!content.formspreeId) {
      // No backend configured: open the visitor's email app instead.
      const subject = encodeURIComponent(`Portfolio message from ${name}`);
      const body = encodeURIComponent(`${message}\n\n${name} <${email}>`);
      celebrate();
      status.textContent = 'OPENING YOUR EMAIL APP… HIT SEND THERE TO FINISH.';
      status.classList.add('is-ok');
      window.location.href = `mailto:${content.links.email}?subject=${subject}&body=${body}`;
      return;
    }
    submit.disabled = true;
    submit.textContent = 'SENDING…';
    try {
      const res = await fetch(`https://formspree.io/f/${content.formspreeId}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, _gotcha: (form.elements.namedItem('_gotcha') as HTMLInputElement).value }),
      });
      if (!res.ok) throw new Error(String(res.status));
      celebrate();
      status.textContent = 'MESSAGE SENT! +1UP. I WILL REPLY SOON.';
      status.classList.add('is-ok');
      form.reset();
    } catch {
      status.innerHTML = `CONNECTION LOST. TRY AGAIN OR EMAIL <a href="mailto:${esc(content.links.email)}">${esc(content.links.email)}</a>.`;
      status.classList.add('is-err');
    } finally {
      submit.disabled = false;
      submit.textContent = 'INSERT COIN ▶ SEND';
    }
  });
}

// ─── Footer credits ───────────────────────────────────────────────
export function initCredits(): void {
  const f = document.getElementById('credits');
  if (!f) return;
  onVisible(f, (v) => {
    if (v) f.classList.add('is-rolling');
  }, 0.2);
}
