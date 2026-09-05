const DEMO_USER='Valentino';
const DEMO_PASS='KOlin7127';

const DEFAULTS={
 heroTitle:'SPORT.\nDATA.\nMOMENTUM.',
 heroText:'Ein radikales Sports-Interface für schnelle Entscheidungen, klare Daten und redaktionelle Picks.',
 release:'2026-09-11',
 pulse:'Live intelligence · Demo feed',
 picks:[
  {
   sport:'FUSSBALL',
   match:'FC Bayern — Dortmund',
   tip:'Heimsieg',
   reason:'WINTIQ-Einschätzung: Heimvorteil + aktuelle Match-Dynamik.',
   tag:'TOP PICK',
   odd:'1.78'
  },
  {
   sport:'TENNIS',
   match:'Spieler A — Spieler B',
   tip:'Spieler A',
   reason:'WINTIQ-Einschätzung: stärkerer Start in die Partie.',
   tag:'EDGE',
   odd:'1.85'
  },
  {
   sport:'BASKETBALL',
   match:'Lakers — Celtics',
   tip:'Lakers',
   reason:'WINTIQ-Einschätzung: Matchup spricht leicht für das Heimteam.',
   tag:'WATCH',
   odd:'1.92'
  }
 ]
};

let state=JSON.parse(
 localStorage.getItem('wintiq_state')||'null'
)||structuredClone(DEFAULTS);

let slip=[];


/* =========================
   GITHUB PICKS LADEN
========================= */

async function loadPublishedPicks(){
 try{

  const r=await fetch(
   `picks.json?ts=${Date.now()}`,
   {
    cache:'no-store'
   }
  );

  if(!r.ok){
   throw new Error('picks.json nicht gefunden');
  }

  const data=await r.json();

  if(Array.isArray(data.picks)){

   state.picks=data.picks;

   saveState();
   renderPicks();

  }

 }catch(e){

  console.warn(
   'Konnte veröffentlichte Picks nicht laden:',
   e
  );

 }
}


/* =========================
   BASE64
========================= */

function bytesToBase64(bytes){

 let binary='';

 const chunk=0x8000;

 for(
  let i=0;
  i<bytes.length;
  i+=chunk
 ){

  binary+=String.fromCharCode(
   ...bytes.subarray(
    i,
    i+chunk
   )
  );

 }

 return btoa(binary);
}


function utf8ToBase64(text){

 return bytesToBase64(
  new TextEncoder().encode(text)
 );

}


/* =========================
   GITHUB PUBLISH
========================= */

async function publishPicksToGitHub(){

 const token=$('#ghToken').value.trim();

 const repo=$('#ghRepo').value.trim();

 const branch=
  $('#ghBranch').value.trim()||'main';


 /* Eingaben prüfen */

 if(!token){

  showToast(
   'GitHub Token fehlt'
  );

  return;

 }


 if(!repo||!repo.includes('/')){

  showToast(
   'Repository muss z.B. bodycam1212-lab/axenvo-bet sein'
  );

  return;

 }


 const btn=$('#publishGitHub');

 btn.disabled=true;

 btn.textContent=
  'Wird veröffentlicht …';


 try{

  /* GitHub API Header */

  const headers={

   'Accept':
    'application/vnd.github+json',

   'Authorization':
    `Bearer ${token}`,

   'X-GitHub-Api-Version':
    '2022-11-28',

   'Content-Type':
    'application/json'

  };


  /* Datei */

  const api=
   `https://api.github.com/repos/${repo}/contents/picks.json`;


  /* =========================
     AKTUELLE DATEI HOLEN
  ========================= */

  const current=await fetch(

   `${api}?ref=${encodeURIComponent(branch)}`,

   {
    method:'GET',
    headers:headers
   }

  );


  let sha=null;


  if(current.ok){

   const file=
    await current.json();

   sha=file.sha;

  }

  else if(current.status!==404){

   const errorData=
    await current.json().catch(
     ()=>({})
    );

   throw new Error(

    errorData.message||
    `GitHub Fehler ${current.status}`

   );

  }


  /* =========================
     PICKS VORBEREITEN
  ========================= */

  const content=
   JSON.stringify(
    {
     picks:state.picks
    },
    null,
    2
   )+'\n';


  /* UTF-8 -> Base64 */

  const encodedContent=
   utf8ToBase64(content);


  /* =========================
     GITHUB COMMIT
  ========================= */

  const body={

   message:
    'Update WINTIQ picks',

   content:
    encodedContent,

   branch:
    branch

  };


  /*
   Wenn picks.json bereits existiert,
   muss SHA mitgeschickt werden.
  */

  if(sha){

   body.sha=sha;

  }


  const response=
   await fetch(

    api,

    {
     method:'PUT',

     headers:headers,

     body:
      JSON.stringify(body)
    }

   );


  const result=
   await response
    .json()
    .catch(
     ()=>({})
    );


  /* Fehler anzeigen */

  if(!response.ok){

   console.error(
    'GitHub API Fehler:',
    result
   );

   throw new Error(

    result.message||
    `GitHub Fehler ${response.status}`

   );

  }


  /* =========================
     ERFOLG
  ========================= */

  $('#ghToken').value='';

  showToast(
   'Picks erfolgreich zu GitHub gesendet ✓'
  );


 }catch(error){

  console.error(
   'GitHub Veröffentlichung fehlgeschlagen:',
   error
  );


  showToast(
   `Fehler: ${error.message}`
  );


 }finally{

  btn.disabled=false;

  btn.textContent=
   'Picks zu GitHub senden';

 }

}


/* =========================
   SELECTOR
========================= */

const $=
 s=>document.querySelector(s);


/* =========================
   LOCAL STORAGE
========================= */

function saveState(){

 localStorage.setItem(
  'wintiq_state',
  JSON.stringify(state)
 );

}


/* =========================
   TOAST
========================= */

function showToast(msg){

 const t=$('#toast');

 t.textContent=msg;

 t.classList.add('show');

 setTimeout(
  ()=>t.classList.remove('show'),
  1800
 );

}


/* =========================
   LOGIN
========================= */

function login(){

 if(
  $('#loginUser').value===DEMO_USER&&
  $('#loginPass').value===DEMO_PASS
 ){

  sessionStorage.setItem(
   'wintiq_auth',
   '1'
  );

  $('#loginGate')
   .classList
   .add('hidden');

  $('#app')
   .classList
   .remove('app-hidden');

  document.body
   .classList
   .remove('locked');

  applyState();

 }

 else{

  $('#loginError')
   .textContent=
   'Zugangsdaten nicht korrekt.';

 }

}


function lock(){

 sessionStorage.removeItem(
  'wintiq_auth'
 );

 location.reload();

}


$('#loginForm')
 .addEventListener(
  'submit',
  e=>{
   e.preventDefault();
   login();
  }
 );


if(
 sessionStorage.getItem(
  'wintiq_auth'
 )==='1'
){

 $('#loginGate')
  .classList
  .add('hidden');

 $('#app')
  .classList
  .remove('app-hidden');

 document.body
  .classList
  .remove('locked');

}


$('#logout').onclick=lock;


/* =========================
   COUNTDOWN
========================= */

function pad(n){

 return String(n).padStart(
  2,
  '0'
 );

}


function updateCountdown(){

 const release=
  new Date(
   state.release+
   'T00:00:00'
  );

 const d=Math.max(
  0,
  release-new Date()
 );

 const da=Math.floor(
  d/864e5
 );

 const h=Math.floor(
  d%864e5/36e5
 );

 const m=Math.floor(
  d%36e5/6e4
 );

 const s=Math.floor(
  d%6e4/1e3
 );

 $('#timer').textContent=
  `${pad(da)} : ${pad(h)} : ${pad(m)} : ${pad(s)}`;

 $('#days').textContent=
  `${pad(da)} DAYS`;

}


setInterval(
 updateCountdown,
 1000
);


/* =========================
   MATCHES
========================= */

function renderMatches(){

 const data=[

  {
   sport:'football',
   league:'UEFA · DEMO',
   time:"● LIVE 68'",
   a:'FC Bayern',
   b:'Dortmund',
   score:'2 : 1',
   odds:[
    ['1','1.78','FC Bayern — Sieg'],
    ['X','3.90','Remis'],
    ['2','4.40','Dortmund — Sieg']
   ]
  },

  {
   sport:'football',
   league:'LA LIGA · DEMO',
   time:"● LIVE 31'",
   a:'Real Madrid',
   b:'Barcelona',
   score:'0 : 0',
   odds:[
    ['1','2.10','Real Madrid — Sieg'],
    ['X','3.70','Real Madrid — Remis'],
    ['2','3.05','Barcelona — Sieg']
   ]
  },

  {
   sport:'tennis',
   league:'ATP · DEMO',
   time:'START 19:30',
   a:'Spieler A',
   b:'Spieler B',
   score:'VS',
   odds:[
    ['A','1.85','Spieler A — Sieg'],
    ['B','1.95','Spieler B — Sieg']
   ]
  },

  {
   sport:'basketball',
   league:'NBA · DEMO',
   time:'START 21:00',
   a:'Lakers',
   b:'Celtics',
   score:'VS',
   odds:[
    ['1','1.92','Lakers — Sieg'],
    ['2','1.88','Celtics — Sieg']
   ]
  }

 ];


 $('#matches').innerHTML=
  data.map(
   m=>`

   <article
    class="match"
    data-sport="${m.sport}"
   >

    <div class="match-top">

     <span>
      ${m.league}
     </span>

     <b>
      ${m.time}
     </b>

    </div>


    <div class="teams">

     <strong>

      <i>
       ${m.a.slice(0,3).toUpperCase()}
      </i>

      ${m.a}

     </strong>


     <div>

      ${m.score.replace(
       ':',
       '<span>:</span>'
      )}

     </div>


     <strong>

      ${m.b}

      <i class="lime">

       ${m.b.slice(
        0,
        3
       ).toUpperCase()}

      </i>

     </strong>

    </div>


    <div
     class="odds ${
      m.odds.length===2
       ? 'two'
       : ''
     }"
    >

     ${m.odds.map(
      o=>`

       <button
        data-bet="${o[2]}"
        data-odd="${o[1]}"
       >

        <span>
         ${o[0]}
        </span>

        <b>
         ${o[1]}
        </b>

       </button>

      `
     ).join('')}

    </div>

   </article>

   `
  ).join('');


 document
  .querySelectorAll(
   '.odds button'
  )
  .forEach(

   b=>b.onclick=()=>{

    const i=
     slip.findIndex(
      x=>x.bet===
       b.dataset.bet
     );


    if(i>=0){

     slip.splice(
      i,
      1
     );

    }

    else{

     slip.push({

      bet:
       b.dataset.bet,

      odd:
       b.dataset.odd

     });

    }


    renderSlip();


    showToast(

     i>=0
      ? 'Demo-Tipp entfernt'
      : 'Demo-Quote hinzugefügt ✓'

    );

   }

  );

}


/* =========================
   SLIP
========================= */

function renderSlip(){

 const box=$('#items');


 if(!slip.length){

  box.innerHTML=`

   <div class="empty">

    <b>＋</b>

    <strong>
     Dein Slip ist leer
    </strong>

    <span>
     Klicke auf eine Demo-Quote,
     um sie hier zu sehen.
    </span>

   </div>

  `;

  $('#total')
   .textContent='—';

  return;

 }


 box.innerHTML=

  slip.map(
   (x,i)=>`

    <div class="slip-item">

     <div>

      <strong>
       ${x.bet}
      </strong>

      <span>
       Demo-Markt · Quote ${x.odd}
      </span>

     </div>

     <button
      data-i="${i}"
     >
      ×
     </button>

    </div>

   `
  ).join('');


 $('#total').textContent=
  slip
   .reduce(
    (a,x)=>
     a*Number(x.odd),
    1
   )
   .toFixed(2);


 document
  .querySelectorAll(
   '.slip-item button'
  )
  .forEach(

   b=>b.onclick=()=>{

    slip.splice(
     Number(b.dataset.i),
     1
    );

    renderSlip();

   }

  );

}


$('#clear').onclick=()=>{

 slip=[];

 renderSlip();

};


$('#place').onclick=()=>{

 showToast(
  'Nur Demo: kein Echtgeld und keine echte Wette.'
 );

};


/* =========================
   PICKS
========================= */

function renderPicks(){

 $('#pickGrid').innerHTML=

  state.picks.map(
   (p,i)=>`

    <article class="pick">

     <div class="pick-top">

      <span>
       ${p.tag}
      </span>

      <small>
       ${p.sport}
      </small>

     </div>


     <h3>
      ${p.match}
     </h3>


     <div class="pick-tip">

      <small>
       WINTIQ PICK
      </small>

      <strong>
       ${p.tip}
      </strong>

      <b>
       ${p.odd}
      </b>

     </div>


     <p>
      ${p.reason}
     </p>


     <footer>

      <span>
       Redaktionell
      </span>

      <button
       onclick="addPickToSlip(${i})"
      >
       Demo-Tipp +
      </button>

     </footer>

    </article>

   `
  ).join('');

}


window.addPickToSlip=i=>{

 const p=
  state.picks[i];

 slip.push({

  bet:
   `${p.match} — ${p.tip}`,

  odd:
   p.odd

 });

 renderSlip();

 showToast(
  'WINTIQ Pick im Demo-Slip ✓'
 );

};


/* =========================
   STATE ANWENDEN
========================= */

function applyState(){

 const title=
  state.heroTitle.split('\n');


 $('#heroTitle').innerHTML=

  title.map(
   (x,i)=>
    i===1
     ? `<span>${x}</span>`
     : x
  ).join('<br>');


 $('#heroText').textContent=
  state.heroText;


 $('#pulseText').textContent=
  state.pulse;


 const date=
  new Date(
   state.release+
   'T00:00:00'
  );


 const fmt=
  new Intl.DateTimeFormat(
   'de-DE'
  );


 const nice=
  fmt.format(date);


 $('#releaseDateBig')
  .textContent=nice;


 $('#releaseMeta')
  .textContent=nice;


 updateCountdown();

 renderMatches();

 renderPicks();

}


/* =========================
   ADMIN
========================= */

function openAdmin(){

 const a=
  $('#adminPanel');

 a.classList.remove(
  'hidden'
 );


 $('#aHeroTitle').value=
  state.heroTitle;


 $('#aHeroText').value=
  state.heroText;


 $('#aRelease').value=
  state.release;


 $('#aPulse').value=
  state.pulse;


 renderAdminPicks();

}


function renderAdminPicks(){

 $('#adminPicks').innerHTML=

  state.picks.map(
   (p,i)=>`

    <div class="admin-pick">

     <input
      data-k="sport"
      data-i="${i}"
      value="${p.sport}"
     >

     <input
      data-k="match"
      data-i="${i}"
      value="${p.match}"
     >

     <input
      data-k="tip"
      data-i="${i}"
      value="${p.tip}"
     >

     <input
      data-k="odd"
      data-i="${i}"
      value="${p.odd}"
     >

     <button
      data-remove="${i}"
     >
      ×
     </button>

    </div>

   `
  ).join('');


 document
  .querySelectorAll(
   '[data-remove]'
  )
  .forEach(

   b=>b.onclick=()=>{

    state.picks.splice(
     Number(
      b.dataset.remove
     ),
     1
    );

    renderAdminPicks();

   }

  );

}


$('#adminOpen')
 .onclick=openAdmin;


$('#adminClose')
 .onclick=()=>
  $('#adminPanel')
   .classList
   .add('hidden');


$('#addPick').onclick=()=>{

 state.picks.push({

  sport:'FUSSBALL',

  match:'Neues Match',

  tip:'Dein Tipp',

  reason:
   'Eigene redaktionelle Einschätzung.',

  tag:'NEW',

  odd:'2.00'

 });

 renderAdminPicks();

};


$('#saveAdmin').onclick=()=>{

 state.heroTitle=
  $('#aHeroTitle').value||
  DEFAULTS.heroTitle;


 state.heroText=
  $('#aHeroText').value||
  DEFAULTS.heroText;


 state.release=
  $('#aRelease').value||
  DEFAULTS.release;


 state.pulse=
  $('#aPulse').value||
  DEFAULTS.pulse;


 document
  .querySelectorAll(
   '#adminPicks [data-k]'
  )
  .forEach(

   i=>{

    state.picks[
     Number(i.dataset.i)
    ][i.dataset.k]=
     i.value;

   }

  );


 saveState();

 applyState();

 $('#adminPanel')
  .classList
  .add('hidden');


 showToast(
  'Admin-Änderungen gespeichert ✓'
 );

};


/* =========================
   GITHUB BUTTON
========================= */

$('#publishGitHub')
 .onclick=
 publishPicksToGitHub;


$('#resetAdmin').onclick=()=>{

 state=
  structuredClone(
   DEFAULTS
  );

 saveState();

 applyState();

 openAdmin();

 showToast(
  'Demo zurückgesetzt'
 );

};


/* =========================
   MOBILE
========================= */

const mobile=
 $('#mobile');


$('#hamb').onclick=()=>
 mobile.classList.toggle(
  'open'
 );


document
 .querySelectorAll(
  '.mobile a'
 )
 .forEach(

  a=>a.onclick=()=>
   mobile.classList.remove(
    'open'
   )

 );


$('#search').onclick=()=>
 showToast(
  'Demo-Suche — Event- und Sportfilter'
 );


/* =========================
   SPORT FILTER
========================= */

const chips=[
 ...document.querySelectorAll(
  '.chip'
 )
];


chips.forEach(

 c=>c.onclick=()=>{

  chips.forEach(
   x=>x.classList.remove(
    'active'
   )
  );

  c.classList.add(
   'active'
  );


  const s=
   c.dataset.sport;


  document
   .querySelectorAll(
    '.match'
   )
   .forEach(

    x=>
     x.classList.toggle(
      'hidden',
      s!=='all'&&
      x.dataset.sport!==s
     )

   );

 }

);


/* =========================
   START
========================= */

applyState();

renderSlip();

loadPublishedPicks();
