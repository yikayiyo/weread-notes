import type { ArchiveData, Book, Highlight, Note } from "./types";
import { bookLookup } from "./format";
import { highlightStyle } from "./colors";
import { normalizeExcerptText } from "./excerpt-filter";

export type ShareTheme = "paper" | "ochre" | "mauve";

export type ShareHighlightItem = {
  kind: "highlight";
  content: string;
  bookTitle: string;
  bookAuthor: string;
  chapterTitle?: string;
  createdAt: string;
  accent: string;
};

export type ShareNoteItem = {
  kind: "note";
  content: string;
  quote?: string;
  bookTitle: string;
  bookAuthor: string;
  chapterTitle?: string;
  createdAt: string;
};

export type ShareItem = ShareHighlightItem | ShareNoteItem;

function hasBookTitle(book: Book | undefined): book is Book {
  return Boolean(book?.title);
}

export function highlightToShareItem(
  highlight: Highlight,
  book: Book,
): ShareHighlightItem {
  return {
    kind: "highlight",
    content: normalizeExcerptText(highlight.content),
    bookTitle: book.title,
    bookAuthor: book.author,
    chapterTitle: highlight.chapterTitle,
    createdAt: highlight.createdAt,
    accent: highlightStyle(highlight.colorStyle).accent,
  };
}

export function noteToShareItem(note: Note, book: Book): ShareNoteItem {
  const content = normalizeExcerptText(note.content);
  const quote = note.quote ? normalizeExcerptText(note.quote) : undefined;
  return {
    kind: "note",
    content,
    quote: quote || undefined,
    bookTitle: book.title,
    bookAuthor: book.author,
    chapterTitle: note.chapterTitle,
    createdAt: note.createdAt,
  };
}

export function buildSharePool(data: ArchiveData): ShareItem[] {
  const { books, highlights, notes } = data;
  const pool: ShareItem[] = [];

  for (const highlight of highlights) {
    const book = bookLookup(books, highlight.bookId);
    if (!hasBookTitle(book)) continue;
    pool.push(highlightToShareItem(highlight, book));
  }

  for (const note of notes) {
    const book = bookLookup(books, note.bookId);
    if (!hasBookTitle(book)) continue;
    pool.push(noteToShareItem(note, book));
  }

  return pool;
}

export function pickRandomShareItem(pool: ShareItem[]): ShareItem | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export const SHARE_THEMES: ShareTheme[] = ["paper", "ochre", "mauve"];

export function pickRandomTheme(): ShareTheme {
  return SHARE_THEMES[Math.floor(Math.random() * SHARE_THEMES.length)] ?? "paper";
}

function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToUtf8(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary =
    typeof atob === "function"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeShareItem(item: ShareItem): string {
  return utf8ToBase64Url(JSON.stringify(item));
}

export function decodeShareItem(encoded: string): ShareItem | null {
  try {
    const json = base64UrlToUtf8(encoded);
    const parsed = JSON.parse(json) as ShareItem;
    if (!isValidShareItem(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isValidShareItem(value: unknown): value is ShareItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (
    typeof item.bookTitle !== "string" ||
    typeof item.bookAuthor !== "string" ||
    typeof item.createdAt !== "string"
  ) {
    return false;
  }
  if (item.kind === "highlight") {
    return typeof item.content === "string" && typeof item.accent === "string";
  }
  if (item.kind === "note") {
    return (
      typeof item.content === "string" &&
      (item.quote === undefined || typeof item.quote === "string")
    );
  }
  return false;
}

export function shareDownloadFilename(
  item: ShareItem,
  ext: "png" | "svg",
): string {
  const safeTitle = item.bookTitle.replace(/[<>:"/\\|?*]/g, "_").slice(0, 40);
  return `不高山-《${safeTitle}》-摘录.${ext}`;
}
