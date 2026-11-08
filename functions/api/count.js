/* Anonymous button counts for stephenfmontagnabooks.com (2026-11-08, Claude, at Nick's request).
 *
 * dist/app.js sends POST /api/count with {k, b, f, p} when a visitor presses a Paperback/Hardback buy button (k "buy")
 * or saves a book to the reading list (k "save"): b = book slug, f = format, p = where on the site. This adds 1 to the
 * day's row in the Cloudflare D1 database "montagna-counts" (binding DB on the Pages project), table `clicks`.
 *
 * Nothing about the visitor is stored: no cookie, no IP address, no user agent, no time finer than the day. Unknown
 * books, formats and placements are ignored, so the table only ever holds catalogue values.
 * Read the totals in Cloudflare (Stephen's account) → Storage & databases → D1 → montagna-counts → Console:
 *     SELECT * FROM totals;        SELECT * FROM by_day LIMIT 60;
 * Rows with placement "test" are verification presses and are left out of both views.
 */
const KINDS = new Set(['buy', 'save']);
const FORMATS = new Set(['paperback', 'hardback', '']);
const PLACES = new Set(['shelf', 'search', 'reading-list', 'home', 'book', 'books', 'review', 'portfolio', 'series',
  'collections', 'other', 'test']);
const HOSTS = new Set(['stephenfmontagnabooks.com', 'www.stephenfmontagnabooks.com']);
let slugs = null;

async function knownSlugs(env, request) {
  if (slugs) return slugs;
  const response = await env.ASSETS.fetch(new URL('/catalog.json', request.url));
  const rows = await response.json();
  slugs = new Set(rows.map(row => row.slug));
  return slugs;
}

const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

export async function onRequestPost({ request, env }) {
  try {
    const origin = request.headers.get('Origin');
    if (origin && !HOSTS.has(new URL(origin).hostname)) return done();
    const text = await request.text();
    if (!env.DB || text.length > 300) return done();
    const data = JSON.parse(text);
    const kind = String(data.k || ''), book = String(data.b || ''), format = String(data.f || ''), place = String(data.p || '');
    if (!KINDS.has(kind) || !FORMATS.has(format) || !PLACES.has(place)) return done();
    if ((kind === 'buy') !== (format !== '')) return done();
    if (!(await knownSlugs(env, request)).has(book)) return done();
    const day = new Date().toISOString().slice(0, 10);
    await env.DB.prepare('INSERT INTO clicks (day, kind, book, format, placement, n) VALUES (?1, ?2, ?3, ?4, ?5, 1) '
      + 'ON CONFLICT (day, kind, book, format, placement) DO UPDATE SET n = n + 1')
      .bind(day, kind, book, format, place).run();
  } catch (_) { /* a count is never worth an error for the visitor */ }
  return done();
}

export function onRequestGet() {
  return new Response('POST only', { status: 405, headers: { Allow: 'POST', 'X-Robots-Tag': 'noindex' } });
}
