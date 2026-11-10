import { defineConfig } from 'astro/config';

const base = (process.env.BASE_PATH ?? '/').replace(/\/$/, ''); // '' on a custom domain

// SITE_URL / BASE_PATH are only set for the GitHub Pages preview (project site under a sub-path).
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://andreas-poettler.at',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'never',
  build: { format: 'file' },
  // URLs of the old WordPress site (GitHub Pages has no server-side redirects, so these become meta-refresh pages)
  redirects: {
    '/lebenslauf': `${base}/vita`,
    '/contact': `${base}/kontakt`,
    '/teaching': `${base}/unterricht`,
    '/unterrichten': `${base}/unterricht`,
    '/referenzen': `${base}/stimmen`,
    '/referenzen-2': `${base}/stimmen`,
    '/kritiken': `${base}/stimmen`,
    '/privacy-policy': `${base}/datenschutz`,
  },
  // dev only: forward API calls to the local api (cd api && npm start)
  vite: { server: { proxy: { '/api': 'http://localhost:3000' } } },
});
