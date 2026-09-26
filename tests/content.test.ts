import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { content } from '../src/content.ts';
import { renderApp, esc, SECTIONS } from '../src/sections/render.ts';
import { THEME_IDS } from '../src/game/level.ts';

const pub = (p: string) => resolve(__dirname, '../public', p);

describe('content.ts data shape', () => {
  it('has the core identity fields', () => {
    for (const k of ['name', 'firstName', 'gamertag', 'role', 'builds', 'location', 'bio'] as const) {
      expect(typeof content[k]).toBe('string');
      expect(content[k].length).toBeGreaterThan(0);
    }
    expect(content.firstName).toMatch(/^[a-z0-9_-]+$/i);
    expect(content.dialog.length).toBeGreaterThan(0);
  });

  it('has valid links', () => {
    expect(content.links.linkedin).toMatch(/^https:\/\//);
    expect(content.links.github).toMatch(/^https:\/\/github\.com\//);
    expect(content.links.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it('has skills with levels from 1 to 10', () => {
    expect(content.skills.length).toBeGreaterThan(0);
    for (const s of content.skills) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.level).toBeGreaterThanOrEqual(1);
      expect(s.level).toBeLessThanOrEqual(10);
    }
  });

  it('has experience entries with achievements', () => {
    expect(content.experience.length).toBeGreaterThan(0);
    for (const j of content.experience) {
      expect(j.team && j.role && j.years).toBeTruthy();
      expect(j.achievements.length).toBeGreaterThan(0);
    }
  });

  it('has projects with unique ids, valid links and existing screenshots', () => {
    const ids = content.projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of content.projects) {
      expect(p.name && p.year && p.tagline && p.description).toBeTruthy();
      expect(['yellow', 'pink', 'cyan']).toContain(p.color);
      if (p.playUrl) expect(p.playUrl).toMatch(/^https?:\/\//);
      if (p.codeUrl) expect(p.codeUrl).toMatch(/^https?:\/\//);
      for (const s of p.screenshots) expect(existsSync(pub(s)), s).toBe(true);
    }
  });

  it('points to files that exist in /public', () => {
    expect(existsSync(pub(content.photo))).toBe(true);
    expect(existsSync(pub(content.cv))).toBe(true);
  });

  it('maps every section to a real level theme', () => {
    for (const s of SECTIONS) expect(THEME_IDS).toContain(s.theme);
  });
});

describe('build-time HTML renderer', () => {
  const html = renderApp(content);

  it('puts all the real content into the page (readable without JS)', () => {
    expect(html).toContain(esc(content.name.split(' ')[0]));
    for (const p of content.projects) expect(html).toContain(esc(p.name));
    for (const j of content.experience) expect(html).toContain(esc(j.team));
    for (const s of content.skills) expect(html).toContain(esc(s.name));
    for (const s of SECTIONS) expect(html).toContain(`id="${s.id}"`);
    expect(html).toContain('HOW IT WORKS');
  });

  it('escapes HTML', () => {
    expect(esc('<b>"x" & \'y\'</b>')).toBe('&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;');
  });

  it('labels every form field', () => {
    for (const id of ['f-name', 'f-email', 'f-msg']) expect(html).toContain(`for="${id}"`);
  });
});

describe('page wording and layout choices', () => {
  const html = renderApp(content);

  it('has no PLAY links on projects, only VIEW CODE', () => {
    expect(html).not.toContain('▶ PLAY<');
    expect(html).toContain('VIEW CODE');
  });

  it('starts every experience row open', () => {
    expect(html).not.toMatch(/class="score__more"[^>]*hidden/);
    expect(html).not.toContain('aria-expanded="false"');
  });

  it('numbers pages 1 to 6 (no "1-N")', () => {
    expect(SECTIONS.map((s) => s.world)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(html).not.toMatch(/WORLD 1-\d/);
  });

  it('uses plain page titles for about, experience and projects', () => {
    for (const t of ['>ABOUT</h2>', '>EXPERIENCE</h2>', '>PROJECTS</h2>', '>NEURAL NET</h2>', '>CONTINUE?</h2>']) expect(html).toContain(t);
  });

  it('offers PLAY IT YOURSELF and labels the skill boxes', () => {
    expect(html).toContain('data-you-play');
    expect(html).toContain('SKILLS THE AI HAS SHOWN YOU');
    expect(html).not.toContain('MORE AI / ML LOOT');
  });
});
