# Politique de confidentialité

Cette extension "YouTube Notes" est conçue pour fonctionner localement dans ton navigateur et n’envoie pas de données à un serveur externe.

## Ce que l’extension peut faire

- Stocker des notes et des préférences dans le stockage local du navigateur (`chrome.storage` / `browser.storage`).
- Interagir avec les pages YouTube uniquement lorsque tu es sur un site autorisé.
- Afficher une interface de popup et une page d’options sans transmettre de données à des tiers.

## Données stockées

- Les notes sont conservées localement dans l’espace de stockage de l’extension.
- Elles ne sont pas synchronisées automatiquement vers un serveur externe.
- Si le navigateur synchronise les données de l’extension via un compte (fonctionnalité du navigateur), c’est géré par le navigateur lui-même.

## Permissions utilisées dans le manifeste

### `storage`

- Permet à l’extension de sauvegarder et de lire les notes et préférences locales.
- C’est une permission limitée au stockage interne de l’extension.
- Elle ne donne pas accès aux fichiers de l’ordinateur ni aux données d’autres extensions.

### `tabs`

- Permet de lire des informations de base sur les onglets ouverts.
- Normalement utilisé pour vérifier l’URL de l’onglet actif ou savoir si l’utilisateur est sur YouTube.
- Cela ne donne pas un accès complet au contenu de la page, mais seulement aux métadonnées de l’onglet.

### `host_permissions` pour YouTube

- L’extension est autorisée uniquement sur :
  - `https://*.youtube.com/*`
  - `https://*.youtube-nocookie.com/*`
- Elle ne peut pas agir sur d’autres sites.
- Cela limite son champ d’action à YouTube, ce qui est meilleur pour la confidentialité.

### `content_scripts`

- Le script `src/content/inject.ts` est injecté dans les pages YouTube.
- Le fichier CSS `src/content/styles.css` est appliqué uniquement sur ces pages.
- Ces ressources sont utilisées pour afficher l’interface de prise de notes sur YouTube.
- Cela ne signifie pas que l’extension peut lire ou envoyer des données en dehors de YouTube.

## Web Accessible Resources

- Cette configuration est générée automatiquement par le build.
- Elle liste les fichiers que la page peut charger depuis l’extension.
- Ce n’est pas une permission de collecte de données, c’est juste un mécanisme de distribution de fichiers internes.

## En résumé

- L’extension fonctionne essentiellement localement.
- Elle ne transmet pas d’informations à des serveurs externes.
- Son accès est limité au stockage local, aux onglets et aux pages YouTube autorisées.
- La confidentialité est préservée tant que l’extension reste utilisée telle quelle.

---

# Privacy Policy

This "YouTube Notes" extension is designed to work locally in your browser and does not send data to an external server.

## What the extension can do

- Store notes and preferences in the browser's local storage (`chrome.storage` / `browser.storage`).
- Interact with YouTube pages only when you are on an authorized site.
- Display a popup interface and an options page without sending data to third parties.

## Data stored

- Notes are kept locally in the extension's storage area.
- They are not automatically synced to an external server.
- If the browser syncs extension data through a browser account, that is managed by the browser itself.

## Permissions used in the manifest

### `storage`

- Allows the extension to save and read local notes and preferences.
- This is limited to the extension's internal storage.
- It does not grant access to computer files or data from other extensions.

### `tabs`

- Allows reading basic information about open tabs.
- Usually used to check the active tab URL or determine whether the user is on YouTube.
- This does not grant full access to page content, only tab metadata.

### `host_permissions` for YouTube

- The extension is allowed only on:
  - `https://*.youtube.com/*`
  - `https://*.youtube-nocookie.com/*`
- It cannot act on other websites.
- This limits its scope to YouTube, which is better for privacy.

### `content_scripts`

- The script `src/content/inject.ts` is injected into YouTube pages.
- The CSS file `src/content/styles.css` is applied only on those pages.
- These resources are used to display the note-taking interface on YouTube.
- That does not mean the extension can read or send data outside of YouTube.

## Web Accessible Resources

- This configuration is generated automatically by the build.
- It lists the files that the page can load from the extension.
- This is not a data collection permission; it is just a mechanism for distributing internal files.

## In summary

- The extension operates primarily locally.
- It does not transmit information to external servers.
- Its access is limited to local storage, tabs, and authorized YouTube pages.
- Privacy is preserved as long as the extension is used as is.
