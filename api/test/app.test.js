import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { generateSlots } from '../src/slots.js';

const availability = { timezone: 'Europe/Vienna', slotMinutes: 45, horizonDays: 14, minNoticeHours: 24, weekly: [{ weekday: 2, start: '15:00', end: '16:30' }], blockedDates: [] };
const books = [{ id: 'b1', title: 'B1', priceCents: 1000 }];
const NOW = new Date('2026-11-08T10:00:00Z'); // Sunday

function setup() {
  const sent = [];
  const app = createApp({ db: openDb(':memory:'), availability, books, notify: async (s) => sent.push(s), adminPassword: 'pw', now: () => NOW });
  const post = (path, body) => app.request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { app, post, sent };
}

test('slots are only generated on configured weekdays, respecting notice', () => {
  const s = generateSlots(availability, NOW);
  assert.deepEqual(s.slice(0, 2), ['2026-11-10 15:00', '2026-11-10 15:45']);
  assert.ok(!s.includes('2026-11-10 16:30'));
});

test('booking a slot removes it; double booking gets 409', async () => {
  const { app, post } = setup();
  const lesson = { slot: '2026-11-10 15:00', name: 'Anna', email: 'a@example.com' };
  assert.equal((await post('/api/lessons', lesson)).status, 201);
  assert.equal((await post('/api/lessons', lesson)).status, 409);
  const { slots } = await (await app.request('/api/slots')).json();
  assert.ok(!slots.includes(lesson.slot));
});

test('cancelling frees the slot again', async () => {
  const { app, post } = setup();
  const auth = { authorization: 'Basic ' + Buffer.from('a:pw').toString('base64'), 'content-type': 'application/json' };
  const r = await (await post('/api/lessons', { slot: '2026-11-10 15:00', name: 'A', email: 'a@example.com' })).json();
  await app.request(`/api/admin/lessons/${r.id}/status`, { method: 'POST', headers: auth, body: JSON.stringify({ status: 'cancelled' }) });
  assert.equal((await post('/api/lessons', { slot: '2026-11-10 15:00', name: 'B', email: 'b@example.com' })).status, 201);
});

test('invalid input and unknown slots are rejected', async () => {
  const { post } = setup();
  assert.equal((await post('/api/lessons', { slot: '2026-11-10 15:00', name: '', email: 'x' })).status, 400);
  assert.equal((await post('/api/lessons', { slot: '2030-01-01 10:00', name: 'A', email: 'a@example.com' })).status, 409);
});

test('orders take prices from server data and reject unknown books', async () => {
  const { app, post } = setup();
  const base = { name: 'A', email: 'a@example.com', address: 'Weg 1' };
  assert.equal((await post('/api/orders', { ...base, items: [{ id: 'nope', qty: 1 }] })).status, 400);
  assert.equal((await post('/api/orders', { ...base, items: [{ id: 'b1', qty: 2, priceCents: 1 }] })).status, 201);
  const auth = { authorization: 'Basic ' + Buffer.from('a:pw').toString('base64') };
  const { orders } = await (await app.request('/api/admin/data', { headers: auth })).json();
  assert.equal(orders[0].total_cents, 2000);
});

test('admin requires the password', async () => {
  const { app } = setup();
  assert.equal((await app.request('/api/admin/data')).status, 401);
  const bad = { authorization: 'Basic ' + Buffer.from('a:wrong').toString('base64') };
  assert.equal((await app.request('/api/admin/data', { headers: bad })).status, 401);
});
