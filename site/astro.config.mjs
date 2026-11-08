import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://andreas-poettler.at',
  trailingSlash: 'never',
  build: { format: 'file' },
  // dev only: forward API calls to the local api (cd api && npm start)
  vite: { server: { proxy: { '/api': 'http://localhost:3000' } } },
});
