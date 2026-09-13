(() => {
"use strict";

const DEFAULT_USERS = {
  WINTIQ_MASTER:{password:"W!ntiqMaster#2026X",role:"admin"},
  Ionix87:{password:"Ajjw_291#12_O9s",role:"user"},
  Sxne1:{password:"K211093##duik_",role:"user"}
};

const DEFAULT_PICKS = [
 {id:"pick-1",sport:"FUSSBALL",tag:"TOP PICK",match:"SC Freiburg — Borussia Mönchengladbach",tip:"Heimsieg",reason:"WINTIQ Einschätzung: Heimvorteil, Form und Matchup sprechen für Freiburg."},
 {id:"pick-2",sport:"FUSSBALL",tag:"EDGE",match:"St. Pauli — VfL Wolfsburg",tip:"Doppelte Chance – X2",reason:"WINTIQ Einschätzung: Der Tipp basiert auf Form und defensiver Stabilität."},
 {id:"pick-3",sport:"FUSSBALL",tag:"LALIGA",match:"Racing Santander — Deportivo Alavés",tip:"Doppelte Chance – X2",reason:"WINTIQ Einschätzung: Form und Matchup sprechen für die Absicherung auf X2."}
];

const LEAGUES = ["ger.1","ger.2","esp.1","esp.2","eng.1","ita.1","fra.1"];
const REFRESH_KEY="wintiqRefreshSeconds";
const state = {
  picks: load("wintiqPicks", DEFAULT_PICKS),
  users: load("wintiqAccounts", DEFAULT_USERS),
  overrides: load("wintiqOverrides", {}),
  settings: load("wintiqSettings", {intro:"Redaktionelle Tipps, echte Spielstände und ein Live-Ticker – alles an einem Ort.", refresh:15}),
  feed:{events:[],updatedAt:null,fetchedAt:null,source:"—",error:null},
  user:null
};

function load(key, fallback){try{const v=JSON.parse(localStorage.getItem(key));return v ?? structuredClone(fallback)}catch{return structuredClone(fallback)}}
function save(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch{}}
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
function findUser(name){const raw=String(name||"").trim();if(state.users[raw])return [raw,state.users[raw]];const k=Object.keys(state.users).find(x=>x.toLowerCase()===raw.toLowerCase());return k?[k,state.users[k]]:[null,null]}
function toast(msg){const e=$("#toast");e.textContent=msg;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2500)}
function splitMatch(s){const a=String(s||"").split(/\s+[—–-]\s+/);return [a[0]||"",a[1]||""]}
function aliases(s){const n=norm(s);const m={scfreiburg:["freiburg","scfreiburg"],borussiamonchengladbach:["gladbach","monchengladbach","borussiamonchengladbach"],stpauli:["stpauli","fcstpauli"],vflwolfsburg:["wolfsburg","vflwolfsburg"],racingsantander:["racing","racingsantander","realracingclub"],deportivoalaves:["alaves","deportivoalaves"]};return [n,...(m[n]||[])]}
function sameTeam(a,b){const x=norm(a),y=norm(b);return !!x&&!!y&&(x===y||x.includes(y)||y.includes(x)||aliases(a).some(v=>y.includes(v)||v.includes(y)))}
function eventTeams(e){const c=e?.competitions?.[0]?.competitors||[];return {home:c.find(x=>x.homeAway==="home")?.team?.displayName||"",away:c.find(x=>x.homeAway==="away")?.team?.displayName||""}}
function eventScore(e){const c=e?.competitions?.[0]?.competitors||[];return {home:Number(c.find(x=>x.homeAway==="home")?.score||0),away:Number(c.find(x=>x.homeAway==="away")?.score||0)}}
function status(e){const t=e?.status?.type||{};if(t.completed||t.state==="post")return "finished";if(t.state==="in")return "live";return "upcoming"}
function start(e){const n=Date.parse(e?.date||"");return Number.isFinite(n)?n:null}
function minute(e){const d=e?.status?.displayClock||e?.status?.displayValue||"";const m=String(d).match(/(\d+)(?::(\d+))?/);return m?m[1]:""}
function parseMinute(v){const m=String(v??"").match(/(\d+)(?::(\d+))?/);return m?Number(m[1])+(Number(m[2]||0)/60):null}
function runningMinute(l){if(l.status!=="live")return l.minute||"";const base=parseMinute(l.minute);if(base==null)return "LIVE";const anchor=Number(l.fetchedAt||state.feed.fetchedAt||Date.now());const elapsed=Math.max(0,(Date.now()-anchor)/60000);return String(Math.min(120,Math.floor(base+elapsed)))}
function playText(x){return x?.text||x?.shortText||x?.type?.text||x?.type?.shortText||"Match-Event"}
function normalizePlay(x){return {clock:x?.clock?.displayValue||x?.clock?.value||x?.period?.displayValue||"",text:playText(x),type:x?.type?.text||"Event",homeScore:x?.homeScore,awayScore:x?.awayScore,id:x?.id||null}}
function extractPlays(event,summary){const raw=summary?.plays||event?.plays||event?.competitions?.[0]?.details||[];return Array.isArray(raw)?raw.map(normalizePlay).filter(x=>x.text):[]}
function fmtDate(v,time=true){const n=typeof v==="number"?v:Date.parse(v||"");if(!Number.isFinite(n))return "—";return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",...(time?{hour:"2-digit",minute:"2-digit"}:{})}).format(n)}
function fmtClock(v){const n=typeof v==="number"?v:Date.parse(v||"");return Number.isFinite(n)?new Intl.DateTimeFormat("de-DE",{hour:"2-digit",minute:"2-digit"}).format(n):"—"}
function duration(ms){if(ms<=0)return "jetzt";let s=Math.floor(ms/1000),h=Math.floor(s/3600);s%=3600;let m=Math.floor(s/60),sec=s%60;return h?`${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`:`${m}:${String(sec).padStart(2,"0")}`}
function currentOverride(p){const o=state.overrides[p.id];return o?.enabled?o:null}
function findEvent(p){const [h,a]=splitMatch(p.match);return state.feed.events.find(x=>sameTeam(h,x.teams.home)&&sameTeam(a,x.teams.away)) || state.feed.events.find(x=>sameTeam(h,x.teams.away)&&sameTeam(a,x.teams.home)) || null}
function getLive(p){
  const o=currentOverride(p);
  if(o)return {status:o.status||"upcoming",score:o.score||{home:0,away:0},startAt:o.startAt||null,minute:o.minute||"",source:"ADMIN OVERRIDE",events:o.events||[],eventText:o.eventText||"",fetchedAt:o.fetchedAt||Date.now()};
  const e=findEvent(p);
  if(!e)return {status:"unavailable",score:{home:0,away:0},startAt:null,minute:"",source:"KEIN FEED",events:[],reason:"Kein bestätigtes Spiel im aktuellen Feed."};
  return {status:status(e.event),score:eventScore(e.event),startAt:start(e.event),minute:minute(e.event),source:"ESPN",events:e.plays||[],teams:e.teams,fetchedAt:state.feed.fetchedAt};
}
function verdict(p,l){
  if(l.status!=="finished" && l.status!=="live")return "pending";
  const h=l.score.home,a=l.score.away,t=norm(p.tip);
  if(t.includes("x2")||t.includes("auswart"))return a>=h?"correct":"wrong";
  if(t.includes("1x"))return h>=a?"correct":"wrong";
  if(t.includes("unentschieden")||t.includes("draw"))return h===a?"correct":"wrong";
  if(t.includes("heim")||t.includes("home"))return h>a?"correct":"wrong";
  return "pending";
}
function statusText(l){return l.status==="live"?"LIVE":l.status==="upcoming"?"STARTET BALD":l.status==="finished"?"BEENDET":"KEINE DATEN"}
function scoreText(l){return l.status==="unavailable"?"— : —":`${l.score.home} : ${l.score.away}`}
function timing(l){if(l.status==="live"){const m=runningMinute(l);return m&&m!=="LIVE"?`${m}' · LIVE`:"LIVE"}if(l.status==="upcoming"&&l.startAt)return `Start ${fmtDate(l.startAt)}`;if(l.status==="finished")return `Endstand · ${fmtDate(l.startAt)}`;return "Kein bestätigter Spielstand"}

function goalChanged(p,l){if(l.status!=="live"&&l.status!=="finished")return false;const key=p.id+":"+l.score.home+":"+l.score.away;const prev=state.lastScores?.[p.id];if(!state.lastScores)state.lastScores={};state.lastScores[p.id]=key;return prev&&prev!==key}
function render(){
  const picks=state.picks||[];
  const live=picks.map(p=>({p,l:getLive(p)}));
  $("#statPicks").textContent=picks.length;
  $("#statLive").textContent=live.filter(x=>x.l.status==="live").length;
  $("#statOpen").textContent=live.filter(x=>x.l.status==="live"||x.l.status==="upcoming").length;
  const done=live.filter(x=>x.l.status==="finished"), won=done.filter(x=>verdict(x.p,x.l)==="correct").length, lost=done.filter(x=>verdict(x.p,x.l)==="wrong").length;
  const rate=won+lost?Math.round(won/(won+lost)*100):null;
  $("#statRate").textContent=rate===null?"—":rate+"%";$("#rateBig").textContent=rate===null?"—":rate+"%";$("#rateBar").style.width=(rate||0)+"%";$("#wonBig").textContent=won;$("#lostBig").textContent=lost;$("#openBig").textContent=picks.length-done.length;
  $("#pickCount").textContent=picks.length;
  $("#todayLabel").textContent=new Intl.DateTimeFormat("de-DE",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date());
  $("#feedTime").textContent=state.feed.updatedAt?`FEED ${fmtClock(state.feed.updatedAt)}`:"FEED —";
  $("#feedBadge span").textContent=state.feed.error?"FEED OFFLINE":state.feed.updatedAt?"LIVE SYNC":"SYNC";
  $("#feedBadge i").style.background=state.feed.error?"var(--red)":"var(--acid)";
  $("#feedBadge i").style.boxShadow=state.feed.error?"0 0 14px var(--red)":"0 0 14px var(--acid)";
  $("#syncState").textContent=state.feed.error?"OFFLINE":"ONLINE";$("#syncAge").textContent=state.feed.updatedAt?`Letzter Abruf ${fmtClock(state.feed.updatedAt)}`:"Noch kein Abruf";$("#footerFeed").textContent=state.feed.error?"Feed: offline":`Feed: ${state.feed.source}`;
  renderTicker(live);renderPicks(live);renderMonitor(live);renderEvents(live);
}
function renderTicker(items){
  const el=$("#liveTicker"), strip=$("#liveStripTrack");
  const sorted=[...items].sort((a,b)=>({live:0,upcoming:1,finished:2,unavailable:3}[a.l.status]-({live:0,upcoming:1,finished:2,unavailable:3}[b.l.status])));
  if(!sorted.length){const empty="<div class='ticker-row'><div class='ticker-status'>WINTIQ</div><div>Keine Picks vorhanden.</div><div>—</div><div>—</div></div>";el.innerHTML=empty;if(strip)strip.innerHTML="<span class='strip-empty'>WINTIQ · Keine Live-Picks</span>";return}
  el.innerHTML=sorted.map(({p,l})=>{const [h,a]=splitMatch(p.match);const cls=l.status==="live"?"live":"";const v=verdict(p,l);return `<div class="ticker-row ${cls}"><div class="ticker-status ${cls}">${l.status==="live"?"🔴 LIVE":statusText(l)}</div><div><b>${esc(h)}</b> <span>vs.</span> <b>${esc(a)}</b><div class="ticker-meta">${esc(timing(l))} · ${esc(l.startAt?fmtDate(l.startAt,false):"Datum —")}</div></div><div class="ticker-score ${cls}">${scoreText(l)}</div><div class="ticker-meta">${esc(p.tip)}${v==="correct"?" · ✓":v==="wrong"?" · ✕":""}</div></div>`}).join("");
  if(strip)strip.innerHTML=sorted.map(({p,l})=>{const [h,a]=splitMatch(p.match);return `<div class="strip-item ${l.status}"><span class="strip-dot"></span><span class="strip-league">${esc(p.sport||"SPORT")}</span><b>${esc(h)}</b><strong>${scoreText(l)}</strong><b>${esc(a)}</b><span class="strip-time">${esc(timing(l))}</span></div>`}).join("");
}
function renderPicks(items){
  $("#pickGrid").innerHTML=items.map(({p,l})=>{const [h,a]=splitMatch(p.match),v=verdict(p,l),statusCls=l.status==="live"?"live":l.status==="upcoming"?"upcoming":l.status==="finished"?"finished":"unavailable";const ev=(l.events||[]).slice(-5).reverse();const flash=goalChanged(p,l);return `<article class="pick-card ${flash?"score-flash":""}"><div class="pick-top"><span class="pick-tag">${esc(p.tag||"WINTIQ PICK")}</span><span class="status ${statusCls}">${l.status==="live"?"🔴 LIVE":esc(statusText(l))}</span></div><div class="pick-body"><div class="sport">${esc(p.sport||"SPORT")}</div><div class="teams">${esc(h)}<br><span>vs.</span><br>${esc(a)}</div><div class="score-wrap"><div class="score">${scoreText(l)}</div>${l.status==="live"?`<div class="minute-live"><i></i>${esc(timing(l))}</div>`:""}</div><div class="match-info"><span class="chip">${esc(timing(l))}</span><span class="chip">${esc(l.startAt?fmtDate(l.startAt,false):"Datum —")}</span><span class="chip">${esc(l.source)}</span></div><div class="tip-box"><span>UNSER TIPP</span><strong>${esc(p.tip)}</strong></div><p class="reason">${esc(p.reason||"")}</p><div class="verdict ${v}">${v==="correct"?(l.status==="live"?"✓ AKTUELL RICHTIG":"✓ PICK RICHTIG"):v==="wrong"?(l.status==="live"?"✕ AKTUELL FALSCH":"✕ PICK FALSCH"):l.status==="unavailable"?"⚠ KEINE BESTÄTIGTEN DATEN":"◌ NOCH OFFEN"}</div>${ev.length?`<div class="events">${ev.map(e=>`<div class="event"><b>${esc(e.clock||"")}</b><span>${esc(e.text||e.type||"Event")}</span></div>`).join("")}</div>`:""}</div></article>`}).join("");
}
function renderMonitor(items){
  const x=items.find(v=>v.l.status==="live")||items.find(v=>v.l.status==="upcoming");
  const el=$("#heroLiveMatch");
  if(!x){el.className="monitor-empty";el.textContent="Kein bestätigtes Live-Spiel.";$("#monitorSource").textContent=state.feed.source||"—";return}
  const [h,a]=splitMatch(x.p.match);el.className="monitor-match";el.innerHTML=`<div class="monitor-status">${x.l.status==="live"?"🔴 LIVE":statusText(x.l)}</div><div class="monitor-teams">${esc(h)} · ${esc(a)}</div><div class="monitor-score">${scoreText(x.l)}</div><div class="monitor-time">${esc(timing(x.l))}</div>`;$("#monitorSource").textContent=x.l.source;
}
function renderEvents(items){
  const ev=[];items.forEach(x=>(x.l.events||[]).slice(-4).forEach(e=>ev.push({p:x.p,e})));
  $("#liveEvents").innerHTML=ev.length?ev.slice(-12).reverse().map(x=>`<article class="event-card"><h4>${esc(x.p.match)}</h4><b>${esc(x.e.clock||"EVENT")}</b><p>${esc(x.e.text||x.e.type||"Match Event")}</p></article>`).join(""):"<article class='event-card'><h4>Live Events</h4><p>Hier erscheinen bestätigte Tore und Match-Events, sobald der Feed sie liefert.</p></article>";
}

async function fetchScoreboard(league,date){
  const url=`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${date}`;
  const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(String(r.status));return r.json();
}
async function refreshFeed(){
  const now=new Date(),dates=[];
  for(let i=-1;i<=1;i++){const d=new Date(now);d.setDate(d.getDate()+i);dates.push(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`)}
  const results=await Promise.allSettled(LEAGUES.flatMap(l=>dates.map(d=>fetchScoreboard(l,d))));
  const events=[];
  results.forEach(r=>{if(r.status!=="fulfilled")return;(r.value.events||[]).forEach(e=>events.push({event:e,teams:eventTeams(e),league:e.league?.slug||"soccer",plays:extractPlays(e,null)}))});
  // Pull full match summaries for the games represented by WINTIQ picks. This supplies reliable goal/event data.
  const relevant=events.filter(x=>state.picks.some(p=>{const [h,a]=splitMatch(p.match);return sameTeam(h,x.teams.home)&&sameTeam(a,x.teams.away)||sameTeam(h,x.teams.away)&&sameTeam(a,x.teams.home)}));
  await Promise.allSettled(relevant.map(async x=>{try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${x.league}/summary?event=${encodeURIComponent(x.event.id)}`,{cache:"no-store"});if(r.ok){const s=await r.json();x.plays=extractPlays(x.event,s)}}catch{}}));
  const fetchedAt=Date.now();
  state.feed.events=events;state.feed.updatedAt=fetchedAt;state.feed.fetchedAt=fetchedAt;state.feed.source="ESPN";state.feed.error=results.every(r=>r.status==="rejected")?"Alle Feed-Anfragen fehlgeschlagen":null;render();
  save("wintiqLastFeed",{updatedAt:state.feed.updatedAt,fetchedAt:state.feed.fetchedAt,events:events.map(({event,teams,league,plays})=>({event,teams,league,plays}))});
}
function loadLastFeed(){const f=load("wintiqLastFeed",null);if(f?.events?.length){state.feed={...state.feed,...f,source:"ESPN (cached)"}}}

function openModal(id){$(id).classList.remove("hidden")}function closeModal(id){$(id).classList.add("hidden")}
function login(){
  $("#loginForm").addEventListener("submit",e=>{e.preventDefault();const u=$("#loginUser").value.trim(),p=$("#loginPass").value,[key,acc]=findUser(u);if(acc&&String(acc.password)===String(p)){state.user={username:key,role:acc.role};sessionStorage.setItem("wintiqUser",JSON.stringify(state.user));$("#loginGate").classList.add("hidden");$("#app").classList.remove("hidden");if(acc.role==="admin")$("#adminOpen").classList.remove("hidden");render();refreshFeed().catch(()=>{});toast("Willkommen bei WINTIQ")}else $("#loginError").textContent="Benutzername oder Passwort ist falsch."})
}
function restoreSession(){const s=load("wintiqSession",null);const raw=sessionStorage.getItem("wintiqUser");try{state.user=raw?JSON.parse(raw):null}catch{state.user=null}if(state.user){$("#loginGate").classList.add("hidden");$("#app").classList.remove("hidden");if(state.user.role==="admin")$("#adminOpen").classList.remove("hidden")}}
function saveSession(){if(state.user)sessionStorage.setItem("wintiqUser",JSON.stringify(state.user))}
function bindForgot(){$("#forgotPasswordBtn").onclick=()=>openModal("#forgotModal");$("#resetRequest").onclick=()=>{const u=$("#resetUser").value.trim(),[key]=findUser(u);if(!key){$("#resetMsg").textContent="Benutzername nicht gefunden.";return}const req=load("wintiqPasswordRequests",[]);req.unshift({id:Date.now(),username:key,createdAt:new Date().toISOString(),status:"pending"});save("wintiqPasswordRequests",req);$("#resetMsg").textContent="Anfrage gespeichert. Bitte Admin kontaktieren.";}}
function renderAdmin(){
  if(!state.user||state.user.role!=="admin")return;
  $("#adminPicks").innerHTML=state.picks.map((p,i)=>`<div class="admin-item"><div class="admin-grid"><label>Tag<input data-p="${i}" data-f="tag" value="${esc(p.tag||"")}" /></label><label>Sport<input data-p="${i}" data-f="sport" value="${esc(p.sport||"")}" /></label><label>Match<input data-p="${i}" data-f="match" value="${esc(p.match||"")}" /></label><label>Tipp<input data-p="${i}" data-f="tip" value="${esc(p.tip||"")}" /></label><label>Einschätzung<textarea data-p="${i}" data-f="reason">${esc(p.reason||"")}</textarea></label><label>ID<input data-p="${i}" data-f="id" value="${esc(p.id||"")}" /></label></div><div class="admin-actions"><button class="btn ghost danger" data-remove="${i}">Pick löschen</button></div></div>`).join("");
  $$("#adminPicks [data-p]").forEach(e=>e.oninput=()=>{state.picks[+e.dataset.p][e.dataset.f]=e.value;save("wintiqPicks",state.picks);render()});
  $("#adminUsers").innerHTML=Object.entries(state.users).map(([u,a])=>`<div class="admin-item"><b>${esc(u)}</b><div class="admin-grid"><label>Rolle<select data-user-role="${esc(u)}"><option value="user" ${a.role==="user"?"selected":""}>User</option><option value="admin" ${a.role==="admin"?"selected":""}>Admin</option></select></label><label>Neues Passwort<input type="password" data-user-pass="${esc(u)}" placeholder="nur ändern, wenn nötig"></label><label>Aktion<button class="btn ghost" data-save-user="${esc(u)}">Passwort setzen</button></label></div></div>`).join("");
  const req=load("wintiqPasswordRequests",[]);
  $("#adminUsers").insertAdjacentHTML("beforeend",`<div class="admin-item"><b>Passwort-Anfragen</b>${req.length?req.map(r=>`<p>${esc(r.username)} · ${esc(r.status)} · ${esc(fmtDate(r.createdAt))}</p>`).join(""):"<p>Keine Anfragen.</p>"}</div>`);
  $("#adminLive").innerHTML=state.picks.map(p=>{const o=state.overrides[p.id]||{};return `<div class="admin-item"><b>${esc(p.match)}</b><div class="admin-grid"><label>Override<select data-ov-enable="${p.id}"><option value="0" ${!o.enabled?"selected":""}>Aus</option><option value="1" ${o.enabled?"selected":""}>An</option></select></label><label>Status<select data-ov-status="${p.id}"><option value="upcoming" ${o.status==="upcoming"?"selected":""}>Upcoming</option><option value="live" ${o.status==="live"?"selected":""}>Live</option><option value="finished" ${o.status==="finished"?"selected":""}>Beendet</option><option value="unavailable" ${o.status==="unavailable"?"selected":""}>Keine Daten</option></select></label><label>Startzeit<input type="datetime-local" data-ov-start="${p.id}" value="${o.startAt?new Date(o.startAt).toISOString().slice(0,16):""}"></label><label>Heim<input type="number" data-ov-h="${p.id}" value="${o.score?.home??0}"></label><label>Auswärts<input type="number" data-ov-a="${p.id}" value="${o.score?.away??0}"></label><label>Minute<input data-ov-min="${p.id}" value="${esc(o.minute||"")}"></label><label>Event<input data-ov-event="${p.id}" value="${esc(o.eventText||"")}"></label></div></div>`}).join("");
  $("#adminIntro").value=state.settings.intro;$("#adminRefresh").value=state.settings.refresh;
}
function bindAdmin(){
  $("#adminOpen").onclick=()=>{openModal("#adminModal");renderAdmin()};
  $("#addPick").onclick=()=>{state.picks.push({id:"pick-"+Date.now(),sport:"FUSSBALL",tag:"NEW PICK",match:"Heimteam — Auswärtsteam",tip:"Unser Tipp",reason:"Unsere Einschätzung."});save("wintiqPicks",state.picks);renderAdmin();render()};
  $("#adminPicks").onclick=e=>{const b=e.target.closest("[data-remove]");if(b){state.picks.splice(+b.dataset.remove,1);save("wintiqPicks",state.picks);renderAdmin();render()}};
  $("#adminUsers").onclick=e=>{const b=e.target.closest("[data-save-user]");if(!b)return;const u=b.dataset.saveUser,inp=document.querySelector(`[data-user-pass="${CSS.escape(u)}"]`),role=document.querySelector(`[data-user-role="${CSS.escape(u)}"]`);if(inp.value){state.users[u].password=inp.value;save("wintiqAccounts",state.users);inp.value="";toast("Passwort gespeichert ✓")}if(role){state.users[u].role=role.value;save("wintiqAccounts",state.users)}};
  $("#adminLive").addEventListener("input",e=>{const id=e.target.closest(".admin-item")?.querySelector("[data-ov-enable]")?.dataset.ovEnable;if(!id)return;const o=state.overrides[id]||{};const val=s=>{const x=document.querySelector(`[${s}="${CSS.escape(id)}"]`);return x?.value??""};state.overrides[id]={...o,enabled:val("data-ov-enable")==="1",status:val("data-ov-status"),startAt:val("data-ov-start")?new Date(val("data-ov-start")).toISOString():null,score:{home:Number(val("data-ov-h")||0),away:Number(val("data-ov-a")||0)},minute:val("data-ov-min"),eventText:val("data-ov-event"),events:val("data-ov-event")?[{clock:val("data-ov-min"),type:"EVENT",text:val("data-ov-event")}]:[]};save("wintiqOverrides",state.overrides);render()});
  $("#saveSite").onclick=()=>{state.settings.intro=$("#adminIntro").value;state.settings.refresh=Math.max(5,Math.min(120,Number($("#adminRefresh").value)||15));save("wintiqSettings",state.settings);render();toast("Website gespeichert ✓")};
  $("#exportData").onclick=()=>{const blob=new Blob([JSON.stringify({picks:state.picks,settings:state.settings,overrides:state.overrides},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="wintiq-admin-export.json";a.click();URL.revokeObjectURL(a.href)};
  $("#clearOverrides").onclick=()=>{state.overrides={};save("wintiqOverrides",{});renderAdmin();render();toast("Live Overrides gelöscht")};
  $$(".admin-tabs button").forEach(b=>b.onclick=()=>{$$(".admin-tabs button").forEach(x=>x.classList.remove("active"));$$(".admin-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.tab).classList.add("active")});
}
function bindCommon(){
  $$(".close").forEach(b=>b.onclick=()=>closeModal("#"+b.dataset.close));
  $("#logout").onclick=()=>{sessionStorage.removeItem("wintiqUser");location.reload()};
  $("#adminOpen").onclick=()=>{openModal("#adminModal");renderAdmin()};
  $("#adminIntro").value=state.settings.intro;
}
async function boot(){
  loadLastFeed();restoreSession();login();bindForgot();bindAdmin();bindCommon();render();
  if(state.user)refreshFeed().catch(()=>{});
  setInterval(()=>{render()},1000);
  setInterval(()=>{if(state.user)refreshFeed().catch(()=>{})},Math.max(5000,Number(state.settings.refresh||15)*1000));
}
boot();
})();

/* ===== WINTIQ TRUE COLORS PLAYER ===== */
(function initWintiqMusic() {
  const audio = document.getElementById("wintiqMusic");
  const toggle = document.getElementById("musicToggle");
  const volume = document.getElementById("musicVolume");
  if (!audio || !toggle || !volume) return;

  audio.volume = Number(volume.value || 0.35);

  function syncUI() {
    const playing = !audio.paused;
    toggle.textContent = playing ? "True Colors Ⅱ" : "True Colors";
    toggle.setAttribute("aria-label", playing ? "True Colors pausieren" : "True Colors abspielen");
  }

  toggle.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (err) {
      console.warn("True Colors could not start:", err);
    }
    syncUI();
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    syncUI();
  });

  audio.addEventListener("play", syncUI);
  audio.addEventListener("pause", syncUI);
  syncUI();
})();
