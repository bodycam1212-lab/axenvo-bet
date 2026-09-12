import fs from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const config = JSON.parse(await fs.readFile(new URL('../live-config.json', import.meta.url), 'utf8'));
const picksState = JSON.parse(await fs.readFile(new URL('../picks.json', import.meta.url), 'utf8'));
const previousFeed = JSON.parse(await fs.readFile(new URL('../live-data.json', import.meta.url), 'utf8').catch(() => '{"matches":{}}'));

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}`;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const aliases = {
  'scfreiburg':['freiburg','scfreiburg'],
  'borussiamonchengladbach':['borussiamonchengladbach','monchengladbach','gladbach'],
  'stpauli':['stpauli','fcstpauli'],
  'vflwolfsburg':['wolfsburg','vflwolfsburg'],
  'racingclub':['racingdesantander','racingclub','racing'],
  'realracingclub':['racingdesantander','racingclub','racing'],
  'deportivoalaves':['deportivoalaves','alaves'],
};
const aliasHit = (needle, value) => {
  const n = norm(needle);
  const v = norm(value);
  return v === n || (aliases[n] || []).some(a => v === a || v.includes(a) || a.includes(v));
};
function splitMatch(match){
  const [home,away] = String(match||'').split(/\s+[—–-]\s+/);
  return [home?.trim() || '', away?.trim() || ''];
}
function statusOf(event){
  const t = event?.status?.type || {};
  if (t.completed || t.state === 'post') return 'finished';
  if (t.state === 'in') return 'live';
  return 'upcoming';
}
function scoreOf(event){
  const c = event?.competitions?.[0]?.competitors || [];
  const home = c.find(x => x.homeAway === 'home');
  const away = c.find(x => x.homeAway === 'away');
  return {home:Number(home?.score ?? 0), away:Number(away?.score ?? 0)};
}
function eventTeams(event){
  const c = event?.competitions?.[0]?.competitors || [];
  return {
    home:c.find(x=>x.homeAway==='home')?.team?.displayName || '',
    away:c.find(x=>x.homeAway==='away')?.team?.displayName || ''
  };
}
async function getJson(url){
  const r = await fetch(url, {headers:{'user-agent':'WINTIQ-Live-Sync/1.0'}});
  if(!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function fetchLeague(league, start, end){
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${start}-${end}`;
  return getJson(url);
}
async function fetchSummary(league,eventId){
  try {
    return await getJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eventId}`);
  } catch { return null; }
}

const now = new Date();
const from = new Date(now); from.setUTCDate(from.getUTCDate()-config.searchWindowDays);
const to = new Date(now); to.setUTCDate(to.getUTCDate()+config.searchWindowDays);
const allEvents=[];
for (const league of [...new Set(Object.values(config.leagues).flat())]) {
  try {
    const data = await fetchLeague(league, ymd(from), ymd(to));
    for (const e of (data.events || [])) allEvents.push({league,event:e});
  } catch (err) {
    console.warn('league fetch failed', league, err.message);
  }
}

const picks = picksState.picks || [];
const matches = {...(previousFeed.matches || {})};
for (const p of picks) {
  const [homeNeedle, awayNeedle] = splitMatch(p.match);
  let found = allEvents.find(({event}) => {
    const t = eventTeams(event);
    return aliasHit(homeNeedle,t.home) && aliasHit(awayNeedle,t.away);
  });
  if (!found) {
    // Some editors write the two clubs in the opposite convention; allow reverse only as a last resort.
    found = allEvents.find(({event}) => {
      const t = eventTeams(event);
      return aliasHit(homeNeedle,t.away) && aliasHit(awayNeedle,t.home);
    });
  }
  if (!found) {
    matches[p.id] = {...(matches[p.id]||{}), status:'unavailable', source:'ESPN', lastChecked:now.toISOString(), reason:'Kein passendes Spiel im aktuellen Datenfenster gefunden.'};
    continue;
  }
  const {league,event}=found;
  const status = statusOf(event);
  const score = scoreOf(event);
  const out = {
    status,
    source:'ESPN',
    providerLeague:league,
    eventId:event.id,
    home:eventTeams(event).home,
    away:eventTeams(event).away,
    score,
    startAt:event.date,
    displayClock:event.status?.type?.shortDetail || event.status?.type?.detail || '',
    minute:event.status?.displayClock || event.status?.type?.shortDetail || '',
    lastChecked:now.toISOString(),
    stale:false,
    events:[]
  };
  if (status !== 'upcoming') {
    const summary = await fetchSummary(league,event.id);
    const plays = summary?.plays || [];
    out.events = plays.filter(x => x.type?.text || x.text).slice(-20).map(x => ({
      clock:x.clock?.displayValue || x.clock?.value || '',
      text:x.text || x.type?.text || '',
      team:x.team?.displayName || '',
      type:x.type?.text || ''
    }));
  }
  matches[p.id]=out;
}

const output = {
  updatedAt: now.toISOString(),
  source:'ESPN public scoreboard',
  refreshSeconds:300,
  matches
};
await fs.writeFile(new URL('../live-data.json', import.meta.url), JSON.stringify(output,null,2)+'\n');
console.log(`WINTIQ live sync: ${picks.length} picks / ${allEvents.length} events`);
