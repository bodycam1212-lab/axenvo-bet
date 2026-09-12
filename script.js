'use strict';

const DEFAULT_USERS={
  WINTIQ_MASTER:{password:'W!ntiqMaster#2026X',role:'admin'},
  Ionix87:{password:'Ajjw_291#12_O9s',role:'user'},
  Sxne1:{password:'K211093##duik_',role:'user'}
};

function loadUsers(){
  try{
    const saved=JSON.parse(localStorage.getItem('wintiqAccounts')||'null');
    if(saved && typeof saved==='object'){
      return Object.fromEntries(Object.entries({...DEFAULT_USERS,...saved}).filter(([u,a])=>a&&typeof a.password==='string'&&a.role));
    }
  }catch(e){}
  const fresh=structuredClone(DEFAULT_USERS);
  try{localStorage.setItem('wintiqAccounts',JSON.stringify(fresh))}catch(e){}
  return fresh;
}

let USERS=loadUsers();

function saveUsers(){try{localStorage.setItem('wintiqAccounts',JSON.stringify(USERS))}catch(e){}}

function findUser(username){
  const raw=String(username||'').trim();
  if(USERS[raw]) return [raw,USERS[raw]];
  const key=Object.keys(USERS).find(k=>k.toLowerCase()===raw.toLowerCase());
  return key?[key,USERS[key]]:[null,null];
}
const DEFAULTS={
  heroTitle:'SPORT.\nDATA.\nMOMENTUM.',
  heroText:'Live-Kontext, klare Daten und redaktionelle Picks. Alles, was sich im Spielmoment verändert, bleibt sichtbar.',
  release:'2026-09-13',
  pulse:'Real-time match intelligence',
  picks:[
    {id:'pick-1',sport:'FUSSBALL',match:'SC Freiburg — Borussia Mönchengladbach',tip:'Heimsieg',reason:'WINTIQ Edge: Heimvorteil und redaktionelle Matchanalyse.',tag:'TOP PICK',odd:'1.72'},
    {id:'pick-2',sport:'FUSSBALL',match:'St. Pauli — VfL Wolfsburg',tip:'Doppelte Chance – X2',reason:'WINTIQ Edge: Form, H2H und Auswärtssicherheit.',tag:'EDGE',odd:'1.50'},
    {id:'pick-3',sport:'FUSSBALL',match:'Racing Santander — Deportivo Alavés',tip:'Doppelte Chance – X2',reason:'WINTIQ Edge: aktuelle Form und defensiver Matchup-Faktor.',tag:'LALIGA',odd:'1.53'}
  ]
};
const API_LEAGUES={FUSSBALL:['ger.1','ger.2','esp.1','esp.2','eng.1','ita.1','fra.1'],BASKETBALL:['nba'],TENNIS:[]};
const REFRESH_MS=15000;
const STATE_VERSION=3;
let state=loadState();
let liveFeed={updatedAt:null,source:null,matches:{}};
let apiEvents=[];
let currentUser=null;
let activeFilter='all';
let apiBusy=false;
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function loadState(){
  try{const saved=JSON.parse(localStorage.getItem('wintiqState')||'null');if(!saved||saved.version!==STATE_VERSION){const fresh={...structuredClone(DEFAULTS),version:STATE_VERSION};localStorage.setItem('wintiqState',JSON.stringify(fresh));return fresh}return {...structuredClone(DEFAULTS),...saved,picks:Array.isArray(saved.picks)?saved.picks:structuredClone(DEFAULTS.picks)}}catch{return {...structuredClone(DEFAULTS),version:STATE_VERSION}}
}
function saveState(){state.version=STATE_VERSION;localStorage.setItem('wintiqState',JSON.stringify(state))}
function toast(msg){const e=$('#toast');if(!e)return;e.textContent=msg;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2800)}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')}
function aliases(s){const n=norm(s);const map={
  scfreiburg:['freiburg','scfreiburg'],
  borussiamonchengladbach:['borussiamonchengladbach','monchengladbach','gladbach'],
  stpauli:['stpauli','fcstpauli'],
  vflwolfsburg:['wolfsburg','vflwolfsburg'],
  racingclub:['racingdesantander','realracingclub','racingclub','racing'],
  racingdesantander:['racingdesantander','realracingclub','racingclub','racing'],
  realracingclub:['racingdesantander','realracingclub','racingclub','racing'],
  deportivoalaves:['deportivoalaves','alaves']
};return [n,...(map[n]||[])];}
function teamMatches(needle,value){const n=norm(needle),v=norm(value);if(!n||!v)return false;return v===n||v.includes(n)||n.includes(v)||aliases(needle).some(a=>v===a||v.includes(a)||a.includes(v))}
function splitMatch(match){const x=String(match||'').split(/\s+[—–-]\s+/);return [x[0]?.trim()||'',x[1]?.trim()||'']}
function teams(p){const [home,away]=splitMatch(p.match);return{home,away}}
function fmtDate(ts,withTime=true){const n=typeof ts==='number'?ts:new Date(ts||'').getTime();if(!Number.isFinite(n))return'—';return new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',...(withTime?{hour:'2-digit',minute:'2-digit'}:{})}).format(new Date(n))}
function fmtClock(ts){const n=typeof ts==='number'?ts:new Date(ts||'').getTime();return Number.isFinite(n)?new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(new Date(n)):'—'}
function fmtDuration(ms){if(!Number.isFinite(ms)||ms<0)return'—';let s=Math.floor(ms/1000),d=Math.floor(s/86400);s%=86400;let h=Math.floor(s/3600);s%=3600;let m=Math.floor(s/60),sec=s%60;if(d)return`${d}T ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;if(h)return`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;return`${m}:${String(sec).padStart(2,'0')}`}
function dateInput(d){const x=new Date(d);return Number.isFinite(x.getTime())?new Date(x.getTime()-x.getTimezoneOffset()*60000).toISOString().slice(0,16):''}
function escapeNewlines(v){return esc(v).replace(/\n/g,'<br>')}

function statusFromEvent(e){const t=e?.status?.type||{};if(t.completed||t.state==='post')return'finished';if(t.state==='in')return'live';return'upcoming'}
function eventTeams(e){const c=e?.competitions?.[0]?.competitors||[];return{home:c.find(x=>x.homeAway==='home')?.team?.displayName||'',away:c.find(x=>x.homeAway==='away')?.team?.displayName||''}}
function eventScore(e){const c=e?.competitions?.[0]?.competitors||[];return{home:Number(c.find(x=>x.homeAway==='home')?.score??0),away:Number(c.find(x=>x.homeAway==='away')?.score??0)}}
function eventMinute(e){const s=e?.status?.displayClock||'';const m=String(s).match(/(\d+)(?::\d+)?/);if(m)return Number(m[1]);const d=e?.status?.type?.shortDetail||'';const x=String(d).match(/(\d+)['’]?/);return x?Number(x[1]):0}
function eventDate(e){return new Date(e?.date||'').getTime()}
function eventKey(e){return `${e?.id||''}`}

function matchFromApi(p){
  const t=teams(p);
  let found=apiEvents.find(x=>teamMatches(t.home,x.teams.home)&&teamMatches(t.away,x.teams.away));
  if(!found)found=apiEvents.find(x=>teamMatches(t.home,x.teams.away)&&teamMatches(t.away,x.teams.home));
  return found||null;
}
function matchFromFeed(p){return liveFeed.matches?.[p.id]||null}
function normalizeFeedMatch(p,f){
  if(!f)return null;
  const score=f.score||{};
  const status=['live','upcoming','finished','unavailable'].includes(f.status)?f.status:'unavailable';
  return{status,score:{home:Number(score.home||0),away:Number(score.away||0)},startAt:f.startAt||null,source:f.source||liveFeed.source||'feed',eventId:f.eventId||null,minute:f.minute||f.displayClock||'',displayClock:f.displayClock||'',events:Array.isArray(f.events)?f.events:[],lastChecked:f.lastChecked||liveFeed.updatedAt||null,stale:Boolean(f.stale),reason:f.reason||''};
}
function loadLiveOverrides(){try{return JSON.parse(localStorage.getItem('wintiqLiveOverrides')||'{}')}catch{return{}}}
function saveLiveOverrides(v){try{localStorage.setItem('wintiqLiveOverrides',JSON.stringify(v))}catch{}}
function getLiveOverride(p){const o=loadLiveOverrides()[p.id];return o&&o.enabled?o:null}
function getLive(p){
  const manual=getLiveOverride(p);
  if(manual){return normalizeFeedMatch(p,{...manual,source:manual.source||'ADMIN OVERRIDE',stale:false})}
  const api=matchFromApi(p);
  if(api){
    const status=statusFromEvent(api.event), score=eventScore(api.event), start=eventDate(api.event);
    return{status,score,startAt:start,source:'ESPN live',eventId:api.event.id,minute:eventMinute(api.event),displayClock:api.event.status?.type?.shortDetail||api.event.status?.type?.detail||'',events:api.events||[],stale:false,lastChecked:Date.now(),home:api.teams.home,away:api.teams.away,league:api.league};
  }
  const f=normalizeFeedMatch(p,matchFromFeed(p));
  if(f)return f;
  return{status:'unavailable',score:{home:0,away:0},startAt:null,source:'—',events:[],stale:true,reason:'Kein bestätigtes Spiel im Live-Feed gefunden.'};
}
function getVerdict(p,l){
  if(l.status==='unavailable'||l.status==='upcoming')return'pending';
  if(l.status!=='live'&&l.status!=='finished')return'pending';
  const h=l.score.home,a=l.score.away,t=norm(p.tip);
  if(t.includes('x2')||t.includes('auswart')||t.includes('away'))return a>=h?'correct':'wrong';
  if(t.includes('1x'))return h>=a?'correct':'wrong';
  if(t.includes('unentschieden')||t.includes('draw'))return h===a?'correct':'wrong';
  if(t.includes('ueber')||t.includes('over'))return'pending';
  if(t.includes('unter')||t.includes('under'))return'pending';
  return h>a?'correct':'wrong';
}
function verdictLabel(v,l){if(v==='correct')return l.status==='live'?'✓ AKTUELL RICHTIG':'✓ PICK RICHTIG';if(v==='wrong')return l.status==='live'?'✕ AKTUELL FALSCH':'✕ PICK FALSCH';return l.status==='upcoming'?'◌ NOCH OFFEN':'⚠ KEIN ERGEBNIS'}
function statusLabel(l){if(l.status==='live')return`LIVE · ${l.minute?esc(l.minute):'LIVE'}`;if(l.status==='upcoming')return'STARTET BALD';if(l.status==='finished')return'BEENDET';return'KEIN LIVE-FEED'}
function timingText(l){if(l.status==='live')return l.minute?`${esc(l.minute)}' · LIVE`:'LIVE';if(l.status==='upcoming'&&l.startAt){const d=new Date(l.startAt).getTime()-Date.now();return`in ${fmtDuration(Math.max(0,d))}`};if(l.status==='finished')return`Endstand · ${fmtDate(l.startAt)}`;return'Keine bestätigte Zeit'}
function dateLine(l){if(!l.startAt)return'—';return fmtDate(l.startAt,false)}
function sourceBadge(l){return l.source||'—'}
function eventLines(l){
  const events=(l.events||[]).filter(x=>x.text||x.type).slice(-6).reverse();
  if(!events.length)return'';
  return`<div class="event-stream"><div class="event-title">MATCH EVENTS</div>${events.map(e=>`<div class="event-line"><span>${esc(e.clock||'')}</span><b>${esc(e.type||'EVENT')}</b><p>${esc(e.text||'')}</p></div>`).join('')}</div>`;
}
function liveCard(p,l){
  const t=teams(p),v=getVerdict(p,l),score=l.score||{home:0,away:0};
  const stateClass=l.status==='live'?'is-live':l.status==='upcoming'?'is-upcoming':l.status==='finished'?'is-finished':'is-unavailable';
  const stale=l.stale||(!['live','upcoming','finished'].includes(l.status));
  return`<div class="match-card ${stateClass}">
    <div class="match-card-top"><span class="match-status">${l.status==='live'?'<i></i>':''}${statusLabel(l)}</span><span>${esc(sourceBadge(l))}</span></div>
    <div class="scoreline"><div><strong>${esc(t.home)}</strong><small>HOME</small></div><div class="score-big">${Number(score.home)} <span>:</span> ${Number(score.away)}</div><div class="away"><strong>${esc(t.away)}</strong><small>AWAY</small></div></div>
    <div class="match-data"><div><span>📅 DATUM</span><b>${esc(dateLine(l))}</b></div><div><span>🕐 ZEIT</span><b>${esc(l.startAt?fmtClock(l.startAt):'—')}</b></div><div><span>⏱ STATUS</span><b>${timingText(l)}</b></div><div><span>◉ DATEN</span><b>${stale?'FEED PRÜFEN':esc(l.displayClock||'OK')}</b></div></div>
    <div class="verdict ${v}">${verdictLabel(v,l)}</div>
    ${l.status==='unavailable'?`<div class="data-warning">${esc(l.reason||'Für dieses Spiel liegt aktuell keine bestätigte Live-Datenquelle vor.')}</div>`:''}
    ${eventLines(l)}
  </div>`;
}
function renderPick(p,i){const l=getLive(p),t=teams(p);return`<article class="pick-card ${l.status}"><div class="pick-glow"></div><div class="pick-inner">
  <div class="pick-top"><span class="pick-tag">${esc(p.tag||'PICK')}</span><span class="pick-number">#${String(i+1).padStart(2,'0')}</span></div>
  <div class="pick-sport">${esc(p.sport||'SPORT')}</div>
  <h3>${esc(t.home)} <span>vs.</span> ${esc(t.away)}</h3>
  <div class="tip-row"><span>🎯 WINTIQ TIPP</span><strong>${esc(p.tip)}</strong></div>
  <p class="pick-reason">${escapeNewlines(p.reason||'')}</p>
  <div class="pick-quote"><span>QUOTE</span><strong>${esc(p.odd||'—')}</strong></div>
  ${liveCard(p,l)}
</div></article>`}
function renderPicks(){const g=$('#pickGrid');if(!g)return;g.innerHTML=(state.picks||[]).map(renderPick).join('');renderTicker()}
function renderTicker(){
  const box=$('#picksLiveTicker');if(!box)return;
  const items=(state.picks||[]).map((p,i)=>{const l=getLive(p),t=teams(p),s=l.score||{home:0,away:0};return`<div class="rail-item ${l.status}"><span class="rail-state">${l.status==='live'?'<i></i> LIVE':l.status==='upcoming'?'⏱ BALD':l.status==='finished'?'✓ FINAL':'⚠ FEED'}</span><strong>${esc(t.home)} <b>${s.home}:${s.away}</b> ${esc(t.away)}</strong><small>${esc(timingText(l))} · ${esc(dateLine(l))}</small></div>`}).join('');
  if(!items){box.innerHTML='';return}
  box.innerHTML=`<div class="rail-track"><div class="rail-set">${items}</div><div class="rail-set" aria-hidden="true">${items}</div></div>`;
}
function renderMatchBoard(){
  const b=$('#matchBoard');if(!b)return;
  const rows=(state.picks||[]).map((p,i)=>({p,i,l:getLive(p)}).filter(x=>activeFilter==='all'||x.l.status===activeFilter));
  if(!rows.length){b.innerHTML='<div class="empty-state">Keine Partien für diesen Filter.</div>';return}
  b.innerHTML=rows.map(({p,l})=>{const t=teams(p),s=l.score||{home:0,away:0};return`<div class="match-row ${l.status}"><div class="row-status">${l.status==='live'?'<i></i>':''}${esc(statusLabel(l))}</div><div class="row-team home">${esc(t.home)}</div><strong class="row-score">${s.home}<span>:</span>${s.away}</strong><div class="row-team">${esc(t.away)}</div><div class="row-time"><b>${esc(l.startAt?fmtClock(l.startAt):'—')}</b><span>${esc(timingText(l))}</span></div></div>`}).join('');
}
function calcPerformance(){let won=0,lost=0,open=0;for(const p of state.picks||[]){const l=getLive(p),v=getVerdict(p,l);if(l.status==='finished'){if(v==='correct')won++;else if(v==='wrong')lost++;else open++}else open++}const total=won+lost,rate=total?Math.round(won/total*100):0;$('#perfWon').textContent=won;$('#perfLost').textContent=lost;$('#perfOpen').textContent=open;$('#perfRate').textContent=`${rate}%`;$('#perfBar').style.width=`${rate}%`;$('#perfText').textContent=total?`${won} von ${total} beendeten Picks richtig.`:'Noch keine beendeten Picks mit bestätigten Daten.';$('#heroCorrect').textContent=`${rate}%`}
function updateMonitor(){
  const live=(state.picks||[]).map((p,i)=>({p,l:getLive(p)})).find(x=>x.l.status==='live');
  const x=live||null;
  if(!x){$('#monitorLabel').textContent='NO LIVE MATCH';$('#monitorScore').textContent='— : —';$('#monitorTeams').textContent='Keine bestätigte laufende Partie';$('#monitorStatus').textContent='WARTET';$('#monitorTime').textContent='—';$('#monitorDate').textContent='—';$('#monitorSource').textContent=liveFeed.source||'—';$('#monitorEvent').textContent='Keine erfundenen Live-Daten';return}
  const t=teams(x.p),s=x.l.score;$('#monitorLabel').textContent=`${x.p.sport} · ${x.l.minute||'LIVE'}`;$('#monitorScore').textContent=`${s.home} : ${s.away}`;$('#monitorTeams').textContent=`${t.home} — ${t.away}`;$('#monitorStatus').textContent='LIVE';$('#monitorTime').textContent=x.l.displayClock||`${x.l.minute||'—'}'`;$('#monitorDate').textContent=fmtDate(x.l.startAt,false);$('#monitorSource').textContent=x.l.source||'ESPN';$('#monitorEvent').textContent=x.l.events?.[x.l.events.length-1]?.text||'Live-Spiel läuft';}
function updateMeta(){
  const ts=liveFeed.updatedAt?new Date(liveFeed.updatedAt).getTime():0;const age=ts?Math.max(0,Date.now()-ts):Infinity;const stale=age>120000;$('#lastUpdate').textContent=ts?`FEED · ${fmtClock(ts)}`:'FEED · —';$('#feedSync').textContent=stale?'FEED STALE':'LIVE SYNC';$('#feedSource').textContent=stale?'PRÜFEN':(liveFeed.source||'ESPN');$('#tickerUpdated').textContent=ts?`Letzter Datenstand ${fmtClock(ts)}`:'Noch kein bestätigter Datenstand';const live=(state.picks||[]).filter(p=>getLive(p).status==='live').length;$('#heroLiveCount').textContent=live;$('#heroPickCount').textContent=state.picks.length;$('#heroFeedAge').textContent=stale?'STALE':'ONLINE';}
function updateAll(){renderPicks();renderMatchBoard();calcPerformance();updateMonitor();updateMeta();}

async function loadStoredFeed(){try{const r=await fetch(`live-data.json?v=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(r.status);liveFeed=await r.json();updateAll()}catch{updateMeta()}}
async function fetchScoreboard(sport,league,dates){const u=`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${dates}`;const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error(`${r.status}`);return r.json()}
async function loadApiLive(){
  if(apiBusy)return;apiBusy=true;
  try{
    const now=new Date();
    const dates=[];
    for(let offset=-2;offset<=2;offset++){
      const d=new Date(now);d.setDate(d.getDate()+offset);
      dates.push(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);
    }
    const jobs=[];
    for(const p of (state.picks||[])){
      for(const league of (API_LEAGUES[p.sport]||[])) jobs.push({sport:p.sport==='BASKETBALL'?'basketball':'soccer',league});
    }
    const unique=jobs.filter((x,i,a)=>a.findIndex(y=>y.sport===x.sport&&y.league===x.league)===i);
    const requests=[];
    for(const x of unique) for(const date of dates) requests.push({...x,date});
    const results=await Promise.allSettled(requests.map(x=>fetchScoreboard(x.sport,x.league,x.date)));
    apiEvents=[];
    results.forEach((r,i)=>{
      if(r.status!=='fulfilled')return;
      const req=requests[i];
      for(const event of (r.value.events||[])) apiEvents.push({league:req.league,sport:req.sport,event,teams:eventTeams(event),events:[]});
    });
    if(apiEvents.length)liveFeed={...liveFeed,updatedAt:new Date().toISOString(),source:'ESPN live'};
    updateAll();
  }catch(e){console.warn('Live feed error',e)}
  finally{apiBusy=false}
}
async function loadMatchDetails(){
  const live=(state.picks||[]).map(p=>({p,e:matchFromApi(p)})).filter(x=>x.e&&statusFromEvent(x.e.event)==='live');
  await Promise.all(live.map(async x=>{try{const league=x.e.league,sport=x.e.sport||'soccer',r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${x.e.event.id}`,{cache:'no-store'});if(r.ok){const d=await r.json();x.e.events=(d.plays||[]).filter(v=>v.text||v.type?.text).slice(-12).map(v=>({clock:v.clock?.displayValue||'',type:v.type?.text||'EVENT',text:v.text||'',team:v.team?.displayName||''}));x.e.events=x.events||[];}}catch{}}));
  updateAll();
}
function renderHero(){const title=$('#heroTitle');title.innerHTML=escapeNewlines(state.heroTitle);$('#heroText').textContent=state.heroText;$('#pulseText').textContent=state.pulse;$('#releaseDateBig').textContent=state.release;if($('#releaseMeta'))$('#releaseMeta').textContent=state.release;$('#heroDate').textContent=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date())}
function countdown(){const target=new Date(`${state.release}T00:00:00`).getTime(),d=Math.max(0,target-Date.now()),s=Math.floor(d/1000),days=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sec=s%60,p=n=>String(n).padStart(2,'0');$('#timer').textContent=`${p(days)} : ${p(h)} : ${p(m)} : ${p(sec)}`;$('#days').textContent=`${p(days)} DAYS`}
function unlock(user,role){currentUser={user,role};sessionStorage.setItem('wintiqUser',JSON.stringify(currentUser));document.body.classList.remove('locked');$('#loginGate').classList.add('hidden');$('#app').classList.remove('app-hidden');$('#currentUserLabel').textContent=user+(role==='admin'?' · ADMIN':'');if(role==='admin')$('#adminOpen').classList.remove('hidden');updateAll()}
function lock(){sessionStorage.removeItem('wintiqUser');currentUser=null;document.body.classList.add('locked');$('#loginGate').classList.remove('hidden');$('#app').classList.add('app-hidden');closeModal('#adminPanel');closeModal('#resetModal')}
function closeModal(id){$(id)?.classList.add('hidden')}
function resetRequest(){const input=$('#resetUsername'),m=$('#resetMessage');const u=input?.value.trim()||'';const [resolved]=findUser(u);if(!u||!resolved){m.textContent='Benutzername nicht gefunden.';m.style.color='#ff6b75';return}const r=JSON.parse(localStorage.getItem('wintiqPasswordRequests')||'[]');if(!r.some(x=>x.username===u&&x.status==='pending'))r.unshift({id:'PW-'+Date.now().toString(36),username:u,status:'pending',createdAt:new Date().toISOString()});localStorage.setItem('wintiqPasswordRequests',JSON.stringify(r));m.textContent='Anfrage gesendet ✓';m.style.color='var(--acid)';toast('Passwort-Anfrage gesendet');setTimeout(()=>closeModal('#resetModal'),800)}
function renderRequests(){const list=$('#passwordRequestList');if(!list)return;const r=JSON.parse(localStorage.getItem('wintiqPasswordRequests')||'[]');$('#pendingResetCount').textContent=r.filter(x=>x.status==='pending').length;list.innerHTML=r.length?r.map(x=>`<div class="password-request"><div class="password-request-top"><b>${esc(x.username)}</b><span>${esc(x.status)}</span></div><small>${esc(new Date(x.createdAt).toLocaleString('de-DE'))}</small></div>`).join(''):'<div class="password-request">Keine Anfragen.</div>'}
function renderAdmin(){
  if(!currentUser||currentUser.role!=='admin')return;
  $('#aHeroTitle').value=state.heroTitle;
  $('#aHeroText').value=state.heroText;
  $('#aRelease').value=state.release;
  $('#aPulse').value=state.pulse;
  $('#adminPicks').innerHTML=state.picks.map((p,i)=>`<div class="admin-pick"><div class="password-request-top"><b>Pick ${i+1}</b><button class="mini-btn" data-remove-pick="${i}">ENTFERNEN</button></div><div class="admin-grid"><label>Sport<input data-p="${i}" data-f="sport" value="${esc(p.sport)}"></label><label>Tag<input data-p="${i}" data-f="tag" value="${esc(p.tag||'PICK')}"></label><label>Match<input data-p="${i}" data-f="match" value="${esc(p.match)}"></label><label>Tipp<input data-p="${i}" data-f="tip" value="${esc(p.tip)}"></label><label>Quote<input data-p="${i}" data-f="odd" value="${esc(p.odd||'')}"></label><label>Einschätzung<textarea data-p="${i}" data-f="reason" rows="2">${esc(p.reason||'')}</textarea></label></div></div>`).join('');
  $$('[data-p]').forEach(e=>e.oninput=()=>{const i=+e.dataset.p;if(state.picks[i])state.picks[i][e.dataset.f]=e.value});
  const overrides=loadLiveOverrides();
  $('#adminLiveControls').innerHTML=state.picks.map((p,i)=>{const o=overrides[p.id]||{};const t=teams(p);return `<div class="admin-pick"><div class="password-request-top"><b>${esc(t.home)} — ${esc(t.away)}</b><label><input type="checkbox" data-live-enabled="${p.id}" ${o.enabled?'checked':''}> Override aktiv</label></div><div class="admin-grid"><label>Status<select data-live-field="status" data-live-id="${p.id}"><option value="upcoming" ${o.status==='upcoming'?'selected':''}>Upcoming</option><option value="live" ${o.status==='live'?'selected':''}>Live</option><option value="finished" ${o.status==='finished'?'selected':''}>Beendet</option><option value="unavailable" ${o.status==='unavailable'?'selected':''}>Keine Daten</option></select></label><label>Startzeit<input type="datetime-local" data-live-field="startAt" data-live-id="${p.id}" value="${dateInput(o.startAt||'')}"></label><label>Heim <input type="number" min="0" data-live-field="home" data-live-id="${p.id}" value="${Number(o.score?.home||0)}"></label><label>Auswärts <input type="number" min="0" data-live-field="away" data-live-id="${p.id}" value="${Number(o.score?.away||0)}"></label><label>Minute<input data-live-field="minute" data-live-id="${p.id}" value="${esc(o.minute||'')}" placeholder="z. B. 72"></label><label>Letztes Event<input data-live-field="eventText" data-live-id="${p.id}" value="${esc(o.eventText||'')}" placeholder="z. B. 72' Tor Heimteam"></label></div></div>`}).join('');
  $$('[data-live-field],[data-live-enabled]').forEach(e=>e.addEventListener('input',collectLiveOverride));
  $$('[data-live-enabled]').forEach(e=>e.addEventListener('change',collectLiveOverride));
  renderRequests();
}
function collectLiveOverride(){
  const overrides=loadLiveOverrides();
  state.picks.forEach(p=>{
    const id=p.id;const enabled=$(`[data-live-enabled="${CSS.escape(id)}"]`)?.checked;
    const get=f=>$(`[data-live-field="${f}"][data-live-id="${CSS.escape(id)}"]`)?.value||'';
    const existing=overrides[id]||{};
    overrides[id]={...existing,enabled:!!enabled,status:get('status')||existing.status||'upcoming',startAt:get('startAt')?new Date(get('startAt')).toISOString():existing.startAt||null,score:{home:Number(get('home')||0),away:Number(get('away')||0)},minute:get('minute'),eventText:get('eventText'),events:get('eventText')?[{clock:get('minute')?`${get('minute')}'`:'',type:'EVENT',text:get('eventText')}]:existing.events||[],source:'ADMIN OVERRIDE'};
  });
  saveLiveOverrides(overrides);updateAll();
}

function bindFilters(){$$('.filter').forEach(b=>b.onclick=()=>{$$('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeFilter=b.dataset.filter;renderMatchBoard()})}
function bindLogin(){
  const form=$('#loginForm');
  if(!form || form.dataset.bound==='1') return;
  form.dataset.bound='1';
  form.addEventListener('submit',e=>{
    e.preventDefault();
    e.stopPropagation();
    const u=$('#loginUser')?.value.trim()||'';
    const pass=$('#loginPass')?.value||'';
    const err=$('#loginError');
    const [resolved,account]=findUser(u);
    if(resolved && account && String(account.password)===String(pass)){
      if(err) err.textContent='';
      unlock(resolved,account.role);
      return false;
    }
    if(err) err.textContent='Benutzername oder Passwort ist falsch.';
    $('#loginPass')?.focus();
  });
}

function init(){
  // Login wird als allererstes gebunden, damit ein Fehler im Live-System
  // niemals das Anmeldeformular unbenutzbar machen kann.
  bindLogin();
  renderHero();updateAll();countdown();bindFilters();
  $('#forgotPasswordBtn')?.addEventListener('click',()=>$('#resetModal')?.classList.remove('hidden'));
  $('#resetClose')?.addEventListener('click',()=>closeModal('#resetModal'));
  $('#sendResetRequest')?.addEventListener('click',resetRequest);
  $('#logout')?.addEventListener('click',lock);
  $('#hamb')?.addEventListener('click',()=>$('#mobile')?.classList.toggle('open'));
  $$('#mobile a').forEach(a=>a.addEventListener('click',()=>$('#mobile')?.classList.remove('open')));
  $('#adminOpen')?.addEventListener('click',()=>{$('#adminPanel')?.classList.remove('hidden');renderAdmin()});
  $('#adminClose')?.addEventListener('click',()=>closeModal('#adminPanel'));
  $('#refreshPasswordRequests')?.addEventListener('click',renderRequests);
  $('#addPick')?.addEventListener('click',()=>{state.picks.push({id:'pick-'+Date.now(),sport:'FUSSBALL',match:'Neue Partie — Gegner',tip:'Heimsieg',reason:'Neue WINTIQ Einschätzung.',tag:'NEW',odd:'1.90'});renderAdmin();updateAll()});
  $('#adminPicks')?.addEventListener('click',e=>{const b=e.target.closest('[data-remove-pick]');if(b){state.picks.splice(+b.dataset.removePick,1);renderAdmin();updateAll()}});
  $('#saveAdmin')?.addEventListener('click',()=>{state.heroTitle=$('#aHeroTitle').value;state.heroText=$('#aHeroText').value;state.release=$('#aRelease').value;state.pulse=$('#aPulse').value;collectLiveOverride();saveState();renderHero();updateAll();closeModal('#adminPanel');toast('Änderungen gespeichert ✓')});
  $('#resetAdmin')?.addEventListener('click',()=>{state=structuredClone(DEFAULTS);saveState();renderHero();updateAll();toast('Demo zurückgesetzt')});
  try{const saved=JSON.parse(sessionStorage.getItem('wintiqUser')||'null');const [savedUser,savedAccount]=findUser(saved?.user||'');if(savedUser&&savedAccount)unlock(savedUser,savedAccount.role)}catch(e){sessionStorage.removeItem('wintiqUser')}
  loadStoredFeed().then(loadApiLive).then(loadMatchDetails).catch(()=>{});
  setInterval(()=>{countdown();updateAll()},1000);
  setInterval(async()=>{try{await loadStoredFeed();await loadApiLive();await loadMatchDetails()}catch{}},REFRESH_MS);
}
document.addEventListener('DOMContentLoaded',init);
