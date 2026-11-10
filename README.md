# andreas-poettler.at

- `site/` – Astro static site (German). Content (German) was imported from the WordPress export; the old Jekyll repo is outdated and not used.
- `api/` – Node 22 + Hono + SQLite: own booking/orders API with admin page. **Not used by the GitHub Pages setup**; kept for a self-hosted variant (see `compose.yaml`).
- `content/` – `books.json`, `availability.json` (weekly lesson hours, slot length, notice), shared by site and api.
- `compose.yaml` + `Caddyfile` – the whole thing on any VM: `cp .env.example .env && podman compose up -d --build`.

Dev: `cd api && ADMIN_PASSWORD=x npm start`; `cd site && npm run dev`.
Tests: `cd api && npm test`.

Stubs: `content/books.json` and `content/availability.json` hold placeholder data; email (`api/src/notify.js`) only logs. Open: real books/hours, SMTP, payment (postponed), legal texts, photos (need WordPress uploads).

## GitHub Pages setup (current)
Static site only; no server. Third-party services, configured via repository variables:
- `PUBLIC_CAL_LINK` – Cal.com booking link (`user/event`) → lesson calendar on `/unterricht` (embedded after click).
- `PUBLIC_FORM_KEY` – Web3Forms access key → book orders on `/buecher` arrive by email.
Without a variable the feature is shown but disabled. These services must be named in the privacy policy (Cal.com, Web3Forms, YouTube).
