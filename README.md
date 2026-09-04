# WINTIQ BET — GitHub + Discord

Die Website bleibt eine statische GitHub-Pages-Seite. Die WINTIQ-Picks werden jetzt aus `picks.json` geladen.

## Ablauf

`Admin → Picks bearbeiten → Picks zu GitHub senden → picks.json wird committed → GitHub Actions → Discord`

GitHub Actions reagiert nur auf Änderungen an `picks.json` im `main`-Branch. Wenn ein neuer Pick hinzugefügt wird, wird automatisch eine Discord-Embed-Nachricht gesendet.

## Einmalig einrichten

### 1. Discord Webhook

Erstelle in Discord für den gewünschten Channel einen Webhook und kopiere dessen URL.

### 2. GitHub Secret

Im GitHub-Repository:

`Settings → Secrets and variables → Actions → New repository secret`

Name:

`DISCORD_WEBHOOK_URL`

Value: deine Discord-Webhook-URL.

Die Webhook-URL gehört **nicht** in `script.js` oder `picks.json`.

### 3. GitHub Token für den Admin

Der Button **„Picks zu GitHub senden“** schreibt `picks.json` über die GitHub Contents API.

Erstelle dafür einen **Fine-grained personal access token**, beschränkt auf dieses Repository, mit:

- Repository access: nur dein WINTIQ-Repository
- Repository permissions → Contents: **Read and write**

Der Token wird im Browser nur für den aktuellen Upload verwendet und nicht von diesem Projekt gespeichert.

### 4. Admin benutzen

Im Admin Studio:

- GitHub Token: dein Fine-grained Token
- Repository: z. B. `deinname/WINTIQ-BET`
- Branch: `main`
- **Picks zu GitHub senden**

Danach wird `picks.json` committed. GitHub Pages veröffentlicht die neue Version und die Action prüft den Commit. Bei einem neu hinzugekommenen Pick geht eine Meldung an Discord.

## Wichtig

Die vorhandene Login-Seite ist weiterhin nur ein Frontend-Demo-Login und keine sichere Authentifizierung. Auch ein GitHub-Token sollte niemals in den Quellcode, in GitHub Secrets oder in öffentliche Dateien kopiert werden. Für ein echtes Produkt sollte der Admin-Zugriff serverseitig abgesichert werden.
