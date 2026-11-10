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
Without a variable the feature is shown but disabled. `PUBLIC_ORDERS=off` additionally disables the order form while the key stays configured. These services must be named in the privacy policy (Cal.com, Web3Forms, YouTube).

## Custom domain cutover (GitHub Pages)
The workflow builds for the preview URL until the repo variable `CUSTOM_DOMAIN` is set (e.g. `andreas-poettler.at`); then it builds for that domain (no base path, indexable, canonical URLs).
1. A day ahead: lower the TTL of the apex and `www` A records at the DNS host (currently 86400 s).
2. Verify the domain in GitHub (Settings > Pages > Verified domains: adds a TXT record `_github-pages-challenge-<user>`).
3. DNS: apex `A` -> 185.199.108.153 / .109.153 / .110.153 / .111.153 (optionally `AAAA` 2606:50c0:8000::153 .. 8003::153); `www` `CNAME` -> `<user>.github.io`. **Do not touch** MX / `mail` / `ftp` / `_dmarc` records (mail runs on the old host).
4. Set variable `CUSTOM_DOMAIN`, set the custom domain in Settings > Pages, re-run the workflow, then enable "Enforce HTTPS" once the certificate is issued.
Old WordPress URLs (`/lebenslauf`, `/contact`, ...) are redirected by meta-refresh pages, see `site/astro.config.mjs`.
