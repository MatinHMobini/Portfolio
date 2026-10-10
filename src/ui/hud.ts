/** Persistent top HUD: score, coins, world, lives, sound + CRT toggles, page progress bar. */
import { isSoundOn, onSoundChange, setSound, sfx } from '../audio/sfx.ts';

const pad = (n: number, w: number) => String(Math.max(0, Math.floor(n))).padStart(w, '0');

export class Hud {
  private el = document.getElementById('hud')!;
  private score = this.el.querySelector<HTMLElement>('[data-hud="score"]')!;
  private coins = this.el.querySelector<HTMLElement>('[data-hud="coins"]')!;
  private world = this.el.querySelector<HTMLElement>('[data-hud="world"]')!;
  private hearts = this.el.querySelector<HTMLButtonElement>('[data-hud="lives"]')!;

  constructor() {
    this.bindToggles();
    this.bindProgress();
  }

  get heartsButton(): HTMLButtonElement {
    return this.hearts;
  }

  setScore(score: number, coins: number): void {
    this.score.textContent = pad(score, 6);
    this.coins.textContent = pad(coins, 2);
  }

  setWorld(w: string): void {
    this.world.textContent = w;
  }

  setLives(n: number, hit: boolean): void {
    this.hearts.querySelectorAll('svg').forEach((s, i) => s.classList.toggle('is-empty', i >= n));
    this.hearts.setAttribute('aria-label', `Lives: ${n}`);
    if (hit) {
      this.hearts.classList.remove('is-hit');
      void this.hearts.offsetWidth;
      this.hearts.classList.add('is-hit');
    }
  }

  /** Thin bar under the HUD: how far down the page you are, with a notch where each world starts. */
  private bindProgress(): void {
    const bar = this.el.querySelector<HTMLElement>('.hud__progress');
    if (!bar) return;
    const max = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    let raf = 0;
    const update = () => {
      raf = 0;
      bar.style.setProperty('--p', String(Math.min(1, Math.max(0, window.scrollY / max()))));
    };
    const notches = () => {
      bar.querySelectorAll('b').forEach((b) => b.remove());
      document.querySelectorAll<HTMLElement>('main > .level').forEach((sec, i) => {
        if (i === 0) return;
        const b = document.createElement('b');
        b.style.left = `${Math.min(100, (sec.offsetTop / max()) * 100)}%`;
        bar.appendChild(b);
      });
      update();
    };
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    new ResizeObserver(notches).observe(document.body);
    notches();
  }

  private bindToggles(): void {
    const snd = this.el.querySelector<HTMLButtonElement>('[data-toggle="sound"]')!;
    const crt = this.el.querySelector<HTMLButtonElement>('[data-toggle="crt"]')!;
    const paint = (b: HTMLButtonElement, on: boolean) => {
      b.setAttribute('aria-pressed', String(on));
      b.title = `${b.getAttribute('aria-label')}: ${on ? 'ON' : 'OFF'}`;
    };
    paint(snd, isSoundOn());
    paint(crt, !document.documentElement.classList.contains('no-crt'));
    onSoundChange((on) => paint(snd, on));
    snd.addEventListener('click', () => {
      const on = !isSoundOn();
      setSound(on);
      if (on) sfx.select();
    });
    crt.addEventListener('click', () => {
      const off = document.documentElement.classList.toggle('no-crt');
      paint(crt, !off);
      try {
        localStorage.setItem('pq.crt', off ? 'off' : 'on');
      } catch {
        /* ignore */
      }
      sfx.select();
    });
  }
}
