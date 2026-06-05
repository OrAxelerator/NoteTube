# YouTube Notes

Extension Chromium locale pour prendre des notes Markdown par video YouTube.

## Demarrage

```bash
npm install
npm run build
```

Puis charger le dossier `dist` dans Chromium via `chrome://extensions` avec le mode developpeur.

## MVP code

- bouton `Notes` injecte dans `#menu` sur YouTube
- sidebar React avec editeur Markdown
- autosave IndexedDB via Dexie
- notes indexees par `videoId`
- dashboard global avec recherche Fuse.js
- ouverture d'une video depuis le dashboard avec sidebar auto-ouverte
- masquage automatique en fullscreen
- timestamps Markdown cliquables dans la preview
