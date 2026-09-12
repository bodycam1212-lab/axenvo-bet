'use strict';

/* WINTIQ — stable frontend controller
   - Login starts independently from live data
   - Admin editor for hero, picks and live overrides
   - Live feed: local JSON + ESPN scoreboard (browser polling, no reload)
   - No fake status from elapsed time
*/

const DEFAULT_USERS = Object.freeze({
  WINTIQ_MASTER: { password: 'W!ntiqMaster#2026X', role: 'admin' },
  Ionix87: { password: 'Ajjw_291#12_O9s', role: 'user' },
  Sxne1: { password: 'K211093##duik_', role: 'user' }
});

const DEFAULTS = {
  heroTitle: 'SPORT.\nDATA.\nMOMENTUM.',
  heroText: 'Live-Kontext, klare Daten und redaktionelle Picks. Alles, was sich im Spielmoment verändert, bleibt sichtbar.',
  release: '2026-09-13',
  pulse: 'Real-time match intelligence',
  picks: [
    { id: 'pick-1', sport: 'FUSSBALL', match: 'SC Freiburg — Borussia Mönchengladbach', tip: 'Heimsieg', reason: 'WINTIQ Edge: Heimvorteil und redaktionelle Matchanalyse.', tag: 'TOP PICK', odd: '1.72' },
    { id: 'pick-2', sport: 'FUSSBALL', match: 'FC St. Pauli — VfL Wolfsburg', tip: 'Doppelte Chance – X2', reason: 'WINTIQ Edge: Form, H2H und Auswärtssicherheit.', tag: 'EDGE', odd: '1.50' },
    { id: 'pick-3', sport: 'FUSSBALL', match: 'Racing Santander — Deportivo Alavés', tip: 'Doppelte Chance – X2', reason: 'WINTIQ Edge: aktuelle Form und defensiver Matchup-Faktor.', tag: 'LALIGA', odd: '1.53' }
  ]
};

const API_LEAGUES = {
  FUSSBALL: ['ger.1', 'ger.2', 'esp.1', 'eng.1', 'ita.1', 'fra.1'],
  BASKETBALL: ['nba'],
  TENNIS: []
};

const REFRESH_MS = 15000;
const STATE_VERSION = 6;
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));

let currentUser = null;
let activeFilter = 'all';
let liveFeed = { updatedAt: null, source: null, matches: {} };
let apiEvents = [];
let apiBusy = false;
let state = loadState();
let users = loadUsers();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function loadUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem('wintiqAccounts') || 'null');
    const merged = { ...clone(DEFAULT_USERS), ...(saved && typeof saved === 'object' ? saved : {}) };
    return Object.fromEntries(Object.entries(merged).filter(([, a]) => a && typeof a.password === 'string' && a.role));
  } catch {
    return clone(DEFAULT_USERS);
  }
}

function saveUsers() {
  try { localStorage.setItem('wintiqAccounts', JSON.stringify(users)); } catch {}
}

function findUser(username) {
  const raw = String(username || '').trim();
  const exact = users[raw];
  if (exact) return [raw, exact];
  const key = Object.keys(users).find((k) => k.toLowerCase() === raw.toLowerCase());
  return key ? [key, users[key]] : [null, null];
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('wintiqState') || 'null');
    if (!saved || typeof saved !== 'object') return { ...clone(DEFAULTS), version: STATE_VERSION };
    const picks = Array.isArray(saved.picks) && saved.picks.length ? saved.picks : clone(DEFAULTS.picks);
    return { ...clone(DEFAULTS), ...saved, version: STATE_VERSION, picks: picks.map((p, i) => ({ ...clone(DEFAULTS.picks[i % DEFAULTS.picks.length]), ...p, id: p.id || `pick-${i + 1}` })) };
  } catch {
    return { ...clone(DEFAULTS), version: STATE_VERSION };
  }
}

function saveState() {
  try { localStorage.setItem('wintiqState', JSON.stringify({ ...state, version: STATE_VERSION })); } catch {}
}

function toast(msg) {
  const e = $('#toast');
  if (!e) return;
  e.textContent = msg;
  e.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => e.classList.remove('show'), 2800);
}

function closeModal(id) { $(id)?.classList.add('hidden'); }

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function splitMatch(match) {
  const x = String(match || '').split(/\s+[—–-]\s+/);
  return [x[0]?.trim() || '', x[1]?.trim() || ''];
}

function teams(p) {
  const [home, away] = splitMatch(p.match);
  return { home, away };
}

const NAME_ALIASES = {
  'scfreiburg': ['freiburg', 'scfreiburg'],
  'borussiamonchengladbach': ['borussiamonchengladbach', 'monchengladbach', 'gladbach'],
  'fcstpauli': ['stpauli', 'fcstpauli', 'pauli'],
  'stpauli': ['stpauli', 'fcstpauli', 'pauli'],
  'vflwolfsburg': ['wolfsburg', 'vflwolfsburg'],
  'racingsantander': ['racingsantander', 'realracingclub', 'racing', 'santander'],
  'deportivoalaves': ['deportivoalaves', 'alaves', 'alaveses']
};

function teamMatches(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  const aa = [na, ...(NAME_ALIASES[na] || [])];
  const bb = [nb, ...(NAME_ALIASES[nb] || [])];
  return aa.some(x => bb.some(y => x === y || x.includes(y) || y.includes(x)));
}

function fmtDate(ts, withTime = true) {
  const n = typeof ts === 'number' ? ts : new Date(ts || '').getTime();
  if (!Number.isFinite(n)) return '—';
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(new Date(n));
}

function fmtClock(ts) {
  const n = typeof ts === 'number' ? ts : new Date(ts || '').getTime();
  return Number.isFinite(n) ? new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date(n)) : '—';
}

function dateInput(value) {
  const d = new Date(value || '');
  if (!Number.isFinite(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function statusFromEvent(event) {
  const t = event?.status?.type || {};
  if (t.completed || t.state === 'post' || t.name === 'STATUS_FINAL') return 'finished';
  if (t.state === 'in' || t.name === 'STATUS_IN_PROGRESS') return 'live';
  return 'upcoming';
}

function eventTeams(event) {
  const c = event?.competitions?.[0]?.competitors || [];
  return {
    home: c.find(x => x.homeAway === 'home')?.team?.displayName || '',
    away: c.find(x => x.homeAway === 'away')?.team?.displayName || ''
  };
}

function eventScore(event) {
  const c = event?.competitions?.[0]?.competitors || [];
  return {
    home: Number(c.find(x => x.homeAway === 'home')?.score ?? 0),
    away: Number(c.find(x => x.homeAway === 'away')?.score ?? 0)
  };
}

function eventDate(event) { return new Date(event?.date || '').getTime(); }

function eventMinute(event) {
  const clock = String(event?.status?.displayClock || event?.status?.type?.shortDetail || '');
  const m = clock.match(/(\d+)(?:\+\d+)?/);
  return m ? Number(m[1]) : '';
}

function eventClock(event) {
  return event?.status?.displayClock || event?.status?.type?.shortDetail || '';
}

function matchFromApi(p) {
  const t = teams(p);
  let hit = apiEvents.find(x => teamMatches(t.home, x.teams.home) && teamMatches(t.away, x.teams.away));
  if (!hit) hit = apiEvents.find(x => teamMatches(t.home, x.teams.away) && teamMatches(t.away, x.teams.home));
  return hit || null;
}

function matchFromFeed(p) { return liveFeed.matches?.[p.id] || null; }

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem('wintiqLiveOverrides') || '{}'); } catch { return {}; }
}

function saveOverrides(v) {
  try { localStorage.setItem('wintiqLiveOverrides', JSON.stringify(v)); } catch {}
}

function getOverride(p) {
  const o = loadOverrides()[p.id];
  return o?.enabled ? o : null;
}

function buildApiMatch(p, hit) {
  const e = hit.event;
  const score = eventScore(e);
  const status = statusFromEvent(e);
  return {
    status,
    score,
    startAt: eventDate(e),
    source: `ESPN · ${hit.league}`,
    eventId: e.id || null,
    minute: status === 'live' ? eventMinute(e) : '',
    displayClock: status === 'live' ? eventClock(e) : (status === 'finished' ? 'FT' : ''),
    events: Array.isArray(hit.events) ? hit.events : [],
    lastChecked: new Date().toISOString(),
    stale: false,
    reason: ''
  };
}

function getLive(p) {
  const override = getOverride(p);
  if (override) return {
    status: override.status || 'upcoming',
    score: { home: Number(override.score?.home || 0), away: Number(override.score?.away || 0) },
    startAt: override.startAt || null,
    source: 'ADMIN OVERRIDE',
    eventId: null,
    minute: override.minute || '',
    displayClock: override.status === 'finished' ? 'FT' : (override.minute ? `${override.minute}'` : ''),
    events: Array.isArray(override.events) ? override.events : [],
    lastChecked: new Date().toISOString(),
    stale: false,
    reason: ''
  };

  const api = matchFromApi(p);
  if (api) return buildApiMatch(p, api);

  const stored = matchFromFeed(p);
  if (stored) return stored;

  return { status: 'unavailable', score: { home: 0, away: 0 }, startAt: null, source: 'NO VERIFIED FEED', eventId: null, minute: '', displayClock: '', events: [], lastChecked: null, stale: true, reason: 'Für dieses Spiel liegt aktuell keine bestätigte Datenquelle vor.' };
}

function pickSideOutcome(p, l) {
  const tip = norm(p.tip);
  const s = l.score || { home: 0, away: 0 };
  if (l.status !== 'finished') return 'pending';
  if (!tip) return 'pending';
  const draw = s.home === s.away;
  const homeWin = s.home > s.away;
  const awayWin = s.away > s.home;
  if (tip.includes('heimsieg') || tip.includes('homewin')) return homeWin ? 'correct' : 'wrong';
  if (tip.includes('auswärtssieg') || tip.includes('awaywin')) return awayWin ? 'correct' : 'wrong';
  if (tip.includes('x2') || tip.includes('doppeltechancex2')) return awayWin || draw ? 'correct' : 'wrong';
  if (tip.includes('1x') || tip.includes('doppeltechance1x')) return homeWin || draw ? 'correct' : 'wrong';
  return 'pending';
}

function verdictLabel(v) {
  return v === 'correct' ? '✓ PICK RICHTIG' : v === 'wrong' ? '✕ PICK FALSCH' : '◌ ERGEBNIS OFFEN';
}

function statusLabel(l) {
  return l.status === 'live' ? 'LIVE' : l.status === 'upcoming' ? 'UPCOMING' : l.status === 'finished' ? 'FINAL' : 'KEINE DATEN';
}

function timingText(l) {
  if (l.status === 'live') return l.displayClock || (l.minute !== '' ? `${l.minute}'` : 'LIVE');
  if (l.status === 'finished') return 'beendet';
  if (l.status === 'upcoming') return l.startAt ? `Start ${fmtClock(l.startAt)}` : 'Startzeit —';
  return 'Feed nicht verfügbar';
}

function dateLine(l) {
  return l.startAt ? fmtDate(l.startAt, false) : 'Datum —';
}

function sourceBadge(l) {
  return l.source || 'Feed';
}

function eventLines(l) {
  if (!Array.isArray(l.events) || !l.events.length) return '';
  const last = l.events.slice(-6).reverse();
  return `<div class="event-stream"><div class="event-title">MATCH EVENTS</div>${last.map(e => `<div class="event-line"><span>${esc(e.clock || '—')}</span><b>${esc(e.type || 'EVENT')}</b><p>${esc(e.text || '')}</p></div>`).join('')}</div>`;
}

function liveCard(p, l) {
  const t = teams(p);
  const s = l.score || { home: 0, away: 0 };
  const v = pickSideOutcome(p, l);
  const klass = l.status === 'live' ? 'is-live' : l.status === 'upcoming' ? 'is-upcoming' : l.status === 'finished' ? 'is-finished' : 'is-unavailable';
  return `<div class="match-card ${klass}">
    <div class="match-card-top"><span class="match-status">${l.status === 'live' ? '<i></i>' : ''}${esc(statusLabel(l))}</span><span>${esc(sourceBadge(l))}</span></div>
    <div class="scoreline"><div><strong>${esc(t.home)}</strong><small>HOME</small></div><div class="score-big">${Number(s.home)} <span>:</span> ${Number(s.away)}</div><div class="away"><strong>${esc(t.away)}</strong><small>AWAY</small></div></div>
    <div class="match-data"><div><span>📅 DATUM</span><b>${esc(dateLine(l))}</b></div><div><span>🕐 ZEIT</span><b>${esc(l.startAt ? fmtClock(l.startAt) : '—')}</b></div><div><span>⏱ STATUS</span><b>${esc(timingText(l))}</b></div><div><span>◉ FEED</span><b>${esc(l.stale ? 'STALE' : (l.displayClock || 'OK'))}</b></div></div>
    <div class="verdict ${v}">${verdictLabel(v)}</div>
    ${l.status === 'unavailable' ? `<div class="data-warning">${esc(l.reason)}</div>` : ''}
    ${eventLines(l)}
  </div>`;
}

function renderPick(p, i) {
  const l = getLive(p);
  const t = teams(p);
  return `<article class="pick-card ${l.status}"><div class="pick-inner">
    <div class="pick-top"><span class="pick-tag">${esc(p.tag || 'PICK')}</span><span class="pick-number">#${String(i + 1).padStart(2, '0')}</span></div>
    <div class="pick-sport">${esc(p.sport || 'SPORT')}</div>
    <h3>${esc(t.home)} <span>vs.</span> ${esc(t.away)}</h3>
    <div class="tip-row"><span>🎯 WINTIQ TIPP</span><strong>${esc(p.tip)}</strong></div>
    <p class="pick-reason">${esc(p.reason || '')}</p>
    <div class="pick-quote"><span>💶 QUOTE</span><strong>${esc(p.odd || '—')}</strong></div>
    ${liveCard(p, l)}
  </div></article>`;
}

function renderPicks() {
  const grid = $('#pickGrid');
  if (!grid) return;
  grid.innerHTML = (state.picks || []).map(renderPick).join('');
  renderTicker();
}

function tickerItem(p) {
  const l = getLive(p), t = teams(p), s = l.score || { home: 0, away: 0 };
  const stateClass = l.status;
  const stateText = l.status === 'live' ? '<i></i> LIVE' : l.status === 'upcoming' ? '⏱ BALD' : l.status === 'finished' ? '✓ FINAL' : '⚠ FEED';
  return `<div class="rail-item ${stateClass}"><span class="rail-state">${stateText}</span><strong>${esc(t.home)} <b>${Number(s.home)}:${Number(s.away)}</b> ${esc(t.away)}</strong><small>${esc(timingText(l))} · ${esc(dateLine(l))}</small></div>`;
}

function renderTicker() {
  const box = $('#picksLiveTicker');
  if (!box) return;
  const items = (state.picks || []).map(tickerItem).join('');
  box.innerHTML = items ? `<div class="rail-track"><div class="rail-set">${items}</div><div class="rail-set" aria-hidden="true">${items}</div></div>` : '';
}

function renderMatchBoard() {
  const board = $('#matchBoard');
  if (!board) return;
  const rows = (state.picks || []).map((p, i) => ({ p, i, l: getLive(p) })).filter(x => activeFilter === 'all' || x.l.status === activeFilter);
  if (!rows.length) {
    board.innerHTML = '<div class="empty-state">Keine Partien für diesen Filter.</div>';
    return;
  }
  board.innerHTML = rows.map(({ p, l }) => {
    const t = teams(p), s = l.score || { home: 0, away: 0 };
    return `<div class="match-row ${l.status}"><div class="row-status">${l.status === 'live' ? '<i></i>' : ''}${esc(statusLabel(l))}</div><div class="row-team home">${esc(t.home)}</div><strong class="row-score">${Number(s.home)}<span>:</span>${Number(s.away)}</strong><div class="row-team">${esc(t.away)}</div><div class="row-time"><b>${esc(l.startAt ? fmtClock(l.startAt) : '—')}</b><span>${esc(timingText(l))}</span></div></div>`;
  }).join('');
}

function calcPerformance() {
  let won = 0, lost = 0, open = 0;
  for (const p of state.picks || []) {
    const v = pickSideOutcome(p, getLive(p));
    if (v === 'correct') won++; else if (v === 'wrong') lost++; else open++;
  }
  const total = won + lost;
  const rate = total ? Math.round((won / total) * 100) : 0;
  $('#perfWon').textContent = won;
  $('#perfLost').textContent = lost;
  $('#perfOpen').textContent = open;
  $('#perfRate').textContent = `${rate}%`;
  $('#perfBar').style.width = `${rate}%`;
  $('#perfText').textContent = total ? `${won} von ${total} beendeten Picks richtig.` : 'Noch keine beendeten Picks mit bestätigten Daten.';
  $('#heroCorrect').textContent = `${rate}%`;
}

function updateMonitor() {
  const found = (state.picks || []).map(p => ({ p, l: getLive(p) })).find(x => x.l.status === 'live');
  if (!found) {
    $('#monitorLabel').textContent = 'NO LIVE MATCH';
    $('#monitorScore').textContent = '— : —';
    $('#monitorTeams').textContent = 'Keine bestätigte laufende Partie';
    $('#monitorStatus').textContent = 'WARTET';
    $('#monitorTime').textContent = '—';
    $('#monitorDate').textContent = '—';
    $('#monitorSource').textContent = liveFeed.source || '—';
    $('#monitorEvent').textContent = 'Keine erfundenen Live-Daten';
    return;
  }
  const t = teams(found.p), s = found.l.score || { home: 0, away: 0 };
  $('#monitorLabel').textContent = `${found.p.sport} · ${found.l.minute || 'LIVE'}`;
  $('#monitorScore').textContent = `${Number(s.home)} : ${Number(s.away)}`;
  $('#monitorTeams').textContent = `${t.home} — ${t.away}`;
  $('#monitorStatus').textContent = 'LIVE';
  $('#monitorTime').textContent = found.l.displayClock || (found.l.minute ? `${found.l.minute}'` : 'LIVE');
  $('#monitorDate').textContent = found.l.startAt ? fmtDate(found.l.startAt, false) : '—';
  $('#monitorSource').textContent = found.l.source || 'ESPN';
  $('#monitorEvent').textContent = found.l.events?.[found.l.events.length - 1]?.text || 'Live-Spiel läuft';
}

function updateMeta() {
  const ts = liveFeed.updatedAt ? new Date(liveFeed.updatedAt).getTime() : 0;
  const age = ts ? Math.max(0, Date.now() - ts) : Infinity;
  const stale = age > 120000;
  $('#lastUpdate').textContent = ts ? `FEED · ${fmtClock(ts)}` : 'FEED · —';
  $('#feedSync').textContent = stale ? 'FEED STALE' : 'LIVE SYNC';
  $('#feedSource').textContent = stale ? 'PRÜFEN' : (liveFeed.source || 'ESPN / FALLBACK');
  $('#tickerUpdated').textContent = ts ? `Letzter Datenstand ${fmtClock(ts)}` : 'Noch kein bestätigter Datenstand';
  $('#heroLiveCount').textContent = (state.picks || []).filter(p => getLive(p).status === 'live').length;
  $('#heroPickCount').textContent = (state.picks || []).length;
  $('#heroFeedAge').textContent = stale ? 'STALE' : 'ONLINE';
}

function updateAll() {
  renderPicks();
  renderMatchBoard();
  calcPerformance();
  updateMonitor();
  updateMeta();
}

async function loadStoredFeed() {
  try {
    const response = await fetch(`live-data.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data && typeof data === 'object') {
      liveFeed = { updatedAt: data.updatedAt || null, source: data.source || 'Stored feed', matches: data.matches || {} };
      updateAll();
    }
  } catch {
    updateMeta();
  }
}

async function fetchScoreboard(sport, league, date) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${date}`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`ESPN ${response.status}`);
  return response.json();
}

async function loadApiLive() {
  if (apiBusy) return;
  apiBusy = true;
  try {
    const now = new Date();
    const dates = [];
    for (let offset = -2; offset <= 2; offset++) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      dates.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`);
    }
    const leagues = [];
    for (const p of state.picks || []) {
      for (const league of API_LEAGUES[p.sport] || []) {
        const sport = p.sport === 'BASKETBALL' ? 'basketball' : 'soccer';
        leagues.push({ sport, league });
      }
    }
    const unique = leagues.filter((x, i, arr) => arr.findIndex(y => y.sport === x.sport && y.league === x.league) === i);
    const requests = unique.flatMap(x => dates.map(date => ({ ...x, date })));
    const results = await Promise.allSettled(requests.map(r => fetchScoreboard(r.sport, r.league, r.date)));
    const nextEvents = [];
    results.forEach((result, idx) => {
      if (result.status !== 'fulfilled') return;
      for (const event of result.value?.events || []) {
        nextEvents.push({ league: requests[idx].league, sport: requests[idx].sport, event, teams: eventTeams(event), events: [] });
      }
    });
    if (nextEvents.length) {
      apiEvents = nextEvents;
      liveFeed = { ...liveFeed, updatedAt: new Date().toISOString(), source: 'ESPN · browser live feed' };
      updateAll();
    }
  } catch (error) {
    console.warn('Live API unavailable:', error);
  } finally {
    apiBusy = false;
  }
}

async function loadMatchDetails() {
  const live = (state.picks || []).map(p => ({ p, e: matchFromApi(p) })).filter(x => x.e && statusFromEvent(x.e.event) === 'live');
  await Promise.all(live.map(async item => {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/${item.e.sport}/${item.e.league}/summary?event=${encodeURIComponent(item.e.event.id)}`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      item.e.events = (data.plays || []).filter(p => p.text || p.type?.text).slice(-12).map(p => ({ clock: p.clock?.displayValue || '', type: p.type?.text || 'EVENT', text: p.text || '', team: p.team?.displayName || '' }));
    } catch (error) {
      console.warn('Match summary unavailable:', error);
    }
  }));
  updateAll();
}

function renderHero() {
  $('#heroTitle').innerHTML = esc(state.heroTitle).replace(/\n/g, '<br>');
  $('#heroText').textContent = state.heroText;
  $('#pulseText').textContent = state.pulse;
  $('#releaseDateBig').textContent = state.release;
  $('#releaseMeta').textContent = state.release;
  $('#heroDate').textContent = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
}

function countdown() {
  const target = new Date(`${state.release}T00:00:00`).getTime();
  const diff = Math.max(0, target - Date.now());
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = n => String(n).padStart(2, '0');
  $('#timer').textContent = `${p(days)} : ${p(h)} : ${p(m)} : ${p(sec)}`;
  $('#days').textContent = `${p(days)} DAYS`;
}

function unlock(user, role) {
  currentUser = { user, role };
  sessionStorage.setItem('wintiqUser', JSON.stringify(currentUser));
  document.body.classList.remove('locked');
  $('#loginGate')?.classList.add('hidden');
  $('#app')?.classList.remove('app-hidden');
  $('#currentUserLabel').textContent = role === 'admin' ? `${user} · ADMIN` : user;
  $('#adminOpen')?.classList.toggle('hidden', role !== 'admin');
  updateAll();
}

function lock() {
  currentUser = null;
  sessionStorage.removeItem('wintiqUser');
  document.body.classList.add('locked');
  $('#loginGate')?.classList.remove('hidden');
  $('#app')?.classList.add('app-hidden');
  closeModal('#adminPanel');
  closeModal('#resetModal');
}

function resetRequest() {
  const input = $('#resetUsername');
  const m = $('#resetMessage');
  const u = input?.value.trim() || '';
  const [resolved] = findUser(u);
  if (!u || !resolved) { m.textContent = 'Benutzername nicht gefunden.'; m.style.color = '#ff6b75'; return; }
  const requests = JSON.parse(localStorage.getItem('wintiqPasswordRequests') || '[]');
  if (!requests.some(x => x.username.toLowerCase() === resolved.toLowerCase() && x.status === 'pending')) requests.unshift({ id: `PW-${Date.now().toString(36).toUpperCase()}`, username: resolved, status: 'pending', createdAt: new Date().toISOString() });
  localStorage.setItem('wintiqPasswordRequests', JSON.stringify(requests));
  m.textContent = 'Anfrage gesendet ✓';
  m.style.color = 'var(--acid)';
  toast('Passwort-Anfrage gesendet');
  setTimeout(() => closeModal('#resetModal'), 800);
}

function renderRequests() {
  const list = $('#passwordRequestList');
  if (!list) return;
  const requests = JSON.parse(localStorage.getItem('wintiqPasswordRequests') || '[]');
  $('#pendingResetCount').textContent = requests.filter(x => x.status === 'pending').length;
  list.innerHTML = requests.length ? requests.map(x => `<div class="password-request"><div class="password-request-top"><b>${esc(x.username)}</b><span>${esc(x.status)}</span></div><small>${esc(new Date(x.createdAt).toLocaleString('de-DE'))}</small><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="mini-btn" data-reset-user="${esc(x.username)}">PASSWORT SETZEN</button><button type="button" class="mini-btn" data-reset-delete="${esc(x.id)}">LÖSCHEN</button></div></div>`).join('') : '<div class="password-request">Keine Anfragen.</div>';
}

function renderAdmin() {
  if (!currentUser || currentUser.role !== 'admin') return;
  $('#aHeroTitle').value = state.heroTitle;
  $('#aHeroText').value = state.heroText;
  $('#aRelease').value = state.release;
  $('#aPulse').value = state.pulse;
  $('#adminPicks').innerHTML = (state.picks || []).map((p, i) => `<div class="admin-pick"><div class="password-request-top"><b>Pick ${i + 1}</b><button class="mini-btn" data-remove-pick="${i}" type="button">ENTFERNEN</button></div><div class="admin-grid"><label>Sport<input data-p="${i}" data-f="sport" value="${esc(p.sport)}"></label><label>Tag<input data-p="${i}" data-f="tag" value="${esc(p.tag || '')}"></label><label>Match<input data-p="${i}" data-f="match" value="${esc(p.match)}"></label><label>Tipp<input data-p="${i}" data-f="tip" value="${esc(p.tip)}"></label><label>Quote<input data-p="${i}" data-f="odd" value="${esc(p.odd || '')}"></label><label>Einschätzung<textarea data-p="${i}" data-f="reason" rows="2">${esc(p.reason || '')}</textarea></label></div></div>`).join('');
  $$('[data-p]').forEach(el => el.addEventListener('input', () => { const i = Number(el.dataset.p); if (state.picks[i]) state.picks[i][el.dataset.f] = el.value; }));

  const overrides = loadOverrides();
  $('#adminLiveControls').innerHTML = (state.picks || []).map(p => {
    const o = overrides[p.id] || {};
    const t = teams(p);
    return `<div class="admin-pick"><div class="password-request-top"><b>${esc(t.home)} — ${esc(t.away)}</b><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-live-enabled="${esc(p.id)}" ${o.enabled ? 'checked' : ''}> Override aktiv</label></div><div class="admin-grid"><label>Status<select data-live-field="status" data-live-id="${esc(p.id)}"><option value="upcoming" ${o.status === 'upcoming' ? 'selected' : ''}>Upcoming</option><option value="live" ${o.status === 'live' ? 'selected' : ''}>Live</option><option value="finished" ${o.status === 'finished' ? 'selected' : ''}>Beendet</option><option value="unavailable" ${o.status === 'unavailable' ? 'selected' : ''}>Keine Daten</option></select></label><label>Startzeit<input type="datetime-local" data-live-field="startAt" data-live-id="${esc(p.id)}" value="${dateInput(o.startAt)}"></label><label>Heim<input type="number" min="0" data-live-field="home" data-live-id="${esc(p.id)}" value="${Number(o.score?.home || 0)}"></label><label>Auswärts<input type="number" min="0" data-live-field="away" data-live-id="${esc(p.id)}" value="${Number(o.score?.away || 0)}"></label><label>Minute<input data-live-field="minute" data-live-id="${esc(p.id)}" value="${esc(o.minute || '')}" placeholder="72"></label><label>Event<input data-live-field="eventText" data-live-id="${esc(p.id)}" value="${esc(o.eventText || '')}" placeholder="72' Tor Heimteam"></label></div></div>`;
  }).join('');
  $$('[data-live-field],[data-live-enabled]').forEach(el => { el.addEventListener('input', collectLiveOverride); el.addEventListener('change', collectLiveOverride); });
  renderRequests();
}

function collectLiveOverride() {
  const overrides = loadOverrides();
  (state.picks || []).forEach(p => {
    const selector = CSS.escape(p.id);
    const enabled = $(`[data-live-enabled="${selector}"]`)?.checked;
    const read = field => $(`[data-live-field="${field}"][data-live-id="${selector}"]`)?.value || '';
    const old = overrides[p.id] || {};
    const eventText = read('eventText');
    overrides[p.id] = {
      ...old,
      enabled: !!enabled,
      status: read('status') || old.status || 'upcoming',
      startAt: read('startAt') ? new Date(read('startAt')).toISOString() : old.startAt || null,
      score: { home: Number(read('home') || 0), away: Number(read('away') || 0) },
      minute: read('minute'),
      eventText,
      events: eventText ? [{ clock: read('minute') ? `${read('minute')}'` : '', type: 'EVENT', text: eventText }] : old.events || [],
      source: 'ADMIN OVERRIDE'
    };
  });
  saveOverrides(overrides);
  updateAll();
}

function bindFilters() {
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    $$('.filter').forEach(x => x.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter || 'all';
    renderMatchBoard();
  }));
}

function bindLogin() {
  const form = $('#loginForm');
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  form.addEventListener('submit', event => {
    event.preventDefault();
    const u = $('#loginUser')?.value.trim() || '';
    const password = $('#loginPass')?.value || '';
    const [resolved, account] = findUser(u);
    const error = $('#loginError');
    if (resolved && account && String(account.password) === String(password)) {
      if (error) error.textContent = '';
      unlock(resolved, account.role);
      return;
    }
    // Falls ein alter lokaler Account einen veralteten Passwortwert enthält,
    // akzeptieren wir einmalig die bekannten Standard-Zugangsdaten und
    // synchronisieren den lokalen Account wieder mit der Standardkonfiguration.
    const defaultAccount = Object.keys(DEFAULT_USERS).find(k => k.toLowerCase() === u.toLowerCase());
    if (defaultAccount && DEFAULT_USERS[defaultAccount] && String(DEFAULT_USERS[defaultAccount].password) === String(password)) {
      users[defaultAccount] = clone(DEFAULT_USERS[defaultAccount]);
      saveUsers();
      if (error) error.textContent = '';
      unlock(defaultAccount, users[defaultAccount].role);
      return;
    }
    if (error) error.textContent = 'Benutzername oder Passwort ist falsch.';
    $('#loginPass')?.focus();
  });
}

function bindAdmin() {
  $('#adminOpen')?.addEventListener('click', () => { $('#adminPanel')?.classList.remove('hidden'); renderAdmin(); });
  $('#adminClose')?.addEventListener('click', () => closeModal('#adminPanel'));
  $('#addPick')?.addEventListener('click', () => {
    state.picks.push({ id: `pick-${Date.now()}`, sport: 'FUSSBALL', match: 'Neue Partie — Gegner', tip: 'Heimsieg', reason: 'Neue WINTIQ Einschätzung.', tag: 'NEW', odd: '1.90' });
    renderAdmin(); updateAll();
  });
  $('#adminPicks')?.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove-pick]');
    if (!remove) return;
    state.picks.splice(Number(remove.dataset.removePick), 1);
    saveState(); renderAdmin(); updateAll();
  });
  $('#saveAdmin')?.addEventListener('click', () => {
    state.heroTitle = $('#aHeroTitle').value;
    state.heroText = $('#aHeroText').value;
    state.release = $('#aRelease').value;
    state.pulse = $('#aPulse').value;
    saveState();
    updateAll(); renderHero();
    toast('Änderungen gespeichert ✓');
    closeModal('#adminPanel');
  });
  $('#resetAdmin')?.addEventListener('click', () => {
    if (!confirm('Demo wirklich zurücksetzen?')) return;
    state = { ...clone(DEFAULTS), version: STATE_VERSION };
    saveState(); renderHero(); updateAll(); toast('Demo zurückgesetzt');
  });
  $('#refreshPasswordRequests')?.addEventListener('click', renderRequests);
  $('#passwordRequestList')?.addEventListener('click', event => {
    const setButton = event.target.closest('[data-reset-user]');
    const deleteButton = event.target.closest('[data-reset-delete]');
    if (setButton) {
      const [resolved] = findUser(setButton.dataset.resetUser);
      if (!resolved) return;
      const next = prompt(`Neues Passwort für ${resolved}:`, '');
      if (!next) return;
      if (next.length < 8) { toast('Passwort muss mindestens 8 Zeichen haben.'); return; }
      users[resolved].password = next; saveUsers();
      const requests = JSON.parse(localStorage.getItem('wintiqPasswordRequests') || '[]');
      requests.forEach(x => { if (x.username === resolved && x.status === 'pending') { x.status = 'done'; x.completedAt = new Date().toISOString(); } });
      localStorage.setItem('wintiqPasswordRequests', JSON.stringify(requests));
      renderRequests(); toast('Passwort geändert ✓');
    }
    if (deleteButton) {
      const requests = JSON.parse(localStorage.getItem('wintiqPasswordRequests') || '[]').filter(x => x.id !== deleteButton.dataset.resetDelete);
      localStorage.setItem('wintiqPasswordRequests', JSON.stringify(requests)); renderRequests();
    }
  });
}

function init() {
  bindLogin();
  $('#forgotPasswordBtn')?.addEventListener('click', () => $('#resetModal')?.classList.remove('hidden'));
  $('#resetClose')?.addEventListener('click', () => closeModal('#resetModal'));
  $('#sendResetRequest')?.addEventListener('click', resetRequest);
  $('#logout')?.addEventListener('click', lock);
  $('#hamb')?.addEventListener('click', () => $('#mobile')?.classList.toggle('open'));
  $$('#mobile a').forEach(a => a.addEventListener('click', () => $('#mobile')?.classList.remove('open')));
  bindAdmin();
  bindFilters();
  renderHero();
  updateAll();
  countdown();
  try {
    const saved = JSON.parse(sessionStorage.getItem('wintiqUser') || 'null');
    const [resolved, account] = findUser(saved?.user || '');
    if (resolved && account && saved?.role === account.role) unlock(resolved, account.role);
  } catch { sessionStorage.removeItem('wintiqUser'); }

  loadStoredFeed().then(loadApiLive).then(loadMatchDetails).catch(() => {});
  setInterval(() => { countdown(); updateAll(); }, 1000);
  setInterval(async () => {
    try { await loadStoredFeed(); await loadApiLive(); await loadMatchDetails(); } catch {}
  }, REFRESH_MS);
}

document.addEventListener('DOMContentLoaded', init);
