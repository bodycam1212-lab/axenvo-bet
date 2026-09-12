import fs from 'node:fs/promises';

const picks = JSON.parse(await fs.readFile(new URL('../picks.json', import.meta.url), 'utf8')).picks || [];
const leaguesBySport = {
  FUSSBALL: ['ger.1','ger.2','esp.1','eng.1','ita.1','fra.1'],
  BASKETBALL: ['nba']
};
const sportPath = sport => sport === 'BASKETBALL' ? 'basketball' : 'soccer';
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const aliases = {
  scfreiburg:['freiburg','scfreiburg'],
  borussiamonchengladbach:['borussiamonchengladbach','monchengladbach','gladbach'],
  fcstpauli:['stpauli','fcstpauli','pauli'], stpauli:['stpauli','fcstpauli','pauli'],
  vflwolfsburg:['wolfsburg','vflwolfsburg'],
  racingsantander:['racingsantander','realracingclub','racing','santander'],
  deportivoalaves:['deportivoalaves','alaves']
};
function matchName(a,b){const na=norm(a),nb=norm(b);const aa=[na,...(aliases[na]||[])];const bb=[nb,...(aliases[nb]||[])];return aa.some(x=>bb.some(y=>x===y||x.includes(y)||y.includes(x)));}
function split(match){const [home='',away='']=String(match||'').split(/\s+[—–-]\s+/);return {home:home.trim(),away:away.trim()};}
function eventTeams(e){const c=e?.competitions?.[0]?.competitors||[];return {home:c.find(x=>x.homeAway==='home')?.team?.displayName||'',away:c.find(x=>x.homeAway==='away')?.team?.displayName||''};}
function score(e){const c=e?.competitions?.[0]?.competitors||[];return {home:Number(c.find(x=>x.homeAway==='home')?.score??0),away:Number(c.find(x=>x.homeAway==='away')?.score??0)};}
function status(e){const t=e?.status?.type||{};if(t.completed||t.state==='post'||t.name==='STATUS_FINAL')return 'finished';if(t.state==='in'||t.name==='STATUS_IN_PROGRESS')return 'live';return 'upcoming';}
function clock(e){return e?.status?.displayClock||e?.status?.type?.shortDetail||'';}
function minute(e){const m=String(clock(e)).match(/(\d+)/);return m?Number(m[1]):'';}

const now=new Date();
const dates=[];
for(let offset=-2;offset<=2;offset++){
  const d=new Date(now); d.setUTCDate(d.getUTCDate()+offset);
  dates.push(`${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`);
}
const jobs=[];
for(const p of picks){for(const league of (leaguesBySport[p.sport]||[])) jobs.push({p,league,sportPath:sportPath(p.sport)});}
const unique=jobs.filter((x,i,a)=>a.findIndex(y=>y.sportPath===x.sportPath&&y.league===x.league)===i);
const events=[];
for(const job of unique){
  for(const date of dates){
    try{
      const url=`https://site.api.espn.com/apis/site/v2/sports/${job.sportPath}/${job.league}/scoreboard?dates=${date}`;
      const r=await fetch(url); if(!r.ok) continue;
      const data=await r.json();
      for(const e of data.events||[]) events.push({league:job.league,sportPath:job.sportPath,event:e,teams:eventTeams(e)});
    }catch{}
  }
}
const matches={};
for(const p of picks){
  const t=split(p.match);
  let hit=events.find(x=>matchName(t.home,x.teams.home)&&matchName(t.away,x.teams.away));
  if(!hit)hit=events.find(x=>matchName(t.home,x.teams.away)&&matchName(t.away,x.teams.home));
  if(hit){
    const e=hit.event; const st=status(e); const s=score(e);
    let plays=[];
    if(st==='live'){
      try{
        const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${hit.sportPath}/${hit.league}/summary?event=${encodeURIComponent(e.id)}`);
        if(r.ok){const d=await r.json(); plays=(d.plays||[]).filter(x=>x.text||x.type?.text).slice(-12).map(x=>({clock:x.clock?.displayValue||'',text:x.text||'',team:x.team?.displayName||'',type:x.type?.text||'EVENT'}));}
      }catch{}
    }
    matches[p.id]={status:st,source:`ESPN · ${hit.league}`,providerLeague:hit.league,eventId:e.id||null,home:t.home,away:t.away,score:s,startAt:e.date||null,displayClock:st==='live'?clock(e):st==='finished'?'FT':'',minute:st==='live'?minute(e):st==='finished'?'90+':'',lastChecked:new Date().toISOString(),stale:false,events:plays};
  }
}
const output={updatedAt:new Date().toISOString(),source:'ESPN scoreboard auto-sync',refreshSeconds:15,matches};
await fs.writeFile(new URL('../live-data.json', import.meta.url),JSON.stringify(output,null,2)+'\n');
