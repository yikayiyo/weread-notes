import type { Highlight, Note } from "./types";

/** 去掉空白与换行，用于判断摘录是否有可见文字。 */
export function normalizeExcerptText(text?: string): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export function isVisibleHighlight(highlight: Highlight): boolean {
  return normalizeExcerptText(highlight.content).length > 0;
}

export function isVisibleNote(note: Note): boolean {
  return (
    normalizeExcerptText(note.content).length > 0 ||
    normalizeExcerptText(note.quote).length > 0
  );
}

export function filterVisibleHighlights(highlights: Highlight[]): Highlight[] {
  return highlights.filter(isVisibleHighlight);
}

export function filterVisibleNotes(notes: Note[]): Note[] {
  return notes.filter(isVisibleNote);
}
