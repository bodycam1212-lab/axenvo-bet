/* =========================================================
   WINTIQ BET
   Frontend Demo + GitHub Picks Publishing
   ========================================================= */


/* LOGIN */
const DEMO_USER = 'WINTIQ_OWNER';
const DEMO_PASS = 'Wintiq#Bet2026!X7';

/* =========================================================
   DEFAULT DATEN
   ========================================================= */

const DEFAULTS = {
  heroTitle: 'SPORT.\nDATA.\nMOMENTUM.',

  heroText:
    'Ein radikales Sports-Interface für schnelle Entscheidungen, klare Daten und redaktionelle Picks.',

  release: '2026-09-11',

  pulse:
    'Live intelligence · Demo feed',

  picks: [
    {
      sport: 'FUSSBALL',
      match: 'FC Bayern — FC SCHALKE 04',
      tip: 'Heimsieg',
      reason: 'WINTIQ-Einschätzung: TEST der Discord-Verbindung.',
      tag: 'TOP PICK',
      odd: '9.09'
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

let state = loadState();


/* =========================================================
   HELPER
   ========================================================= */

const $ = selector => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);

  let binary = '';

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function showToast(message) {
  const toast = $('#toast');

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}


/* =========================================================
   LOCAL STATE
   ========================================================= */

function loadState() {
  try {
    const saved = localStorage.getItem('wintiqState');

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        ...DEFAULTS,
        ...parsed,
        picks: Array.isArray(parsed.picks)
          ? parsed.picks
          : DEFAULTS.picks
      };
    }
  } catch (error) {
    console.error('State konnte nicht geladen werden:', error);
  }

  return JSON.parse(JSON.stringify(DEFAULTS));
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

function unlockApp() {
  document.body.classList.remove('locked');

  $('#loginGate')?.classList.add('hidden');

  $('#app')?.classList.remove('app-hidden');

  sessionStorage.setItem('wintiqUnlocked', '1');
}

function lockApp() {
  sessionStorage.removeItem('wintiqUnlocked');

  document.body.classList.add('locked');

  $('#loginGate')?.classList.remove('hidden');

  $('#app')?.classList.add('app-hidden');
}

function initLogin() {
  const form = $('#loginForm');

  if (!form) return;

  if (sessionStorage.getItem('wintiqUnlocked') === '1') {
    unlockApp();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();

    const user = $('#loginUser')?.value.trim() || '';
    const pass = $('#loginPass')?.value || '';

    const error = $('#loginError');

    if (user === DEMO_USER && pass === DEMO_PASS) {
      if (error) {
        error.textContent = '';
      }

      unlockApp();

      return;
    }

    if (error) {
      error.textContent =
        'Benutzername oder Passwort ist falsch.';
    }
  });

  $('#logout')?.addEventListener('click', lockApp);
}


/* =========================================================
   HERO
   ========================================================= */

function renderHero() {
  const title = $('#heroTitle');
  const text = $('#heroText');
  const pulse = $('#pulseText');
  const releaseMeta = $('#releaseMeta');
  const releaseBig = $('#releaseDateBig');

  if (title) {
    title.innerHTML = escapeHtml(state.heroTitle)
      .replace(/\n/g, '<br>');
  }

  if (text) {
    text.textContent = state.heroText;
  }

  if (pulse) {
    pulse.textContent = state.pulse;
  }

  const date = formatDate(state.release);

  if (releaseMeta) {
    releaseMeta.textContent = date;
  }

  if (releaseBig) {
    releaseBig.textContent = date;
  }
}

function formatDate(dateString) {
  if (!dateString) return '—';

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('de-DE');
}


/* =========================================================
   COUNTDOWN
   ========================================================= */

function updateCountdown() {
  const timer = $('#timer');
  const days = $('#days');

  if (!state.release) return;

  const target = new Date(
    `${state.release}T00:00:00`
  ).getTime();

  const now = Date.now();

  let diff = target - now;

  if (diff < 0) {
    diff = 0;
  }

  const totalSeconds =
    Math.floor(diff / 1000);

  const d =
    Math.floor(totalSeconds / 86400);

  const h =
    Math.floor((totalSeconds % 86400) / 3600);

  const m =
    Math.floor((totalSeconds % 3600) / 60);

  const s =
    totalSeconds % 60;

  const pad = value =>
    String(value).padStart(2, '0');

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
    time: 'LIVE 68\'',
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

  const matches =
    filter === 'all'
      ? MATCHES
      : MATCHES.filter(match => match.sport === filter);

  container.innerHTML = matches.map(match => {

    const oddsHtml = match.odds
      .map(odd => `
        <button
          class="odd"
          type="button"
          data-odd="${escapeHtml(odd)}"
        >
          ${escapeHtml(odd)}
        </button>
      `)
      .join('');

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

        <div class="odds">
          ${oddsHtml}
        </div>

      </article>
    `;
  }).join('');

  container
    .querySelectorAll('.odd')
    .forEach(button => {
      button.addEventListener('click', () => {
        addToSlip(button.dataset.odd);
      });
    });
}


/* =========================================================
   BET SLIP
   ========================================================= */

let slipItems = [];

function addToSlip(odd) {
  slipItems.push(Number(odd));

  renderSlip();

  showToast(`Quote ${odd} hinzugefügt`);
}

function renderSlip() {
  const items = $('#items');
  const total = $('#total');

  if (!items || !total) return;

  if (!slipItems.length) {
    items.innerHTML = `
      <div class="empty">
        Noch keine Demo-Auswahl.
      </div>
    `;

    total.textContent = '—';

    return;
  }

  items.innerHTML = slipItems
    .map((odd, index) => `
      <div class="slip-item">
        <span>Auswahl ${index + 1}</span>
        <strong>${odd.toFixed(2)}</strong>
      </div>
    `)
    .join('');

  const combined =
    slipItems.reduce(
      (sum, odd) => sum * odd,
      1
    );

  total.textContent =
    combined.toFixed(2);
}

function initSlip() {
  $('#clear')?.addEventListener('click', () => {
    slipItems = [];

    renderSlip();
  });

  $('#place')?.addEventListener('click', () => {
    if (!slipItems.length) {
      showToast('Bitte zuerst eine Demo-Auswahl anklicken.');
      return;
    }

    showToast(
      'Demo-Tipp ausgewählt · kein Echtgeld.'
    );
  });

  renderSlip();
}


/* =========================================================
   PICKS
   ========================================================= */

function renderPicks() {
  const grid = $('#pickGrid');

  if (!grid) return;

  if (!state.picks.length) {
    grid.innerHTML = `
      <div class="empty">
        Aktuell keine Picks veröffentlicht.
      </div>
    `;

    return;
  }

  grid.innerHTML = state.picks.map((pick, index) => `
    <article class="pick-card">

      <div class="pick-top">
        <span>${escapeHtml(pick.tag)}</span>
        <small>#${String(index + 1).padStart(2, '0')}</small>
      </div>

      <small class="pick-sport">
        ${escapeHtml(pick.sport)}
      </small>

      <h3>
        ${escapeHtml(pick.match)}
      </h3>

      <div class="pick-tip">
        <span>TIPP</span>
        <strong>${escapeHtml(pick.tip)}</strong>
      </div>

      <p>
        ${escapeHtml(pick.reason)}
      </p>

      <div class="pick-bottom">
        <span>QUOTE</span>
        <strong>${escapeHtml(pick.odd)}</strong>
      </div>

    </article>
  `).join('');
}


/* =========================================================
   GITHUB
   ========================================================= */

function getGitHubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

function getGitHubSettings() {
  const token =
    $('#ghToken')?.value.trim() || '';

  const repo =
    $('#ghRepo')?.value.trim() || '';

  const branch =
    $('#ghBranch')?.value.trim() || 'main';

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

  const status = $('#ghStatus');

  const {
    token,
    repo,
    branch
  } = getGitHubSettings();

  if (!token) {
    setGitHubStatus(
      'Bitte zuerst deinen GitHub Token eintragen.',
      'error'
    );

    return;
  }

  if (!repo || !repo.includes('/')) {
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
      getGitHubHeaders(token);

    const repoApi =
      `https://api.github.com/repos/${repo}`;

    const repoResponse =
      await fetch(repoApi, {
        method: 'GET',
        headers
      });

    const repoData =
      await repoResponse.json().catch(() => ({}));

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
        'Der Token kann dieses Repository lesen, aber nicht schreiben. Prüfe "Contents: Read and write".'
      );
    }

    const fileApi =
      `https://api.github.com/repos/${repo}/contents/picks.json?ref=${encodeURIComponent(branch)}`;

    const fileResponse =
      await fetch(fileApi, {
        method: 'GET',
        headers
      });

    const fileData =
      await fileResponse.json().catch(() => ({}));

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

function setGitHubStatus(message, type = '') {

  const status = $('#ghStatus');

  if (!status) return;

  status.textContent = message;

  status.className =
    `github-status ${type}`;
}


/* =========================================================
   GITHUB PUBLISH
   ========================================================= */

async function publishPicksToGitHub() {

  const btn =
    $('#publishGitHub');

  const {
    token,
    repo,
    branch
  } = getGitHubSettings();

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

  if (!repo || !repo.includes('/')) {
    showToast(
      'Repository ist ungültig.'
    );

    setGitHubStatus(
      'Repository muss z.B. bodycam1212-lab/axenvo-bet sein.',
      'error'
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
      getGitHubHeaders(token);

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

      sha = currentFile.sha;

    } else if (currentResponse.status !== 404) {

      const errorData =
        await currentResponse.json()
          .catch(() => ({}));

      throw new Error(
        errorData.message ||
        `GitHub Fehler ${currentResponse.status}`
      );
    }

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
      message:
        'Update WINTIQ picks',
      content:
        encodedContent,
      branch:
        branch
    };

    if (sha) {
      body.sha = sha;
    }

    const response =
      await fetch(api, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });

    const result =
      await response.json()
        .catch(() => ({}));

    if (!response.ok) {

      let message =
        result.message ||
        `GitHub Fehler ${response.status}`;

      if (response.status === 401) {
        message =
          'GitHub Token ist ungültig oder abgelaufen.';
      }

      if (response.status === 403) {
        message =
          result.message ||
          'GitHub verweigert den Schreibzugriff. Prüfe Contents: Read and write.';
      }

      if (response.status === 409) {
        message =
          'GitHub meldet einen Konflikt. Bitte erneut versuchen.';
      }

      if (response.status === 422) {
        message =
          result.message ||
          'GitHub konnte die Datei nicht aktualisieren.';
      }

      throw new Error(message);
    }

    $('#ghToken').value = '';

    setGitHubStatus(
      '✓ Picks erfolgreich zu GitHub gesendet.',
      'ok'
    );

    showToast(
      'Picks erfolgreich zu GitHub gesendet ✓'
    );

    setTimeout(() => {
      loadPublishedPicks();
    }, 1200);

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
    $('#ghRepo')?.value.trim() ||
    'bodycam1212-lab/axenvo-bet';

  const branch =
    $('#ghBranch')?.value.trim() ||
    'main';

  try {

    const api =
      `https://api.github.com/repos/${repo}/contents/picks.json?ref=${encodeURIComponent(branch)}`;

    const response =
      await fetch(api, {
        method: 'GET',
        headers: {
          Accept:
            'application/vnd.github+json',
          'X-GitHub-Api-Version':
            '2022-11-28'
        },
        cache: 'no-store'
      });

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
      atob(data.content.replace(/\n/g, ''));

    const bytes =
      Uint8Array.from(
        binary,
        char => char.charCodeAt(0)
      );

    const content =
      new TextDecoder().decode(bytes);

    const remote =
      JSON.parse(content);

    if (Array.isArray(remote.picks)) {

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

  const panel =
    $('#adminPanel');

  if (!panel) return;

  fillAdminForm();

  panel.classList.remove('hidden');
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

  if (!container) return;

  container.innerHTML =
    state.picks.map((pick, index) => `
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

          <label class="full">
            Begründung
            <textarea
              data-field="reason"
              data-index="${index}"
              rows="3"
            >${escapeHtml(pick.reason)}</textarea>
          </label>

        </div>

      </div>
    `).join('');

  container
    .querySelectorAll('[data-field]')
    .forEach(input => {

      input.addEventListener(
        'input',
        event => {

          const index =
            Number(event.target.dataset.index);

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
    .querySelectorAll('.remove-pick')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const index =
            Number(button.dataset.index);

          state.picks.splice(index, 1);

          renderAdminPicks();
        }
      );
    });
}


/* =========================================================
   ADD PICK
   ========================================================= */

function addPick() {

  state.picks.push({
    sport: 'FUSSBALL',
    match: 'Neue Partie — Gegner',
    tip: 'Heimsieg',
    reason:
      'WINTIQ-Einschätzung: Neue redaktionelle Bewertung.',
    tag: 'NEW',
    odd: '1.90'
  });

  renderAdminPicks();
}


/* =========================================================
   SAVE ADMIN
   ========================================================= */

function saveAdmin() {

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

  const confirmed =
    confirm(
      'Demo wirklich zurücksetzen?'
    );

  if (!confirmed) return;

  state =
    JSON.parse(
      JSON.stringify(DEFAULTS)
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

  if (!mobile || !hamburger) return;

  hamburger.addEventListener(
    'click',
    () => {
      mobile.classList.toggle('open');
    }
  );

  mobile
    .querySelectorAll('a')
    .forEach(link => {

      link.addEventListener(
        'click',
        () => {
          mobile.classList.remove('open');
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
              item.classList.remove('active');
            });

          chip.classList.add('active');

          renderMatches(
            chip.dataset.sport || 'all'
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
   START
   ========================================================= */

function init() {

  initLogin();

  renderHero();

  renderMatches();

  renderPicks();

  initSlip();

  initMobile();

  initFilters();

  initAdmin();

  updateCountdown();

  setInterval(
    updateCountdown,
    1000
  );

  loadPublishedPicks();
}

document.addEventListener(
  'DOMContentLoaded',
  init
);
