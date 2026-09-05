/* =========================================================
   WINTIQ BET
   SCRIPT.JS
   ========================================================= */

/* LOGIN
   DEINEN BISHERIGEN BENUTZERNAMEN UND DEIN BISHERIGES
   PASSWORT HIER EINTRAGEN.
*/
const DEMO_USER = 'Valentino';
const DEMO_PASS = 'KOlin7127';


/* =========================================================
   DEFAULTS
   ========================================================= */

const DEFAULTS = {
  heroTitle: 'SPORT.\nDATA.\nMOMENTUM.',
  heroText: 'Ein radikales Sports-Interface für schnelle Entscheidungen, klare Daten und redaktionelle Picks.',
  release: '2026-09-11',
  pulse: 'Live intelligence · Demo feed',

  picks: [
    {
      sport: 'FUSSBALL',
      match: 'FC Bayern — Dortmund',
      tip: 'Heimsieg',
      reason: 'WINTIQ-Einschätzung: Heimvorteil + aktuelle Match-Dynamik.',
      tag: 'TOP PICK',
      odd: '1.78'
    },
    {
      sport: 'TENNIS',
      match: 'Spieler A — Spieler B',
      tip: 'Spieler A',
      reason: 'WINTIQ-Einschätzung: stärkerer Start in die Partie.',
      tag: 'EDGE',
      odd: '1.85'
    },
    {
      sport: 'BASKETBALL',
      match: 'Lakers — Celtics',
      tip: 'Lakers',
      reason: 'WINTIQ-Einschätzung: Matchup spricht leicht für das Heimteam.',
      tag: 'WATCH',
      odd: '1.92'
    }
  ]
};


/* =========================================================
   STATE
   ========================================================= */

let state =
  JSON.parse(localStorage.getItem('wintiq_state') || 'null')
  || structuredClone(DEFAULTS);

let slip = [];

const $ = s => document.querySelector(s);


/* =========================================================
   STORAGE
   ========================================================= */

function saveState(){
  localStorage.setItem(
    'wintiq_state',
    JSON.stringify(state)
  );
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(msg){
  const t = $('#toast');

  if(!t) return;

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => {
    t.classList.remove('show');
  }, 2500);
}


/* =========================================================
   BASE64 / GITHUB
   ========================================================= */

function bytesToBase64(bytes){
  let binary = '';
  const chunk = 0x8000;

  for(let i = 0; i < bytes.length; i += chunk){
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunk)
    );
  }

  return btoa(binary);
}


function utf8ToBase64(text){
  return bytesToBase64(
    new TextEncoder().encode(text)
  );
}


function getGitHubHeaders(token){
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}


/* =========================================================
   GITHUB TOKEN TEST
   ========================================================= */

async function testGitHubToken(){

  const token = $('#ghToken')?.value.trim();
  const repo = $('#ghRepo')?.value.trim();
  const branch =
    $('#ghBranch')?.value.trim() || 'main';

  const status = $('#ghStatus');
  const btn = $('#testGitHub');


  if(!token){

    if(status){
      status.textContent =
        '❌ Bitte zuerst deinen neuen GitHub-Token eintragen.';

      status.className =
        'github-status error';
    }

    return;
  }


  if(!repo || !repo.includes('/')){

    if(status){
      status.textContent =
        '❌ Repository muss z.B. bodycam1212-lab/axenvo-bet sein.';

      status.className =
        'github-status error';
    }

    return;
  }


  if(btn){
    btn.disabled = true;
    btn.textContent = 'Prüfe …';
  }


  if(status){
    status.textContent =
      'GitHub-Zugriff wird geprüft …';

    status.className =
      'github-status loading';
  }


  try{

    const headers =
      getGitHubHeaders(token);


    /* Repository prüfen */

    const repoResponse = await fetch(
      `https://api.github.com/repos/${repo}`,
      {
        method: 'GET',
        headers
      }
    );


    const repoData =
      await repoResponse.json().catch(() => ({}));


    if(!repoResponse.ok){

      if(repoResponse.status === 401){
        throw new Error(
          'Token ungültig oder abgelaufen.'
        );
      }


      if(repoResponse.status === 403){
        throw new Error(
          'GitHub verweigert diesem Token den Zugriff auf das Repository.'
        );
      }


      if(repoResponse.status === 404){
        throw new Error(
          `Repository "${repo}" wurde nicht gefunden oder der Token hat keinen Zugriff darauf.`
        );
      }


      throw new Error(
        repoData.message ||
        `GitHub Fehler ${repoResponse.status}`
      );
    }


    /* Schreibrecht prüfen */

    if(
      repoData.permissions &&
      repoData.permissions.push === false
    ){
      throw new Error(
        'Der Token kann das Repository lesen, besitzt aber kein Schreibrecht. Bei GitHub muss Contents auf "Read and write" stehen.'
      );
    }


    /* picks.json prüfen */

    const fileResponse = await fetch(
      `https://api.github.com/repos/${repo}/contents/picks.json?ref=${encodeURIComponent(branch)}`,
      {
        method: 'GET',
        headers
      }
    );


    const fileData =
      await fileResponse.json().catch(() => ({}));


    if(fileResponse.ok){

      if(status){
        status.textContent =
          `✓ Alles okay. Repository, Branch "${branch}" und picks.json sind erreichbar.`;

        status.className =
          'github-status ok';
      }

    }else if(fileResponse.status === 404){

      if(status){
        status.textContent =
          `✓ Token funktioniert. Repository "${repo}" ist erreichbar. picks.json wird beim ersten Upload erstellt.`;

        status.className =
          'github-status ok';
      }

    }else if(fileResponse.status === 403){

      throw new Error(
        'GitHub verweigert den Zugriff auf picks.json. Prüfe beim Fine-grained Token den Repository-Zugriff und Contents → Read and write.'
      );

    }else{

      throw new Error(
        fileData.message ||
        `GitHub Fehler ${fileResponse.status}`
      );
    }


  }catch(error){

    console.error(
      'GitHub Token Test:',
      error
    );


    if(status){
      status.textContent =
        `❌ ${error.message}`;

      status.className =
        'github-status error';
    }


  }finally{

    if(btn){
      btn.disabled = false;
      btn.textContent = '🧪 Token prüfen';
    }
  }
}


/* =========================================================
   GITHUB PUBLISH
   ========================================================= */

async function publishPicksToGitHub(){

  const token =
    $('#ghToken')?.value.trim();

  const repo =
    $('#ghRepo')?.value.trim();

  const branch =
    $('#ghBranch')?.value.trim() || 'main';

  const btn =
    $('#publishGitHub');

  const status =
    $('#ghStatus');


  if(!token){

    showToast(
      'GitHub Token fehlt'
    );

    if(status){
      status.textContent =
        '❌ Bitte zuerst den GitHub-Token eintragen.';

      status.className =
        'github-status error';
    }

    return;
  }


  if(!repo || !repo.includes('/')){

    showToast(
      'Repository fehlt'
    );

    if(status){
      status.textContent =
        '❌ Repository muss z.B. bodycam1212-lab/axenvo-bet sein.';

      status.className =
        'github-status error';
    }

    return;
  }


  if(btn){
    btn.disabled = true;
    btn.textContent = 'Wird veröffentlicht …';
  }


  if(status){
    status.textContent =
      'Picks werden zu GitHub gesendet …';

    status.className =
      'github-status loading';
  }


  try{

    const headers =
      getGitHubHeaders(token);

    const api =
      `https://api.github.com/repos/${repo}/contents/picks.json`;


    /* Aktuelle Datei holen */

    const currentResponse = await fetch(
      `${api}?ref=${encodeURIComponent(branch)}`,
      {
        method: 'GET',
        headers
      }
    );


    const currentData =
      await currentResponse.json().catch(() => ({}));

    let sha = null;


    if(currentResponse.ok){

      sha = currentData.sha;

    }else if(currentResponse.status === 404){

      sha = null;

    }else if(currentResponse.status === 401){

      throw new Error(
        'Token ungültig oder abgelaufen.'
      );

    }else if(currentResponse.status === 403){

      throw new Error(
        currentData.message ||
        'GitHub verweigert den Zugriff. Prüfe Repository Access und Contents → Read and write.'
      );

    }else{

      throw new Error(
        currentData.message ||
        `GitHub Fehler ${currentResponse.status}`
      );
    }


    /* Picks vorbereiten */

    const content =
      JSON.stringify(
        {
          picks: state.picks
        },
        null,
        2
      ) + '\n';


    const encodedContent =
      utf8ToBase64(content);


    const body = {
      message: 'Update WINTIQ picks',
      content: encodedContent,
      branch: branch
    };


    if(sha){
      body.sha = sha;
    }


    /* Datei zu GitHub senden */

    const response = await fetch(
      api,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      }
    );


    const result =
      await response.json().catch(() => ({}));


    if(!response.ok){

      console.error(
        'GitHub API Fehler:',
        result
      );


      if(response.status === 401){

        throw new Error(
          'GitHub akzeptiert den Token nicht. Bitte einen neuen Token verwenden.'
        );
      }


      if(response.status === 403){

        throw new Error(
          result.message ||
          'GitHub verweigert das Schreiben. Prüfe beim Fine-grained Token: Repository access = axenvo-bet und Contents = Read and write.'
        );
      }


      if(response.status === 409){

        throw new Error(
          'GitHub meldet einen Versionskonflikt. Seite neu laden und erneut versuchen.'
        );
      }


      if(response.status === 422){

        throw new Error(
          result.message ||
          'GitHub konnte die Datei nicht speichern. Prüfe Repository und Branch.'
        );
      }


      throw new Error(
        result.message ||
        `GitHub Fehler ${response.status}`
      );
    }


    /* Token nach erfolgreichem Upload löschen */

    $('#ghToken').value = '';


    if(status){

      status.textContent =
        `✓ Erfolgreich veröffentlicht: picks.json → ${repo} → ${branch}`;

      status.className =
        'github-status ok';
    }


    showToast(
      'Picks erfolgreich zu GitHub gesendet ✓'
    );


    /* Seite kurz später aktualisieren */

    setTimeout(
      loadPublishedPicks,
      1200
    );


  }catch(error){

    console.error(
      'GitHub Veröffentlichung fehlgeschlagen:',
      error
    );


    if(status){

      status.textContent =
        `❌ ${error.message}`;

      status.className =
        'github-status error';
    }


    showToast(
      `Fehler: ${error.message}`
    );


  }finally{

    if(btn){

      btn.disabled = false;

      btn.textContent =
        'Picks zu GitHub senden';
    }
  }
}


/* =========================================================
   PUBLISHED PICKS LADEN
   ========================================================= */

async function loadPublishedPicks(){

  try{

    const r = await fetch(
      `picks.json?ts=${Date.now()}`,
      {
        cache: 'no-store'
      }
    );


    if(!r.ok){
      throw new Error(
        'picks.json nicht gefunden'
      );
    }


    const data =
      await r.json();


    if(Array.isArray(data.picks)){

      state.picks =
        data.picks;

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


/* =========================================================
   LOGIN
   ========================================================= */

function login(){

  const user =
    $('#loginUser')?.value || '';

  const pass =
    $('#loginPass')?.value || '';


  if(
    user === DEMO_USER &&
    pass === DEMO_PASS
  ){

    sessionStorage.setItem(
      'wintiq_auth',
      '1'
    );


    $('#loginGate')?.classList.add(
      'hidden'
    );

    $('#app')?.classList.remove(
      'app-hidden'
    );

    document.body.classList.remove(
      'locked'
    );


    applyState();


  }else{

    if($('#loginError')){

      $('#loginError').textContent =
        'Zugangsdaten nicht korrekt.';
    }
  }
}


/* Login-Formular */

if($('#loginForm')){

  $('#loginForm').addEventListener(
    'submit',
    e => {

      e.preventDefault();

      login();
    }
  );
}


/* Bereits eingeloggt? */

if(
  sessionStorage.getItem(
    'wintiq_auth'
  ) === '1'
){

  $('#loginGate')?.classList.add(
    'hidden'
  );

  $('#app')?.classList.remove(
    'app-hidden'
  );

  document.body.classList.remove(
    'locked'
  );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function lock(){

  sessionStorage.removeItem(
    'wintiq_auth'
  );

  location.reload();
}


if($('#logout')){

  $('#logout').onclick = lock;
}


/* =========================================================
   COUNTDOWN
   ========================================================= */

function pad(n){

  return String(n).padStart(
    2,
    '0'
  );
}


function updateCountdown(){

  const release =
    new Date(
      state.release + 'T00:00:00'
    );


  const d =
    Math.max(
      0,
      release - new Date()
    );


  const da =
    Math.floor(
      d / 864e5
    );


  const h =
    Math.floor(
      d % 864e5 / 36e5
    );


  const m =
    Math.floor(
      d % 36e5 / 6e4
    );


  const s =
    Math.floor(
      d % 6e4 / 1e3
    );


  if($('#timer')){

    $('#timer').textContent =
      `${pad(da)} : ${pad(h)} : ${pad(m)} : ${pad(s)}`;
  }


  if($('#days')){

    $('#days').textContent =
      `${pad(da)} DAYS`;
  }
}


setInterval(
  updateCountdown,
  1000
);


/* =========================================================
   MATCHES
   ========================================================= */

function renderMatches(){

  const data = [

    {
      sport: 'football',
      league: 'UEFA · DEMO',
      time: '● LIVE 68\'',
      a: 'FC Bayern',
      b: 'Dortmund',
      score: '2 : 1',

      odds: [
        ['1','1.78','FC Bayern — Sieg'],
        ['X','3.90','Remis'],
        ['2','4.40','Dortmund — Sieg']
      ]
    },


    {
      sport: 'football',
      league: 'LA LIGA · DEMO',
      time: '● LIVE 31\'',
      a: 'Real Madrid',
      b: 'Barcelona',
      score: '0 : 0',

      odds: [
        ['1','2.10','Real Madrid — Sieg'],
        ['X','3.70','Real Madrid — Remis'],
        ['2','3.05','Barcelona — Sieg']
      ]
    },


    {
      sport: 'tennis',
      league: 'ATP · DEMO',
      time: 'START 19:30',
      a: 'Spieler A',
      b: 'Spieler B',
      score: 'VS',

      odds: [
        ['A','1.85','Spieler A — Sieg'],
        ['B','1.95','Spieler B — Sieg']
      ]
    },


    {
      sport: 'basketball',
      league: 'NBA · DEMO',
      time: 'START 21:00',
      a: 'Lakers',
      b: 'Celtics',
      score: 'VS',

      odds: [
        ['1','1.92','Lakers — Sieg'],
        ['2','1.88','Celtics — Sieg']
      ]
    }

  ];


  if(!$('#matches')) return;


  $('#matches').innerHTML =
    data.map(m => `

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
              ${m.b.slice(0,3).toUpperCase()}
            </i>

          </strong>

        </div>


        <div
          class="odds ${m.odds.length === 2 ? 'two' : ''}"
        >

          ${m.odds.map(o => `

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

          `).join('')}

        </div>

      </article>

    `).join('');


  /* Quote Buttons */

  document
    .querySelectorAll('.odds button')
    .forEach(b => {

      b.onclick = () => {

        const i =
          slip.findIndex(
            x => x.bet === b.dataset.bet
          );


        if(i >= 0){

          slip.splice(
            i,
            1
          );

        }else{

          slip.push({
            bet: b.dataset.bet,
            odd: b.dataset.odd
          });
        }


        renderSlip();


        showToast(
          i >= 0
            ? 'Demo-Tipp entfernt'
            : 'Demo-Quote hinzugefügt ✓'
        );
      };
    });
}


/* =========================================================
   BET SLIP
   ========================================================= */

function renderSlip(){

  const box =
    $('#items');


  if(!box) return;


  if(!slip.length){

    box.innerHTML = `

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


    if($('#total')){
      $('#total').textContent = '—';
    }

    return;
  }


  box.innerHTML =
    slip.map((x,i) => `

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

    `).join('');


  if($('#total')){

    $('#total').textContent =
      slip
        .reduce(
          (a,x) => a * Number(x.odd),
          1
        )
        .toFixed(2);
  }


  document
    .querySelectorAll('.slip-item button')
    .forEach(b => {

      b.onclick = () => {

        slip.splice(
          Number(b.dataset.i),
          1
        );

        renderSlip();
      };
    });
}


/* Slip leeren */

if($('#clear')){

  $('#clear').onclick = () => {

    slip = [];

    renderSlip();
  };
}


/* Demo-Wette */

if($('#place')){

  $('#place').onclick = () => {

    showToast(
      'Nur Demo: kein Echtgeld und keine echte Wette.'
    );
  };
}


/* =========================================================
   PICKS
   ========================================================= */

function renderPicks(){

  const grid =
    $('#pickGrid');


  if(!grid) return;


  grid.innerHTML =
    state.picks.map((p,i) => `

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

    `).join('');
}


/* Pick in Slip */

window.addPickToSlip = i => {

  const p =
    state.picks[i];


  if(!p) return;


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


/* =========================================================
   STATE AUF SEITE ANWENDEN
   ========================================================= */

function applyState(){

  const title =
    state.heroTitle.split('\n');


  if($('#heroTitle')){

    $('#heroTitle').innerHTML =
      title
        .map(
          (x,i) =>
            i === 1
              ? `<span>${x}</span>`
              : x
        )
        .join('<br>');
  }


  if($('#heroText')){
    $('#heroText').textContent =
      state.heroText;
  }


  if($('#pulseText')){
    $('#pulseText').textContent =
      state.pulse;
  }


  const date =
    new Date(
      state.release + 'T00:00:00'
    );


  const fmt =
    new Intl.DateTimeFormat(
      'de-DE'
    );


  const nice =
    fmt.format(date);


  if($('#releaseDateBig')){
    $('#releaseDateBig').textContent =
      nice;
  }


  if($('#releaseMeta')){
    $('#releaseMeta').textContent =
      nice;
  }


  updateCountdown();
  renderMatches();
  renderPicks();
}


/* =========================================================
   ADMIN
   ========================================================= */

function openAdmin(){

  const a =
    $('#adminPanel');


  if(!a) return;


  a.classList.remove(
    'hidden'
  );


  $('#aHeroTitle').value =
    state.heroTitle;


  $('#aHeroText').value =
    state.heroText;


  $('#aRelease').value =
    state.release;


  $('#aPulse').value =
    state.pulse;


  if(
    $('#ghRepo') &&
    !$('#ghRepo').value.trim()
  ){

    $('#ghRepo').value =
      'bodycam1212-lab/axenvo-bet';
  }


  if(
    $('#ghBranch') &&
    !$('#ghBranch').value.trim()
  ){

    $('#ghBranch').value =
      'main';
  }


  if($('#ghStatus')){

    $('#ghStatus').textContent = '';

    $('#ghStatus').className =
      'github-status';
  }


  renderAdminPicks();
}


/* Admin Picks */

function renderAdminPicks(){

  const box =
    $('#adminPicks');


  if(!box) return;


  box.innerHTML =
    state.picks.map((p,i) => `

      <div class="admin-pick">

        <input
          data-k="sport"
          data-i="${i}"
          value="${p.sport || ''}"
          placeholder="Sport"
        >

        <input
          data-k="match"
          data-i="${i}"
          value="${p.match || ''}"
          placeholder="Match"
        >

        <input
          data-k="tip"
          data-i="${i}"
          value="${p.tip || ''}"
          placeholder="Tipp"
        >

        <input
          data-k="odd"
          data-i="${i}"
          value="${p.odd || ''}"
          placeholder="Quote"
        >

        <button
          data-remove="${i}"
          type="button"
        >
          ×
        </button>

      </div>

    `).join('');


  document
    .querySelectorAll('[data-remove]')
    .forEach(b => {

      b.onclick = () => {

        state.picks.splice(
          Number(b.dataset.remove),
          1
        );

        renderAdminPicks();
      };
    });
}


/* Admin öffnen */

if($('#adminOpen')){

  $('#adminOpen').onclick =
    openAdmin;
}


/* Admin schließen */

if($('#adminClose')){

  $('#adminClose').onclick = () => {

    $('#adminPanel')
      ?.classList
      .add('hidden');
  };
}


/* Pick hinzufügen */

if($('#addPick')){

  $('#addPick').onclick = () => {

    state.picks.push({

      sport: 'FUSSBALL',

      match: 'Neues Match',

      tip: 'Dein Tipp',

      reason:
        'Eigene redaktionelle Einschätzung.',

      tag: 'NEW',

      odd: '2.00'
    });


    renderAdminPicks();
  };
}


/* =========================================================
   ADMIN SPEICHERN
   ========================================================= */

if($('#saveAdmin')){

  $('#saveAdmin').onclick = () => {

    state.heroTitle =
      $('#aHeroTitle').value ||
      DEFAULTS.heroTitle;


    state.heroText =
      $('#aHeroText').value ||
      DEFAULTS.heroText;


    state.release =
      $('#aRelease').value ||
      DEFAULTS.release;


    state.pulse =
      $('#aPulse').value ||
      DEFAULTS.pulse;


    document
      .querySelectorAll(
        '#adminPicks [data-k]'
      )
      .forEach(i => {

        const index =
          Number(i.dataset.i);

        const key =
          i.dataset.k;


        if(state.picks[index]){

          state.picks[index][key] =
            i.value;
        }
      });


    saveState();

    applyState();


    $('#adminPanel')
      ?.classList
      .add('hidden');


    showToast(
      'Admin-Änderungen gespeichert ✓'
    );
  };
}


/* =========================================================
   GITHUB BUTTONS
   ========================================================= */

if($('#publishGitHub')){

  $('#publishGitHub').onclick =
    publishPicksToGitHub;
}


if($('#testGitHub')){

  $('#testGitHub').onclick =
    testGitHubToken;
}


/* =========================================================
   ADMIN RESET
   ========================================================= */

if($('#resetAdmin')){

  $('#resetAdmin').onclick = () => {

    state =
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
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

const mobile =
  $('#mobile');


if($('#hamb')){

  $('#hamb').onclick = () => {

    mobile?.classList.toggle(
      'open'
    );
  };
}


document
  .querySelectorAll('.mobile a')
  .forEach(a => {

    a.onclick = () => {

      mobile?.classList.remove(
        'open'
      );
    };
  });


/* =========================================================
   SEARCH
   ========================================================= */

if($('#search')){

  $('#search').onclick = () => {

    showToast(
      'Demo-Suche — Event- und Sportfilter'
    );
  };
}


/* =========================================================
   SPORT FILTER
   ========================================================= */

const chips = [
  ...document.querySelectorAll('.chip')
];


chips.forEach(c => {

  c.onclick = () => {

    chips.forEach(x => {

      x.classList.remove(
        'active'
      );

    });


    c.classList.add(
      'active'
    );


    const s =
      c.dataset.sport;


    document
      .querySelectorAll('.match')
      .forEach(x => {

        x.classList.toggle(

          'hidden',

          s !== 'all' &&
          x.dataset.sport !== s

        );
      });
  };
});


/* =========================================================
   START
   ========================================================= */

applyState();

renderSlip();

loadPublishedPicks();
