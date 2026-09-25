/** Pixel toast notifications ("NEW SKILL LEARNED", "LEVEL CLEAR"...). */
const host = () => document.getElementById('toasts');

export function toast(html: string, ms = 2600): void {
  const el = host();
  if (!el) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = html;
  el.appendChild(t);
  while (el.children.length > 3) el.firstElementChild?.remove();
  window.setTimeout(() => {
    t.classList.add('is-out');
    window.setTimeout(() => t.remove(), 300);
  }, ms);
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
