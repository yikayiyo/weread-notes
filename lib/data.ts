import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type {
  ArchiveData,
  ArchiveMeta,
  Book,
  Highlight,
  Note,
  ReadingStats,
} from "./types";
import {
  filterVisibleHighlights,
  filterVisibleNotes,
} from "./excerpt-filter";

const DATA_DIR = join(process.cwd(), "data");

function readJson<T>(filename: string, fallback: T): T {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export function getBooks(): Book[] {
  return readJson<Book[]>("books.json", []);
}

export function getHighlights(): Highlight[] {
  return filterVisibleHighlights(
    readJson<Highlight[]>("highlights.json", []),
  );
}

export function getNotes(): Note[] {
  return filterVisibleNotes(readJson<Note[]>("notes.json", []));
}

export function getReadingStats(): ReadingStats[] {
  return readJson<ReadingStats[]>("reading-stats.json", []);
}

export function getMeta(): ArchiveMeta {
  return readJson<ArchiveMeta>("meta.json", {
    lastSyncedAt: "",
    source: "weread",
    stats: {
      shelfBooks: 0,
      notebookBooks: 0,
      totalHighlights: 0,
      totalNotes: 0,
    },
  });
}

export function getArchiveData(): ArchiveData {
  return {
    books: getBooks(),
    highlights: getHighlights(),
    notes: getNotes(),
    readingStats: getReadingStats(),
    meta: getMeta(),
  };
}

export function getCurrentlyReading(books: Book[]): Book[] {
  return books
    .filter((b) => b.progress > 0 && b.progress < 100)
    .sort((a, b) => ts(b.lastReadAt) - ts(a.lastReadAt));
}

export function getFinishedBooks(books: Book[]): Book[] {
  return books
    .filter((b) => b.progress === 100 || b.finishedAt)
    .sort((a, b) => ts(b.finishedAt) - ts(a.finishedAt));
}

export function getRecentHighlights(
  highlights: Highlight[],
  limit = 5,
): Highlight[] {
  return sortByDate(highlights, (h) => h.createdAt).slice(0, limit);
}

export function getRecentNotes(notes: Note[], limit = 5): Note[] {
  return sortByDate(notes, (n) => n.createdAt).slice(0, limit);
}

export function groupBooksByYearMonth(
  books: Book[],
): { key: string; label: string; books: Book[] }[] {
  const map = new Map<string, Book[]>();
  for (const book of getFinishedBooks(books)) {
    const key = book.finishedAt
      ? `${new Date(book.finishedAt).getFullYear()}-${String(new Date(book.finishedAt).getMonth() + 1).padStart(2, "0")}`
      : "unknown";
    map.set(key, [...(map.get(key) ?? []), book]);
  }
  return [...map.entries()]
    .sort((a, b) => {
      if (a[0] === "unknown") return 1;
      if (b[0] === "unknown") return -1;
      return b[0].localeCompare(a[0]);
    })
    .map(([key, group]) => ({
      key,
      label:
        key === "unknown"
          ? "未记录"
          : formatYearMonthLabel(key),
      books: group,
    }));
}

function formatYearMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y}年${Number(m)}月`;
}

function ts(iso?: string): number {
  return iso ? new Date(iso).getTime() : 0;
}

function sortByDate<T>(items: T[], getDate: (item: T) => string): T[] {
  return [...items].sort(
    (a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime(),
  );
}
