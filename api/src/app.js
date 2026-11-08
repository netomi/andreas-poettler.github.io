import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { freeSlots } from './slots.js';
import { adminPage } from './admin.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    return recent.length > limit;
  };
}

function safeEqual(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function createApp({ db, availability, books, notify, adminPassword, now = () => new Date() }) {
  const app = new Hono();
  const limited = rateLimiter(10, 3600_000);
  const bookById = new Map(books.map((b) => [b.id, b]));
  // Caddy is the only thing that reaches us, so the last X-Forwarded-For hop is the client.
  const clientIp = (c) => (c.req.header('x-forwarded-for') ?? 'local').split(',').pop().trim();

  app.get('/api/slots', (c) => c.json({ slots: freeSlots(db, availability, now()) }));

  app.post('/api/lessons', async (c) => {
    if (limited(clientIp(c))) return c.json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, 429);
    const b = await c.req.json().catch(() => ({}));
    if (b.website) return c.json({ ok: true }); // honeypot: pretend success
    const slot = clip(b.slot, 16), name = clip(b.name, 100), email = clip(b.email, 200);
    if (!name || !EMAIL.test(email)) return c.json({ error: 'Bitte Name und gültige E-Mail angeben.' }, 400);
    if (!freeSlots(db, availability, now()).includes(slot)) {
      return c.json({ error: 'Dieser Termin ist leider nicht mehr verfügbar.' }, 409);
    }
    try {
      const r = db.prepare('INSERT INTO lessons (slot,name,email,phone,level,message) VALUES (?,?,?,?,?,?)')
        .run(slot, name, email, clip(b.phone, 40), clip(b.level, 60), clip(b.message, 2000));
      await notify(`Neue Unterrichtsanfrage ${slot}`, `${name} <${email}>\n${clip(b.message, 2000)}`);
      return c.json({ ok: true, id: Number(r.lastInsertRowid) }, 201);
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) return c.json({ error: 'Dieser Termin ist leider nicht mehr verfügbar.' }, 409);
      throw e;
    }
  });

  app.post('/api/orders', async (c) => {
    if (limited(clientIp(c))) return c.json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, 429);
    const b = await c.req.json().catch(() => ({}));
    if (b.website) return c.json({ ok: true });
    const name = clip(b.name, 100), email = clip(b.email, 200), address = clip(b.address, 500);
    if (!name || !EMAIL.test(email) || !address) return c.json({ error: 'Bitte Name, gültige E-Mail und Adresse angeben.' }, 400);
    if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 20) return c.json({ error: 'Keine Bücher ausgewählt.' }, 400);
    const items = [];
    for (const it of b.items) {
      const book = bookById.get(it?.id);
      const qty = Number(it?.qty);
      if (!book || !Number.isInteger(qty) || qty < 1 || qty > 20) return c.json({ error: 'Ungültige Auswahl.' }, 400);
      items.push({ id: book.id, title: book.title, qty, priceCents: book.priceCents }); // price always from server data
    }
    const total = items.reduce((s, i) => s + i.qty * i.priceCents, 0);
    const r = db.prepare('INSERT INTO orders (name,email,address,message,items,total_cents) VALUES (?,?,?,?,?,?)')
      .run(name, email, address, clip(b.message, 2000), JSON.stringify(items), total);
    await notify(`Neue Buchbestellung #${r.lastInsertRowid}`, `${name} <${email}>\n${items.map((i) => `${i.qty}× ${i.title}`).join('\n')}`);
    return c.json({ ok: true, id: Number(r.lastInsertRowid) }, 201);
  });

  // ---- admin (HTTP basic auth; always behind TLS in production) ----
  app.use('/api/admin/*', async (c, next) => {
    const h = c.req.header('authorization') ?? '';
    const pw = h.startsWith('Basic ') ? Buffer.from(h.slice(6), 'base64').toString().split(':').slice(1).join(':') : '';
    if (!adminPassword || !safeEqual(pw, adminPassword)) {
      return c.text('Authentication required', 401, { 'WWW-Authenticate': 'Basic realm="admin", charset="UTF-8"' });
    }
    await next();
  });
  app.get('/api/admin', (c) => c.html(adminPage));
  app.get('/api/admin/data', (c) => c.json({
    lessons: db.prepare('SELECT * FROM lessons ORDER BY slot DESC LIMIT 500').all(),
    orders: db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 500').all().map((o) => ({ ...o, items: JSON.parse(o.items) })),
  }));
  app.post('/api/admin/lessons/:id/status', async (c) => {
    const { status } = await c.req.json().catch(() => ({}));
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) return c.json({ error: 'bad status' }, 400);
    const r = db.prepare('UPDATE lessons SET status=? WHERE id=?').run(status, Number(c.req.param('id')));
    return r.changes ? c.json({ ok: true }) : c.json({ error: 'not found' }, 404);
  });
  app.post('/api/admin/orders/:id/status', async (c) => {
    const { status } = await c.req.json().catch(() => ({}));
    if (!['new', 'paid', 'shipped', 'cancelled'].includes(status)) return c.json({ error: 'bad status' }, 400);
    const r = db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, Number(c.req.param('id')));
    return r.changes ? c.json({ ok: true }) : c.json({ error: 'not found' }, 404);
  });

  return app;
}
