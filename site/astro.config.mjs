import { defineConfig } from 'astro/config';

// SITE_URL / BASE_PATH are only set for the GitHub Pages preview (project site under a sub-path).
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://andreas-poettler.at',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'never',
  build: { format: 'file' },
  // dev only: forward API calls to the local api (cd api && npm start)
  vite: { server: { proxy: { '/api': 'http://localhost:3000' } } },
});
