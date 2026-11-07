// Gzowo StarNet engine: project model, taste vectors, scoring and reasons.

export const MOODS = ['chill', 'action', 'scary', 'build', 'create', 'funny', 'puzzle', 'explore'];

export const MOOD_LABEL = {
  chill: ['Na spokojnie', 'Chill'],
  action: ['Akcja', 'Action'],
  scary: ['Straszne', 'Scary'],
  build: ['Budowanie', 'Building'],
  create: ['Tworzenie', 'Making stuff'],
  funny: ['Śmieszne', 'Funny'],
  puzzle: ['Łamigłówki', 'Puzzles'],
  explore: ['Zwiedzanie', 'Exploring']
};

export const FEATURE_LABEL = {
  coop: ['co-op', 'co-op'], party: ['na imprezę', 'party'], platformer: ['platformówka', 'platformer'],
  physics: ['fizyka', 'physics'], cars: ['auta', 'cars'], flying: ['latanie', 'flying'], space: ['kosmos', 'space'],
  robots: ['roboty', 'robots'], tesla: ['Tesla', 'Tesla'], animals: ['zwierzaki', 'animals'],
  factory: ['fabryki', 'factories'], tycoon: ['biznes', 'tycoon'], building: ['budowanie', 'building'],
  drawing: ['rysowanie', 'drawing'], code: ['programowanie', 'coding'], music: ['muzyka', 'music'],
  horror: ['horror', 'horror'], shooting: ['strzelanie', 'shooting'], nature: ['natura', 'nature'],
  water: ['woda', 'water'], fidget: ['fidgety', 'fidget toys'], asmr: ['ASMR', 'ASMR'], ai: ['AI', 'AI'],
  gzowo: ['Gzowo', 'Gzowo'], destruction: ['demolka', 'destruction'], sim: ['realizm', 'realism'],
  puzzles: ['łamigłówki', 'puzzles'], sports: ['sport', 'sports'], winter: ['zima', 'winter'],
  film: ['jak z filmu', 'movie vibes'], webcam: ['kamerka', 'webcam'], phonepad: ['telefon jako pad', 'phone as a pad'],
  creative: ['tworzenie', 'making things'], city: ['miasto', 'city'], strategy: ['strategia', 'strategy'],
  survival: ['survival', 'survival'], fire: ['ogień', 'fire'], toy: ['zabawka', 'toy'], cozy: ['przytulnie', 'cozy'],
  sandbox: ['piaskownica', 'sandbox'], upgrades: ['ulepszenia', 'upgrades'], monsters: ['potwory', 'monsters'],
  halloween: ['Halloween', 'Halloween'], pixel: ['piksele', 'pixel art'], retro: ['retro', 'retro'],
  superhero: ['superbohater', 'superhero'], stunts: ['triki', 'stunts'], dance: ['taniec', 'dance'],
  chat: ['rozmowa', 'chat'], voice: ['głos', 'voice'], hardware: ['sprzęt', 'hardware'], tech: ['technika', 'tech'],
  family: ['rodzinnie', 'family'], house: ['dom', 'house'], drones: ['drony', 'drones'], typing: ['pisanie', 'typing'],
  race: ['wyścig', 'race'], chaos: ['chaos', 'chaos'], weird: ['dziwne', 'weird'], maze: ['labirynt', 'maze'],
  backrooms: ['Backrooms', 'Backrooms'], art: ['sztuka', 'art'], video: ['wideo', 'video'], minimal: ['minimalizm', 'minimal'],
  animation: ['animacja', 'animation'], hands: ['dłonie', 'hands'], ghosts: ['duchy', 'ghosts'], parkour: ['parkour', 'parkour'],
  runner: ['biegówka', 'runner'], gamemaking: ['robienie gier', 'making games'], learn: ['nauka', 'learning'],
  architecture: ['architektura', 'architecture'], minigames: ['minigry', 'minigames'], trains: ['pociągi', 'trains'],
  crafting: ['crafting', 'crafting'], farm: ['farma', 'farm'], photos: ['zdjęcia', 'photos'], rockets: ['rakiety', 'rockets'],
  print3d: ['druk 3D', '3D printing'], glasses: ['okulary', 'glasses'], job: ['praca', 'job sim'], speed: ['prędkość', 'speed'],
  chase: ['pościg', 'chase'], watch: ['oglądanie', 'watching'], hard: ['trudne', 'hard'], leaderboard: ['rankingi', 'leaderboards'],
  neon: ['neon', 'neon'], voxels: ['woksele', 'voxels'], mystery: ['tajemnica', 'mystery'], walk: ['spacer', 'walking'],
  ambient: ['klimat', 'ambient'], concept: ['koncept', 'concept'], apple: ['Apple', 'Apple'], design: ['design', 'design']
};

const CATS = ['Game', 'Experiment', 'Web app', 'AI model', 'Hardware'];

export function lab(pair, lang) { return pair ? pair[lang === 'pl' ? 0 : 1] : ''; }

export function normUrl(u) {
  if (!u) return '';
  u = String(u).trim();
  if (!/^https?:\/\//.test(u)) u = 'https://' + u;
  return u;
}

const KW = [
  [/co-?op|together|friends|players|multiplayer|room code|online/, 'coop'],
  [/platformer|jump across|levels/, 'platformer'], [/physics|rapier|ragdoll/, 'physics'],
  [/\bcar\b|cars|drive|driving|roadster/, 'cars'], [/fly|flight|flying|drone/, 'flying'],
  [/space|orbit|black hole|alien|rocket/, 'space'], [/robot|optimus/, 'robots'], [/tesla/, 'tesla'],
  [/animal|frog|duck|bee|fish|penguin|capybara/, 'animals'], [/factory|belt|automat|conveyor/, 'factory'],
  [/tycoon|shop|money|sell|economy/, 'tycoon'], [/build|place|construct/, 'building'], [/draw|sketch|paint|doodle/, 'drawing'],
  [/program|code|script/, 'code'], [/music|song|beat|synth|instrument|band/, 'music'], [/horror|scary|creep|backrooms/, 'horror'],
  [/shoot|gun|laser|blast/, 'shooting'], [/nature|forest|meadow|valley|grass|river|lake/, 'nature'], [/water|river|fluid|swim/, 'water'],
  [/\bai\b|haiku|claude|model|transformer/, 'ai'], [/gzowo|narew/, 'gzowo'], [/destroy|destruction|demolition|smash|break/, 'destruction'],
  [/realistic|real |simulat/, 'sim'], [/puzzle|solve/, 'puzzles'], [/ski|bowling|sport/, 'sports'], [/snow|winter|ice/, 'winter'],
  [/webcam|camera/, 'webcam'], [/phone becomes|phones join|qr code|scan the code/, 'phonepad'], [/city|street|town/, 'city'],
  [/survive|survival/, 'survival'], [/fire|flame|ember/, 'fire'], [/toy|fidget|squish/, 'toy'], [/sandbox/, 'sandbox'],
  [/upgrade/, 'upgrades'], [/monster/, 'monsters'], [/pixel/, 'pixel'], [/party|chaos/, 'party']
];

export function heuristicTags(p) {
  const txt = [p.name, p.blurb, (p.body || []).join(' '), (p.stack || []).join(' ')].join(' ').toLowerCase();
  const has = re => re.test(txt);
  const m = { chill: 0.2, action: 0.25, scary: 0, build: 0.2, create: 0.2, funny: 0.2, puzzle: 0.2, explore: 0.25 };
  if (has(/calm|quiet|relax|cozy|chill|walk|peace/)) m.chill = 0.8;
  if (has(/shoot|race|fast|fight|combat|speed|boost|blast|stunt/)) m.action = 0.8;
  if (has(/horror|scary|creep|monster|backrooms|something .* follows|dread/)) m.scary = 0.7;
  if (has(/build|factory|belt|automat|tycoon|craft|place /)) m.build = 0.8;
  if (has(/draw|paint|music|compose|creat|animation|design|make /)) m.create = 0.8;
  if (has(/fart|silly|chaos|funny|ridiculous|banana|poop/)) m.funny = 0.8;
  if (has(/puzzle|solve|logic|program|code/)) m.puzzle = 0.7;
  if (has(/explore|wander|open world|discover|valley|city|island/)) m.explore = 0.7;
  const f = [];
  for (const [re, k] of KW) if (re.test(txt) && !f.includes(k)) f.push(k);
  let pl = [1, 1];
  const mm = txt.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:players|people)/) || txt.match(/up to (\d+)/);
  if (mm) pl = mm[2] ? [+mm[1], +mm[2]] : [1, +mm[1]];
  const on = has(/online|co-?op|multiplayer|room code|friends/) ? 1 : 0;
  const couch = has(/couch|same screen|phones? (?:join|become)|scan the code|qr code/) ? 1 : 0;
  const kit = [];
  if (has(/webcam|needs a camera|in front of a camera/)) kit.push('cam');
  if (has(/projector/)) kit.push('proj');
  if (has(/microphone|speak to it|talk to it/)) kit.push('mic');
  const sc = m.scary >= 0.7 ? 2 : 0;
  const url = normUrl(p.url);
  return {
    d: has(/program|calibrat|research tree|strategy|configur/) ? 4 : 2,
    q: p.status === 'live' ? 3 : 2.5,
    age: sc >= 2 ? [12, 13, 99] : [7, 8, 99],
    sc, vi: has(/gun|pistol|kill|blood/) ? 2 : 0,
    np: pl, on: on && pl[1] > 1 ? 1 : on, couch, solo: 1,
    dev: !url ? 'none' : has(/windows download/) ? 'win' : 'desk',
    mob: has(/on a phone|on phones|touch controls|mobile/) ? 2 : has(/phone|touch/) ? 1 : 0,
    kit, opt: has(/headphones/) ? ['head'] : [],
    t: has(/hours|evening|session runs|endless/) ? 60 : 20,
    m, f, auto: 'heuristic'
  };
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function buildModel(projectsJson, curated, auto, opts = {}) {
  const raw = (projectsJson.projects || projectsJson).filter(p => p && p.slug && !p.hidden);
  const cur = (curated && curated.projects) || curated || {};
  const au = (auto && auto.projects) || auto || {};
  const list = raw.map((p, i) => {
    const t = Object.assign({}, cur[p.slug] || au[p.slug] || heuristicTags(p));
    t.m = Object.assign({}, t.m);
    t.f = (t.f || []).slice();
    t.kit = t.kit || []; t.opt = t.opt || [];
    if (!Array.isArray(t.np)) t.np = [1, 1];
    const url = normUrl(p.url);
    const blurbEn = p.blurb || (p.body && p.body[0] ? p.body[0].split('. ')[0] + '.' : '');
    return {
      i, slug: p.slug, name: p.name, cat: p.category || 'Game', status: p.status || 'live', year: p.year,
      url, playable: !!url && t.dev !== 'none',
      page: 'https://gzowo.fun/p/' + p.slug + '/',
      imgFull: p.image ? 'https://gzowo.fun/' + p.image : '',
      thumb: opts.thumb ? opts.thumb(p) : (p.image ? 'https://gzowo.fun/' + p.image : ''),
      blurbEn, blurbPl: t.pl || '', t, src: cur[p.slug] ? 'curated' : au[p.slug] ? 'auto' : 'heuristic',
      seed: hash(p.slug)
    };
  });
  const df = {};
  for (const P of list) for (const f of P.t.f) df[f] = (df[f] || 0) + 1;
  const N = list.length;
  const idf = {};
  for (const f in df) idf[f] = Math.log((N + 1) / (df[f] + 0.5));
  const feats = Object.keys(df).sort();
  const msum = {};
  for (const mo of MOODS) msum[mo] = list.reduce((a, P) => a + (P.t.m[mo] || 0), 0);
  const midf = {};
  for (const mo of MOODS) midf[mo] = Math.log((N + 1) / (msum[mo] + 1));
  const mmean = MOODS.reduce((a, mo) => a + midf[mo], 0) / MOODS.length;
  for (const mo of MOODS) midf[mo] /= mmean;
  const dims = MOODS.length + feats.length + 3 + CATS.length;
  for (const P of list) {
    const v = new Float32Array(dims);
    let k = 0;
    for (const mo of MOODS) v[k++] = (P.t.m[mo] || 0) * midf[mo];
    for (const f of feats) v[k++] = P.t.f.includes(f) ? 0.42 * idf[f] / 2.2 : 0;
    v[k++] = P.t.np[1] <= 1 ? 0.35 : 0;
    v[k++] = P.t.on ? 0.35 : 0;
    v[k++] = P.t.couch ? 0.45 : 0;
    for (const c of CATS) v[k++] = P.cat === c ? 0.3 : 0;
    let n = 0;
    for (let j = 0; j < dims; j++) n += v[j] * v[j];
    n = Math.sqrt(n) || 1;
    for (let j = 0; j < dims; j++) v[j] /= n;
    P.v = v;
  }
  const bySlug = Object.fromEntries(list.map(P => [P.slug, P]));
  const model = { list, bySlug, idf, midf, feats, dims };
  model.sim = list.map(a => list.map(b => cos(a.v, b.v)));
  model.embed = embed2d(model);
  return model;
}

export function cos(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function embed2d(model) {
  const n = model.list.length;
  const D = model.sim.map(r => r.map(s => Math.pow(1 - s, 1)));
  const B = [];
  const rowM = D.map(r => r.reduce((a, x) => a + x * x, 0) / n);
  const allM = rowM.reduce((a, x) => a + x, 0) / n;
  for (let i = 0; i < n; i++) {
    B[i] = new Float64Array(n);
    for (let j = 0; j < n; j++) B[i][j] = -0.5 * (D[i][j] * D[i][j] - rowM[i] - rowM[j] + allM);
  }
  const vecs = [];
  for (let e = 0; e < 2; e++) {
    let v = new Float64Array(n).map((_, i) => Math.sin(i * 12.9898 + e * 78.233) * 0.5 + 0.5);
    let lam = 0;
    for (let it = 0; it < 200; it++) {
      const w = new Float64Array(n);
      for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < n; j++) s += B[i][j] * v[j]; w[i] = s; }
      for (const u of vecs) { let d = 0; for (let i = 0; i < n; i++) d += w[i] * u.v[i]; for (let i = 0; i < n; i++) w[i] -= d * u.v[i]; }
      let nn = 0; for (let i = 0; i < n; i++) nn += w[i] * w[i];
      nn = Math.sqrt(nn) || 1; lam = nn;
      for (let i = 0; i < n; i++) v[i] = w[i] / nn;
    }
    vecs.push({ v, lam });
  }
  const pts = model.list.map((_, i) => [vecs[0].v[i] * Math.sqrt(vecs[0].lam), vecs[1].v[i] * Math.sqrt(vecs[1].lam)]);
  let mx = 0;
  for (const p of pts) mx = Math.max(mx, Math.abs(p[0]), Math.abs(p[1]));
  for (const p of pts) { p[0] /= mx || 1; p[1] /= mx || 1; }
  for (let it = 0; it < 120; it++) {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = pts[j][0] - pts[i][0], dy = pts[j][1] - pts[i][1];
      const d = Math.hypot(dx, dy) || 1e-4, min = 0.17;
      if (d < min) { const push = (min - d) / 2 / d; pts[i][0] -= dx * push; pts[i][1] -= dy * push; pts[j][0] += dx * push; pts[j][1] += dy * push; }
    }
  }
  mx = 0;
  for (const p of pts) mx = Math.max(mx, Math.hypot(p[0], p[1]));
  for (const p of pts) { p[0] /= mx || 1; p[1] /= mx || 1; }
  return pts;
}

export function emptyState() {
  return { likes: [], nopes: [], age: null, with: null, moods: [], time: null, kit: [], kitAsked: false, device: null, lang: 'pl' };
}

export function infoAmount(S) {
  return S.likes.length * 1.0 + S.nopes.length * 0.45 + (S.age != null ? 1 : 0) + (S.with ? 1 : 0) +
    S.moods.length * 0.6 + (S.time ? 0.6 : 0) + (S.kitAsked ? 0.4 : 0) + (S.deviceSet ? 0.3 : 0);
}

function ageTargetD(age) {
  if (age == null) return null;
  if (age <= 6) return 1.3;
  if (age <= 8) return 2;
  if (age <= 10) return 2.7;
  if (age <= 12) return 3.4;
  if (age <= 15) return 4.2;
  return 5;
}

function cfScore(P, likes, stats) {
  if (!stats || !stats.co || !likes.length) return { v: 0, from: null };
  const total = stats.totalPlays || 1;
  const base = ((stats.plays && stats.plays[P.slug]) || 0) / total + 1e-3;
  let acc = 0, w = 0, best = null, bestLift = 0;
  for (const L of likes) {
    const row = stats.co[L.slug];
    if (!row) continue;
    const nL = row._n || Object.values(row).reduce((a, x) => a + x, 0);
    const c = row[P.slug] || 0;
    const p = (c + 2 * base) / (nL + 2);
    const lift = Math.log(p / base);
    const conf = nL / (nL + 15);
    acc += lift * conf; w += 1;
    if (lift * conf > bestLift && c >= 3) { bestLift = lift * conf; best = L; }
  }
  return { v: w ? acc / w : 0, from: best };
}

function ctxScore(P, S, stats) {
  if (!stats || !stats.ctx) return 0;
  const keys = [];
  if (S.age != null) keys.push('age:' + ageBucket(S.age));
  if (S.with) keys.push('with:' + S.with);
  for (const m of S.moods) keys.push('mood:' + m);
  if (S.device) keys.push('dev:' + S.device);
  const total = stats.totalPlays || 1;
  const base = ((stats.plays && stats.plays[P.slug]) || 0) / total + 1e-3;
  let acc = 0, w = 0;
  for (const k of keys) {
    const row = stats.ctx[k];
    if (!row) continue;
    const n = row._n || 0;
    const p = ((row[P.slug] || 0) + 2 * base) / (n + 2);
    acc += Math.log(p / base) * n / (n + 25); w++;
  }
  return w ? acc / w : 0;
}

export function ageBucket(a) {
  return a < 7 ? '0-6' : a < 10 ? '7-9' : a < 13 ? '10-12' : a < 16 ? '13-15' : '16+';
}

export function rank(model, S, stats) {
  const L = model.list;
  const likes = S.likes.map(s => model.bySlug[s]).filter(Boolean);
  const nopes = S.nopes.map(s => model.bySlug[s]).filter(Boolean);
  const lang = S.lang;
  const taste = new Float32Array(model.dims);
  for (const P of likes) for (let j = 0; j < model.dims; j++) taste[j] += P.v[j];
  for (const P of nopes) for (let j = 0; j < model.dims; j++) taste[j] -= 0.5 * P.v[j];
  let tn = 0;
  for (let j = 0; j < model.dims; j++) tn += taste[j] * taste[j];
  tn = Math.sqrt(tn) || 1;
  for (let j = 0; j < model.dims; j++) taste[j] /= tn;

  const likeD = likes.length ? likes.reduce((a, P) => a + P.t.d, 0) / likes.length : null;
  const likeQ = likes.length ? likes.reduce((a, P) => a + P.t.q, 0) / likes.length : null;
  const likeSc = likes.length ? Math.max(...likes.map(P => P.t.sc)) : 0;
  const aD = ageTargetD(S.age);
  let targetD = null;
  if (likeD != null) {
    const wL = likes.length / (likes.length + 1.2);
    targetD = aD != null ? wL * likeD + (1 - wL) * Math.min(aD, likeD + 1) : likeD;
    if (aD != null) targetD = Math.min(targetD, aD + 0.5);
  } else if (aD != null) targetD = aD;
  const simpleLover = likes.length >= 2 && likeD <= 1.7 && (S.age == null || S.age < 13);
  const dConf = S.age != null ? 1 : likes.length / (likes.length + 2);
  const nStats = stats ? Math.min(1, (stats.sessions || 0) / 400) : 0;

  const out = [];
  for (const P of L) {
    const t = P.t;
    const why = [], neg = [];
    let s = 0, hard = false;
    const liked = S.likes.includes(P.slug);
    const noped = S.nopes.includes(P.slug);
    if (noped) { hard = true; neg.push({ w: 9, k: 'nope' }); }

    let bestLike = null, bestSim = 0;
    if (likes.length && !liked) {
      for (const Lk of likes) {
        const c = model.sim[P.i][Lk.i];
        if (c > bestSim) { bestSim = c; bestLike = Lk; }
      }
      const content = 0.6 * bestSim + 0.4 * cos(P.v, taste);
      s += 1.25 * (content - 0.42);
      if (bestSim > 0.5) why.push({ w: bestSim, k: 'like', L: bestLike, shared: shared(model, P, bestLike, lang) });
      else if (content < 0.3) neg.push({ w: 0.4 - content, k: 'far' });
    }
    if (nopes.length) {
      let ns = 0, nP = null;
      for (const N of nopes) { const c = model.sim[P.i][N.i]; if (c > ns) { ns = c; nP = N; } }
      if (ns > 0.45 && !noped) { s -= 1.1 * (ns - 0.45); neg.push({ w: ns, k: 'likeNope', L: nP }); }
    }

    if (S.moods.length) {
      let mm = 0, top = null, topV = 0;
      for (const mo of S.moods) { const v = t.m[mo] || 0; mm += v; if (v > topV) { topV = v; top = mo; } }
      mm /= S.moods.length;
      const peak = topV;
      s += 0.7 * (0.6 * mm + 0.4 * peak - 0.38);
      if (topV >= 0.55) why.push({ w: 0.45 + topV * 0.3, k: 'mood', mood: top });
      else neg.push({ w: 0.5 - topV, k: 'mood', mood: S.moods[0] });
    }
    if (!S.moods.includes('scary') && t.sc >= 2 && likeSc < 2) {
      s -= S.age != null && S.age < 13 ? 0.35 : 0.12;
    }
    if (S.moods.includes('scary') && t.sc === 0) s -= 0.12;

    if (targetD != null) {
      const over = t.d - targetD;
      if (over > 0.5) { const p = dConf * (simpleLover ? 0.3 : 0.17) * Math.pow(over - 0.5, 1.2); s -= p; if (p > 0.12) neg.push({ w: p, k: 'hard' }); }
      if (targetD >= 4 && t.d <= 1) s -= 0.06;
      if (t.d <= 1.5 && targetD <= 2.3) why.push({ w: 0.32, k: 'easy' });
    }

    if (S.age != null) {
      const [mn, lo, hi] = t.age;
      if (S.age < mn - 2 || (t.sc >= 2 && S.age < mn) || (t.vi >= 2 && S.age < mn - 1)) { hard = true; neg.push({ w: 3, k: t.sc >= 2 ? 'scaryAge' : 'age', min: mn }); }
      else if (S.age < mn) { s -= 0.22 * (mn - S.age); neg.push({ w: 0.3, k: 'age', min: mn }); }
      else if (S.age >= lo && S.age <= hi) { s += 0.08; why.push({ w: 0.28, k: 'ageFit' }); }
      else if (S.age > hi) s -= Math.min(0.28, 0.035 * (S.age - hi));
      if (S.age <= 7 && t.d <= 1 && t.sc === 0) s += 0.08;
    }

    if (S.with === 'solo') {
      if (!t.solo) { s -= 0.6; neg.push({ w: 1, k: 'notSolo' }); }
      else if (t.np[1] <= 1) { s += 0.06; why.push({ w: 0.22, k: 'solo' }); }
    } else if (S.with === 'online') {
      if (t.on) { s += 0.2; why.push({ w: 0.55, k: 'online', n: t.np[1] }); }
      else { s -= 0.55; neg.push({ w: 1, k: 'noOnline' }); }
    } else if (S.with === 'couch') {
      if (t.couch) { s += 0.32; why.push({ w: 0.7, k: 'couch' }); }
      else if (t.np[1] > 1) s -= 0.3;
      else { s -= 0.55; neg.push({ w: 1, k: 'noCouch' }); }
    }

    const dev = S.device;
    if (dev === 'phone') {
      if (t.mob === 0) { s -= 0.75; neg.push({ w: 1.2, k: 'desk' }); }
      else if (t.mob === 1) s -= 0.15;
      else { s += 0.06; why.push({ w: 0.3, k: 'mobile' }); }
      if (t.kit.includes('phone')) s -= 0.4;
    }
    if (t.dev === 'win') { s -= 0.2; neg.push({ w: 0.6, k: 'win' }); }

    for (const k of t.kit) {
      if (k === 'phone' && dev === 'phone') continue;
      if (S.kit.includes(k)) { s += 0.12; why.push({ w: 0.5, k: 'kit', kit: k }); }
      else { s -= S.kitAsked ? 0.5 : 0.12; if (S.kitAsked) neg.push({ w: 0.9, k: 'needs', kit: k }); }
    }
    for (const k of t.opt) if (S.kit.includes(k)) { s += k === 'proj' ? 0.28 : 0.03; if (k === 'proj') why.push({ w: 0.8, k: 'kit', kit: k }); }

    if (S.time) {
      if (t.t > S.time * 1.4) { const p = 0.2 * Math.log2(t.t / S.time); s -= p; if (p > 0.15) neg.push({ w: p, k: 'long', t: t.t }); }
      else if (S.time >= 60 && t.t <= 5) s -= 0.1;
      else if (t.t <= S.time) why.push({ w: 0.16, k: 'time', t: t.t });
    }

    const qBoost = 0.075 * (t.q - 3) + (likeQ != null && likeQ >= 4 ? 0.04 * (t.q - 3) : 0);
    s += qBoost;
    if (t.q >= 4.5) why.push({ w: 0.42, k: 'polish' });
    else if (t.q >= 4) why.push({ w: 0.2, k: 'polishOk' });
    if (!P.playable) { s -= 0.32; neg.push({ w: 0.5, k: 'soon' }); }
    if (P.status === 'building') s -= 0.03;
    if (P.status === 'archive') s -= 0.08;
    if (t.lang === 'pl' && lang !== 'pl') s -= 0.12;

    if (stats && nStats > 0) {
      const cf = cfScore(P, likes, stats);
      s += 0.16 * nStats * Math.max(-1, Math.min(1.5, cf.v));
      if (cf.from && cf.v > 0.4) why.push({ w: 0.6 + cf.v * 0.2, k: 'cf', L: cf.from });
      s += 0.1 * nStats * Math.max(-1, Math.min(1.5, ctxScore(P, S, stats)));
      const pop = (stats.plays && stats.plays[P.slug]) || 0;
      if (stats.maxPlays) s += 0.06 * nStats * Math.log1p(pop) / Math.log1p(stats.maxPlays);
    }

    why.sort((a, b) => b.w - a.w);
    neg.sort((a, b) => b.w - a.w);
    out.push({ P, s, hard, liked, noped, why: dedupe(why).slice(0, 3), neg: neg.slice(0, 2), bestLike, bestSim });
  }

  const info = infoAmount(S);
  const pool = out.filter(o => !o.liked && !o.hard);
  pool.sort((a, b) => b.s - a.s || a.P.seed - b.P.seed);
  const N = pool.length;
  let K = info > 0 ? Math.round(N * Math.exp(-0.4 * info)) : N;
  K = Math.max(Math.min(3, N), Math.min(N, K));
  const top = pool.length ? pool[0].s : 0;
  const alive = new Set();
  pool.forEach((o, r) => {
    o.rank = r;
    const keep = r < K && (info === 0 || o.s > top - Math.max(0.45, 1.1 - 0.12 * info) || r < 3);
    if (keep) alive.add(o.P.slug);
  });
  for (const o of out) {
    if (o.liked) { o.rank = -1; alive.add(o.P.slug); }
    if (o.hard) o.rank = 999;
    o.alive = alive.has(o.P.slug);
    o.pct = info > 0 ? Math.max(1, Math.min(99, Math.round(100 / (1 + Math.exp(-(3 * (o.s - top) + 1.2 + 0.5 * Math.min(info, 3))))))) : null;
  }
  const best = pool.filter(o => alive.has(o.P.slug) && o.P.playable).slice(0, 3);
  return { items: out, alive, K, info, best, pool, targetD };
}

function dedupe(arr) {
  const seen = new Set();
  return arr.filter(x => { const k = x.k + (x.mood || '') + (x.kit || ''); if (seen.has(k)) return false; seen.add(k); return true; });
}

function shared(model, A, B, lang) {
  const c = [];
  for (const mo of MOODS) { const v = Math.min(A.t.m[mo] || 0, B.t.m[mo] || 0); if (v >= 0.45) c.push([v * 1.1, lab(MOOD_LABEL[mo], lang).toLowerCase()]); }
  for (const f of A.t.f) if (B.t.f.includes(f) && FEATURE_LABEL[f]) c.push([0.35 * (model.idf[f] || 1), lab(FEATURE_LABEL[f], lang)]);
  if (A.t.on && B.t.on) c.push([0.5, lang === 'pl' ? 'co-op' : 'co-op']);
  c.sort((a, b) => b[0] - a[0]);
  const outL = [];
  for (const [, l] of c) if (!outL.includes(l)) outL.push(l);
  return outL.slice(0, 2);
}

const KIT_LABEL = { cam: ['kamerka', 'webcam'], proj: ['projektor', 'projector'], phone: ['drugi telefon', 'a second phone'], mic: ['mikrofon', 'microphone'], head: ['słuchawki', 'headphones'] };

export function reasonText(r, lang) {
  const pl = lang === 'pl';
  switch (r.k) {
    case 'like': return (pl ? 'Jak ' : 'Like ') + r.L.name + (r.shared && r.shared.length ? ': ' + r.shared.join(', ') : '');
    case 'mood': return lab(MOOD_LABEL[r.mood], lang);
    case 'easy': return pl ? 'Ogarniesz w 10 sekund' : 'Makes sense in 10 seconds';
    case 'ageFit': return pl ? 'W sam raz na Twój wiek' : 'Right for your age';
    case 'solo': return pl ? 'Dla jednej osoby' : 'Made for one player';
    case 'online': return pl ? 'Co-op online' + (r.n > 1 ? ' do ' + r.n + ' osób' : '') : 'Online co-op' + (r.n > 1 ? ' for up to ' + r.n : '');
    case 'couch': return pl ? 'Na jednym ekranie, telefony jako pady' : 'One screen, phones as pads';
    case 'mobile': return pl ? 'Działa na telefonie' : 'Works on a phone';
    case 'kit': return r.kit === 'proj' ? (pl ? 'Masz projektor, idealnie' : 'You have a projector, perfect') : (pl ? 'Masz: ' : 'You have: ') + lab(KIT_LABEL[r.kit], lang);
    case 'time': return '~' + r.t + ' min';
    case 'polish': return pl ? 'Jeden z najbardziej dopracowanych' : 'One of the most polished';
    case 'polishOk': return pl ? 'Dopracowany' : 'Polished';
    case 'cf': return (pl ? 'Fani ' : 'Fans of ') + r.L.name + (pl ? ' w to grają' : ' play this');
    default: return '';
  }
}

export function negText(r, lang) {
  const pl = lang === 'pl';
  switch (r.k) {
    case 'nope': return pl ? 'Oznaczyłeś: nie dla mnie' : 'You marked it: not for me';
    case 'far': return pl ? 'Mało podobny do tego, co lubisz' : 'Not much like what you like';
    case 'likeNope': return (pl ? 'Za bardzo jak ' : 'Too much like ') + r.L.name;
    case 'mood': return (pl ? 'Mało w nim: ' : 'Not much ') + lab(MOOD_LABEL[r.mood], lang).toLowerCase();
    case 'hard': return pl ? 'Trudniejszy niż to, co lubisz' : 'Harder than what you like';
    case 'scaryAge': return (pl ? 'Za straszny dla osób poniżej ' : 'Too scary for anyone under ') + r.min + (pl ? ' lat' : '');
    case 'age': return (pl ? 'Raczej od ' : 'Best from age ') + r.min + (pl ? ' lat' : '');
    case 'notSolo': return pl ? 'Nie da się grać samemu' : 'Needs other players';
    case 'noOnline': return pl ? 'Bez trybu online' : 'No online mode';
    case 'noCouch': return pl ? 'Tylko dla jednej osoby' : 'One player only';
    case 'desk': return pl ? 'Tylko na komputerze' : 'Computer only';
    case 'win': return pl ? 'Do pobrania na Windowsa' : 'A Windows download';
    case 'needs': return (pl ? 'Potrzebna: ' : 'Needs: ') + lab(KIT_LABEL[r.kit], lang);
    case 'long': return (pl ? 'Na dłużej, ~' : 'Takes longer, ~') + r.t + ' min';
    case 'soon': return pl ? 'Jeszcze nie do zagrania' : 'Not playable yet';
    default: return '';
  }
}

export function factsLine(P, lang) {
  const t = P.t, pl = lang === 'pl';
  const parts = [];
  if (t.age && t.age[0]) parts.push((pl ? 'od ' : 'age ') + t.age[0] + '+');
  if (t.np[1] > 1) parts.push(t.np[0] + '-' + t.np[1] + (pl ? ' osób' : ' players') + (t.on ? ' online' : t.couch ? (pl ? ' na kanapie' : ' couch') : ''));
  else parts.push(pl ? '1 osoba' : '1 player');
  parts.push('~' + t.t + ' min');
  parts.push(t.dev === 'none' ? (pl ? 'jeszcze niedostępny' : 'not out yet') : t.dev === 'win' ? 'Windows' : t.mob === 2 ? (pl ? 'komputer i telefon' : 'computer and phone') : (pl ? 'komputer' : 'computer'));
  for (const k of t.kit) parts.push(lab(KIT_LABEL[k], lang));
  return parts.join(' · ');
}
