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

      /*
        Session nur wiederherstellen,
        wenn Benutzer UND Rolle mit
        dem festgelegten Account übereinstimmen.
      */

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

  const message =
    $('#resetMessage');

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


  /*
    Wir akzeptieren nur bekannte Accounts.

    Dadurch können nicht beliebige Fantasie-Accounts
    in das Admin-Postfach geschrieben werden.
  */

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

  /*
    Doppelte offene Anfrage desselben
    Benutzers verhindern.
  */

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

      /*
        DEMO:

        Passwort lokal aktualisieren.

        Hinweis:
        Diese Änderung gilt nur in diesem Browser.
      */

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
    odds: ['1.92', '1.88']
  }
];

function renderMatches(filter = 'all') {
  const container = $('#matches');
  if (!container) return;

  const matches = filter === 'all'
    ? MATCHES
    : MATCHES.filter(match => match.sport === filter);

  container.innerHTML = matches.map(match => {
    const oddsHtml = match.odds.map(odd => `
      <button class="odd" type="button" data-odd="${escapeHtml(odd)}">
        ${escapeHtml(odd)}
      </button>
    `).join('');

    return `
      <article class="match-card">
        <div class="match-top">
          <small>${escapeHtml(match.league)}</small>
          <span>${escapeHtml(match.time)}</span>
        </div>
        <div class="match-teams">
          <div>
            <strong>${escapeHtml(match.home)}</strong>
            <strong>${escapeHtml(match.away)}</strong>
          </div>
          <div class="score">
            <b>${escapeHtml(match.score[0])}</b>
            <span>:</span>
            <b>${escapeHtml(match.score[1])}</b>
          </div>
        </div>
        <div class="odds">${oddsHtml}</div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('.odd').forEach(button => {
    button.addEventListener('click', () => {
      showToast(`Quote ${button.dataset.odd} ausgewählt`);
    });
  });
}

/* =========================================================
   LIVE PICK TICKER
   ========================================================= */

function getPickLiveState(pick, index) {
  const fallbackStarts = [
    '2026-09-12T14:15:00+02:00',
    '2026-09-12T15:30:00+02:00',
    '2026-09-12T18:00:00+02:00'
  ];

  const rawStart = pick.startAt || fallbackStarts[index % fallbackStarts.length];
  const start = new Date(rawStart).getTime();
  const duration = Math.max(60, Number(pick.durationMinutes) || 105);
  const end = start + duration * 60 * 1000;
  const now = Date.now();

  if (!Number.isFinite(start)) {
    return { status: 'unknown', start: NaN, end: NaN, duration, elapsed: 0, minute: 0 };
  }

  if (now < start) {
    return { status: 'upcoming', start, end, duration, elapsed: 0, minute: 0 };
  }

  if (now >= end) {
    return { status: 'finished', start, end, duration, elapsed: duration, minute: duration };
  }

  const elapsed = Math.floor((now - start) / 60000);
  return {
    status: 'live',
    start,
    end,
    duration,
    elapsed,
    minute: Math.max(1, elapsed + 1)
  };
}

function getSimulatedPickScore(pick, index, liveState) {
  const seed = `${pick.match || ''}|${pick.tip || ''}|${index}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  hash = Math.abs(hash);

  if (liveState.status === 'upcoming' || liveState.status === 'unknown') {
    return [0, 0];
  }

  const progress = liveState.status === 'finished'
    ? 1
    : Math.min(1, liveState.elapsed / Math.max(1, liveState.duration));

  const home = Math.min(5, Math.floor(progress * (hash % 4 + 1)));
  const away = Math.min(5, Math.floor(progress * ((hash >> 3) % 3 + 1)));

  return [home, away];
}

function getPickVerdict(pick, index) {
  const live = getPickLiveState(pick, index);

  if (live.status === 'upcoming' || live.status === 'unknown') {
    return 'pending';
  }

  const [home, away] = getSimulatedPickScore(pick, index, live);
  const tip = String(pick.tip || '').toLowerCase();

  if (tip.includes('unentschieden') || tip.includes('draw')) {
    return home === away ? 'correct' : 'wrong';
  }

  if (tip.includes('auswärt') || tip.includes('away')) {
    return away > home ? 'correct' : 'wrong';
  }

  if (tip.includes('over') || tip.includes('mehr')) {
    return home + away >= 3 ? 'correct' : 'wrong';
  }

  if (tip.includes('under') || tip.includes('weniger')) {
    return home + away < 3 ? 'correct' : 'wrong';
  }

  return home > away ? 'correct' : 'wrong';
}

function formatPickStart(start) {
  if (!Number.isFinite(start)) return 'Startzeit nicht festgelegt';

  return new Date(start).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRemaining(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00';

  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getPickTeamNames(pick) {
  const parts = String(pick.match || '').split(/\s+[—–-]\s+/);
  return {
    home: parts[0]?.trim() || 'Team A',
    away: parts[1]?.trim() || 'Team B'
  };
}

function renderPickLiveTicker(pick, index) {
  const live = getPickLiveState(pick, index);
  const score = getSimulatedPickScore(pick, index, live);
  const verdict = getPickVerdict(pick, index);
  const teams = getPickTeamNames(pick);

  let statusLabel = 'STARTET BALD';
  let statusClass = 'pending';
  let meta = `Start ${formatPickStart(live.start)}`;
  let result = '<div class="pick-live-result pending">— Noch offen</div>';
  let timeText = 'Startzeit nicht festgelegt';

  if (live.status === 'live') {
    statusLabel = `LIVE · ${live.minute}'`;
    statusClass = 'live';
    meta = `Noch ${formatRemaining(live.end - Date.now())}`;
    timeText = `Läuft seit ${live.minute}'`;

    if (verdict === 'correct') {
      result = '<div class="pick-live-result correct">✓ AKTUELL RICHTIG</div>';
    } else if (verdict === 'wrong') {
      result = '<div class="pick-live-result wrong">✕ AKTUELL FALSCH</div>';
    } else {
      result = '<div class="pick-live-result pending">— AKTUELL OFFEN</div>';
    }
  } else if (live.status === 'finished') {
    statusLabel = 'BEENDET';
    statusClass = 'done';
    meta = 'Spiel beendet';
    timeText = `Endstand nach ${live.duration} Min.`;
    result = verdict === 'correct'
      ? '<div class="pick-live-result correct">✓ PICK RICHTIG</div>'
      : '<div class="pick-live-result wrong">✕ PICK FALSCH</div>';
  }

  return `
    <div class="pick-live pick-live-${statusClass}">
      <div class="pick-live-head">
        <span class="pick-live-dot ${statusClass}">● ${statusLabel}</span>
        <span>${escapeHtml(pick.sport || 'SPORT')}</span>
      </div>

      <div class="pick-live-score">
        <span>${escapeHtml(teams.home)}</span>
        <strong>${score[0]} : ${score[1]}</strong>
        <span>${escapeHtml(teams.away)}</span>
      </div>

      <div class="pick-live-meta">
        <span>${escapeHtml(meta)}</span>
        <span>${escapeHtml(timeText)}</span>
      </div>

      ${result}

      <div class="pick-start">
        Tipp: <b>${escapeHtml(pick.tip || '—')}</b>
      </div>
    </div>
  `;
}

function renderPicksLiveTicker() {
  const container = $('#picksLiveTicker');
  if (!container) return;

  if (!state.picks.length) {
    container.innerHTML = '';
    return;
  }

  const items = state.picks.map((pick, index) => {
    const live = getPickLiveState(pick, index);
    const score = getSimulatedPickScore(pick, index, live);
    const teams = getPickTeamNames(pick);

    let stateLabel = `START ${formatPickStart(live.start)}`;
    let stateClass = 'upcoming';

    if (live.status === 'live') {
      stateLabel = `LIVE ${live.minute}'`;
      stateClass = 'live';
    } else if (live.status === 'finished') {
      stateLabel = 'FINAL';
      stateClass = 'finished';
    }

    return `
      <div class="picks-live-ticker-item ${stateClass}">
        <span>${escapeHtml(teams.home)} <strong>${score[0]}:${score[1]}</strong> ${escapeHtml(teams.away)}</span>
        <span class="ticker-state">${escapeHtml(stateLabel)}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="picks-live-ticker-track">${items}</div>`;
}

function updateLivePickTickers() {
  document.querySelectorAll('[data-pick-live]').forEach(element => {
    const index = Number(element.dataset.pickLive);
    const pick = state.picks[index];
    if (pick) {
      element.innerHTML = renderPickLiveTicker(pick, index);
    }
  });

  renderPicksLiveTicker();
}

/* =========================================================
   PICKS
   ========================================================= */

function renderPicks() {
  const grid = $('#pickGrid');
  if (!grid) return;

  if (!state.picks.length) {
    grid.innerHTML = `<div class="empty">Aktuell keine Picks veröffentlicht.</div>`;
    return;
  }

  grid.innerHTML = state.picks.map((pick, index) => `
    <article class="pick-card">
      <div class="pick-top">
        <span>${escapeHtml(pick.tag)}</span>
        <small>#${String(index + 1).padStart(2, '0')}</small>
      </div>

      <small class="pick-sport">${escapeHtml(pick.sport)}</small>

      <h3>${escapeHtml(pick.match)}</h3>

      <div class="pick-tip">
        <span>TIPP</span>
        <strong>${escapeHtml(pick.tip)}</strong>
      </div>

      <p>${escapeHtml(pick.reason)}</p>

      <div class="pick-bottom">
        <span>QUOTE</span>
        <strong>${escapeHtml(pick.odd)}</strong>
      </div>

      <div data-pick-live="${index}">
        ${renderPickLiveTicker(pick, index)}
      </div>
    </article>
  `).join('');

  renderPicksLiveTicker();
}

/* =========================================================
   GITHUB
   ========================================================= */

function getGitHubHeaders(
  token
) {

  return {

    Accept:
      'application/vnd.github+json',

    Authorization:
      `Bearer ${token}`,

    'X-GitHub-Api-Version':
      '2022-11-28',

    'Content-Type':
      'application/json'

  };

}


function getGitHubSettings() {

  const token =
    $('#ghToken')
      ?.value
      .trim() || '';


  const repo =
    $('#ghRepo')
      ?.value
      .trim() || '';


  const branch =
    $('#ghBranch')
      ?.value
      .trim() || 'main';


  return {
    token,
    repo,
    branch
  };

}


/* =========================================================
   GITHUB TOKEN TEST
   ========================================================= */

async function testGitHubToken() {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  const {
    token,
    repo,
    branch
  } =
    getGitHubSettings();


  if (!token) {

    setGitHubStatus(
      'Bitte zuerst deinen GitHub Token eintragen.',
      'error'
    );

    return;

  }


  if (
    !repo ||
    !repo.includes('/')
  ) {

    setGitHubStatus(
      'Repository muss z.B. bodycam1212-lab/axenvo-bet sein.',
      'error'
    );

    return;

  }


  setGitHubStatus(
    'GitHub-Zugang wird geprüft …',
    'loading'
  );


  try {

    const headers =
      getGitHubHeaders(
        token
      );


    const repoApi =
      `https://api.github.com/repos/${repo}`;


    const repoResponse =
      await fetch(
        repoApi,
        {
          method: 'GET',
          headers
        }
      );


    const repoData =
      await repoResponse
        .json()
        .catch(() => ({}));


    if (!repoResponse.ok) {

      throw new Error(
        repoData.message ||
        `GitHub Fehler ${repoResponse.status}`
      );

    }


    if (
      repoData.permissions &&
      repoData.permissions.push === false
    ) {

      throw new Error(
        'Der Token kann dieses Repository lesen, aber nicht schreiben.'
      );

    }


    const fileApi =
      `https://api.github.com/repos/${repo}/contents/picks.json?ref=${encodeURIComponent(branch)}`;


    const fileResponse =
      await fetch(
        fileApi,
        {
          method: 'GET',
          headers
        }
      );


    const fileData =
      await fileResponse
        .json()
        .catch(() => ({}));


    if (!fileResponse.ok) {

      throw new Error(
        fileData.message ||
        `picks.json konnte nicht gelesen werden (${fileResponse.status})`
      );

    }


    setGitHubStatus(
      `✓ GitHub funktioniert. Repository und picks.json auf "${branch}" sind erreichbar.`,
      'ok'
    );


  } catch (error) {

    console.error(
      'GitHub Token Test fehlgeschlagen:',
      error
    );


    setGitHubStatus(
      `✕ ${error.message}`,
      'error'
    );

  }

}


function setGitHubStatus(
  message,
  type = ''
) {

  const status =
    $('#ghStatus');

  if (!status) {
    return;
  }


  status.textContent =
    message;

  status.className =
    `github-status ${type}`;

}


/* =========================================================
   GITHUB PUBLISH
   ========================================================= */

async function publishPicksToGitHub() {

  if (!isAdmin()) {

    showToast(
      'Keine Berechtigung.'
    );

    return;

  }


  const btn =
    $('#publishGitHub');


  const {
    token,
    repo,
    branch
  } =
    getGitHubSettings();


  if (!token) {

    showToast(
      'GitHub Token fehlt.'
    );

    setGitHubStatus(
      'Bitte zuerst den GitHub Token eintragen.',
      'error'
    );

    return;

  }


  if (
    !repo ||
    !repo.includes('/')
  ) {

    showToast(
      'Repository ist ungültig.'
    );

    return;

  }


  if (btn) {

    btn.disabled = true;

    btn.textContent =
      'Wird veröffentlicht …';

  }


  setGitHubStatus(
    'Picks werden zu GitHub gesendet …',
    'loading'
  );


  try {

    const headers =
      getGitHubHeaders(
        token
      );


    const api =
      `https://api.github.com/repos/${repo}/contents/picks.json`;


    const currentResponse =
      await fetch(
        `${api}?ref=${encodeURIComponent(branch)}`,
        {
          method: 'GET',
          headers
        }
      );


    let sha = null;


    if (currentResponse.ok) {

      const currentFile =
        await currentResponse.json();

      sha =
        currentFile.sha;

    } else if (
      currentResponse.status !== 404
    ) {

      const errorData =
        await currentResponse
          .json()
          .catch(() => ({}));


      throw new Error(
        errorData.message ||
        `GitHub Fehler ${currentResponse.status}`
      );

    }


    const content =
      JSON.stringify(
        {
          picks:
            state.picks
        },
        null,
        2
      ) + '\n';


    const encodedContent =
      utf8ToBase64(
        content
      );


    const body = {

      message:
        'Update WINTIQ picks',

      content:
        encodedContent,

      branch:
        branch

    };


    if (sha) {

      body.sha =
        sha;

    }


    const response =
      await fetch(
        api,
        {
          method: 'PUT',
          headers,
          body:
            JSON.stringify(body)
        }
      );


    const result =
      await response
        .json()
        .catch(() => ({}));


    if (!response.ok) {

      let message =
        result.message ||
        `GitHub Fehler ${response.status}`;


      if (
        response.status === 401
      ) {

        message =
          'GitHub Token ist ungültig oder abgelaufen.';

      }


      if (
        response.status === 403
      ) {

        message =
          result.message ||
          'GitHub verweigert den Schreibzugriff.';

      }


      if (
        response.status === 409
      ) {

        message =
          'GitHub meldet einen Konflikt. Bitte erneut versuchen.';

      }


      throw new Error(
        message
      );

    }


    const tokenInput =
      $('#ghToken');


    if (tokenInput) {
      tokenInput.value = '';
    }


    setGitHubStatus(
      '✓ Picks erfolgreich zu GitHub gesendet.',
      'ok'
    );


    showToast(
      'Picks erfolgreich zu GitHub gesendet ✓'
    );


    setTimeout(
      loadPublishedPicks,
      1200
    );


  } catch (error) {

    console.error(
      'GitHub Veröffentlichung fehlgeschlagen:',
      error
    );


    setGitHubStatus(
      `✕ ${error.message}`,
      'error'
    );


    showToast(
      `Fehler: ${error.message}`
    );


  } finally {

    if (btn) {

      btn.disabled = false;

      btn.textContent =
        'Picks zu GitHub senden';

    }

  }

}


/* =========================================================
   PICKS AUS GITHUB LADEN
   ========================================================= */

async function loadPublishedPicks() {

  const repo =
    $('#ghRepo')
      ?.value
      .trim() ||
    'bodycam1212-lab/axenvo-bet';


  const branch =
    $('#ghBranch')
      ?.value
      .trim() ||
    'main';


  try {

    const api =
      `https://api.github.com/repos/${repo}/contents/picks.json?ref=${encodeURIComponent(branch)}`;


    const response =
      await fetch(
        api,
        {
          method: 'GET',

          headers: {
            Accept:
              'application/vnd.github+json',

            'X-GitHub-Api-Version':
              '2022-11-28'
          },

          cache:
            'no-store'
        }
      );


    if (!response.ok) {

      throw new Error(
        `picks.json konnte nicht geladen werden (${response.status})`
      );

    }


    const data =
      await response.json();


    if (!data.content) {

      throw new Error(
        'GitHub hat keinen Dateiinhalt geliefert.'
      );

    }


    const binary =
      atob(
        data.content.replace(
          /\n/g,
          ''
        )
      );


    const bytes =
      Uint8Array.from(
        binary,
        char =>
          char.charCodeAt(0)
      );


    const content =
      new TextDecoder()
        .decode(bytes);


    const remote =
      JSON.parse(
        content
      );


    if (
      Array.isArray(
        remote.picks
      )
    ) {

      state.picks =
        remote.picks;

      saveState();

      renderPicks();

    }


  } catch (error) {

    console.warn(
      'Remote picks konnten nicht geladen werden:',
      error
    );

  }

}


/* =========================================================
   ADMIN
   ========================================================= */

function openAdmin() {

  if (!isAdmin()) {

    showToast(
      'Kein Zugriff auf den Admin-Bereich.'
    );

    return;

  }


  const panel =
    $('#adminPanel');

  if (!panel) {
    return;
  }


  fillAdminForm();

  panel.classList.remove(
    'hidden'
  );


  /*
    Beim Öffnen des Admin-Bereichs
    direkt das Postfach aktualisieren.
  */

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
                <input type="datetime-local" data-field="startAt" data-index="${index}" value="${pick.startAt ? new Date(pick.startAt).toISOString().slice(0,16) : ''}">
              </label>

              <label>
                Dauer (Min.)
                <input type="number" min="1" data-field="durationMinutes" data-index="${index}" value="${escapeHtml(pick.durationMinutes ?? 105)}">
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

          const index =
            Number(
              event.target.dataset.index
            );


          const field =
            event.target.dataset.field;


          if (
            state.picks[index] &&
            field
          ) {

            state.picks[index][field] =
              event.target.value;

          }

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
      new Date(Date.now() + 30 * 60 * 1000).toISOString(),

    durationMinutes:
      105

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
    () => {
      updateCountdown();
      updateLivePickTickers();
    },
    1000
  );



  /*
    picks.json beim Laden aktualisieren.
  */

  loadPublishedPicks();

}


document.addEventListener(
  'DOMContentLoaded',
  init
);
