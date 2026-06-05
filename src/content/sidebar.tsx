import MDEditor from "@uiw/react-md-editor";
import { type Dispatch, type MouseEvent, type SetStateAction, useEffect, useMemo, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { deleteNote, getNote, upsertNote } from "../db/database";
import type { VideoNote } from "../types/note";
import { getThumbnail, getVideoId, getVideoTitle, parseTimestamp, seekToTimestamp } from "./youtube";

type SidebarState = {
  open: boolean;
  videoId: string | null;
};

let root: Root | null = null;
let setExternalState: Dispatch<SetStateAction<SidebarState>> | null = null;

const DEFAULT_MARKDOWN = "";

function SidebarApp() {
  const [state, setState] = useState<SidebarState>({
    open: false,
    videoId: getVideoId()
  });
  const [note, setNote] = useState<VideoNote | null>(null);
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setExternalState = setState;
    return () => {
      setExternalState = null;
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!state.videoId) {
      setNote(null);
      setMarkdown(DEFAULT_MARKDOWN);
      return;
    }

    let cancelled = false;

    void getNote(state.videoId).then((storedNote) => {
      if (cancelled) return;

      const nextNote =
        storedNote ??
        {
          videoId: state.videoId!,
          title: getVideoTitle(),
          markdown: DEFAULT_MARKDOWN,
          updatedAt: Date.now(),
          thumbnail: getThumbnail(state.videoId!),
          tags: []
        };

      setNote(nextNote);
      setMarkdown(nextNote.markdown);
      setNoteTags(nextNote.tags ?? []);
      setSaveStatus(storedNote ? "saved" : "idle");
    });

    return () => {
      cancelled = true;
    };
  }, [state.videoId]);

  const saveCurrentNote = async () => {
    if (!note || !state.videoId) return;

    const normalizedTags = noteTags.map((tag) => tag.trim()).filter(Boolean);

    if (!markdown.trim() && normalizedTags.length === 0) {
      try {
        await deleteNote(state.videoId);
        setNote({ ...note, markdown: DEFAULT_MARKDOWN, tags: [] });
        setNoteTags([]);
        setSaveStatus("idle");
      } catch (error) {
        console.error("YouTube Notes delete empty note error", error);
        setSaveStatus("error");
      }
      return;
    }

    const nextNote: VideoNote = {
      ...note,
      title: getVideoTitle(),
      markdown,
      updatedAt: Date.now(),
      thumbnail: getThumbnail(state.videoId),
      tags: normalizedTags
    };

    setSaveStatus("saving");

    try {
      await upsertNote(nextNote);
      setNote(nextNote);
      setSaveStatus("saved");
    } catch (error) {
      console.error("YouTube Notes save error", error);
      setSaveStatus("error");
    }
  };

  const addTag = () => {
    const rawTag = tagInput.trim().replace(/^#/, "");
    if (!rawTag) return;

    const normalizedTag = rawTag.toLowerCase();
    if (noteTags.includes(normalizedTag)) {
      setTagInput("");
      return;
    }

    setNoteTags((currentTags) => [...currentTags, normalizedTag]);
    setTagInput("");
    setSaveStatus("idle");
  };

  const removeTag = (tagToRemove: string) => {
    setNoteTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
    setSaveStatus("idle");
  };

  useEffect(() => {
    if (!note || !state.videoId) return;

    const timeout = window.setTimeout(() => {
      void saveCurrentNote();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [markdown, noteTags, note?.videoId, state.videoId]);

  const visible = state.open && Boolean(state.videoId) && !fullscreen;
  const previewSource = useMemo(() => markdown || "", [markdown]);
  const statusLabel = {
    idle: "Non sauvegarde",
    saving: "Sauvegarde...",
    saved: "Sauvegarde",
    error: "Erreur save"
  }[saveStatus];

  const handlePreviewClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const text = target.textContent?.trim();
    if (!text) return;

    const match = text.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?$/);
    if (!match) return;

    const seconds = parseTimestamp(match[1]);
    if (seconds === null) return;

    event.preventDefault();
    seekToTimestamp(seconds);
  };

  return (
    <aside className={`yt-notes-sidebar ${visible ? "is-open" : ""}`} data-color-mode="light">
      <header className="yt-notes-sidebar__header">
        <div>
          <strong>YouTube Notes</strong>
          <span>{note?.title || "Aucune video"}</span>
        </div>
        <div className="yt-notes-sidebar__actions">
          <span className={`yt-notes-sidebar__status is-${saveStatus}`}>{statusLabel}</span>
          <button type="button" className="yt-notes-sidebar__save" onClick={() => void saveCurrentNote()}>
            Save
          </button>
          <button
            type="button"
            style={{
              color: "#fff",
              background: "rgb(39, 39, 39)",
              border: "none",
              padding: "6px 10px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
            onClick={() => setState((current) => ({ ...current, open: false }))}
          >
            Fermer
          </button>
        </div>
      </header>

      <div className="yt-notes-sidebar__tags">
        <div className="yt-notes-sidebar__tag-list">
          {noteTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="yt-notes-sidebar__tag"
              onClick={() => removeTag(tag)}
            >
              #{tag} ×
            </button>
          ))}
        </div>

        <div className="yt-notes-sidebar__tag-input-row">
          <input
            className="yt-notes-sidebar__tag-input"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag();
              }
            }}
            placeholder="Ajouter un tag"
          />
          <button type="button" className="yt-notes-sidebar__add-tag" onClick={addTag}>
            +
          </button>
        </div>
      </div>

      <div className="yt-notes-sidebar__editor" onClick={handlePreviewClick}>
        <MDEditor
          value={markdown}
          onChange={(value) => {
            setMarkdown(value ?? "");
            setSaveStatus("idle");
          }}
          height="100%"
          previewOptions={{
            components: {
              a: ({ children, href }) => {
                const label = String(children);
                const timestamp = label.match(/^\d{1,2}:\d{2}(?::\d{2})?$/);

                if (timestamp) {
                  return (
                    <button
                      type="button"
                      className="yt-notes-timestamp"
                      onClick={() => {
                        const seconds = parseTimestamp(label);
                        if (seconds !== null) seekToTimestamp(seconds);
                      }}
                    >
                      {children}
                    </button>
                  );
                }

                return (
                  <a href={href} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                );
              }
            }
          }}
          textareaProps={{
            placeholder: "Ecris tes notes Markdown ici..."
          }}
        />
      </div>
    </aside>
  );
}

export function mountSidebar(): void {
  if (root) return;

  const container = document.createElement("div");
  container.id = "yt-notes-root";
  document.body.appendChild(container);

  root = createRoot(container);
  root.render(<SidebarApp />);
}

export function toggleSidebar(): void {
  mountSidebar();
  setExternalState?.((current) => ({
    open: !current.open,
    videoId: getVideoId()
  }));
}

export function openSidebar(): void {
  mountSidebar();
  setExternalState?.({
    open: true,
    videoId: getVideoId()
  });
}

export function refreshSidebarVideo(): void {
  setExternalState?.((current) => ({
    ...current,
    videoId: getVideoId()
  }));
}
