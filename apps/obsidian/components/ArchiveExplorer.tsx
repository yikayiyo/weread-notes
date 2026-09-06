"use client";

import Link from "../ui-adapters";
import { useMemo, useState } from "react";
import type { Book } from "@weread/core/types";
import { formatDate } from "../lib/format";
import { ScrollReveal } from "./ScrollReveal";
import { BookObject } from "./BookObject";

type ViewMode = "list" | "grid";

type BookGroup = {
  key: string;
  label: string;
  books: Book[];
};

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="segmented-control" role="tablist" aria-label="视图切换">
      <span
        aria-hidden="true"
        className={`segmented-control-indicator motion-reduce:transition-none ${
          mode === "grid" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      {(
        [
          ["list", "列表"],
          ["grid", "网格"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={mode === key}
          onClick={() => onChange(key)}
          className={`segmented-control-btn ${
            mode === key
              ? "font-medium text-primary"
              : "text-secondary hover:text-primary"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ListItem({ book }: { book: Book }) {
  return (
    <li className="archive-list-item">
      <Link
        href={`/notes?book=${encodeURIComponent(book.id)}`}
        className="group book-lift flex gap-4 rounded-[0.75rem] focus-ring"
      >
        <BookObject
          title={book.title}
          cover={book.cover}
          sizes="68px"
          className="archive-list-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-base text-primary transition-colors group-hover:text-accent">
            {book.title}
          </p>
          <p className="mt-1 text-sm text-secondary">{book.author}</p>
          {book.finishedAt && (
            <p className="mt-2 text-xs text-secondary">
              读完于 {formatDate(book.finishedAt)}
            </p>
          )}
          {(book.highlightCount ?? 0) > 0 && (
            <p className="mt-1 text-xs text-secondary">
              {book.highlightCount} 条划线
              {(book.noteCount ?? 0) > 0 && ` · ${book.noteCount} 条笔记`}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function GridItem({ book }: { book: Book }) {
  const isRead = book.progress >= 100 || Boolean(book.finishedAt);
  const isReading = !isRead && book.progress > 0;

  return (
    <li className="archive-grid-item">
      <Link
        href={`/notes?book=${encodeURIComponent(book.id)}`}
        className="group book-lift block rounded-[0.75rem] focus-ring"
      >
        <BookObject
          title={book.title}
          cover={book.cover}
          sizes="96px"
          className="archive-grid-cover"
        />
        <div className="archive-grid-meta">
          <p
            className={`archive-grid-status ${
              isReading
                ? "archive-grid-status-reading"
                : isRead
                  ? "archive-grid-status-read"
                  : "archive-grid-status-shelved"
            }`}
          >
            {isReading ? `在读 ${book.progress}%` : isRead ? "已读" : "藏书"}
          </p>
          <p className="archive-grid-title text-primary line-clamp-2 transition-colors group-hover:text-accent">
            {book.title}
          </p>
          <p className="archive-grid-author text-secondary line-clamp-1">{book.author}</p>
          {book.finishedAt && (
            <p className="archive-grid-date text-secondary/70">
              {formatDate(book.finishedAt)}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

export function BookGrid({ books }: { books: Book[] }) {
  return <ul className="archive-grid">{books.map((book) => <GridItem key={book.id} book={book} />)}</ul>;
}

export function ArchiveExplorer({ groups }: { groups: BookGroup[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const allBooks = useMemo(() => groups.flatMap((group) => group.books), [groups]);

  return (
    <div className="flex flex-col gap-[var(--section-gap)]">
      <div className="flex justify-end">
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "grid" ? (
        <BookGrid books={allBooks} />
      ) : (
        groups.map((group) => (
          <section key={group.key} className="space-y-6">
            <ScrollReveal>
              <h2 className="section-label">
                {group.label}
              </h2>
            </ScrollReveal>

            <ul>
              {group.books.map((book) => (
                <ListItem key={book.id} book={book} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
