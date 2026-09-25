/** Tiny pooled pixel particle system (dust, sparkles, beams, motion lines). */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  gravity: number;
}

export class Particles {
  items: Particle[] = [];
  limit: number;

  constructor(limit = 300) {
    this.limit = limit;
  }

  spawn(p: Partial<Particle> & { x: number; y: number }): void {
    if (this.items.length >= this.limit) this.items.shift();
    this.items.push({ vx: 0, vy: 0, life: 0, max: 0.6, size: 2, color: '#F5F2FF', gravity: 0, ...p });
  }

  burst(x: number, y: number, n: number, color: string, speed = 60, opts: Partial<Particle> = {}): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, max: 0.4 + Math.random() * 0.4, ...opts });
    }
  }

  dust(x: number, y: number, n = 8): void {
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1;
      this.spawn({ x, y, vx: dir * (20 + Math.random() * 50), vy: -10 - Math.random() * 30, color: '#B3ADD6', size: 2, max: 0.35 + Math.random() * 0.2, gravity: 60 });
    }
  }

  update(dt: number): void {
    for (const p of this.items) {
      p.life += dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.items = this.items.filter((p) => p.life < p.max);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, top: number): void {
    for (const p of this.items) {
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y + top), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.items = [];
  }
}
