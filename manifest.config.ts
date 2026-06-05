import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "YouTube Notes",
  version: "0.1.0",
  description: "Take local Markdown notes linked to YouTube videos.",
  permissions: ["storage", "tabs"],
  host_permissions: ["https://www.youtube.com/*", "https://www.youtube-nocookie.com/*"],
  icons: {
    128: "icon128.png",
    512: "icon512.png"
  },
  action: {
    default_title: "YouTube Notes",
    default_popup: "src/popup/index.html",
    default_icon: {
      128: "icon128.png"
    }
  },
  options_page: "src/dashboard/index.html",
  content_scripts: [
    {
      matches: ["https://www.youtube.com/*"],
      js: ["src/content/inject.ts"],
      css: ["src/content/styles.css"],
      run_at: "document_idle"
    }
  ]
};

export default manifest;
