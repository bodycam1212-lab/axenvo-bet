/* =========================================================
   WINTIQ
   Frontend Demo + GitHub Picks Publishing
   + Password Reset Inbox
   ========================================================= */


/* =========================================================
   BACKEND
   ========================================================= */

/*
  WICHTIG:

  Für ein echtes gemeinsames Passwort-Postfach muss hier
  später die URL deines Backends eingetragen werden.

  Beispiel:

  const API_BASE = 'https://api.deine-domain.de';

  Wenn API_BASE leer bleibt, benutzt die Demo automatisch
  localStorage.

  localStorage bedeutet:
  Die Anfrage ist nur auf DIESEM Browser gespeichert.

  Für ein echtes gemeinsames Postfach:
  API_BASE setzen und die API-Endpunkte bereitstellen.
*/

const API_BASE = '';


/* =========================================================
   LOGIN
   ========================================================= */

const USERS = {

  WINTIQ_MASTER: {
    password: 'W!ntiqMaster#2026X',
    role: 'admin'
  },

  Ionix87: {
    password: 'Ajjw_291#12_O9s',
    role: 'user'
  },

  Sxne1: {
    password: 'K211093##duik_',
    role: 'user'
  }

};

let currentUser = null;


/* =========================================================
   DEFAULT DATEN
   ========================================================= */

const DEFAULTS = {

  heroTitle:
    'SPORT.\nDATA.\nMOMENTUM.',

  heroText:
    'Ein radikales Sports-Interface für schnelle Entscheidungen, klare Daten und redaktionelle Picks.',

  release:
    '2026-09-11',

  pulse:
    'Live intelligence · Demo feed',

  picks: [

    {
      sport: 'FUSSBALL',
      match: 'FC Bayern — FC SCHALKE 04',
      tip: 'Heimsieg',
      reason:
        'WINTIQ-Einschätzung: TEST der Discord-Verbindung.',
      tag: 'TOP PICK',
      odd: '9.09',
      startAt: '2026-09-12T14:15:00+02:00',
      durationMinutes: 105
    },

    {
      sport: 'TENNIS',
      match: 'Spieler A — Spieler B',
      tip: 'Spieler A',
      reason:
        'WINTIQ-Einschätzung: stärkerer Start in die Partie.',
      tag: 'EDGE',
      odd: '1.85',
      startAt: '2026-09-12T15:30:00+02:00',
      durationMinutes: 120
    },

    {
      sport: 'BASKETBALL',
      match: 'Lakers — Celtics',
      tip: 'Lakers',
      reason:
        'WINTIQ-Einschätzung: Matchup spricht leicht für das Heimteam.',
      tag: 'WATCH',
      odd: '1.92',
      startAt: '2026-09-12T18:00:00+02:00',
      durationMinutes: 150
    }

  ]

};


/* =========================================================
   STATE
   ========================================================= */

let state = loadState();


/* =========================================================
   HELPER
   ========================================================= */

const $ = selector =>
  document.querySelector(selector);


function escapeHtml(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


function utf8ToBase64(text) {

  const bytes =
    new TextEncoder().encode(text);

  let binary = '';

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);

}


function showToast(message) {

  const toast =
    $('#toast');

  if (!toast) return;

  toast.textContent =
    message;

  toast.classList.add('show');

  clearTimeout(showToast.timer);

  showToast.timer =
    setTimeout(() => {

      toast.classList.remove('show');

    }, 3500);

}


/* =========================================================
   LOCAL STATE
   ========================================================= */

function loadState() {

  try {

    const saved =
      localStorage.getItem('wintiqState');

    if (saved) {

      const parsed =
        JSON.parse(saved);

      return {

        ...DEFAULTS,

        ...parsed,

        picks:
          Array.isArray(parsed.picks)
            ? parsed.picks
            : DEFAULTS.picks

      };

    }

  } catch (error) {

    console.error(
      'State konnte nicht geladen werden:',
      error
    );

  }

  return JSON.parse(
    JSON.stringify(DEFAULTS)
  );

}


function saveState() {

  localStorage.setItem(
    'wintiqState',
    JSON.stringify(state)
  );

}


/* =========================================================
   LOGIN
   ========================================================= */

function unlockApp(user, role) {

  currentUser = {
    user,
    role
  };

  document.body.classList.remove('locked');

  $('#loginGate')
    ?.classList.add('hidden');

  $('#app')
    ?.classList.remove('app-hidden');

  sessionStorage.setItem(
    'wintiqUser',
    JSON.stringify(currentUser)
  );

  const label =
    $('#currentUserLabel');

  if (label) {

    label.textContent =
      role === 'admin'
        ? `${user} · ADMIN`
        : `${user} · USER`;

  }

  updateUserPermissions();

}


function lockApp() {

  currentUser = null;

  sessionStorage.removeItem(
    'wintiqUser'
  );

  document.body.classList.add(
    'locked'
  );

  $('#loginGate')
    ?.classList.remove('hidden');

  $('#app')
    ?.classList.add('app-hidden');

  closeAdmin();
  closeResetModal();

}


/* =========================================================
   ADMIN CHECK
   ========================================================= */

function isAdmin() {

  return (
    currentUser?.role === 'admin'
  );

}


function updateUserPermissions() {

  const adminOpen =
    $('#adminOpen');

  if (!adminOpen) return;

  if (isAdmin()) {

    adminOpen.classList.remove(
      'hidden'
    );

  } else {

    adminOpen.classList.add(
      'hidden'
    );

  }

}


/* =========================================================
   LOGIN INIT
   ========================================================= */

function initLogin() {

  const form =
    $('#loginForm');

  if (!form) return;


  try {

    const saved =
      sessionStorage.getItem(
        'wintiqUser'
      );

    if (saved) {

      const parsed =
        JSON.parse(saved);

      const account =
        USERS[parsed?.user];

      if (
        account &&
        parsed.user &&
        parsed.role === account.role
      ) {

        currentUser = {
          user: parsed.user,
          role: account.role
        };

        unlockApp(
          parsed.user,
          account.role
        );

      } else {

        sessionStorage.removeItem(
          'wintiqUser'
        );

      }

    }

  } catch (error) {

    console.warn(
      'Login-Session konnte nicht geladen werden:',
      error
    );

    sessionStorage.removeItem(
      'wintiqUser'
    );

  }


  form.addEventListener(
    'submit',
    event => {

      event.preventDefault();

      const user =
        $('#loginUser')
          ?.value
          .trim() || '';

      const pass =
        $('#loginPass')
          ?.value || '';

      const error =
        $('#loginError');

      const account =
        USERS[user];


      if (
        account &&
        account.password === pass
      ) {

        if (error) {
          error.textContent = '';
        }

        unlockApp(
          user,
          account.role
        );

        return;

      }


      if (error) {

        error.textContent =
          'Benutzername oder Passwort ist falsch.';

      }

    }
  );


  $('#logout')
    ?.addEventListener(
      'click',
      lockApp
    );


  $('#forgotPasswordBtn')
    ?.addEventListener(
      'click',
      openResetModal
    );

}


/* =========================================================
   PASSWORD RESET MODAL
   ========================================================= */

function openResetModal() {

  const modal =
    $('#resetModal');

  if (!modal) return;

  const username =
    $('#resetUsername');

  const message =
    $('#resetMessage');

  if (username) {
    username.value = '';
  }

  if (message) {
    message.textContent = '';
    message.className =
      'reset-message';
  }

  modal.classList.remove(
    'hidden'
  );

}


function closeResetModal() {

  $('#resetModal')
    ?.classList.add('hidden');

}


/* =========================================================
   PASSWORD RESET REQUEST
   ========================================================= */

async function requestPasswordReset() {

  const input =
    $('#resetUsername');

  const button =
    $('#sendResetRequest');

  const username =
    input?.value.trim() || '';


  if (!username) {

    setResetMessage(
      'Bitte einen Benutzernamen eingeben.',
      'error'
    );

    return;

  }


  if (!USERS[username]) {

    setResetMessage(
      'Dieser Benutzername ist nicht registriert.',
      'error'
    );

    return;

  }


  if (button) {

    button.disabled = true;

    button.textContent =
      'Wird gesendet …';

  }


  const request = {

    id:
      createRequestId(),

    username,

    status:
      'pending',

    createdAt:
      new Date().toISOString()

  };


  try {

    if (API_BASE) {

      await apiCreatePasswordRequest(
        request
      );

    } else {

      saveLocalPasswordRequest(
        request
      );

    }


    setResetMessage(
      'Passwort-Anfrage wurde an den Administrator gesendet.',
      'ok'
    );

    showToast(
      'Passwort-Anfrage gesendet ✓'
    );


    setTimeout(() => {

      closeResetModal();

    }, 1800);


  } catch (error) {

    console.error(
      'Passwort-Anfrage fehlgeschlagen:',
      error
    );

    setResetMessage(
      error.message ||
      'Die Anfrage konnte nicht gesendet werden.',
      'error'
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        'Anfrage senden →';

    }

  }

}


function setResetMessage(
  text,
  type = ''
) {

  const element =
    $('#resetMessage');

  if (!element) return;

  element.textContent =
    text;

  element.className =
    `reset-message ${type}`;

}


/* =========================================================
   PASSWORD REQUEST ID
   ========================================================= */

function createRequestId() {

  return (
    'PW-' +
    Date.now().toString(36).toUpperCase() +
    '-' +
    Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()
  );

}


/* =========================================================
   LOCAL PASSWORD REQUESTS
   ========================================================= */

function getLocalPasswordRequests() {

  try {

    const value =
      localStorage.getItem(
        'wintiqPasswordRequests'
      );

    if (!value) {
      return [];
    }

    const parsed =
      JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      'Passwort-Anfragen konnten nicht gelesen werden:',
      error
    );

    return [];

  }

}


function saveLocalPasswordRequest(
  request
) {

  const requests =
    getLocalPasswordRequests();

  const alreadyPending =
    requests.some(item =>
      item.username === request.username &&
      item.status === 'pending'
    );

  if (alreadyPending) {

    throw new Error(
      'Für diesen Benutzer existiert bereits eine offene Anfrage.'
    );

  }


  requests.unshift(
    request
  );

  localStorage.setItem(
    'wintiqPasswordRequests',
    JSON.stringify(requests)
  );

}


/* =========================================================
   BACKEND REQUEST
   ========================================================= */

async function apiCreatePasswordRequest(
  request
) {

  const response =
    await fetch(
      `${API_BASE}/password-requests`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body:
          JSON.stringify(request)
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      data.message ||
      `Serverfehler ${response.status}`
    );

  }


  return data;

}


/* =========================================================
   LOAD PASSWORD REQUESTS
   ========================================================= */

async function loadPasswordRequests() {

  if (!isAdmin()) {
    return;
  }


  const container =
    $('#passwordRequestList');

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="password-inbox-empty">
      Anfragen werden geladen …
    </div>
  `;


  try {

    let requests;


    if (API_BASE) {

      requests =
        await apiGetPasswordRequests();

    } else {

      requests =
        getLocalPasswordRequests();

    }


    renderPasswordRequests(
      requests
    );


  } catch (error) {

    console.error(
      'Passwort-Anfragen konnten nicht geladen werden:',
      error
    );

    container.innerHTML = `
      <div class="password-inbox-empty">
        Passwort-Anfragen konnten nicht geladen werden.
      </div>
    `;

  }

}


async function apiGetPasswordRequests() {

  const response =
    await fetch(
      `${API_BASE}/password-requests`,
      {
        method: 'GET',
        headers: {
          Accept:
            'application/json'
        }
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      data.message ||
      `Serverfehler ${response.status}`
    );

  }


  return Array.isArray(data)
    ? data
    : data.requests || [];

}


/* =========================================================
   RENDER PASSWORD REQUESTS
   ========================================================= */

function renderPasswordRequests(
  requests
) {

  const container =
    $('#passwordRequestList');

  const counter =
    $('#pendingResetCount');

  if (!container) return;


  if (!Array.isArray(requests)) {
    requests = [];
  }


  const pending =
    requests.filter(
      request =>
        request.status === 'pending'
    );


  if (counter) {

    counter.textContent =
      String(pending.length);

  }


  if (!requests.length) {

    container.innerHTML = `
      <div class="password-inbox-empty">
        Keine Passwort-Anfragen vorhanden.
      </div>
    `;

    return;

  }


  container.innerHTML =
    requests.map(
      request =>
        renderPasswordRequest(
          request
        )
    ).join('');


  container
    .querySelectorAll(
      '[data-change-password]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            button.dataset.changePassword;

          openPasswordChange(
            id
          );

        }
      );

    });


  container
    .querySelectorAll(
      '[data-save-password]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            button.dataset.savePassword;

          saveNewPassword(
            id
          );

        }
      );

    });


  container
    .querySelectorAll(
      '[data-delete-request]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            button.dataset.deleteRequest;

          deletePasswordRequest(
            id
          );

        }
      );

    });

}


function renderPasswordRequest(
  request
) {

  const isPending =
    request.status === 'pending';


  const date =
    request.createdAt
      ? new Date(
          request.createdAt
        ).toLocaleString('de-DE')
      : '—';


  return `

    <div
      class="password-request ${
        isPending
          ? 'pending'
          : 'done'
      }"
      data-request-id="${escapeHtml(request.id)}"
    >

      <div class="password-request-top">

        <span class="password-request-user">
          ${escapeHtml(request.username)}
        </span>

        <span
          class="password-request-status ${
            isPending
              ? 'pending'
              : 'done'
          }"
        >
          ${
            isPending
              ? 'OFFEN'
              : 'ERLEDIGT'
          }
        </span>

      </div>


      <div class="password-request-meta">

        Anfrage:
        ${escapeHtml(date)}

        <br>

        ID:
        ${escapeHtml(request.id)}

      </div>


      ${
        isPending
          ? `

            <div class="password-request-actions">

              <button
                type="button"
                class="primary"
                data-change-password="${escapeHtml(request.id)}"
              >
                Passwort ändern
              </button>

              <button
                type="button"
                class="ghost"
                data-delete-request="${escapeHtml(request.id)}"
              >
                Löschen
              </button>

            </div>

            <div
              class="password-change-box hidden"
              id="change-${escapeHtml(request.id)}"
            >

              <label>
                Neues Passwort
                <input
                  type="password"
                  id="new-password-${escapeHtml(request.id)}"
                  autocomplete="new-password"
                  placeholder="Neues Passwort"
                >
              </label>

              <label>
                Neues Passwort wiederholen
                <input
                  type="password"
                  id="new-password-confirm-${escapeHtml(request.id)}"
                  autocomplete="new-password"
                  placeholder="Passwort wiederholen"
                >
              </label>

              <button
                type="button"
                class="primary"
                data-save-password="${escapeHtml(request.id)}"
              >
                Neues Passwort speichern
              </button>

            </div>

          `
          : `

            <div class="password-request-actions">

              <button
                type="button"
                class="ghost"
                data-delete-request="${escapeHtml(request.id)}"
              >
                Anfrage löschen
              </button>

            </div>

          `
      }

    </div>

  `;

}


/* =========================================================
   OPEN PASSWORD CHANGE
   ========================================================= */

function openPasswordChange(
  id
) {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  const box =
    document.getElementById(
      `change-${id}`
    );

  if (!box) return;

  box.classList.toggle(
    'hidden'
  );

}


/* =========================================================
   SAVE NEW PASSWORD
   ========================================================= */

async function saveNewPassword(
  id
) {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  const password =
    document.getElementById(
      `new-password-${id}`
    )?.value || '';


  const confirmPassword =
    document.getElementById(
      `new-password-confirm-${id}`
    )?.value || '';


  if (!password) {

    showToast(
      'Bitte ein neues Passwort eingeben.'
    );

    return;

  }


  if (password.length < 8) {

    showToast(
      'Das neue Passwort muss mindestens 8 Zeichen haben.'
    );

    return;

  }


  if (password !== confirmPassword) {

    showToast(
      'Die Passwörter stimmen nicht überein.'
    );

    return;

  }


  const requests =
    API_BASE
      ? null
      : getLocalPasswordRequests();


  const request =
    requests?.find(
      item =>
        item.id === id
    );


  if (!API_BASE && !request) {

    showToast(
      'Passwort-Anfrage wurde nicht gefunden.'
    );

    return;

  }


  try {

    if (API_BASE) {

      await apiChangePassword(
        id,
        password
      );

    } else {

      const username =
        request.username;

      if (!USERS[username]) {

        throw new Error(
          'Benutzerkonto nicht gefunden.'
        );

      }


      USERS[username].password =
        password;


      const index =
        requests.findIndex(
          item =>
            item.id === id
        );


      if (index !== -1) {

        requests[index].status =
          'done';

        requests[index].completedAt =
          new Date().toISOString();

        requests[index].completedBy =
          currentUser.user;

      }


      localStorage.setItem(
        'wintiqPasswordRequests',
        JSON.stringify(requests)
      );

    }


    showToast(
      'Passwort erfolgreich geändert ✓'
    );


    await loadPasswordRequests();


  } catch (error) {

    console.error(
      'Passwort konnte nicht geändert werden:',
      error
    );

    showToast(
      error.message ||
      'Passwort konnte nicht geändert werden.'
    );

  }

}


/* =========================================================
   API PASSWORD CHANGE
   ========================================================= */

async function apiChangePassword(
  id,
  password
) {

  const response =
    await fetch(
      `${API_BASE}/password-requests/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type':
            'application/json'
        },

        body:
          JSON.stringify({
            password
          })
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      data.message ||
      `Serverfehler ${response.status}`
    );

  }


  return data;

}


/* =========================================================
   DELETE PASSWORD REQUEST
   ========================================================= */

async function deletePasswordRequest(
  id
) {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  if (
    !confirm(
      'Diese Passwort-Anfrage wirklich löschen?'
    )
  ) {

    return;

  }


  try {

    if (API_BASE) {

      await apiDeletePasswordRequest(
        id
      );

    } else {

      const requests =
        getLocalPasswordRequests();

      const filtered =
        requests.filter(
          item =>
            item.id !== id
        );

      localStorage.setItem(
        'wintiqPasswordRequests',
        JSON.stringify(filtered)
      );

    }


    showToast(
      'Anfrage gelöscht.'
    );


    await loadPasswordRequests();


  } catch (error) {

    console.error(
      'Anfrage konnte nicht gelöscht werden:',
      error
    );

    showToast(
      error.message ||
      'Anfrage konnte nicht gelöscht werden.'
    );

  }

}


async function apiDeletePasswordRequest(
  id
) {

  const response =
    await fetch(
      `${API_BASE}/password-requests/${encodeURIComponent(id)}`,
      {
        method: 'DELETE'
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      data.message ||
      `Serverfehler ${response.status}`
    );

  }


  return data;

}


/* =========================================================
   HERO
   ========================================================= */

function renderHero() {

  const title =
    $('#heroTitle');

  const text =
    $('#heroText');

  const pulse =
    $('#pulseText');

  const releaseMeta =
    $('#releaseMeta');

  const releaseBig =
    $('#releaseDateBig');


  if (title) {

    title.innerHTML =
      escapeHtml(
        state.heroTitle
      ).replace(
        /\n/g,
        '<br>'
      );

  }


  if (text) {

    text.textContent =
      state.heroText;

  }


  if (pulse) {

    pulse.textContent =
      state.pulse;

  }


  const date =
    formatDate(
      state.release
    );


  if (releaseMeta) {

    releaseMeta.textContent =
      date;

  }


  if (releaseBig) {

    releaseBig.textContent =
      date;

  }

}


function formatDate(
  dateString
) {

  if (!dateString) {
    return '—';
  }


  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateString;

  }


  return date.toLocaleDateString(
    'de-DE'
  );

}


/* =========================================================
   COUNTDOWN
   ========================================================= */

function updateCountdown() {

  const timer =
    $('#timer');

  const days =
    $('#days');


  if (!state.release) {
    return;
  }


  const target =
    new Date(
      `${state.release}T00:00:00`
    ).getTime();


  const now =
    Date.now();


  let diff =
    target - now;


  if (diff < 0) {
    diff = 0;
  }


  const totalSeconds =
    Math.floor(
      diff / 1000
    );


  const d =
    Math.floor(
      totalSeconds / 86400
    );


  const h =
    Math.floor(
      (totalSeconds % 86400) /
      3600
    );


  const m =
    Math.floor(
      (totalSeconds % 3600) /
      60
    );


  const s =
    totalSeconds % 60;


  const pad =
    value =>
      String(value)
        .padStart(2, '0');


  if (timer) {

    timer.textContent =
      `${pad(d)} : ${pad(h)} : ${pad(m)} : ${pad(s)}`;

  }


  if (days) {

    days.textContent =
      `${pad(d)} DAYS`;

  }

}


/* =========================================================
   LIVE MATCHES
   ========================================================= */

const MATCHES = [

  {
    sport: 'football',
    league: 'BUNDESLIGA',
    time: "LIVE 68'",
    home: 'FC Bayern',
    away: 'Dortmund',
    score: ['2', '1'],
    odds: ['1.78', '3.90', '4.40']
  },

  {
    sport: 'football',
    league: 'CHAMPIONS LEAGUE',
    time: '19:30',
    home: 'Real Madrid',
    away: 'Barcelona',
    score: ['0', '0'],
    odds: ['2.05', '3.50', '3.20']
  },

  {
    sport: 'tennis',
    league: 'ATP',
    time: '19:30',
    home: 'Spieler A',
    away: 'Spieler B',
    score: ['1', '0'],
    odds: ['1.65', '2.20']
  },

  {
    sport: 'basketball',
    league: 'NBA',
    time: '21:00',
    home: 'Lakers',
    away: 'Celtics',
    score: ['0', '0'],
    odds: ['1.72', '2.10']
  },

  {
    sport: 'ice',
    league: 'DEL',
    time: '20:00',
    home: 'Berlin',
    away: 'München',
    score: ['0', '0'],
    odds: ['2.15', '3.60', '2.55']
  }

];


function renderMatches(
  sport = 'all'
) {

  const container =
    $('#matches');

  if (!container) return;


  const filtered =
    sport === 'all'
      ? MATCHES
      : MATCHES.filter(
          match =>
            match.sport === sport
        );


  container.innerHTML =
    filtered
      .map(
        match =>
          renderMatch(
            match
          )
      )
      .join('');

}


function renderMatch(
  match
) {

  const isLive =
    String(match.time)
      .toUpperCase()
      .includes('LIVE');


  return `

    <article class="match-card">

      <div class="match-top">

        <small>
          ${escapeHtml(match.league)}
        </small>

        <span class="${isLive ? 'live' : ''}">
          ${escapeHtml(match.time)}
        </span>

      </div>


      <div class="teams">

        <div>

          <strong>
            ${escapeHtml(match.home)}
          </strong>

          <span>
            ${escapeHtml(match.away)}
          </span>

        </div>


        <div class="score">

          <b>
            ${escapeHtml(match.score[0])}
          </b>

          <span>:</span>

          <b>
            ${escapeHtml(match.score[1])}
          </b>

        </div>

      </div>


      <div class="odds">

        ${match.odds.map(
          odd => `
            <button
              type="button"
              class="odd"
              disabled
            >
              ${escapeHtml(odd)}
            </button>
          `
        ).join('')}

      </div>

    </article>

  `;

}


/* =========================================================
   PICKS
   ========================================================= */

function getPickStatus(
  pick,
  now = Date.now()
) {

  const start =
    new Date(
      pick.startAt
    ).getTime();


  if (
    !Number.isFinite(start)
  ) {

    return {
      status: 'scheduled',
      remaining: null,
      elapsed: 0,
      end: null
    };

  }


  const duration =
    Math.max(
      1,
      Number(
        pick.durationMinutes
      ) || 105
    );


  const end =
    start +
    duration * 60 * 1000;


  if (now < start) {

    return {
      status: 'scheduled',
      remaining: start - now,
      elapsed: 0,
      end
    };

  }


  if (now < end) {

    return {
      status: 'live',
      remaining: end - now,
      elapsed: now - start,
      end
    };

  }


  return {
    status: 'finished',
    remaining: 0,
    elapsed: end - start,
    end
  };

}


function formatDuration(
  milliseconds
) {

  const totalSeconds =
    Math.max(
      0,
      Math.floor(
        milliseconds / 1000
      )
    );


  const hours =
    Math.floor(
      totalSeconds / 3600
    );


  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );


  const seconds =
    totalSeconds % 60;


  const pad =
    value =>
      String(value)
        .padStart(2, '0');


  if (hours > 0) {

    return (
      `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    );

  }


  return (
    `${pad(minutes)}:${pad(seconds)}`
  );

}


function formatStartDate(
  dateString
) {

  if (!dateString) {
    return 'Startzeit nicht festgelegt';
  }


  const date =
    new Date(
      dateString
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return 'Startzeit nicht festgelegt';

  }


  return date.toLocaleString(
    'de-DE',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );

}


function getPickResult(
  pick
) {

  if (
    typeof pick.result === 'string' &&
    pick.result
  ) {

    return pick.result;

  }


  /*
    Für die Demo kann ein Pick nach dem Spiel
    über result manuell auf "won" oder "lost"
    gesetzt werden.

    Wenn kein Ergebnis vorhanden ist, zeigen wir
    nach dem Ende "ERGEBNIS OFFEN" statt ein
    falsches Ergebnis zu erfinden.
  */

  return 'pending';

}


function pickResultLabel(
  result
) {

  if (result === 'won') {

    return {
      label: '✓ PICK RICHTIG',
      className: 'pick-won'
    };

  }


  if (result === 'lost') {

    return {
      label: '✕ PICK FALSCH',
      className: 'pick-lost'
    };

  }


  return {
    label: '● ERGEBNIS OFFEN',
    className: 'pick-pending'
  };

}


function renderPick(
  pick,
  index
) {

  const status =
    getPickStatus(
      pick
    );


  const result =
    getPickResult(
      pick
    );


  const resultInfo =
    pickResultLabel(
      result
    );


  let ticker = '';


  if (status.status === 'scheduled') {

    ticker = `
      <div class="pick-live-ticker pick-scheduled">

        <span class="pick-live-badge">
          UPCOMING
        </span>

        <strong>
          Startet um ${escapeHtml(
            formatStartDate(
              pick.startAt
            )
          )}
        </strong>

        ${
          status.remaining !== null
            ? `
              <span>
                Noch ${escapeHtml(
                  formatDuration(
                    status.remaining
                  )
                )}
              </span>
            `
            : ''
        }

      </div>
    `;

  } else if (status.status === 'live') {

    const minute =
      Math.max(
        1,
        Math.floor(
          status.elapsed / 60000
        ) + 1
      );


    ticker = `
      <div class="pick-live-ticker pick-live">

        <span class="pick-live-badge">
          <i></i> LIVE
        </span>

        <strong>
          ${minute}'
        </strong>

        <span>
          Spiel läuft
        </span>

        <span class="pick-live-time">
          Noch ${escapeHtml(
            formatDuration(
              status.remaining
            )
          )}
        </span>

      </div>
    `;

  } else {

    ticker = `
      <div class="pick-live-ticker pick-finished">

        <span class="pick-live-badge">
          ENDE
        </span>

        <strong class="${resultInfo.className}">
          ${resultInfo.label}
        </strong>

      </div>
    `;

  }


  return `

    <article
      class="pick-card"
      data-pick-index="${index}"
    >

      <div class="pick-card-top">

        <span class="pick-sport">
          ${escapeHtml(pick.sport)}
        </span>

        <span class="pick-tag">
          ${escapeHtml(pick.tag)}
        </span>

      </div>


      <div class="pick-match">

        ${escapeHtml(pick.match)}

      </div>


      ${ticker}


      <div class="pick-tip">

        <small>
          WINTIQ PICK
        </small>

        <strong>
          ${escapeHtml(pick.tip)}
        </strong>

      </div>


      <div class="pick-reason">

        ${escapeHtml(pick.reason)}

      </div>


      <div class="pick-meta">

        <span>
          Quote ${escapeHtml(pick.odd || '—')}
        </span>

        <span>
          Start:
          ${escapeHtml(
            formatStartDate(
              pick.startAt
            )
          )}
        </span>

      </div>

    </article>

  `;

}


function renderPicks() {

  const container =
    $('#pickGrid');

  if (!container) return;


  if (
    !Array.isArray(
      state.picks
    ) ||
    !state.picks.length
  ) {

    container.innerHTML = `
      <div class="password-inbox-empty">
        Aktuell keine Picks vorhanden.
      </div>
    `;

    return;

  }


  container.innerHTML =
    state.picks
      .map(
        (pick, index) =>
          renderPick(
            pick,
            index
          )
      )
      .join('');

}


function updateLivePickTickers() {

  const container =
    $('#pickGrid');

  if (!container) return;


  if (
    !Array.isArray(
      state.picks
    )
  ) {

    return;

  }


  /*
    Die Picks werden jede Sekunde neu gerendert.
    Dadurch werden Countdown, LIVE-Status,
    Spielminute und Restzeit sofort aktualisiert.
  */

  renderPicks();

}


/* =========================================================
   ADMIN
   ========================================================= */

function openAdmin() {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  const panel =
    $('#adminPanel');

  if (!panel) return;

  fillAdminForm();

  panel.classList.remove(
    'hidden'
  );

  loadPasswordRequests();

}


function closeAdmin() {

  $('#adminPanel')
    ?.classList.add('hidden');

}


function fillAdminForm() {

  if ($('#aHeroTitle')) {

    $('#aHeroTitle').value =
      state.heroTitle;

  }


  if ($('#aHeroText')) {

    $('#aHeroText').value =
      state.heroText;

  }


  if ($('#aRelease')) {

    $('#aRelease').value =
      state.release;

  }


  if ($('#aPulse')) {

    $('#aPulse').value =
      state.pulse;

  }


  renderAdminPicks();

}


/* =========================================================
   ADMIN PICKS
   ========================================================= */

function renderAdminPicks() {

  const container =
    $('#adminPicks');

  if (!container) {
    return;
  }


  container.innerHTML =
    state.picks
      .map(
        (pick, index) => `

          <div class="admin-pick">

            <div class="admin-pick-head">

              <strong>
                Pick ${index + 1}
              </strong>

              <button
                type="button"
                class="ghost remove-pick"
                data-index="${index}"
              >
                Entfernen
              </button>

            </div>


            <div class="admin-pick-grid">

              <label>

                Sport

                <input
                  data-field="sport"
                  data-index="${index}"
                  value="${escapeHtml(pick.sport)}"
                >

              </label>


              <label>

                Tag

                <input
                  data-field="tag"
                  data-index="${index}"
                  value="${escapeHtml(pick.tag)}"
                >

              </label>


              <label class="full">

                Match

                <input
                  data-field="match"
                  data-index="${index}"
                  value="${escapeHtml(pick.match)}"
                >

              </label>


              <label>

                Tipp

                <input
                  data-field="tip"
                  data-index="${index}"
                  value="${escapeHtml(pick.tip)}"
                >

              </label>


              <label>

                Quote

                <input
                  data-field="odd"
                  data-index="${index}"
                  value="${escapeHtml(pick.odd)}"
                >

              </label>


              <label>
                Startzeit
                <input
                  type="datetime-local"
                  data-field="startAt"
                  data-index="${index}"
                  value="${escapeHtml((pick.startAt || '').slice(0,16))}"
                >
              </label>


              <label>
                Dauer (Min.)
                <input
                  type="number"
                  min="1"
                  data-field="durationMinutes"
                  data-index="${index}"
                  value="${escapeHtml(pick.durationMinutes || 105)}"
                >
              </label>


              <label>
                Ergebnis
                <select
                  data-field="result"
                  data-index="${index}"
                >
                  <option
                    value="pending"
                    ${pick.result === 'pending' || !pick.result ? 'selected' : ''}
                  >
                    Noch offen
                  </option>

                  <option
                    value="won"
                    ${pick.result === 'won' ? 'selected' : ''}
                  >
                    Pick richtig
                  </option>

                  <option
                    value="lost"
                    ${pick.result === 'lost' ? 'selected' : ''}
                  >
                    Pick falsch
                  </option>
                </select>
              </label>


              <label class="full">

                🧠 Einschätzung

                <textarea
                  data-field="reason"
                  data-index="${index}"
                  rows="3"
                  placeholder="WINTIQ-Einschätzung eingeben ..."
                >${escapeHtml(pick.reason)}</textarea>

              </label>

            </div>

          </div>

        `
      )
      .join('');


  container
    .querySelectorAll(
      '[data-field]'
    )
    .forEach(input => {

      input.addEventListener(
        'input',
        event => {

          updateAdminPickField(
            event.target
          );

        }
      );


      input.addEventListener(
        'change',
        event => {

          updateAdminPickField(
            event.target
          );

        }
      );

    });


  container
    .querySelectorAll(
      '.remove-pick'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const index =
            Number(
              button.dataset.index
            );


          state.picks.splice(
            index,
            1
          );


          renderAdminPicks();

        }
      );

    });

}


function updateAdminPickField(
  target
) {

  const index =
    Number(
      target.dataset.index
    );


  const field =
    target.dataset.field;


  if (
    !state.picks[index] ||
    !field
  ) {

    return;

  }


  let value =
    target.value;


  if (
    field === 'durationMinutes'
  ) {

    value =
      Number(
        value
      ) || 105;

  }


  state.picks[index][field] =
    value;

}


/* =========================================================
   ADD PICK
   ========================================================= */

function addPick() {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  state.picks.push({

    sport:
      'FUSSBALL',

    match:
      'Neue Partie — Gegner',

    tip:
      'Heimsieg',

    reason:
      'WINTIQ-Einschätzung: Neue redaktionelle Bewertung.',

    tag:
      'NEW',

    odd:
      '1.90',

    startAt:
      new Date(
        Date.now() +
        30 * 60 * 1000
      ).toISOString(),

    durationMinutes:
      105,

    result:
      'pending'

  });


  renderAdminPicks();

}


/* =========================================================
   SAVE ADMIN
   ========================================================= */

function saveAdmin() {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  state.heroTitle =
    $('#aHeroTitle')?.value ||
    DEFAULTS.heroTitle;


  state.heroText =
    $('#aHeroText')?.value ||
    DEFAULTS.heroText;


  state.release =
    $('#aRelease')?.value ||
    DEFAULTS.release;


  state.pulse =
    $('#aPulse')?.value ||
    DEFAULTS.pulse;


  /*
    Normalisierung der Pick-Daten,
    damit Startzeit, Dauer und Ergebnis
    zuverlässig gespeichert werden.
  */

  state.picks =
    state.picks.map(
      pick => ({

        ...pick,

        startAt:
          pick.startAt ||
          new Date(
            Date.now() +
            30 * 60 * 1000
          ).toISOString(),

        durationMinutes:
          Number(
            pick.durationMinutes
          ) || 105,

        result:
          pick.result ||
          'pending'

      })
    );


  saveState();


  renderHero();

  renderPicks();


  showToast(
    'Änderungen lokal gespeichert ✓'
  );


  closeAdmin();

}


/* =========================================================
   RESET
   ========================================================= */

function resetAdmin() {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  const confirmed =
    confirm(
      'Demo wirklich zurücksetzen?'
    );


  if (!confirmed) {
    return;
  }


  state =
    JSON.parse(
      JSON.stringify(
        DEFAULTS
      )
    );


  saveState();


  renderHero();

  renderPicks();

  fillAdminForm();


  showToast(
    'Demo wurde zurückgesetzt.'
  );

}


/* =========================================================
   GITHUB
   ========================================================= */

async function testGitHubToken() {

  const token =
    $('#ghToken')?.value.trim();

  const repo =
    $('#ghRepo')?.value.trim();

  const branch =
    $('#ghBranch')?.value.trim() ||
    'main';

  const status =
    $('#ghStatus');


  if (!token) {

    if (status) {

      status.className =
        'github-status error';

      status.textContent =
        'Bitte GitHub Token eingeben.';

    }

    return;

  }


  if (!repo || !repo.includes('/')) {

    if (status) {

      status.className =
        'github-status error';

      status.textContent =
        'Repository muss owner/repository sein.';

    }

    return;

  }


  if (status) {

    status.className =
      'github-status loading';

    status.textContent =
      'Token wird geprüft …';

  }


  try {

    const response =
      await fetch(
        `https://api.github.com/repos/${repo}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,

            Accept:
              'application/vnd.github+json'
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `GitHub antwortet mit ${response.status}.`
      );

    }


    const data =
      await response.json();


    if (status) {

      status.className =
        'github-status ok';

      status.textContent =
        `✓ Zugriff auf ${data.full_name} · Branch ${branch}`;

    }

  } catch (error) {

    console.error(
      'GitHub Token Prüfung fehlgeschlagen:',
      error
    );

    if (status) {

      status.className =
        'github-status error';

      status.textContent =
        error.message ||
        'GitHub Token konnte nicht geprüft werden.';

    }

  }

}


async function publishPicksToGitHub() {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  const token =
    $('#ghToken')?.value.trim();

  const repo =
    $('#ghRepo')?.value.trim();

  const branch =
    $('#ghBranch')?.value.trim() ||
    'main';


  if (!token) {

    showToast(
      'Bitte GitHub Token eingeben.'
    );

    return;

  }


  if (
    !repo ||
    !repo.includes('/')
  ) {

    showToast(
      'Repository muss owner/repository sein.'
    );

    return;

  }


  const path =
    'picks.json';


  const content =
    JSON.stringify(
      state.picks,
      null,
      2
    );


  const encodedContent =
    utf8ToBase64(
      content
    );


  try {

    let sha = null;


    const existing =
      await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,

            Accept:
              'application/vnd.github+json'
          }
        }
      );


    if (existing.ok) {

      const existingData =
        await existing.json();

      sha =
        existingData.sha;

    } else if (
      existing.status !== 404
    ) {

      const errorData =
        await existing.json()
          .catch(
            () => ({})
          );

      throw new Error(
        errorData.message ||
        `GitHub Fehler ${existing.status}`
      );

    }


    const body = {

      message:
        'Update WINTIQ Picks',

      content:
        encodedContent,

      branch

    };


    if (sha) {
      body.sha = sha;
    }


    const response =
      await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}`,
        {
          method: 'PUT',

          headers: {
            Authorization:
              `Bearer ${token}`,

            Accept:
              'application/vnd.github+json',

            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify(body)
        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(
        data.message ||
        `GitHub Fehler ${response.status}`
      );

    }


    showToast(
      'Picks erfolgreich zu GitHub gesendet ✓'
    );


  } catch (error) {

    console.error(
      'GitHub Veröffentlichung fehlgeschlagen:',
      error
    );

    showToast(
      error.message ||
      'Picks konnten nicht veröffentlicht werden.'
    );

  }

}


/* =========================================================
   LOAD PUBLISHED PICKS
   ========================================================= */

async function loadPublishedPicks() {

  try {

    const response =
      await fetch(
        'picks.json',
        {
          cache:
            'no-store'
        }
      );


    if (!response.ok) {
      return;
    }


    const published =
      await response.json();


    if (
      Array.isArray(
        published
      ) &&
      published.length
    ) {

      state.picks =
        published.map(
          pick => ({

            ...pick,

            startAt:
              pick.startAt ||
              new Date(
                Date.now() +
                30 * 60 * 1000
              ).toISOString(),

            durationMinutes:
              Number(
                pick.durationMinutes
              ) || 105,

            result:
              pick.result ||
              'pending'

          })
        );


      renderPicks();

    }

  } catch (error) {

    /*
      picks.json ist optional.
      Bei einer reinen Demo bleibt
      der lokale State erhalten.
    */

    console.info(
      'Keine veröffentlichten picks.json geladen.'
    );

  }

}


/* =========================================================
   MOBILE NAV
   ========================================================= */

function initMobile() {

  const mobile =
    $('#mobile');

  const hamburger =
    $('#hamb');


  if (
    !mobile ||
    !hamburger
  ) {

    return;

  }


  hamburger.addEventListener(
    'click',
    () => {

      mobile.classList.toggle(
        'open'
      );

    }
  );


  mobile
    .querySelectorAll('a')
    .forEach(link => {

      link.addEventListener(
        'click',
        () => {

          mobile.classList.remove(
            'open'
          );

        }
      );

    });

}


/* =========================================================
   SPORT FILTER
   ========================================================= */

function initFilters() {

  document
    .querySelectorAll('.chip')
    .forEach(chip => {

      chip.addEventListener(
        'click',
        () => {

          document
            .querySelectorAll('.chip')
            .forEach(item => {

              item.classList.remove(
                'active'
              );

            });


          chip.classList.add(
            'active'
          );


          renderMatches(
            chip.dataset.sport ||
            'all'
          );

        }
      );

    });

}


/* =========================================================
   ADMIN EVENTS
   ========================================================= */

function initAdmin() {

  $('#adminOpen')
    ?.addEventListener(
      'click',
      openAdmin
    );


  $('#adminClose')
    ?.addEventListener(
      'click',
      closeAdmin
    );


  $('#addPick')
    ?.addEventListener(
      'click',
      addPick
    );


  $('#saveAdmin')
    ?.addEventListener(
      'click',
      saveAdmin
    );


  $('#resetAdmin')
    ?.addEventListener(
      'click',
      resetAdmin
    );


  $('#testGitHub')
    ?.addEventListener(
      'click',
      testGitHubToken
    );


  $('#publishGitHub')
    ?.addEventListener(
      'click',
      publishPicksToGitHub
    );


  $('#refreshPasswordRequests')
    ?.addEventListener(
      'click',
      loadPasswordRequests
    );


  $('#adminPanel')
    ?.addEventListener(
      'click',
      event => {

        if (
          event.target.id ===
          'adminPanel'
        ) {

          closeAdmin();

        }

      }
    );

}


/* =========================================================
   RESET EVENTS
   ========================================================= */

function initResetEvents() {

  $('#resetClose')
    ?.addEventListener(
      'click',
      closeResetModal
    );


  $('#sendResetRequest')
    ?.addEventListener(
      'click',
      requestPasswordReset
    );


  $('#resetModal')
    ?.addEventListener(
      'click',
      event => {

        if (
          event.target.id ===
          'resetModal'
        ) {

          closeResetModal();

        }

      }
    );


  $('#resetUsername')
    ?.addEventListener(
      'keydown',
      event => {

        if (
          event.key ===
          'Enter'
        ) {

          event.preventDefault();

          requestPasswordReset();

        }

      }
    );

}


/* =========================================================
   START
   ========================================================= */

function init() {

  initLogin();

  initResetEvents();

  renderHero();

  renderMatches();

  renderPicks();


  initMobile();

  initFilters();

  initAdmin();

  updateCountdown();


  setInterval(
    updateCountdown,
    1000
  );


  setInterval(
    updateLivePickTickers,
    1000
  );


  loadPublishedPicks();

}


document.addEventListener(
  'DOMContentLoaded',
  init
);
