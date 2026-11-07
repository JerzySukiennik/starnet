// Gzowo StarNet: every Gzowo Labs project hangs in one net, and what does not fit the visitor drops out live.
import { MOODS, MOOD_LABEL, lab, buildModel, emptyState, rank, reasonText, negText, factsLine } from './engine.js';

const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const API = LOCAL ? 'http://127.0.0.1:8788' : 'https://gzowo-starnet.kalakasanyt.workers.dev';
const PROJECTS_URL = 'https://gzowo.fun/data/projects.json';
const BASE = 96;
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const coarse = matchMedia('(pointer: coarse)').matches;
const isPhone = coarse && Math.min(screen.width, screen.height) < 600;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TX = {
  pl: {
    sub: 'Wszystkie projekty Gzowo Labs w jednej siatce. Powiedz, co lubisz, a niepasujące odpadną.',
    count: (n, N) => '<b>' + n + '</b> z ' + N, best: 'Najlepiej pasuje',
    bestEmpty: 'Kliknij kartkę, którą znasz i lubisz, albo powiedz coś o sobie. Tu pojawi się Twoja trójka.',
    likes: 'Co już lubisz?', likesHint: 'Klikaj kartki, które znasz i lubisz. Te, które nie są dla Ciebie, możesz odrzucić.', likesEmpty: 'Jeszcze nic.',
    about: 'O Tobie, wszystko opcjonalne', age: 'Ile masz lat?', ageNone: 'nie podam',
    with: 'Z kim grasz?', solo: 'Sam', online: 'Ze znajomymi online', couch: 'Z rodziną na kanapie',
    mood: 'Na co masz ochotę?', time: 'Ile masz czasu?', t5: '5 minut', t30: 'Pół godziny', t120: 'Cały wieczór',
    kit: 'Co masz pod ręką?', cam: 'Kamerkę', proj: 'Projektor', phone: 'Drugi telefon', mic: 'Mikrofon', head: 'Słuchawki', none: 'Nic z tego',
    device: 'Na czym zagrasz?', desk: 'Komputer', phoneDev: 'Telefon', reset: 'Zacznij od nowa', home: 'gzowo.fun ↗',
    privacy: 'Anonimowo zapisujemy, co lubisz i w co grasz, żeby podpowiedzi były coraz lepsze. Bez kont i bez imion.',
    like: '♥ Lubię to', liked: '♥ Lubisz to', nope: 'Nie dla mnie', noped: 'Odrzucone', play: 'Graj ▶', look: 'Zobacz',
    why: 'Dlaczego tutaj', whyGone: 'Dlaczego odpadł', goneBtn: n => 'Co odpadło i dlaczego (' + n + ')', match: ' dopasowania', gone: 'odpadł', yours: 'Twoja kartka',
    hint: '<i>✦</i> Kliknij kartkę, którą znasz i lubisz', loading: 'Rozciągam siatkę...',
    cats: { 'Game': 'Gra', 'Experiment': 'Eksperyment', 'Web app': 'Aplikacja', 'AI model': 'Model AI', 'Hardware': 'Sprzęt' },
    status: { building: 'w budowie', archive: 'archiwum' }
  },
  en: {
    sub: 'Every Gzowo Labs project in one net. Tell it what you like and the rest drops out.',
    count: (n, N) => '<b>' + n + '</b> of ' + N, best: 'Best match',
    bestEmpty: 'Tap a card you know and like, or tell it about yourself. Your top three shows up here.',
    likes: 'What do you already like?', likesHint: 'Tap the cards you know and like. Turn down the ones that are not for you.', likesEmpty: 'Nothing yet.',
    about: 'About you, all optional', age: 'How old are you?', ageNone: 'skip',
    with: 'Who are you playing with?', solo: 'Just me', online: 'Friends online', couch: 'Family on the couch',
    mood: 'What are you in the mood for?', time: 'How much time?', t5: '5 minutes', t30: 'Half an hour', t120: 'All evening',
    kit: 'What do you have?', cam: 'Webcam', proj: 'Projector', phone: 'A second phone', mic: 'Microphone', head: 'Headphones', none: 'None of these',
    device: 'Playing on', desk: 'Computer', phoneDev: 'Phone', reset: 'Start over', home: 'gzowo.fun ↗',
    privacy: 'We anonymously save what you like and what you play, so the picks keep getting better. No accounts, no names.',
    like: '♥ I like it', liked: '♥ You like it', nope: 'Not for me', noped: 'Turned down', play: 'Play ▶', look: 'Have a look',
    why: 'Why it is here', whyGone: 'Why it dropped out', goneBtn: n => 'What dropped out and why (' + n + ')', match: ' match', gone: 'dropped out', yours: 'Your card',
    hint: '<i>✦</i> Tap a card you know and like', loading: 'Stretching the net...',
    cats: {}, status: { building: 'in progress', archive: 'archive' }
  }
};
const MOODC = { chill: '#7dd3fc', action: '#ff6a13', scary: '#a78bfa', build: '#facc15', create: '#f472b6', funny: '#4ade80', puzzle: '#22d3ee', explore: '#60a5fa' };

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join('');
let SID;
try { SID = sessionStorage.getItem('sn-sid'); if (!SID) { SID = rid(); sessionStorage.setItem('sn-sid', SID); } } catch (e) { SID = rid(); }

let lang = /^pl\b/i.test(navigator.language || '') ? 'pl' : 'en';
const savedLang = store.get('sn-lang');
if (savedLang === 'pl' || savedLang === 'en') lang = savedLang;
const tx = () => TX[lang];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const initials = name => name.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

function fetchJSON(url, ms = 7000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { signal: c.signal }).then(r => { clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.json(); });
}

const S = emptyState();
let model, stats = null, nodes = [], bySlug = {}, R = null, A = null, edges = [], frags = [], meta = {}, hover = null, cardNode = null, NP = 0;
const lineCv = $('#lines'), lctx = lineCv.getContext('2d'), stage = $('#stage'), labelsEl = $('#labels');
let DPR = Math.min(devicePixelRatio || 1, 2);

function logEv(kind, slug) {
  const body = JSON.stringify({ kind, slug, sid: SID, likes: S.likes, nopes: S.nopes, age: S.age, with: S.with, moods: S.moods, time: S.time, kit: S.kit, dev: S.device, lang });
  try { if (navigator.sendBeacon && navigator.sendBeacon(API + '/event', new Blob([body], { type: 'text/plain' }))) return; } catch (e) {}
  fetch(API + '/event', { method: 'POST', body, headers: { 'content-type': 'text/plain' }, keepalive: true }).catch(() => {});
}

function thumbEl(P) {
  if (P.thumb) { const im = document.createElement('img'); im.src = P.thumb; im.alt = ''; im.decoding = 'async'; return im; }
  const d = document.createElement('span'); d.className = 'mini-fb'; d.style.setProperty('--h', P.seed % 360); d.textContent = initials(P.name); return d;
}

function makeThumb(src) {
  return new Promise(res => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 192;
        const s = Math.min(im.naturalWidth, im.naturalHeight);
        c.getContext('2d').drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, 0, 0, 192, 192);
        c.toBlob(b => res(b ? URL.createObjectURL(b) : ''), 'image/webp', 0.8);
      } catch (e) { res(''); }
    };
    im.onerror = () => res('');
    im.src = src;
  });
}

async function genThumbs(list) {
  for (const n of list) {
    const url = await makeThumb(n.P.imgFull);
    if (!url) continue;
    n.P.thumb = url;
    const th = n.el.querySelector('.th');
    th.classList.remove('fb');
    th.textContent = '';
    const im = document.createElement('img'); im.src = url; im.alt = ''; th.appendChild(im);
    if (R) renderPanel();
  }
}

function makeNode(P) {
  const el = document.createElement('div');
  el.className = 'node';
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.setAttribute('aria-label', P.name);
  const th = document.createElement('div');
  th.className = 'th';
  if (P.thumb) { const im = document.createElement('img'); im.src = P.thumb; im.alt = ''; im.decoding = 'async'; th.appendChild(im); }
  else { th.classList.add('fb'); th.style.setProperty('--h', P.seed % 360); th.textContent = initials(P.name); }
  el.appendChild(th);
  stage.appendChild(el);
  const lb = document.createElement('div');
  lb.className = 'lb';
  labelsEl.appendChild(lb);
  const n = { P, el, lb, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, s: 0, vs: 0, ts: 0.4, bs: 0.4, a: 1, rot: 0, trot: 0, vrot: 0, mode: 'alive', alive: true, delay: 0, item: null, lbOn: false, lbW: 0, anchor: false, top: false };
  el.addEventListener('click', e => { e.stopPropagation(); openCard(n); });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(n); } });
  if (!coarse) {
    el.addEventListener('pointerenter', () => setHover(n));
    el.addEventListener('pointerleave', () => { if (hover === n) setHover(null); });
  }
  return n;
}

function area() {
  const W = innerWidth, H = innerHeight, mob = W < 760;
  const x0 = 18, y0 = mob ? 84 : 104, x1 = mob ? W - 18 : W - 364 - 44, y1 = mob ? H - 172 : H - 24;
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, W, H, mob, rail: y0 - (mob ? 30 : 40) };
}

function latticePts(sp, labelH) {
  const rowH = sp * 0.866 + labelH;
  const rows = Math.floor((A.h - sp * 0.2) / rowH);
  const r0 = -(rows - 1) / 2;
  const cols = Math.floor((A.w - sp * 0.2) / sp) + 1;
  const c0 = -(cols - 1) / 2;
  const pts = [];
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? sp / 4 : -sp / 4;
    for (let c = 0; c < cols; c++) {
      const x = A.cx + (c0 + c) * sp + off;
      if (x - sp * 0.45 < A.x0 || x + sp * 0.45 > A.x1) continue;
      const y = A.cy + (r0 + r) * rowH;
      pts.push({ x, y, d: Math.hypot((x - A.cx) / A.w, (y - A.cy) / A.h * 1.05) });
    }
  }
  pts.sort((a, b) => a.d - b.d);
  return pts;
}

function layout(an, pool) {
  const all = [...an, ...pool];
  const labelH = 18;
  let lo = 18, hi = 190, best = null;
  for (let it = 0; it < 22; it++) {
    const sp = (lo + hi) / 2;
    const pts = latticePts(sp, labelH);
    if (pts.length >= all.length) { best = { sp, pts }; lo = sp; } else hi = sp;
  }
  if (!best) best = { sp: lo, pts: latticePts(lo, labelH) };
  const sp = best.sp;
  all.forEach((n, i) => {
    const p = best.pts[i] || { x: A.cx, y: A.cy };
    n.tx = p.x; n.ty = p.y - labelH / 2;
    n.bs = n.ts = Math.min(sp, 210) * 0.62 / BASE;
  });
  const rowH = sp * 0.866 + labelH;
  const minY = all.length ? Math.min(...all.map(n => n.ty)) : 0;
  for (const n of nodes) n.top = false;
  for (const n of all) n.top = n.ty < minY + rowH * 0.5;
  meta = { sp, rowH };
}

function computeEdges(alive) {
  edges = [];
  const lim = meta.sp * 1.12, limY = meta.rowH * 1.12;
  for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
    const p = alive[i], q = alive[j];
    const dx = Math.abs(p.tx - q.tx), dy = Math.abs(p.ty - q.ty);
    if (dy < 2 ? dx < lim : (dx < lim * 0.62 && dy < limY)) edges.push([p, q]);
  }
}

function enter(n) { n.x = n.tx + (Math.random() - 0.5) * 30; n.y = -120 - Math.random() * 280; n.s = n.ts; n.a = 1; n.rot = (Math.random() - 0.5) * 34; n.vx = n.vy = 0; }
function leaveInit(n) {
  n.vy = -150 - Math.random() * 130; n.vx = (Math.random() - 0.5) * 170; n.vrot = (Math.random() - 0.5) * 440;
  for (const [p, q] of edges) {
    if (p !== n && q !== n) continue;
    const o = p === n ? q : p;
    if (o.mode === 'alive' && o.alive) frags.push({ o, cx: n.x, cy: n.y, t: 0 });
  }
  if (n.top) frags.push({ o: { x: n.x + (n.x - A.cx) * 0.04, y: A.rail, fixed: true }, cx: n.x, cy: n.y, t: 0 });
}

function relayout() {
  A = area();
  const an = nodes.filter(n => n.alive && n.anchor);
  const pool = nodes.filter(n => n.alive && !n.anchor).sort((a, b) => a.item.rank - b.item.rank);
  layout(an, pool);
  const alive = [...an, ...pool];
  computeEdges(alive);
  const aliveN = alive.length;
  pool.forEach((n, i) => { n.lbOn = aliveN <= 26 || i < 5; n.lbRank = i; });
  for (const n of an) { n.lbOn = true; n.lbRank = -1; }
  const boxes = [];
  for (const n of alive) {
    if (!n.lbOn) continue;
    const w = (n.P.name.length + 5) * 7 + 10, h = 18;
    const lx = n.tx - w / 2, ly = n.ty + BASE * n.ts / 2 + 5;
    const b = [lx, ly, lx + w, ly + h];
    if (boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) { n.lbOn = false; continue; }
    boxes.push(b);
  }
  for (const n of nodes) {
    if (!n.alive) n.lbOn = false;
    const pct = n.item && n.item.pct != null && !n.anchor ? '<b>' + n.item.pct + '%</b>' : '';
    const html = (n.anchor ? '♥ ' : '') + esc(n.P.name) + pct;
    if (n.lb.innerHTML !== html) { n.lb.innerHTML = html; n.lbW = 0; }
  }
  const hint = $('#hint');
  hint.innerHTML = tx().hint;
  hint.style.left = A.cx + 'px';
  hint.style.top = (A.mob ? 10 : 12) + 'px';
  hint.classList.toggle('off', R.info > 0.35 || !!cardNode);
}

let firstRun = true;
function update(save = true) {
  R = rank(model, S, stats);
  const items = Object.fromEntries(R.items.map(o => [o.P.slug, o]));
  for (const n of nodes) {
    const it = items[n.P.slug];
    const was = n.alive;
    n.item = it;
    n.alive = it.alive;
    n.anchor = it.liked;
    n.el.classList.toggle('anchor', n.anchor);
    n.el.setAttribute('aria-pressed', n.anchor ? 'true' : 'false');
    if (!firstRun) {
      if (was && !n.alive) { n.mode = 'leave'; leaveInit(n); }
      else if (!was && n.alive) n.mode = n.mode === 'leave' ? 'alive' : 'enter';
    }
  }
  relayout();
  for (const n of nodes) if (n.mode === 'enter') { n.mode = 'alive'; n.el.style.visibility = ''; enter(n); n.delay = Math.random() * 0.15; }
  if (firstRun) {
    firstRun = false;
    const order = nodes.slice().sort((a, b) => (a.item.rank ?? 0) - (b.item.rank ?? 0));
    order.forEach((n, i) => {
      if (!n.alive) { n.mode = 'gone'; n.el.style.visibility = 'hidden'; return; }
      if (reduce) { n.x = n.tx; n.y = n.ty; n.s = n.ts; n.rot = 0; return; }
      enter(n);
      n.delay = 0.1 + i * 0.016;
    });
  }
  renderPanel();
  if (cardNode) fillCard(cardNode);
  if (save) store.set('sn-state', { likes: S.likes, nopes: S.nopes, age: S.age, with: S.with, moods: S.moods, time: S.time, kit: S.kit, kitAsked: S.kitAsked, device: S.deviceSet ? S.device : null });
  kick();
}

function step(dt) {
  let busy = false;
  const k = 95, c = 9;
  for (const n of nodes) {
    if (n.mode === 'gone') continue;
    if (n.delay > 0) { n.delay -= dt; busy = true; continue; }
    if (n.mode === 'leave') {
      n.vy += 2600 * dt; n.x += n.vx * dt; n.y += n.vy * dt; n.rot += n.vrot * dt;
      if (n.y > A.H + 160) { n.mode = 'gone'; n.el.style.visibility = 'hidden'; n.lb.classList.remove('on'); }
      busy = true;
      continue;
    }
    n.ts = n.bs * (n === hover ? 1.07 : 1);
    n.vx += (k * (n.tx - n.x) - c * n.vx) * dt; n.x += n.vx * dt;
    n.vy += (k * (n.ty - n.y) - c * n.vy) * dt; n.y += n.vy * dt;
    n.vs += (160 * (n.ts - n.s) - 22 * n.vs) * dt; n.s += n.vs * dt;
    n.trot = reduce ? 0 : clamp(-n.vx * 0.018, -9, 9);
    n.vrot += (80 * (n.trot - n.rot) - 8 * n.vrot) * dt; n.rot += n.vrot * dt;
    if (Math.abs(n.tx - n.x) > 0.15 || Math.abs(n.ty - n.y) > 0.15 || Math.abs(n.vx) + Math.abs(n.vy) > 0.6 || Math.abs(n.ts - n.s) > 0.002 || Math.abs(n.rot) > 0.08 || Math.abs(n.vrot) > 0.5) busy = true;
  }
  for (const f of frags) f.t += dt / 0.5;
  frags = frags.filter(f => f.t < 1);
  if (frags.length) busy = true;
  return busy;
}

function string(c, x1, y1, x2, y2, sag, col, w) {
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag, x2, y2); c.stroke();
}

function drawLines() {
  const c = lctx;
  c.clearRect(0, 0, innerWidth, innerHeight);
  c.lineCap = 'round';
  const ink = 'rgba(27,26,23,.55)';
  const alive = nodes.filter(n => n.mode === 'alive' && n.delay <= 0);
  const tops = alive.filter(n => n.top);
  if (tops.length) {
    const xs = tops.map(n => n.tx);
    const rx0 = Math.max(A.x0 + 4, Math.min(...xs) - meta.sp * 0.7), rx1 = Math.min(A.x1 - 4, Math.max(...xs) + meta.sp * 0.7);
    c.strokeStyle = '#1b1a17'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(rx0, A.rail); c.lineTo(rx1, A.rail); c.stroke();
    c.fillStyle = '#1b1a17';
    for (const x of [rx0, rx1]) { c.beginPath(); c.arc(x, A.rail, 4, 0, 7); c.fill(); }
    for (const n of tops) {
      const ty = n.y - BASE * n.s / 2;
      const len = ty - A.rail;
      if (len < 2) continue;
      const h = hover === n;
      string(c, n.tx + (n.tx - A.cx) * 0.04, A.rail, n.x, ty, Math.min(10, len * 0.04) + n.vx * 0.02, h ? '#2b4bff' : ink, h ? 1.8 : 1.15);
    }
  }
  for (const [p, q] of edges) {
    if (p.mode !== 'alive' || q.mode !== 'alive' || p.delay > 0 || q.delay > 0) continue;
    const h = hover && (hover === p || hover === q);
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    const tension = clamp(len / (meta.sp || 100), 0.6, 1.6);
    const sag = 7 * (1.6 - tension) + 2 + clamp(Math.abs(p.vy) + Math.abs(q.vy), 0, 400) * 0.03;
    string(c, p.x, p.y, q.x, q.y, sag, h ? '#2b4bff' : ink, h ? 1.8 : 1.15);
  }
  for (const f of frags) {
    const o = f.o;
    const e = 1 - Math.pow(1 - f.t, 3);
    const ox = o.x, oy = o.y;
    const L = 0.55 * (1 - e);
    const ex = ox + (f.cx - ox) * L, ey = oy + (f.cy - oy) * L;
    const dx = ex - ox, dy = ey - oy, d = Math.hypot(dx, dy) || 1;
    const wig = Math.sin(f.t * 26) * 7 * (1 - f.t);
    c.strokeStyle = 'rgba(27,26,23,' + 0.55 * (1 - f.t * 0.6) + ')'; c.lineWidth = 1.15;
    c.beginPath(); c.moveTo(ox, oy); c.quadraticCurveTo((ox + ex) / 2 - dy / d * wig, (oy + ey) / 2 + dx / d * wig + 4 * (1 - f.t), ex, ey); c.stroke();
  }
}

function draw() {
  drawLines();
  const W = innerWidth;
  for (const n of nodes) {
    if (n.mode === 'gone') continue;
    const z = n === hover ? 1000 : n.anchor ? 900 : 800 - (n.lbRank || 0);
    n.el.style.transform = 'translate3d(' + (n.x - BASE / 2).toFixed(1) + 'px,' + (n.y - BASE / 2).toFixed(1) + 'px,0) scale(' + Math.max(0, n.s).toFixed(4) + ')' + (Math.abs(n.rot) > 0.05 ? ' rotate(' + n.rot.toFixed(2) + 'deg)' : '');
    n.el.style.opacity = clamp(n.a, 0, 1).toFixed(3);
    n.el.style.zIndex = z;
    const on = (n.lbOn || n === hover) && n.mode === 'alive' && n.delay <= 0 && Math.abs(n.y - n.ty) < 60;
    if (on !== n.lb.classList.contains('on')) n.lb.classList.toggle('on', on);
    n.lb.classList.toggle('hot', n === hover);
    if (on) {
      if (!n.lbW) n.lbW = n.lb.offsetWidth || 80;
      const lx = clamp(n.x, n.lbW / 2 + 4, W - n.lbW / 2 - 4) - n.lbW / 2;
      const ly = n.y + BASE * n.s / 2 + 5;
      n.lb.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0)';
      n.lb.style.zIndex = z;
    }
  }
}

let raf = 0, last = 0;
function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
function frame(t) {
  const dt = Math.min(1 / 30, Math.max(0.001, (t - last) / 1000));
  last = t;
  const busy = step(dt);
  draw();
  raf = busy ? requestAnimationFrame(frame) : 0;
}

function setHover(n) {
  hover = n;
  for (const m of nodes) m.el.classList.toggle('hot', m === n);
  kick();
}

function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  lineCv.width = Math.round(innerWidth * DPR);
  lineCv.height = Math.round(innerHeight * DPR);
  lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  A = area();
}

function i18n() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-t]')) { const v = tx()[el.dataset.t]; if (typeof v === 'string') el.textContent = v; }
  $('#lang').textContent = lang === 'pl' ? 'EN' : 'PL';
  $('#lang').setAttribute('aria-label', lang === 'pl' ? 'English' : 'Polski');
  $('#moods').innerHTML = MOODS.map(m => '<button class="chip" data-mood="' + m + '"><i class="dot" style="background:' + MOODC[m] + '"></i>' + esc(lab(MOOD_LABEL[m], lang)) + '</button>').join('');
}

function renderPanel() {
  const t = tx();
  const aliveN = R.pool.filter(o => o.alive).length;
  $('#cnt').innerHTML = t.count(aliveN, NP - S.likes.length);
  const bestEl = $('#best');
  bestEl.innerHTML = '';
  if (!R.info || !R.best.length) bestEl.innerHTML = '<p class="hint">' + esc(t.bestEmpty) + '</p>';
  else for (const o of R.best) {
    const row = document.createElement('div');
    row.className = 'best-row';
    row.dataset.open = o.P.slug;
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.appendChild(thumbEl(o.P));
    const why = o.why[0] ? reasonText(o.why[0], lang) : (lang === 'pl' ? o.P.blurbPl || o.P.blurbEn : o.P.blurbEn);
    row.insertAdjacentHTML('beforeend', '<div class="best-txt"><div class="best-name">' + esc(o.P.name) + '</div><div class="best-why">' + esc(why) + '</div></div><span class="best-pct">' + o.pct + '%</span>');
    const a = document.createElement('a');
    a.className = 'best-play'; a.href = o.P.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = '▶'; a.setAttribute('aria-label', t.play + ' ' + o.P.name);
    a.addEventListener('click', e => { e.stopPropagation(); logEv('play', o.P.slug); });
    row.appendChild(a);
    bestEl.appendChild(row);
  }
  const gone = R.items.filter(o => !o.alive && !o.liked).sort((a, b) => b.s - a.s);
  const gb = $('#goneBtn'), gl = $('#goneList');
  gb.hidden = !R.info || !gone.length;
  gb.textContent = t.goneBtn(gone.length) + (gl.hidden ? ' ↓' : ' ↑');
  if (!gl.hidden || gb.hidden) {
    gl.hidden = gb.hidden || gl.hidden;
    gl.innerHTML = gone.slice(0, 40).map(o => '<button class="chip" data-open="' + o.P.slug + '">' + esc(o.P.name) + '</button>').join('');
  }
  const lc = $('#likeChips');
  lc.innerHTML = '';
  for (const s of S.likes) { const P = model.bySlug[s]; if (!P) continue; const b = document.createElement('button'); b.className = 'chip like-chip on'; b.dataset.unlike = s; b.appendChild(thumbEl(P)); b.insertAdjacentHTML('beforeend', esc(P.name) + '<span class="x">×</span>'); lc.appendChild(b); }
  for (const s of S.nopes) { const P = model.bySlug[s]; if (!P) continue; const b = document.createElement('button'); b.className = 'chip nope-chip'; b.dataset.unnope = s; b.insertAdjacentHTML('beforeend', esc(P.name) + '<span class="x">×</span>'); lc.appendChild(b); }
  if (!S.likes.length && !S.nopes.length) lc.innerHTML = '<span class="empty">' + esc(t.likesEmpty) + '</span>';
  for (const b of document.querySelectorAll('[data-with]')) b.classList.toggle('on', S.with === b.dataset.with);
  for (const b of document.querySelectorAll('[data-mood]')) b.classList.toggle('on', S.moods.includes(b.dataset.mood));
  for (const b of document.querySelectorAll('[data-time]')) b.classList.toggle('on', S.time === +b.dataset.time);
  for (const b of document.querySelectorAll('[data-kit]')) b.classList.toggle('on', b.dataset.kit === 'none' ? (S.kitAsked && !S.kit.length) : S.kit.includes(b.dataset.kit));
  for (const b of document.querySelectorAll('[data-dev]')) b.classList.toggle('on', S.device === b.dataset.dev);
  $('#ageBox').classList.toggle('unset', S.age == null);
  $('#ageOut').textContent = S.age == null ? '?' : S.age >= 19 ? '18+' : S.age;
  if (S.age != null) $('#age').value = Math.min(19, S.age);
}

function wirePanel() {
  $('#panel').addEventListener('click', e => {
    const b = e.target.closest('button,[data-open]');
    if (!b) return;
    const d = b.dataset;
    if (d.open) { openCard(bySlug[d.open]); return; }
    if (b.id === 'goneBtn') { $('#goneList').hidden = !$('#goneList').hidden; renderPanel(); return; }
    if (d.with) S.with = S.with === d.with ? null : d.with;
    else if (d.mood) S.moods = S.moods.includes(d.mood) ? S.moods.filter(m => m !== d.mood) : [...S.moods, d.mood];
    else if (d.time) S.time = S.time === +d.time ? null : +d.time;
    else if (d.kit) { S.kitAsked = true; if (d.kit === 'none') S.kit = []; else S.kit = S.kit.includes(d.kit) ? S.kit.filter(k => k !== d.kit) : [...S.kit, d.kit]; }
    else if (d.dev) { S.device = d.dev; S.deviceSet = true; }
    else if (d.unlike) S.likes = S.likes.filter(s => s !== d.unlike);
    else if (d.unnope) S.nopes = S.nopes.filter(s => s !== d.unnope);
    else if (b.id === 'ageClear') S.age = null;
    else if (b.id === 'reset') Object.assign(S, emptyState(), { lang, device: isPhone ? 'phone' : 'desk', deviceSet: isPhone });
    else if (b.id === 'lang') { lang = lang === 'pl' ? 'en' : 'pl'; S.lang = lang; store.set('sn-lang', lang); i18n(); for (const n of nodes) n.lbW = 0; }
    else return;
    update();
  });
  $('#panel').addEventListener('keydown', e => { const r = e.target.closest('[data-open]'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openCard(bySlug[r.dataset.open]); } });
  $('#age').addEventListener('input', e => { S.age = +e.target.value >= 19 ? 30 : +e.target.value; update(); });
  $('#phead').addEventListener('click', e => { if (innerWidth < 760 && !e.target.closest('button')) $('#panel').classList.toggle('open'); });
}

const card = $('#card');
let lastFocus = null;
function openCard(n) {
  if (!n) return;
  lastFocus = document.activeElement;
  cardNode = n;
  fillCard(n);
  card.hidden = false;
  $('#hint').classList.add('off');
  requestAnimationFrame(() => requestAnimationFrame(() => { card.classList.add('on'); card.querySelector('.c-like').focus({ preventScroll: true }); }));
}
function closeCard() {
  card.classList.remove('on');
  cardNode = null;
  setTimeout(() => { if (!cardNode) card.hidden = true; }, 240);
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  $('#hint').classList.toggle('off', R.info > 0.35);
}
function fillCard(n) {
  const P = n.P, o = n.item, t = tx();
  const img = card.querySelector('.c-img');
  img.innerHTML = '';
  if (P.imgFull) {
    const im = document.createElement('img');
    im.alt = P.name;
    if (P.thumb) im.src = P.thumb;
    img.appendChild(im);
    const full = new Image();
    full.onload = () => { if (cardNode === n) im.src = P.imgFull; };
    full.src = P.imgFull;
  } else img.innerHTML = '<div class="fb" style="--h:' + (P.seed % 360) + '">' + esc(initials(P.name)) + '</div>';
  const st = t.status[P.status] || '';
  card.querySelector('.c-cat').textContent = (t.cats[P.cat] || P.cat) + (st ? ' · ' + st : '') + (P.year ? ' · ' + P.year : '');
  card.querySelector('.c-match').textContent = o.liked ? t.yours : !o.alive ? t.gone : o.pct != null ? o.pct + '%' + t.match : '';
  card.querySelector('.c-name').textContent = P.name;
  card.querySelector('.c-blurb').textContent = lang === 'pl' ? (P.blurbPl || P.blurbEn) : P.blurbEn;
  const gone = !o.alive && !o.liked;
  const list = (gone ? o.neg.map(r => negText(r, lang)) : o.why.map(r => reasonText(r, lang))).filter(Boolean);
  card.querySelector('.c-whyh').textContent = list.length ? (gone ? t.whyGone : t.why) : '';
  const why = card.querySelector('.c-why');
  why.classList.toggle('neg', gone);
  why.innerHTML = list.map(s => '<span>' + esc(s) + '</span>').join('');
  card.querySelector('.c-facts').textContent = factsLine(P, lang);
  const lk = card.querySelector('.c-like'), np = card.querySelector('.c-nope'), pl = card.querySelector('.c-play');
  lk.textContent = o.liked ? t.liked : t.like; lk.classList.toggle('on', o.liked);
  np.textContent = o.noped ? t.noped : t.nope;
  pl.href = P.playable ? P.url : P.page;
  pl.textContent = P.playable ? t.play : t.look;
}
function wireCard() {
  card.querySelector('.c-back').addEventListener('click', closeCard);
  card.querySelector('.c-x').addEventListener('click', closeCard);
  card.querySelector('.c-play').addEventListener('click', () => { if (cardNode && cardNode.P.playable) logEv('play', cardNode.P.slug); });
  card.querySelector('.c-like').addEventListener('click', () => {
    const s = cardNode.P.slug;
    if (S.likes.includes(s)) S.likes = S.likes.filter(x => x !== s);
    else { S.likes = [...S.likes, s]; S.nopes = S.nopes.filter(x => x !== s); logEv('like', s); }
    closeCard(); update();
  });
  card.querySelector('.c-nope').addEventListener('click', () => {
    const s = cardNode.P.slug;
    if (S.nopes.includes(s)) S.nopes = S.nopes.filter(x => x !== s);
    else { S.nopes = [...S.nopes, s]; S.likes = S.likes.filter(x => x !== s); logEv('nope', s); }
    closeCard(); update();
  });
  addEventListener('keydown', e => {
    if (!cardNode) return;
    if (e.key === 'Escape') closeCard();
    else if (e.key === 'Tab') {
      const f = [...card.querySelectorAll('button,a')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
}

async function boot() {
  $('#loading').textContent = tx().loading;
  i18n();
  const [pj, tags, man, remote] = await Promise.all([
    fetchJSON(PROJECTS_URL, 6000).catch(() => fetchJSON('data/projects.snapshot.json')),
    fetchJSON('data/tags.json'),
    fetchJSON('data/thumbs.json').catch(() => ({})),
    fetchJSON(API + '/data', 2500).catch(() => null)
  ]);
  stats = remote && remote.stats ? remote.stats : null;
  const img = (remote && remote.img) || {};
  const gen = [];
  model = buildModel(pj, tags, (remote && remote.auto) || {}, {
    thumb: p => {
      const b = man[p.slug];
      if (b && (!img[p.slug] || img[p.slug] === b)) return 'thumbs/' + p.slug + '.webp?b=' + b;
      if (p.image) gen.push(p.slug);
      return '';
    }
  });
  NP = model.list.length;
  nodes = model.list.map(makeNode);
  bySlug = Object.fromEntries(nodes.map(n => [n.P.slug, n]));
  Object.assign(S, { lang, device: isPhone ? 'phone' : 'desk', deviceSet: isPhone });
  const saved = store.get('sn-state');
  if (saved) {
    const ok = s => typeof s === 'string' && model.bySlug[s];
    S.likes = (saved.likes || []).filter(ok);
    S.nopes = (saved.nopes || []).filter(ok);
    S.age = Number.isFinite(saved.age) ? saved.age : null;
    S.with = ['solo', 'online', 'couch'].includes(saved.with) ? saved.with : null;
    S.moods = (saved.moods || []).filter(m => MOODS.includes(m));
    S.time = [5, 30, 120].includes(saved.time) ? saved.time : null;
    S.kit = (saved.kit || []).filter(k => ['cam', 'proj', 'phone', 'mic', 'head'].includes(k));
    S.kitAsked = !!saved.kitAsked;
    if (saved.device === 'desk' || saved.device === 'phone') { S.device = saved.device; S.deviceSet = true; }
  }
  wirePanel();
  wireCard();
  resize();
  update(false);
  $('#loading').classList.add('off');
  genThumbs(gen.map(s => bySlug[s]).filter(Boolean));
}

let rT = 0;
addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (!model) return; resize(); for (const n of nodes) n.lbW = 0; relayout(); kick(); }, 80); });

boot().catch(() => { $('#loading').textContent = lang === 'pl' ? 'Nie udało się wczytać projektów. Odśwież stronę.' : 'Could not load the projects. Refresh the page.'; });
window.SN = { S, get model() { return model; }, update, get nodes() { return nodes; } };
