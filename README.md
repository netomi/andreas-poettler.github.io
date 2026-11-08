# andreas-poettler.at

- `site/` – Astro static site (German). Content (German) was imported from the WordPress export; the old Jekyll repo is outdated and not used.
- `api/` – Node 22 + Hono + SQLite: lesson booking (`/api/slots`, `/api/lessons`), book orders (`/api/orders`), admin at `/api/admin` (basic auth).
- `content/` – `books.json`, `availability.json` (weekly lesson hours, slot length, notice), shared by site and api.
- `compose.yaml` + `Caddyfile` – the whole thing on any VM: `cp .env.example .env && podman compose up -d --build`.

Dev: `cd api && ADMIN_PASSWORD=x npm start`; `cd site && npm run dev`.
Tests: `cd api && npm test`.

Stubs: `content/books.json` and `content/availability.json` hold placeholder data; email (`api/src/notify.js`) only logs. Open: real books/hours, SMTP, payment (postponed), legal texts, photos (need WordPress uploads).
