type UrlChangeHandler = (url: string) => void;

export function observeUrlChanges(onChange: UrlChangeHandler): () => void {
  let currentUrl = window.location.href;

  const notifyIfChanged = () => {
    if (window.location.href === currentUrl) return;
    currentUrl = window.location.href;
    onChange(currentUrl);
  };

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function pushState(...args) {
    originalPushState.apply(this, args);
    notifyIfChanged();
  };

  history.replaceState = function replaceState(...args) {
    originalReplaceState.apply(this, args);
    notifyIfChanged();
  };

  window.addEventListener("popstate", notifyIfChanged);

  const observer = new MutationObserver(notifyIfChanged);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", notifyIfChanged);
    observer.disconnect();
  };
}

export function observeDom(onMutation: () => void): () => void {
  const observer = new MutationObserver(onMutation);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return () => observer.disconnect();
}
