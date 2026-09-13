# WINTIQ RELEASE

Upload the whole structure to GitHub Pages.

Files:
- index.html
- styles.css
- script.js
- picks.json
- live-data.json
- live-config.json
- manifest.webmanifest
- scripts/sync-live.mjs
- .github/workflows/live-sync.yml

The browser updates live data automatically without page reload.
The GitHub Action also refreshes live-data.json every five minutes.

IMPORTANT: GitHub Pages is static. The admin panel stores changes in the current
browser and can export JSON, but it cannot securely write repository files without
a backend or GitHub token. A real production auth system should be server-side.

Default accounts in script.js:
WINTIQ_MASTER / W!ntiqMaster#2026X
Ionix87 / Ajjw_291#12_O9s
Sxne1 / K211093##duik_

Change them before public release.

Music: the site contains an original WebAudio pulse with on/off and volume control.
No copyrighted Rich Amiri recording is bundled. Use a licensed track if you own the rights.
