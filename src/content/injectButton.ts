import { getVideoId } from "./youtube";

const BUTTON_ID = "yt-notes-btn";

function findWatchMenu(): Element | null {
  const menu = document.querySelector("#menu.style-scope.ytd-watch-metadata") ?? document.querySelector("#menu");
  if (!menu) {
    console.debug("[yt-notes] findWatchMenu: #menu not found");
    return null;
  }

  const target = menu.querySelector("#top-level-buttons-computed") ?? menu;
  console.debug("[yt-notes] findWatchMenu", { menu, target });
  return target;
}

function createNotesButton(onClick: () => void): HTMLElement {
  const wrapper = document.createElement("yt-notes-button");
  wrapper.id = BUTTON_ID;
  wrapper.className = "yt-notes-menu-button-wrapper";

  const button = document.createElement("button");
  button.className = "yt-notes-menu-button";
  button.type = "button";
  button.textContent = "Annoter";
  button.setAttribute("aria-label", "Ouvrir les notes de cette video");
  button.addEventListener("click", onClick);

  const shadow = wrapper.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host {
      align-items: center;
      display: inline-flex;
      margin-left: 8px;
      vertical-align: middle;
    }

    button {
      align-items: center;
      background: rgb(39, 39, 39);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 18px;
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      font: 500 14px/1.2 Roboto, Arial, sans-serif;
      height: 36px;
      min-width: 64px;
      opacity: 1;
      padding: 0 14px;
    }

    button:hover {
      background: rgb(50, 50, 50);
    }
  `;

  shadow.append(style, button);
  return wrapper;
}

export function injectNotesButton(onClick: () => void): void {
  try {
    const videoId = getVideoId();
    if (!videoId) {
      console.debug("[yt-notes] injectNotesButton: no videoId detected");
      return;
    }

    const menu = findWatchMenu();
    if (!menu) {
      console.debug("[yt-notes] injectNotesButton: menu target not found");
      return;
    }

    const existingButton = document.getElementById(BUTTON_ID);
    if (existingButton && existingButton.parentElement === menu) {
      console.debug("[yt-notes] injectNotesButton: button already exists in target");
      return;
    }

    existingButton?.remove();
    menu.appendChild(createNotesButton(onClick));
    console.debug("[yt-notes] injectNotesButton: button appended", { menu, videoId });
  } catch (error) {
    console.error("[yt-notes] injectNotesButton error", error);
  }
}
