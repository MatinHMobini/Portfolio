/**
 * Konami code secret: "YOU PLAY" mode. The visitor takes control of the
 * runner (arrows/WASD + Space, Shift/X to dash, Down to dive; on-screen
 * D-pad + A/B on touch screens). Esc exits.
 */
import { KonamiDetector } from './konami.ts';
import type { Game } from '../game/game.ts';
import { toast } from './toasts.ts';
import { sfx } from '../audio/sfx.ts';

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export class YouPlay {
  active = false;
  private banner: HTMLElement | null = null;
  private pad: HTMLElement | null = null;
  private detector = new KonamiDetector();
  private taps: number[] = [];
  onChange: ((active: boolean) => void) | null = null;

  private game: Game;

  constructor(game: Game, heartsButton: HTMLElement) {
    this.game = game;
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    // Touch-friendly secret: tap the hearts 5 times within 2 seconds.
    heartsButton.addEventListener('click', () => {
      const now = performance.now();
      this.taps = this.taps.filter((t) => now - t < 2000);
      this.taps.push(now);
      if (this.taps.length >= 5) {
        this.taps = [];
        this.toggle();
      }
    });
  }

  toggle(): void {
    if (this.active) this.exit();
    else this.enter();
  }

  enter(): void {
    if (this.active) return;
    this.active = true;
    this.game.setMode('human');
    document.documentElement.classList.add('you-play');
    sfx.oneUp();
    const touchPad = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const controls = touchPad ? '◀ ▶ MOVE · A JUMP · B DASH · ▼ DIVE' : 'ARROWS/WASD · SPACE JUMP · SHIFT DASH · ESC EXIT';
    toast(`<b>YOU PLAY!</b> THE AI IS ON A BREAK.<br>${controls}`, 4200);
    this.banner = document.createElement('div');
    this.banner.className = 'you-play-banner';
    this.banner.innerHTML = '<span>YOU PLAY · THE AI IS ON A BREAK</span><button type="button">EXIT</button>';
    this.banner.querySelector('button')!.addEventListener('click', () => this.exit());
    document.body.appendChild(this.banner);
    this.buildPad();
    this.onChange?.(true);
  }

  exit(): void {
    if (!this.active) return;
    this.active = false;
    this.game.setMode('ai');
    document.documentElement.classList.remove('you-play');
    this.banner?.remove();
    this.pad?.remove();
    this.banner = this.pad = null;
    toast('AI PLAYER RESUMES CONTROL');
    this.onChange?.(false);
  }

  private buildPad(): void {
    const pad = document.createElement('div');
    pad.className = 'pad';
    pad.innerHTML = `
      <div class="pad__dpad"><button type="button" data-k="left" aria-label="Left">◀</button><button type="button" data-k="dive" aria-label="Dive">▼</button><button type="button" data-k="right" aria-label="Right">▶</button></div>
      <div class="pad__ab"><button type="button" class="pad__b" data-k="dash" aria-label="Dash">B</button><button type="button" class="pad__a" data-k="jump" aria-label="Jump">A</button></div>`;
    pad.querySelectorAll<HTMLButtonElement>('[data-k]').forEach((b) => {
      const k = b.dataset.k!;
      const down = (e: Event) => {
        e.preventDefault();
        b.classList.add('is-down');
        const hh = this.game.human;
        if (k === 'left') hh.left = true;
        if (k === 'right') hh.right = true;
        if (k === 'dive') hh.dive = true;
        if (k === 'dash') hh.dash = true;
        if (k === 'jump') {
          hh.jump = true;
          hh.jumpPressed = true;
        }
      };
      const up = (e: Event) => {
        e.preventDefault();
        b.classList.remove('is-down');
        const hh = this.game.human;
        if (k === 'left') hh.left = false;
        if (k === 'right') hh.right = false;
        if (k === 'dive') hh.dive = false;
        if (k === 'jump') hh.jump = false;
      };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('pointerleave', up);
    });
    document.body.appendChild(pad);
    this.pad = pad;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (isTyping(e.target)) return;
    if (this.detector.push(e.key)) {
      this.toggle();
      return;
    }
    if (!this.active) return;
    const h = this.game.human;
    const k = e.key.toLowerCase();
    let used = true;
    if (k === 'arrowleft' || k === 'a') h.left = true;
    else if (k === 'arrowright' || k === 'd') h.right = true;
    else if (k === 'arrowup' || k === 'w' || k === ' ' || k === 'z') {
      if (!e.repeat) h.jumpPressed = true;
      h.jump = true;
    } else if (k === 'arrowdown' || k === 's') h.dive = true;
    else if (k === 'shift' || k === 'x' || k === 'k') {
      if (!e.repeat) h.dash = true;
    } else if (k === 'escape') this.exit();
    else used = false;
    if (used) e.preventDefault();
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (!this.active) return;
    const h = this.game.human;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') h.left = false;
    else if (k === 'arrowright' || k === 'd') h.right = false;
    else if (k === 'arrowup' || k === 'w' || k === ' ' || k === 'z') h.jump = false;
    else if (k === 'arrowdown' || k === 's') h.dive = false;
  }
}
