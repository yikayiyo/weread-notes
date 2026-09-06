"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "../ui-adapters";
import Image from "../ui-image";
import { BookObject } from "./BookObject";
import { FormattedText } from "./FormattedText";
import { highlightStyle } from "../lib/colors";

export type ReadingDeckExcerpt = {
  kind: "highlight" | "note";
  content: string;
  quote?: string;
  chapterTitle?: string;
  colorStyle?: number;
};

export type ReadingDeckItem = {
  id: string;
  title: string;
  author: string;
  cover?: string;
  progress: number;
  excerpt: ReadingDeckExcerpt | null;
};

function Atmosphere({ src }: { src?: string }) {
  const [error, setError] = useState(false);

  if (!src || error) return <div className="cover-atmosphere" aria-hidden="true" />;

  return (
    <div className="cover-atmosphere" aria-hidden="true">
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        className="cover-atmosphere-image"
        onError={() => setError(true)}
      />
    </div>
  );
}

export function ReadingDeck({ books }: { books: ReadingDeckItem[] }) {
  const [selectedId, setSelectedId] = useState(books[0]?.id ?? "");
  const selected = books.find((book) => book.id === selectedId) ?? books[0];

  if (!selected) return null;

  const excerptHref = `/notes?book=${encodeURIComponent(selected.id)}${selected.excerpt?.kind === "note" ? "&tab=notes" : ""}`;
  const marker =
    selected.excerpt?.kind === "highlight"
      ? highlightStyle(selected.excerpt.colorStyle).accent
      : undefined;

  return (
    <section className="reading-deck" aria-labelledby="reading-deck-title">
      <Atmosphere key={selected.cover ?? selected.id} src={selected.cover} />

      <header className="reading-deck-intro">
        <h2 id="reading-deck-title" className="section-label">最近在读</h2>
        <p className="page-kicker">最近翻开的书，和页边留下的句子</p>
      </header>

      <div key={selected.id} className="reading-deck-stage">
        <Link
          href={excerptHref}
          className="reading-deck-cover-link book-lift focus-ring"
          aria-label={`查看《${selected.title}》的划线与笔记`}
        >
          <BookObject
            title={selected.title}
            cover={selected.cover}
            sizes="(max-width: 719px) 46vw, 252px"
            priority
            className="reading-deck-cover"
          />
        </Link>

        <div className="reading-deck-panel matte-panel">
          <p className="reading-deck-title">{selected.title}</p>
          <p className="reading-deck-author">{selected.author}</p>

          {selected.progress > 0 && (
            <div className="reading-deck-progress">
              <div
                className="reading-progress"
                role="progressbar"
                aria-valuenow={selected.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`阅读进度 ${selected.progress}%`}
              >
                <span
                  className="reading-progress-bar"
                  style={{ width: `${selected.progress}%` }}
                />
              </div>
              <p className="reading-deck-progress-label">
                阅读至 <span className="tabular-nums">{selected.progress}%</span>
              </p>
            </div>
          )}

          {selected.excerpt ? (
            <blockquote className="reading-deck-excerpt">
              {marker && (
                <span
                  className="highlight-marker"
                  style={{ backgroundColor: marker }}
                  aria-hidden="true"
                />
              )}
              <div className="reading-deck-excerpt-body">
                <p className="excerpt-text font-excerpt">
                  <FormattedText>{selected.excerpt.content}</FormattedText>
                </p>
                {selected.excerpt.kind === "note" && selected.excerpt.quote && (
                  <p className="reading-deck-quote font-excerpt">
                    <FormattedText>{selected.excerpt.quote}</FormattedText>
                  </p>
                )}
                {selected.excerpt.chapterTitle && (
                  <cite className="reading-deck-cite">
                    〈{selected.excerpt.chapterTitle}〉
                  </cite>
                )}
              </div>
            </blockquote>
          ) : (
            <p className="reading-deck-fallback">
              这本书还没有划线或笔记。下一次阅读时，留下打动你的句子。
            </p>
          )}

          <Link href={excerptHref} className="reading-deck-link focus-ring">
            查看划线与笔记
          </Link>
        </div>
      </div>

      {books.length > 1 && (
        <div
          className="reading-deck-picks"
          role="radiogroup"
          aria-label="选择正在阅读的书"
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            const index = books.findIndex((book) => book.id === selected.id);
            if (index < 0) return;
            event.preventDefault();
            const next =
              event.key === "ArrowRight"
                ? (index + 1) % books.length
                : (index - 1 + books.length) % books.length;
            setSelectedId(books[next].id);
            const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
              "[role='radio']",
            );
            buttons[next]?.focus();
          }}
        >
          {books.map((book) => {
            const checked = book.id === selected.id;
            return (
              <button
                key={book.id}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                aria-label={`《${book.title}》${book.author ? `，${book.author}` : ""}`}
                onClick={() => setSelectedId(book.id)}
                className="reading-pick book-lift focus-ring"
              >
                <BookObject
                  title={book.title}
                  cover={book.cover}
                  sizes="72px"
                  className="reading-pick-cover"
                />
                <span className="reading-pick-title">{book.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
