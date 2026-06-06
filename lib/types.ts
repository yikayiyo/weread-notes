export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  category?: string;
  progress: number;
  startedAt?: string;
  finishedAt?: string;
  lastReadAt?: string;
  highlightCount?: number;
  noteCount?: number;
}

export interface Highlight {
  id: string;
  bookId: string;
  content: string;
  chapterUid?: number;
  chapterTitle?: string;
  createdAt: string;
  range?: string;
  colorStyle?: number;
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  quote?: string;
  chapterUid?: number;
  chapterTitle?: string;
  createdAt: string;
  range?: string;
  isPrivate?: boolean;
}

export interface ReadingStats {
  year: number;
  booksRead: number;
  highlightCount: number;
}

export interface ArchiveMeta {
  lastSyncedAt: string;
  source: "weread";
  stats: {
    shelfBooks: number;
    notebookBooks: number;
    totalHighlights: number;
    totalNotes: number;
  };
}

export interface ArchiveData {
  books: Book[];
  highlights: Highlight[];
  notes: Note[];
  readingStats: ReadingStats[];
  meta: ArchiveMeta;
}
