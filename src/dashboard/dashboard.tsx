import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import MDEditor from "@uiw/react-md-editor";
import { deleteNote, listNotes, upsertNote } from "../db/database";
import type { VideoNote } from "../types/note";
import "./dashboard.css";

function parseTimestamp(value: string): number | null {
  const parts = value.split(":").map((part) => Number.parseInt(part, 10));
  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}

function linkifyTimestamps(markdown: string): string {
  return markdown.replace(/(^|[\s([])(\d{1,2}:\d{2}(?::\d{2})?)(?=[\s)\].,;:!?]|$)/g, (match, prefix, timestamp) => {
    const seconds = parseTimestamp(timestamp);
    if (seconds === null) return match;
    return `${prefix}[${timestamp}](yt-notes-time://${seconds})`;
  });
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function RenameIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function Dashboard() {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<VideoNote | null>(null);
  const [detailMarkdown, setDetailMarkdown] = useState("");
  const [detailTags, setDetailTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [editingTags, setEditingTags] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"updatedAt" | "title">("updatedAt");

  useEffect(() => {
    void listNotes().then(setNotes);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(notes, {
        keys: ["title", "markdown", "tags"],
        threshold: 0.35
      }),
    [notes]
  );

  const tagsFuse = useMemo(
    () =>
      new Fuse(notes, {
        keys: ["tags"],
        threshold: 0.35
      }),
    [notes]
  );

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach((note) => {
      note.tags?.forEach((tag) => {
        const normalizedTag = tag.startsWith("#") ? tag.slice(1) : tag;
        if (normalizedTag.trim()) tagsSet.add(normalizedTag.trim());
      });
    });
    return Array.from(tagsSet).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const trimmedQuery = query.trim();
    const isTagQuery = trimmedQuery.startsWith("#");
    const searchTerm = isTagQuery ? trimmedQuery.slice(1) : trimmedQuery;

    const base = searchTerm
      ? isTagQuery
        ? tagsFuse.search(searchTerm).map((result) => result.item)
        : fuse.search(query).map((result) => result.item)
      : notes;

    return [...base].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      return b.updatedAt - a.updatedAt;
    });
  }, [fuse, tagsFuse, notes, query, sort]);

  const openVideo = (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}&ytNotesOpen=1`;
    void chrome.tabs.create({ url });
  };

  const selectNote = (note: VideoNote) => {
    setDetailMarkdown(note.markdown);
    setDetailTags(note.tags ?? []);
    setEditingTags(false);
    setSaveStatus("saved");
    setSelectedNote(note);
  };

  const toggleEditTags = () => {
    setEditingTags((current) => !current);
  };

  const addDetailTag = () => {
    const rawTag = tagInput.trim().replace(/^#/, "");
    if (!rawTag) return;

    const normalizedTag = rawTag.toLowerCase();
    if (detailTags.includes(normalizedTag)) {
      setTagInput("");
      return;
    }

    setDetailTags((current) => [...current, normalizedTag]);
    setTagInput("");
    setSaveStatus("idle");
  };

  const removeDetailTag = (tagToRemove: string) => {
    setDetailTags((current) => current.filter((tag) => tag !== tagToRemove));
    setSaveStatus("idle");
  };

  const saveDetailNote = async () => {
    if (!selectedNote) return;

    const trimmedMarkdown = detailMarkdown.trim();
    if (!trimmedMarkdown && detailTags.length === 0) {
      await handleDeleteNote(selectedNote.videoId, selectedNote.title);
      return;
    }

    const nextNote: VideoNote = {
      ...selectedNote,
      markdown: detailMarkdown,
      tags: detailTags,
      updatedAt: Date.now()
    };

    setSaveStatus("saving");

    try {
      await upsertNote(nextNote);
      setSelectedNote(nextNote);
      setNotes((current) => current.map((note) => (note.videoId === nextNote.videoId ? nextNote : note)));
      setSaveStatus("saved");
    } catch (error) {
      console.error("YouTube Notes dashboard save error", error);
      setSaveStatus("error");
    }
  };

  const handleDeleteNote = async (videoId: string, videoTitle: string) => {
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer cette note : "${videoTitle}" ? `);
    if (!confirmed) return;
    
    try {
      await deleteNote(videoId);
      setNotes((current) => current.filter((note) => note.videoId !== videoId));
      if (selectedNote?.videoId === videoId) {
        setSelectedNote(null);
        setDetailMarkdown("");
      }
    } catch (error) {
      console.error("YouTube Notes dashboard delete error", error);
      setSaveStatus("error");
    }
  };

  const handleRenameNote = async (note: VideoNote) => {
    const nextTitle = window.prompt("Nouveau titre", note.title || note.videoId)?.trim();
    if (!nextTitle || nextTitle === note.title) return;

    const nextNote: VideoNote = {
      ...note,
      title: nextTitle,
      updatedAt: Date.now()
    };

    try {
      await upsertNote(nextNote);
      setNotes((current) => current.map((currentNote) => (currentNote.videoId === nextNote.videoId ? nextNote : currentNote)));
      if (selectedNote?.videoId === nextNote.videoId) {
        setSelectedNote(nextNote);
      }
    } catch (error) {
      console.error("YouTube Notes dashboard rename error", error);
      setSaveStatus("error");
    }
  };

  const exportMarkdown = () => {
    if (!selectedNote) return;

    const safeTitle = (selectedNote.title || selectedNote.videoId)
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 80);
    const blob = new Blob([detailMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeTitle || selectedNote.videoId}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!selectedNote || saveStatus !== "idle") return;

    const timeout = window.setTimeout(() => {
      void saveDetailNote();
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [detailMarkdown, detailTags, saveStatus, selectedNote?.videoId]);

  if (selectedNote) {
    const markdown = linkifyTimestamps(detailMarkdown || "Aucune note.");
    const statusLabel = {
      idle: "Non sauvegarde",
      saving: "Sauvegarde...",
      saved: "Sauvegarde",
      error: "Erreur save"
    }[saveStatus];

    return (
      <main className="dashboard dashboard--detail">
        <button className="detail-back" type="button" onClick={() => setSelectedNote(null)}>
          Retour
        </button>

        <header className="detail-header">
          <img src={selectedNote.thumbnail} alt="" />
          <div>
            <h1>{selectedNote.title || selectedNote.videoId}</h1>
            <div className="detail-tag-editor">
              <div className="detail-tags">
                {detailTags.length > 0 ? (
                  detailTags.map((tag) => (
                    <span key={tag} className="detail-tag">
                      #{tag}
                      {editingTags ? (
                        <button type="button" className="detail-tag-remove" onClick={() => removeDetailTag(tag)}>
                          ×
                        </button>
                      ) : null}
                    </span>
                  ))
                ) : (
                  <span className="detail-tag-empty">Aucun tag</span>
                )}
              </div>
              <div className="detail-tag-actions">
                {editingTags ? (
                  <div className="detail-tag-input-row">
                    <input
                      className="detail-tag-input"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addDetailTag();
                        }
                      }}
                      placeholder="Ajouter un tag et appuyer sur Entrée"
                      type="text"
                    />
                    <button type="button" className="detail-edit-tags" onClick={toggleEditTags}>
                      OK
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <p>Derniere sauvegarde : {new Date(selectedNote.updatedAt).toLocaleString()}</p>
            <div className="detail-actions">
              {!editingTags && (
                <button type="button" className="detail-edit-tags-with-icon" onClick={toggleEditTags}>
                  <EditIcon />
                  Edit tags
                </button>
              )}
              <button type="button" className="detail-open-youtube" onClick={() => openVideo(selectedNote.videoId)}>
                <YoutubeIcon />
                Ouvrir sur YouTube
              </button>
            </div>
          </div>
        </header>

        <section className="markdown-editor" data-color-mode="light">
          <header>
            <div>
              <strong>Note Markdown</strong>
              <span className={`detail-save-status is-${saveStatus}`}>{statusLabel}</span>
            </div>
            <button type="button" onClick={exportMarkdown}>
              Export .md
            </button>
          </header>
          <MDEditor
            value={detailMarkdown}
            onChange={(value) => {
              setDetailMarkdown(value ?? "");
              setSaveStatus("idle");
            }}
            height={420}
            previewOptions={{
              components: {
                a: ({ children, href }) => {
                  if (href?.startsWith("yt-notes-time://")) {
                    const seconds = Number.parseInt(href.replace("yt-notes-time://", ""), 10);

                    return (
                      <button
                        type="button"
                        className="markdown-timecode"
                        onClick={() => {
                          void chrome.tabs.create({
                            url: `https://www.youtube.com/watch?v=${selectedNote.videoId}&t=${seconds}s&ytNotesOpen=1`
                          });
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
          />
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1>YouTube Notes</h1>
          <p>{notes.length} video{notes.length > 1 ? "s" : ""} annotee{notes.length > 1 ? "s" : ""}</p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              className="dashboard__search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une vidéo, note ou #tag"
              type="search"
              list="dashboard-tags"
            />
            <datalist id="dashboard-tags">
              {allTags.map((tag) => (
                <option key={tag} value={`#${tag}`} />
              ))}
            </datalist>
          </div>
        </div>

        <select value={sort} onChange={(event) => setSort(event.target.value as "updatedAt" | "title")} style={{ paddingLeft: "5px", minHeight: "46px" }}>
          <option value="updatedAt">Recent</option>
          <option value="title">Titre</option>
        </select>
      </header>



      <section className="notes-list">
        {filteredNotes.map((note) => (
          <article className="note-row" key={note.videoId}>
            <button className="note-row__main" type="button" onClick={() => selectNote(note)}>
              <img src={note.thumbnail} alt="" />
              <span>
                <strong>{note.title || note.videoId}</strong>
                <small>{new Date(note.updatedAt).toLocaleString()}</small>
              </span>
            </button>
            <div className="note-row__actions">
              <button
                aria-label={`Renommer la note ${note.title || note.videoId}`}
                className="note-row__rename"
                type="button"
                onClick={() => void handleRenameNote(note)}
                title="Renommer"
              >
                <RenameIcon />
              </button>
              <button
                aria-label={`Supprimer la note ${note.title || note.videoId}`}
                className="note-row__delete"
                type="button"
                onClick={() => void handleDeleteNote(note.videoId, note.title)}
                title="Supprimer"
              >
                <TrashIcon />
              </button>
            </div>
          </article>
        ))}

        {!filteredNotes.length && <p className="notes-list__empty">Aucune note trouvee.</p>}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Dashboard />);
