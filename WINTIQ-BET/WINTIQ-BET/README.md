# WINTIQ — Release 11.09.2026

Premium One-Page-Sportsbook-Demo im WINTIQ-Stil.

**Enthalten:** Hero mit Sportbild, Release-Countdown, Sportfilter, Live-Matches, Demo-Bet-Slip, Eventkarten, Mobile-Visual, responsive Navigation und Footer mit 18+/Responsible-Gaming-Hinweisen.

**Wichtig:** Das ist ausschließlich ein Frontend-/UI-Konzept. Keine Echtgeld-Wetten, keine Zahlungen, keine Ein-/Auszahlungen und keine echte Wettabwicklung.

## Lokal testen
1. Ordner in Visual Studio Code öffnen.
2. `index.html` öffnen.
3. Rechtsklick → **Open with Live Server** (VS-Code-Erweiterung „Live Server“) oder `index.html` direkt im Browser öffnen.

## GitHub Pages — einfach
1. Auf GitHub **New repository** → z. B. `axenvo-bet`.
2. Repository erstellen.
3. Alle Dateien dieses Ordners hochladen und committen.
4. **Settings → Pages** öffnen.
5. Bei **Build and deployment**: **Deploy from a branch**.
6. Branch **main**, Ordner **/(root)** → **Save**.
7. Nach dem Deployment auf **Visit site** klicken.

GitHub Pages kann statische HTML/CSS/JavaScript-Dateien direkt aus einem Repository veröffentlichen.

## GitHub Pages — mit Terminal
```bash
git init
git add .
git commit -m "WINTIQ initial release"
git branch -M main
git remote add origin DEIN-REPOSITORY
 git push -u origin main
```

Danach auf GitHub unter **Settings → Pages** `main` + `/(root)` auswählen.

## Bilder
Die Demo verwendet externe Unsplash-Bilder. Dafür braucht der Besucher beim Laden eine Internetverbindung.

## Eigenes Logo
Im Header ist ein stilisiertes WINTIQ-BET-Zeichen eingebaut. Für dein originales Logo kannst du später z. B. `assets/axenvo-logo.png` hinzufügen und den Logo-Block in `index.html` durch ein `<img>` ersetzen.


## Version 2
Diese Version wurde als WINTIQ rebrandet und um einen Live-Pulse-Ticker, eine Data/Numbers-Sektion, stärkere Micro-Interactions und ein markanteres WINTIQ-Wortzeichen erweitert.
