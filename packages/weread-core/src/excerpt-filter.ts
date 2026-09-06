import type { Highlight, Note } from "./types";

/** 微信读书划线中的图片/嵌入对象占位符等不可见字符 */
const EXCERPT_ARTIFACT_CHARS = /[\uFFFC\uFFFD\uFEFF\u200B-\u200D\u2060]/g;

/** 去掉嵌入占位符，保留原有换行与空格（用于页面展示）。 */
export function stripExcerptArtifacts(text?: string): string {
  return (text ?? "").replace(EXCERPT_ARTIFACT_CHARS, "");
}

/** 去掉空白、换行与嵌入占位符，用于判断摘录是否有可见文字。 */
export function normalizeExcerptText(text?: string): string {
  return stripExcerptArtifacts(text).replace(/\s+/g, " ").trim();
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
