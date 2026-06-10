"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Book, Highlight, Note } from "@/lib/types";
import { sectionAccents } from "@/lib/colors";
import { HighlightCard } from "./HighlightCard";
import { NoteCard } from "./NoteCard";

type Tab = "highlights" | "notes";
type ExcerptView = "list" | "grid";

function parseTab(value: string | null): Tab {
  return value === "notes" ? "notes" : "highlights";
}

function parseView(value: string | null): ExcerptView {
  return value === "grid" ? "grid" : "list";
}

const accent = sectionAccents.ochre;
const QUICK_PICK_COUNT = 6;
const SHOW_ALL_THRESHOLD = 10;
const SEARCH_RESULT_LIMIT = 12;
const PAGE_SIZE = 30;

function parsePage(value: string | null): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: clampedPage,
    totalPages,
    total,
  };
}

function Pagination({
  page,
  totalPages,
  total,
  label,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination-nav" aria-label={`${label}分页`}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="pagination-btn pagination-prev"
      >
        ← 上一页
      </button>
      <p className="pagination-meta">
        第 {page} / {totalPages} 页 · 共 {total} 条{label}
      </p>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="pagination-btn pagination-next"
      >
        下一页 →
      </button>
    </nav>
  );
}

function ViewModeToggle({
  view,
  onChange,
}: {
  view: ExcerptView;
  onChange: (view: ExcerptView) => void;
}) {
  return (
    <div className="view-mode-toggle" role="group" aria-label="摘录布局">
      {(
        [
          ["list", "列表"],
          ["grid", "网格"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={view === key}
          onClick={() => onChange(key)}
          className={`view-mode-toggle-btn${
            view === key ? " view-mode-toggle-btn-active" : ""
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ContentTabToggle({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div
      className="segmented-control"
      role="tablist"
      aria-label="摘录类型"
    >
      <span
        aria-hidden="true"
        className={`segmented-control-indicator ${accent.surface} motion-reduce:transition-none ${
          tab === "notes" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      {(
        [
          ["highlights", "划线"],
          ["notes", "笔记"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={tab === key}
          onClick={() => onChange(key)}
          className={`segmented-control-btn ${
            tab === key
              ? `${accent.tabActive} font-medium`
              : "text-secondary hover:text-primary"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function BookFilterPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`filter-pill${
        selected
          ? " filter-pill-selected"
          : ""
      }`}
    >
      {label}
    </button>
  );
}

export function NotesExplorer({
  books,
  highlights,
  notes,
}: {
  books: Book[];
  highlights: Highlight[];
  notes: Note[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const excerptsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [bookId, setBookId] = useState("");
  const [bookQuery, setBookQuery] = useState("");

  const tab = parseTab(searchParams.get("tab"));
  const view = parseView(searchParams.get("view"));
  const hlPage = parsePage(searchParams.get("hl_page"));
  const notePage = parsePage(searchParams.get("note_page"));

  useEffect(() => {
    const fromUrl = searchParams.get("book") ?? "";
    setBookId(fromUrl);
  }, [searchParams]);

  function replaceParams(
    updates: Record<string, string | null>,
    options?: { scrollToExcerpts?: boolean },
  ) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || (value === "1" && key.endsWith("_page"))) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    if (options?.scrollToExcerpts) {
      requestAnimationFrame(() => {
        excerptsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  const booksWithContent = useMemo(() => {
    const counts = new Map<string, { highlights: number; notes: number }>();
    for (const h of highlights) {
      const c = counts.get(h.bookId) ?? { highlights: 0, notes: 0 };
      c.highlights++;
      counts.set(h.bookId, c);
    }
    for (const n of notes) {
      const c = counts.get(n.bookId) ?? { highlights: 0, notes: 0 };
      c.notes++;
      counts.set(n.bookId, c);
    }

    return books
      .filter((b) => counts.has(b.id))
      .map((b) => ({
        book: b,
        ...counts.get(b.id)!,
      }))
      .sort(
        (a, b) =>
          bookLastReadTime(b.book) - bookLastReadTime(a.book) ||
          a.book.title.localeCompare(b.book.title, "zh-CN"),
      );
  }, [books, highlights, notes]);

  const trimmedBookQuery = bookQuery.trim();

  const matchingBooks = useMemo(() => {
    if (!trimmedBookQuery) return [];
    const q = trimmedBookQuery.toLowerCase();
    return booksWithContent.filter(
      ({ book }) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q),
    );
  }, [booksWithContent, trimmedBookQuery]);

  const quickPickBooks = useMemo(() => {
    if (trimmedBookQuery) return [];
    if (booksWithContent.length <= SHOW_ALL_THRESHOLD) {
      return booksWithContent;
    }

    const picks = booksWithContent.slice(0, QUICK_PICK_COUNT);
    if (!bookId) return picks;

    const inPicks = picks.some(({ book }) => book.id === bookId);
    if (inPicks) return picks;

    const selected = booksWithContent.find(({ book }) => book.id === bookId);
    return selected ? [...picks, selected] : picks;
  }, [booksWithContent, bookId, trimmedBookQuery]);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === bookId),
    [books, bookId],
  );

  const filteredHighlights = useMemo(() => {
    return highlights
      .filter((h) => !bookId || h.bookId === bookId)
      .filter(
        (h) =>
          !query ||
          h.content.includes(query) ||
          h.chapterTitle?.includes(query),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [highlights, bookId, query]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => !bookId || n.bookId === bookId)
      .filter(
        (n) =>
          !query ||
          n.content.includes(query) ||
          n.quote?.includes(query) ||
          n.chapterTitle?.includes(query),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [notes, bookId, query]);

  const hideBookInCards = Boolean(bookId);
  const activeCount =
    tab === "highlights" ? filteredHighlights.length : filteredNotes.length;
  const activeLabel = tab === "highlights" ? "划线" : "笔记";

  const highlightPage = paginate(filteredHighlights, hlPage, PAGE_SIZE);
  const notePageData = paginate(filteredNotes, notePage, PAGE_SIZE);

  useEffect(() => {
    const fixes: Record<string, string | null> = {};
    if (hlPage !== highlightPage.page) {
      fixes.hl_page = highlightPage.page === 1 ? null : String(highlightPage.page);
    }
    if (notePage !== notePageData.page) {
      fixes.note_page =
        notePageData.page === 1 ? null : String(notePageData.page);
    }
    if (Object.keys(fixes).length > 0) {
      replaceParams(fixes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hlPage, notePage, highlightPage.page, notePageData.page]);

  function setTab(next: Tab) {
    replaceParams(
      {
        tab: next === "highlights" ? null : next,
        hl_page: null,
        note_page: null,
      },
      { scrollToExcerpts: true },
    );
  }

  function setView(next: ExcerptView) {
    replaceParams(
      {
        view: next === "list" ? null : next,
        hl_page: null,
        note_page: null,
      },
      { scrollToExcerpts: true },
    );
  }

  function selectBook(id: string, options?: { clearSearch?: boolean }) {
    setBookId(id);
    if (options?.clearSearch) setBookQuery("");
    replaceParams(
      {
        book: id || null,
        hl_page: null,
        note_page: null,
      },
      { scrollToExcerpts: Boolean(id) },
    );
  }

  return (
    <div className="notes-layout">
      <header className="notes-toolbar">
        <div className="notes-toolbar-row">
          <ContentTabToggle tab={tab} onChange={setTab} />
          <div className="notes-toolbar-actions">
            <ViewModeToggle view={view} onChange={setView} />
            <p className="notes-count text-xs tabular-nums text-secondary">
              共 {activeCount} 条{activeLabel}
            </p>
          </div>
        </div>

        <input
          type="search"
          placeholder="搜索摘录内容…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-line w-full text-sm text-primary placeholder:text-[var(--text-placeholder)] focus:border-ochre"
        />

        {selectedBook && (
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-secondary">
            <span>
              正在浏览《{selectedBook.title}》
              {selectedBook.author && ` · ${selectedBook.author}`}
            </span>
            <button
              type="button"
              onClick={() => selectBook("")}
              className="text-btn inline-flex min-h-[var(--touch-min)] items-center text-ochre transition-colors hover:text-primary"
            >
              清除
            </button>
          </p>
        )}
      </header>

      <aside className="notes-aside">
        <div className="flex items-center gap-3">
          <span
            className={`h-3.5 w-0.5 shrink-0 rounded-full ${accent.bar}`}
            aria-hidden="true"
          />
          <h2 className={`section-label ${accent.title}`}>按书籍浏览</h2>
        </div>

        <input
          type="search"
          placeholder="搜索书名或作者…"
          value={bookQuery}
          onChange={(e) => setBookQuery(e.target.value)}
          className="input-line w-full text-sm text-primary placeholder:text-[var(--text-placeholder)] focus:border-ochre"
        />

        {trimmedBookQuery ? (
          matchingBooks.length === 0 ? (
            <p className="empty-state-inline">没有匹配的书籍。</p>
          ) : (
            <ul className="divide-y divide-border rounded-sm border border-border">
              {matchingBooks.slice(0, SEARCH_RESULT_LIMIT).map(({ book }) => (
                <li key={book.id}>
                  <button
                    type="button"
                    onClick={() => selectBook(book.id, { clearSearch: true })}
                    className="book-filter-btn flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-ochre-light sm:flex-row sm:items-baseline sm:gap-2"
                  >
                    <span className="truncate text-sm text-primary">
                      {book.title}
                    </span>
                    <span className="truncate text-xs text-secondary">
                      {book.author}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            {booksWithContent.length > SHOW_ALL_THRESHOLD && (
              <p className="text-xs text-secondary">
                共 {booksWithContent.length} 本 · 快捷显示最近阅读的{" "}
                {QUICK_PICK_COUNT} 本，其余请搜索
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <BookFilterPill
                label="全部"
                selected={!bookId}
                onClick={() => selectBook("")}
              />
              {quickPickBooks.map(({ book }) => (
                <BookFilterPill
                  key={book.id}
                  label={book.title}
                  selected={bookId === book.id}
                  onClick={() => selectBook(book.id)}
                />
              ))}
            </div>
          </>
        )}

        {trimmedBookQuery && matchingBooks.length > SEARCH_RESULT_LIMIT && (
          <p className="text-xs text-secondary">
            还有 {matchingBooks.length - SEARCH_RESULT_LIMIT}{" "}
            本匹配结果，请缩小关键词
          </p>
        )}
      </aside>

      <div ref={excerptsRef} className="notes-content">
        {tab === "highlights" && filteredHighlights.length > 0 && (
          <section
            className={view === "grid" ? "excerpt-grid" : "excerpt-list"}
          >
            {highlightPage.items.map((h) => (
              <HighlightCard
                key={h.id}
                highlight={h}
                books={books}
                hideBook={hideBookInCards}
                reveal={false}
              />
            ))}
            <Pagination
              page={highlightPage.page}
              totalPages={highlightPage.totalPages}
              total={highlightPage.total}
              label="划线"
              onPageChange={(page) =>
                replaceParams(
                  { hl_page: page === 1 ? null : String(page) },
                  { scrollToExcerpts: true },
                )
              }
            />
          </section>
        )}

        {tab === "notes" && filteredNotes.length > 0 && (
          <section
            className={view === "grid" ? "excerpt-grid" : "excerpt-list"}
          >
            {notePageData.items.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                books={books}
                hideBook={hideBookInCards}
                accent="mauve"
                reveal={false}
              />
            ))}
            <Pagination
              page={notePageData.page}
              totalPages={notePageData.totalPages}
              total={notePageData.total}
              label="笔记"
              onPageChange={(page) =>
                replaceParams(
                  { note_page: page === 1 ? null : String(page) },
                  { scrollToExcerpts: true },
                )
              }
            />
          </section>
        )}

        {tab === "highlights" && filteredHighlights.length === 0 && (
          <p className="empty-state-content">
            {bookId ? "这本书暂无匹配的划线。" : "没有找到匹配的划线。"}
          </p>
        )}

        {tab === "notes" && filteredNotes.length === 0 && (
          <p className="empty-state-content">
            {bookId ? "这本书暂无匹配的笔记。" : "没有找到匹配的笔记。"}
          </p>
        )}
      </div>
    </div>
  );
}

function bookLastReadTime(book: Book): number {
  return book.lastReadAt ? new Date(book.lastReadAt).getTime() : 0;
}
