# Explication du projet YouTube Notes

Ce projet est une extension Chromium locale pour prendre des notes Markdown liées à des vidéos YouTube.

## Architecture globale

- `manifest.config.ts` : définit le manifeste Chrome (permissions, pages, scripts injectés).
- `vite.config.ts` : configure Vite et le plugin CRX pour créer l’extension.
- `package.json` : gère les dépendances et les scripts NPM.
- `src/content/` : code injecté sur YouTube.
- `src/db/` : stockage des notes.
- `src/popup/` : popup de l’extension.
- `src/dashboard/` : page dashboard/options pour gérer toutes les notes.
- `src/types/` : types TypeScript, notamment `VideoNote`.

## Comment l’extension fonctionne

### 1. Injection sur YouTube

- Le `content_script` est `src/content/inject.ts`.
- Il monte une sidebar React grâce à `src/content/sidebar.tsx`.
- Il injecte un bouton `Notes` dans le menu YouTube via `src/content/injectButton.ts`.
- Il observe les changements de page et de DOM pour réinjecter le bouton sur les navigations internes de YouTube.

### 2. Sidebar React

- `src/content/sidebar.tsx` contient le composant principal de l’UI sur YouTube.
- Il affiche un éditeur Markdown (`@uiw/react-md-editor`) et une preview.
- Il récupère le `videoId`, le titre et la miniature via `src/content/youtube.ts`.
- Il sauvegarde automatiquement les notes après chaque saisie.
- Les timestamps écrits dans les notes peuvent être cliqués pour se positionner dans la vidéo.

### 3. Stockage des notes

- Le stockage est géré par `src/db/database.ts`.
- Les notes sont indexées par `videoId`.
- Par défaut, le code utilise `chrome.storage.local`.
- Si `chrome.storage.local` n’est pas disponible, il utilise `localStorage`.
- Il y a des fonctions pour :
  - récupérer une note (`getNote`)
  - créer ou mettre à jour une note (`upsertNote`)
  - supprimer une note (`deleteNote`)
  - lister toutes les notes (`listNotes`)

### 4. Popup de l’extension

- `src/popup/popup.tsx` est le code React du popup.
- `src/popup/index.html` est la page HTML de base qui monte le popup.
- Le popup contient un bouton pour ouvrir le dashboard.

### 5. Dashboard global

- `src/dashboard/dashboard.tsx` est la page React du dashboard.
- `src/dashboard/index.html` est la page HTML qui l’héberge.
- Le dashboard liste toutes les notes stockées.
- Il propose :
  - recherche floue avec `Fuse.js`
  - tri par date ou titre
  - modification de notes
  - suppression de notes
  - ouverture de la vidéo YouTube correspondante
  - export Markdown en `.md`

## Comment React et NPM interviennent

- `npm install` installe les dépendances.
- `npm run dev` démarre Vite en mode développement.
- `npm run build` compile le code TypeScript et génère le package d’extension.
- Vite transforme le code source `src/**/*.ts` et `src/**/*.tsx` en fichiers JavaScript utilisables par le navigateur.
- React rend le DOM à l’intérieur des éléments `<div id="root">` des pages HTML.

## Correction de l’erreur de build

L’erreur suivante se produisait durant le build :

```
The emitted file "src/dashboard/index.html" overwrites a previously emitted file of the same name.
```

### Cause probable

- `src/dashboard/index.html` était référencé deux fois dans la build :
  - une fois comme page d’options (`options_page`)
  - et une seconde fois comme ressource web accessible (`web_accessible_resources`)
- Cela peut provoquer un double traitement du même fichier HTML par Vite/CRXJS.

### Correction appliquée

- J’ai supprimé l’entrée `web_accessible_resources` dans `manifest.config.ts`.
- `options_page: "src/dashboard/index.html"` suffit pour exposer la page dashboard dans l’extension.
- Le dashboard peut toujours être ouvert depuis le popup avec `chrome.runtime.getURL("src/dashboard/index.html")`.

## Résumé rapide des fichiers importants

- `manifest.config.ts` : configuration extension Chrome.
- `vite.config.ts` : build Vite + CRX.
- `src/content/inject.ts` : initialisation de la sidebar sur YouTube.
- `src/content/sidebar.tsx` : UI de prise de notes sur YouTube.
- `src/content/youtube.ts` : extraction `videoId`, titre, miniature, timestamps.
- `src/db/database.ts` : stockage local des notes.
- `src/dashboard/dashboard.tsx` : gestion globale des notes.
- `src/popup/popup.tsx` : popup extension.

## Prochaines vérifications

Après cette correction, relance la commande :

```bash
npm run build
```