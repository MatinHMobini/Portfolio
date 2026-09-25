/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { content } from './src/content.ts';
import { renderApp } from './src/sections/render.ts';

/**
 * Injects the fully rendered site (from src/content.ts) into index.html
 * at the <!--APP--> marker, so the page works and is readable even
 * without JavaScript. Editing content.ts restarts the dev server.
 */
function renderContent(): Plugin {
  return {
    name: 'pixel-quest-render-content',
    transformIndexHtml(html) {
      return html
        .replace('<!--APP-->', renderApp(content))
        .replaceAll('%NAME%', content.name)
        .replaceAll('%FULLNAME%', content.fullName)
        .replaceAll('%ROLE%', `${content.role}. Builds ${content.builds}.`);
    },
  };
}

export default defineConfig({
  // The site is served from https://matinhmobini.github.io/Portfolio/
  base: '/Portfolio/',
  plugins: [renderContent()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
