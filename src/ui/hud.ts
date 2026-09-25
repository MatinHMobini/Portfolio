/** Persistent top HUD: score, coins, world, lives, sound + CRT toggles. */
import { isSoundOn, setSound, sfx } from '../audio/sfx.ts';

const pad = (n: number, w: number) => String(Math.max(0, Math.floor(n))).padStart(w, '0');

export class Hud {
  private el = document.getElementById('hud')!;
  private score = this.el.querySelector<HTMLElement>('[data-hud="score"]')!;
  private coins = this.el.querySelector<HTMLElement>('[data-hud="coins"]')!;
  private world = this.el.querySelector<HTMLElement>('[data-hud="world"]')!;
  private hearts = this.el.querySelector<HTMLButtonElement>('[data-hud="lives"]')!;

  constructor() {
    const onScroll = () => this.el.classList.toggle('is-solid', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    this.bindToggles();
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

  private bindToggles(): void {
    const snd = this.el.querySelector<HTMLButtonElement>('[data-toggle="sound"]')!;
    const crt = this.el.querySelector<HTMLButtonElement>('[data-toggle="crt"]')!;
    const paint = (b: HTMLButtonElement, on: boolean) => {
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('.tgl__s')!.textContent = on ? 'ON' : 'OFF';
    };
    paint(snd, isSoundOn());
    paint(crt, !document.documentElement.classList.contains('no-crt'));
    snd.addEventListener('click', () => {
      const on = !isSoundOn();
      setSound(on);
      paint(snd, on);
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
