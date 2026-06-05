export function getVideoId(url = window.location.href): string | null {
  const parsedUrl = new URL(url);

  if (parsedUrl.hostname !== "www.youtube.com" || parsedUrl.pathname !== "/watch") {
    return null;
  }

  return parsedUrl.searchParams.get("v");
}

export function getVideoTitle(): string {
  const selectors = [
    "h1.ytd-watch-metadata yt-formatted-string",
    "h1.title yt-formatted-string",
    "h1"
  ];

  for (const selector of selectors) {
    const text = document.querySelector(selector)?.textContent?.trim();
    if (text) return text;
  }

  return document.title.replace(" - YouTube", "").trim();
}

export function getThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function seekToTimestamp(seconds: number): void {
  const video = document.querySelector("video");
  if (!video) return;

  video.currentTime = seconds;
  void video.play();
}

export function parseTimestamp(value: string): number | null {
  const parts = value.split(":").map((part) => Number.parseInt(part, 10));
  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}
