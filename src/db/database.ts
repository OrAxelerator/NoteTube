import type { VideoNote } from "../types/note";

const STORAGE_KEY = "ytNotes.notes";

type NotesById = Record<string, VideoNote>;

function canUseChromeStorage(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

async function readAll(): Promise<NotesById> {
  if (!canUseChromeStorage()) {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotesById) : {};
  }

  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as NotesById | undefined) ?? {};
}

async function writeAll(notes: NotesById): Promise<void> {
  if (!canUseChromeStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return;
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: notes });
}

export async function getNote(videoId: string): Promise<VideoNote | undefined> {
  const notes = await readAll();
  return notes[videoId];
}

export async function upsertNote(note: VideoNote): Promise<string> {
  if (!note.markdown.trim()) {
    await deleteNote(note.videoId);
    return note.videoId;
  }

  const notes = await readAll();
  notes[note.videoId] = note;
  await writeAll(notes);
  return note.videoId;
}

export async function deleteNote(videoId: string): Promise<void> {
  const notes = await readAll();
  delete notes[videoId];
  await writeAll(notes);
}

export async function listNotes(): Promise<VideoNote[]> {
  const notes = await readAll();
  return Object.values(notes).sort((a, b) => b.updatedAt - a.updatedAt);
}
