"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Book } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { sectionAccents } from "@/lib/colors";
import { ScrollReveal } from "./ScrollReveal";

type ViewMode = "list" | "grid";

type BookGroup = {
  key: string;
  label: string;
  books: Book[];
};

const accent = sectionAccents.sage;

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
        className={`segmented-control-indicator ${accent.surface} motion-reduce:transition-none ${
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

function BookCover({ book, sizes }: { book: Book; sizes: string }) {
  const [error, setError] = useState(false);

  if (!book.cover || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-muted p-2 text-center text-xs text-secondary">
        {book.title}
      </div>
    );
  }

  return (
    <Image
      src={book.cover}
      alt={book.title}
      fill
      className="object-cover"
      sizes={sizes}
      onError={() => setError(true)}
    />
  );
}

function ListItem({ book }: { book: Book }) {
  return (
    <li className="border-b border-border pb-6">
      <Link
        href={`/notes?book=${book.id}`}
        className="group flex gap-4 rounded-[2px] focus-ring"
      >
        {book.cover && (
          <div className="relative h-24 w-16 shrink-0 overflow-hidden bg-surface-muted ring-1 ring-sage/10 transition-[outline-color] group-hover:ring-sage/25">
            <BookCover book={book} sizes="64px" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-title text-base text-primary transition-colors group-hover:text-sage">
            {book.title}
          </p>
          <p className="mt-1 text-sm text-secondary">{book.author}</p>
          {book.finishedAt && (
            <p className="mt-2 text-xs text-sage/80">
              读完于 {formatDate(book.finishedAt)}
            </p>
          )}
          {(book.highlightCount ?? 0) > 0 && (
            <p className="mt-1 text-xs text-ochre/80">
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
  return (
    <li>
      <Link
        href={`/notes?book=${book.id}`}
        className="group block space-y-2 rounded-[2px] focus-ring"
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-surface-muted ring-1 ring-sage/10 transition-[outline-color] group-hover:ring-sage/25">
          <BookCover book={book} sizes="(max-width: 640px) 33vw, 150px" />
        </div>
        <div className="space-y-0.5">
          <p className="font-title text-sm leading-snug text-primary line-clamp-2 transition-colors group-hover:text-sage">
            {book.title}
          </p>
          <p className="text-xs text-secondary line-clamp-1">{book.author}</p>
          {book.finishedAt && (
            <p className="text-xs text-sage/80">{formatDate(book.finishedAt)}</p>
          )}
        </div>
      </Link>
    </li>
  );
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
        <ul
          key="grid"
          className="archive-view-enter archive-grid"
        >
          {allBooks.map((book) => (
            <GridItem key={book.id} book={book} />
          ))}
        </ul>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="space-y-8">
            <ScrollReveal>
              <div className="flex items-center gap-3">
                <span
                  className={`h-4 w-0.5 rounded-full ${accent.bar}`}
                  aria-hidden="true"
                />
                <h2 className={`font-title text-sm tracking-[0.2em] ${accent.title}`}>
                  {group.label}
                </h2>
              </div>
            </ScrollReveal>

            <ul className="archive-view-enter space-y-6">
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
