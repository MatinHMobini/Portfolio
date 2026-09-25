/** Pixel toast notifications ("NEW SKILL LEARNED", "LEVEL CLEAR"...), shown one after another. */
const host = () => document.getElementById('toasts');
const queue: { html: string; ms: number }[] = [];
let busyUntil = 0;
let timer = 0;

function pump(): void {
  const el = host();
  if (!el || !queue.length) return;
  const now = performance.now();
  if (now < busyUntil) {
    clearTimeout(timer);
    timer = window.setTimeout(pump, busyUntil - now);
    return;
  }
  const { html, ms } = queue.shift()!;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = html;
  el.appendChild(t);
  const phone = window.matchMedia('(max-width: 700px)').matches;
  while (el.children.length > (phone ? 1 : 3)) el.firstElementChild?.remove();
  window.setTimeout(() => {
    t.classList.add('is-out');
    window.setTimeout(() => t.remove(), 300);
  }, ms);
  const gap = phone ? Math.min(ms, 2000) : 900;
  busyUntil = now + gap;
  if (queue.length) timer = window.setTimeout(pump, gap);
}

export function toast(html: string, ms = 2600): void {
  if (queue.length > 6) queue.shift();
  queue.push({ html, ms });
  pump();
}

/** Floating "1UP" style popup at a screen position. */
export function popText(text: string, x: number, y: number, color?: string): void {
  const el = document.createElement('div');
  el.className = 'oneup';
  el.textContent = text;
  el.setAttribute('aria-hidden', 'true');
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
  if (color) el.style.color = color;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1200);
}
