import { injectNotesButton } from "./injectButton";
import { observeDom, observeUrlChanges } from "./observer";
import { mountSidebar, openSidebar, refreshSidebarVideo, toggleSidebar } from "./sidebar";

function shouldAutoOpenSidebar(): boolean {
  return new URL(window.location.href).searchParams.get("ytNotesOpen") === "1";
}

function boot(): void {
  mountSidebar();
  injectNotesButton(toggleSidebar);
  window.setTimeout(() => injectNotesButton(toggleSidebar), 800);
  window.setTimeout(() => injectNotesButton(toggleSidebar), 1800);

  if (shouldAutoOpenSidebar()) {
    window.setTimeout(openSidebar, 400);
  }

  observeDom(() => {
    injectNotesButton(toggleSidebar);
  });

  observeUrlChanges(() => {
    refreshSidebarVideo();
    if (shouldAutoOpenSidebar()) {
      window.setTimeout(openSidebar, 400);
    }
    window.setTimeout(() => injectNotesButton(toggleSidebar), 250);
    window.setTimeout(() => injectNotesButton(toggleSidebar), 1200);
  });
}

boot();
