// Gzowo StarNet worker: anonymous play events, learned stats and Haiku tags for projects without curated ones.

const MODEL = 'claude-haiku-5-5';
const DAY = 86400000;
const ORIGINS = [/^https:\/\/starnet\.gzowo\.fun$/, /^https:\/\/(www\.)?gzowo\.fun$/, /^https:\/\/jerzysukiennik\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MOODS = ['chill', 'action', 'scary', 'build', 'create', 'funny', 'puzzle', 'explore'];
const KITS = ['cam', 'proj', 'phone', 'mic', 'head'];
const WITH = ['solo', 'online', 'couch'];
const DEVS = ['desk', 'phone'];
const KINDS = ['play', 'like', 'nope'];
const EXAMPLES = ['toot-tube', 'ghostbusters', 'noclip', 'instalator', 'squish', 'voidworks', 'beam'];
const MAX_TAG = 4;
const HEAD_BATCH = 28;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || '';
    const cors = { 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,x-admin-key', vary: 'origin' };
    if (ORIGINS.some(r => r.test(origin))) cors['access-control-allow-origin'] = origin;
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      if (url.pathname === '/data' && req.method === 'GET') {
        const row = await env.DB.prepare("SELECT v FROM kv WHERE k = 'data'").first();
        return new Response(row ? row.v : '{"v":1,"auto":{},"stats":null,"img":{}}', { headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'public, max-age=300' } });
      }
      if (url.pathname === '/event' && req.method === 'POST') {
        const status = await event(req, env);
        return new Response(null, { status, headers: cors });
      }
      if (url.pathname === '/admin/run' && req.method === 'POST') {
        if (!env.ADMIN_KEY || req.headers.get('x-admin-key') !== env.ADMIN_KEY) return out({ error: 'nope' }, 403, cors);
        return out(await run(env), 200, cors);
      }
      if (url.pathname === '/') return out({ ok: true, name: 'gzowo-starnet' }, 200, cors);
      return out({ error: 'not found' }, 404, cors);
    } catch (e) {
      return out({ error: 'server' }, 500, cors);
    }
  },
  async scheduled(ev, env, ctx) {
    ctx.waitUntil(run(env));
  }
};

function out(body, status, cors) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

async function ipHash(req) {
  const ip = req.headers.get('cf-connecting-ip') || '0';
  const day = Math.floor(Date.now() / DAY);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + ':' + day + ':starnet'));
  return [...new Uint8Array(buf).slice(0, 8)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const pick = (v, allowed, max) => Array.isArray(v)
  ? [...new Set(v.filter(x => typeof x === 'string' && (allowed ? allowed.includes(x) : SLUG.test(x))))].slice(0, max)
  : [];

async function event(req, env) {
  const txt = await req.text();
  if (txt.length > 6000) return 413;
  let b;
  try { b = JSON.parse(txt); } catch { return 400; }
  const kind = KINDS.includes(b.kind) ? b.kind : null;
  const slug = typeof b.slug === 'string' && SLUG.test(b.slug) ? b.slug : null;
  const sid = typeof b.sid === 'string' && /^[a-z0-9]{8,32}$/.test(b.sid) ? b.sid : null;
  if (!kind || !slug || !sid) return 400;
  const ip = await ipHash(req);
  const now = Date.now();
  const rec = await env.DB.prepare('SELECT COUNT(*) AS n FROM events WHERE ip = ? AND ts > ?').bind(ip, now - 600000).first();
  if (rec && rec.n >= 80) return 429;
  const age = Number.isFinite(b.age) ? Math.max(3, Math.min(99, Math.round(b.age))) : null;
  const time = [5, 30, 120].includes(b.time) ? b.time : null;
  await env.DB.prepare('INSERT INTO events (ts, sid, ip, kind, slug, likes, nopes, age, with_, moods, time, kit, dev, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(now, sid, ip, kind, slug, pick(b.likes, null, 30).join(','), pick(b.nopes, null, 30).join(','), age,
      WITH.includes(b.with) ? b.with : null, pick(b.moods, MOODS, 8).join(','), time, pick(b.kit, KITS, 5).join(','),
      DEVS.includes(b.dev) ? b.dev : null, b.lang === 'pl' ? 'pl' : 'en')
    .run();
  return 204;
}

function bucket(a) { return a < 7 ? '0-6' : a < 10 ? '7-9' : a < 13 ? '10-12' : a < 16 ? '13-15' : '16+'; }

async function stats(env) {
  const rows = (await env.DB.prepare('SELECT sid, kind, slug, likes, age, with_, moods, dev FROM events WHERE ts > ? ORDER BY id DESC LIMIT 50000').bind(Date.now() - 180 * DAY).all()).results || [];
  const plays = {}, co = {}, ctx = {}, sids = new Set(), seen = new Set();
  let total = 0;
  const add = (o, a, b, w) => { const r = o[a] || (o[a] = { _n: 0 }); r[b] = (r[b] || 0) + w; r._n += w; };
  for (const r of rows) {
    const key = r.sid + '|' + r.kind + '|' + r.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    sids.add(r.sid);
    const likes = r.likes ? r.likes.split(',') : [];
    if (r.kind === 'play') {
      plays[r.slug] = (plays[r.slug] || 0) + 1;
      total++;
      for (const l of likes) if (l !== r.slug) add(co, l, r.slug, 1);
      const keys = [];
      if (r.age != null) keys.push('age:' + bucket(r.age));
      if (r.with_) keys.push('with:' + r.with_);
      if (r.dev) keys.push('dev:' + r.dev);
      for (const m of r.moods ? r.moods.split(',') : []) keys.push('mood:' + m);
      for (const k of keys) add(ctx, k, r.slug, 1);
    } else if (r.kind === 'like') {
      for (const l of likes) if (l !== r.slug) { add(co, l, r.slug, 0.5); add(co, r.slug, l, 0.5); }
    }
  }
  return { sessions: sids.size, totalPlays: total, maxPlays: Math.max(0, ...Object.values(plays)), plays, co, ctx };
}

function fnv(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}

function brief(p) {
  return {
    name: p.name, category: p.category, status: p.status, playable_link: !!p.url, blurb: p.blurb || '',
    description: (p.body || []).join(' ').slice(0, 2600), stack: (p.stack || []).slice(0, 12)
  };
}

function tagTool(vocab) {
  const n01 = { type: 'number', minimum: 0, maximum: 1 };
  return {
    name: 'tags',
    description: 'Recommendation tags for one project.',
    input_schema: {
      type: 'object', additionalProperties: false,
      required: ['d', 'q', 'age', 'sc', 'vi', 'np', 'on', 'couch', 'solo', 'dev', 'mob', 'kit', 'opt', 't', 'm', 'f', 'lang', 'pl'],
      properties: {
        d: { type: 'integer', minimum: 1, maximum: 5, description: 'How hard it is to understand: 1 obvious in ten seconds, 3 needs a minute of reading, 5 needs setup, calibration or learning a system.' },
        q: { type: 'number', minimum: 1, maximum: 5, description: 'Polish: 1 rough sketch, 3 solid, 5 finished and shiny. Use the length and detail of the description and the status.' },
        age: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 99 }, minItems: 3, maxItems: 3, description: '[minimum age, sweet spot from, sweet spot to]. 99 means no upper limit.' },
        sc: { type: 'integer', minimum: 0, maximum: 3, description: 'How scary: 0 none, 3 real horror.' },
        vi: { type: 'integer', minimum: 0, maximum: 3, description: 'Violence: 0 none, 2 guns or cutting monsters, 3 gore.' },
        np: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 99 }, minItems: 2, maxItems: 2, description: '[min players, max players].' },
        on: { type: 'integer', enum: [0, 1], description: '1 if friends can play together online.' },
        couch: { type: 'integer', enum: [0, 1], description: '1 if several people play in one room on one screen, for example with phones as controllers.' },
        solo: { type: 'integer', enum: [0, 1], description: '1 if it can be played alone.' },
        dev: { type: 'string', enum: ['any', 'desk', 'win', 'none'], description: 'any = computer and phone, desk = computer browser only, win = Windows download, none = nothing to open yet.' },
        mob: { type: 'integer', enum: [0, 1, 2], description: 'Phone support: 0 none, 1 partly, 2 good.' },
        kit: { type: 'array', items: { type: 'string', enum: ['cam', 'proj', 'phone', 'mic'] }, description: 'Gear that is required.' },
        opt: { type: 'array', items: { type: 'string', enum: ['head', 'proj', 'phone'] }, description: 'Gear that is recommended but optional.' },
        t: { type: 'integer', enum: [5, 10, 15, 20, 30, 45, 60], description: 'Typical session in minutes.' },
        m: { type: 'object', additionalProperties: false, required: MOODS, properties: Object.fromEntries(MOODS.map(k => [k, n01])), description: 'How much of each mood, 0 to 1.' },
        f: { type: 'array', items: { type: 'string', enum: vocab }, maxItems: 7, description: 'Features from the vocabulary.' },
        lang: { type: 'string', enum: ['', 'pl'], description: 'pl only when the project itself speaks only Polish.' },
        pl: { type: 'string', description: 'One natural Polish sentence for a card, at most 140 characters, no em dashes, no quotes.' }
      }
    }
  };
}

function clean(t, p) {
  const num = (v, a, b, d) => Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : d;
  const age = Array.isArray(t.age) && t.age.length === 3 ? t.age.map(x => num(x, 0, 99, 0)) : [7, 8, 99];
  if (age[1] < age[0]) age[1] = age[0];
  if (age[2] < age[1]) age[2] = 99;
  const np = Array.isArray(t.np) && t.np.length === 2 ? t.np.map(x => num(x, 1, 99, 1)) : [1, 1];
  if (np[1] < np[0]) np[1] = np[0];
  const m = {};
  for (const k of MOODS) m[k] = Math.round(num(t.m && t.m[k], 0, 1, 0) * 100) / 100;
  const dev = !p.url ? 'none' : ['any', 'desk', 'win', 'none'].includes(t.dev) ? t.dev : 'desk';
  return {
    d: Math.round(num(t.d, 1, 5, 2)), q: Math.round(num(t.q, 1, 5, 3) * 2) / 2, age, sc: Math.round(num(t.sc, 0, 3, 0)), vi: Math.round(num(t.vi, 0, 3, 0)),
    np, on: t.on ? 1 : 0, couch: t.couch ? 1 : 0, solo: t.solo === 0 ? 0 : 1, dev: dev === 'none' && p.url ? 'desk' : dev,
    mob: [0, 1, 2].includes(t.mob) ? t.mob : 0, kit: pick(t.kit, ['cam', 'proj', 'phone', 'mic'], 4), opt: pick(t.opt, ['head', 'proj', 'phone'], 3),
    t: num(t.t, 5, 120, 20), m, f: Array.isArray(t.f) ? [...new Set(t.f.filter(x => typeof x === 'string'))].slice(0, 7) : [],
    lang: t.lang === 'pl' ? 'pl' : undefined, pl: typeof t.pl === 'string' ? t.pl.replace(/—/g, ',').slice(0, 180) : '', auto: 'haiku'
  };
}

async function tagOne(env, p, vocab, examples) {
  const system = 'You tag projects for Gzowo StarNet, a recommender on gzowo.fun that matches visitors (kids, teens and their parents) with the browser games, toys and apps made by Jurek, a 14-year-old maker from Warsaw. Visitors say which projects they like, their age, who they play with, their mood, time and gear, and the tags decide what stays on screen. Be honest and calibrated: copy the scale of these hand-made examples.\n\n' +
    examples.map(e => 'Project: ' + JSON.stringify(e.p) + '\nTags: ' + JSON.stringify(e.t)).join('\n\n');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 900, thinking: { type: 'disabled' }, system,
      tools: [tagTool(vocab)], tool_choice: { type: 'tool', name: 'tags' },
      messages: [{ role: 'user', content: 'Tag this project.\nProject: ' + JSON.stringify(brief(p)) }]
    })
  });
  if (!res.ok) throw new Error('haiku ' + res.status);
  const data = await res.json();
  const use = (data.content || []).find(c => c.type === 'tool_use');
  if (!use) throw new Error('no tool');
  const t = clean(use.input, p);
  t.f = t.f.filter(x => vocab.includes(x));
  return t;
}

async function autotag(env, vis, curated) {
  const rows = (await env.DB.prepare('SELECT slug, hash FROM auto_tags').all()).results || [];
  const have = Object.fromEntries(rows.map(r => [r.slug, r.hash]));
  const todo = [];
  for (const p of vis) {
    if (curated[p.slug]) continue;
    const h = fnv([p.name, p.category, p.status, p.url, p.blurb, (p.body || []).join(' ')].join('|'));
    if (have[p.slug] !== h) todo.push([p, h]);
  }
  const vocab = [...new Set(Object.values(curated).flatMap(t => t.f || []))].sort();
  const examples = EXAMPLES.map(s => {
    const p = vis.find(x => x.slug === s), t = curated[s];
    if (!p || !t) return null;
    const { pl, ...rest } = t;
    return { p: brief(p), t: { ...rest, pl } };
  }).filter(Boolean);
  const stmts = [];
  if (vocab.length && examples.length) {
    for (const [p, h] of todo.slice(0, MAX_TAG)) {
      try {
        const t = await tagOne(env, p, vocab, examples);
        stmts.push(env.DB.prepare('INSERT OR REPLACE INTO auto_tags (slug, hash, tags, ts) VALUES (?, ?, ?, ?)').bind(p.slug, h, JSON.stringify(t), Date.now()));
      } catch (e) {}
    }
  }
  if (stmts.length) await env.DB.batch(stmts);
  const all = (await env.DB.prepare('SELECT slug, tags FROM auto_tags').all()).results || [];
  const visSet = new Set(vis.map(p => p.slug));
  const auto = {};
  for (const r of all) if (visSet.has(r.slug) && !curated[r.slug]) auto[r.slug] = JSON.parse(r.tags);
  return { auto, tagged: stmts.length, pending: Math.max(0, todo.length - stmts.length) };
}

async function imgSizes(env, vis, prev) {
  const withImg = vis.filter(p => typeof p.image === 'string' && /^[\w./-]+$/.test(p.image));
  const n = withImg.length;
  const img = {};
  for (const p of withImg) if (prev[p.slug]) img[p.slug] = prev[p.slug];
  if (!n) return img;
  const start = (Math.floor(Date.now() / 3600000) * HEAD_BATCH) % n;
  const batch = [];
  for (let i = 0; i < Math.min(HEAD_BATCH, n); i++) batch.push(withImg[(start + i) % n]);
  await Promise.all(batch.map(async p => {
    try {
      const r = await fetch(env.SITE + p.image, { method: 'HEAD' });
      const len = +r.headers.get('content-length');
      if (r.ok && len) img[p.slug] = len;
    } catch (e) {}
  }));
  return img;
}

async function run(env) {
  const prevRow = await env.DB.prepare("SELECT v FROM kv WHERE k = 'data'").first();
  const prev = prevRow ? JSON.parse(prevRow.v) : {};
  const [pj, tj] = await Promise.all([
    fetch(env.PROJECTS_URL, { cf: { cacheTtl: 60 } }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(env.TAGS_URL, { cf: { cacheTtl: 60 } }).then(r => r.ok ? r.json() : null).catch(() => null)
  ]);
  const vis = pj ? (pj.projects || []).filter(p => p && p.slug && !p.hidden && SLUG.test(p.slug)) : [];
  let at = { auto: prev.auto || {}, tagged: 0, pending: 0 };
  if (pj && tj && tj.projects && Object.keys(tj.projects).length) at = await autotag(env, vis, tj.projects);
  const st = await stats(env);
  const img = pj ? await imgSizes(env, vis, prev.img || {}) : prev.img || {};
  const data = { v: 1, ts: Date.now(), auto: at.auto, stats: st, img };
  await env.DB.prepare("INSERT OR REPLACE INTO kv (k, v, ts) VALUES ('data', ?, ?)").bind(JSON.stringify(data), Date.now()).run();
  return { auto: Object.keys(at.auto).length, tagged: at.tagged, pending: at.pending, sessions: st.sessions, plays: st.totalPlays, img: Object.keys(img).length };
}
