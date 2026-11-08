// All slot strings are local Vienna wall-clock time: 'YYYY-MM-DD HH:MM'.
// Comparing them lexicographically is correct and sidesteps DST arithmetic.

const pad = (n) => String(n).padStart(2, '0');

export function localNow(timeZone, date = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(date).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

const toMin = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** Every slot the availability rules allow, ignoring bookings. */
export function generateSlots(cfg, now = new Date()) {
  const nowLocal = localNow(cfg.timezone, now);
  const [y, mo, d] = nowLocal.slice(0, 10).split('-').map(Number);
  const earliest = localNow(cfg.timezone, new Date(now.getTime() + cfg.minNoticeHours * 3600_000));
  const out = [];
  for (let i = 0; i <= cfg.horizonDays; i++) {
    const day = new Date(Date.UTC(y, mo - 1, d + i)); // calendar date only, tz-independent
    const date = day.toISOString().slice(0, 10);
    if (cfg.blockedDates.includes(date)) continue;
    for (const w of cfg.weekly.filter((w) => w.weekday === day.getUTCDay())) {
      for (let m = toMin(w.start); m + cfg.slotMinutes <= toMin(w.end); m += cfg.slotMinutes) {
        const slot = `${date} ${fromMin(m)}`;
        if (slot >= earliest) out.push(slot);
      }
    }
  }
  return out;
}

export function freeSlots(db, cfg, now = new Date()) {
  const taken = new Set(db.prepare("SELECT slot FROM lessons WHERE status != 'cancelled'").all().map((r) => r.slot));
  return generateSlots(cfg, now).filter((s) => !taken.has(s));
}
