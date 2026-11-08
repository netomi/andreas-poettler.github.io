import { serve } from '@hono/node-server';
import { readFileSync } from 'node:fs';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { notify } from './notify.js';

const contentDir = process.env.CONTENT_DIR ?? new URL('../../content/', import.meta.url).pathname;
const readJson = (f) => JSON.parse(readFileSync(`${contentDir}/${f}`, 'utf8'));

if (!process.env.ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD not set: admin endpoints are disabled');

const app = createApp({
  db: openDb(process.env.DB_PATH ?? './data.sqlite'),
  availability: readJson('availability.json'),
  books: readJson('books.json'),
  notify,
  adminPassword: process.env.ADMIN_PASSWORD,
});

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (i) => console.log(`api listening on :${i.port}`));
