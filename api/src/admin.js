// Minimal single-page admin. All dynamic values are inserted via textContent, never innerHTML.
export const adminPage = `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin</title>
<style>body{font:15px system-ui;max-width:60rem;margin:2rem auto;padding:0 1rem}table{border-collapse:collapse;width:100%;margin-bottom:2rem}td,th{border-bottom:1px solid #ddd;padding:.4rem;text-align:left;vertical-align:top}.pending,.new{background:#fff8e1}.cancelled{opacity:.5}</style>
<h1>Unterrichtsanfragen</h1><table id="lessons"></table>
<h1>Bestellungen</h1><table id="orders"></table>
<script>
const $ = (id) => document.getElementById(id);
async function post(url, status) { await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) }); load(); }
function cell(tr, text) { const td = document.createElement('td'); td.textContent = text; tr.append(td); return td; }
function actions(tr, base, id, statuses, current) {
  const td = document.createElement('td');
  for (const s of statuses.filter((s) => s !== current)) { const b = document.createElement('button'); b.textContent = s; b.onclick = () => post(base + id + '/status', s); td.append(b, ' '); }
  tr.append(td);
}
async function load() {
  const d = await (await fetch('/api/admin/data')).json();
  const L = $('lessons'); L.replaceChildren();
  for (const l of d.lessons) { const tr = L.insertRow(); tr.className = l.status;
    cell(tr, l.slot); cell(tr, l.name + ' <' + l.email + '>' + (l.phone ? ' ' + l.phone : '')); cell(tr, [l.level, l.message].filter(Boolean).join(' – ')); cell(tr, l.status);
    actions(tr, '/api/admin/lessons/', l.id, ['confirmed', 'cancelled', 'pending'], l.status); }
  const O = $('orders'); O.replaceChildren();
  for (const o of d.orders) { const tr = O.insertRow(); tr.className = o.status;
    cell(tr, '#' + o.id + ' ' + o.created_at); cell(tr, o.name + ' <' + o.email + '>\\n' + o.address).style.whiteSpace = 'pre-line';
    cell(tr, o.items.map((i) => i.qty + '× ' + i.title).join(', ') + ' = ' + (o.total_cents / 100).toFixed(2) + ' €'); cell(tr, o.status);
    actions(tr, '/api/admin/orders/', o.id, ['paid', 'shipped', 'cancelled', 'new'], o.status); }
}
load();
</script></html>`;
