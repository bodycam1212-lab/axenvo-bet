const fs=require("fs");
const leagues=["ger.1","ger.2","esp.1","esp.2","eng.1","ita.1","fra.1"];
const out="live-data.json";
const ymd=d=>`${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,"0")}${String(d.getUTCDate()).padStart(2,"0")}`;
async function get(url){const r=await fetch(url,{headers:{"User-Agent":"WINTIQ-Live-Sync/1.0"}});if(!r.ok)throw new Error(String(r.status));return r.json()}
function teams(e){const c=e?.competitions?.[0]?.competitors||[];return{home:c.find(x=>x.homeAway==="home")?.team?.displayName||"",away:c.find(x=>x.homeAway==="away")?.team?.displayName||""}}
function score(e){const c=e?.competitions?.[0]?.competitors||[];return{home:Number(c.find(x=>x.homeAway==="home")?.score||0),away:Number(c.find(x=>x.homeAway==="away")?.score||0)}}
function status(e){const t=e?.status?.type||{};if(t.completed||t.state==="post")return"finished";if(t.state==="in")return"live";return"upcoming"}
function minute(e){const m=String(e?.status?.displayClock||"").match(/\d+/);return m?m[0]:""}
async function main(){const now=new Date(),events=[];for(const off of [-1,0,1]){const d=new Date(now);d.setUTCDate(d.getUTCDate()+off);const date=ymd(d);await Promise.allSettled(leagues.map(async league=>{try{const data=await get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${date}`);for(const e of(data.events||[]))events.push({id:String(e.id),league,teams:teams(e),status:status(e),score:score(e),startAt:e.date||null,minute:minute(e)})}catch{}}))}const payload={updatedAt:new Date().toISOString(),source:"ESPN via GitHub Actions",matches:{},events};for(const e of events)payload.matches[e.id]=e;fs.writeFileSync(out,JSON.stringify(payload,null,2)+"\n")}
main().catch(e=>{console.error(e);process.exit(1)});