import type { ReactNode } from "react";
import type { Book } from "@/lib/types";
import { formatCitationDate } from "@/lib/format";

function CitationMeta({
  book,
  chapterTitle,
  createdAt,
  showAuthor,
}: {
  book?: Book;
  chapterTitle?: string;
  createdAt: string;
  showAuthor: boolean;
}) {
  const parts: ReactNode[] = [];

  if (showAuthor && book?.author) {
    parts.push(<span key="author">{book.author}</span>);
  }
  if (chapterTitle) {
    parts.push(
      <span key="chapter" className="card-citation-chapter">
        〈{chapterTitle}〉
      </span>,
    );
  }
  if (createdAt) {
    parts.push(
      <time key="date" dateTime={createdAt} className="tabular-nums">
        {formatCitationDate(createdAt)}
      </time>,
    );
  }

  if (parts.length === 0) return null;

  return (
    <p className="card-citation-meta">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <span className="card-citation-sep" aria-hidden="true">
              {" "}
              ·{" "}
            </span>
          )}
          {part}
        </span>
      ))}
    </p>
  );
}

export function CardCitation({
  book,
  chapterTitle,
  createdAt,
  hideBook = false,
  markerColor,
  compact = false,
}: {
  book?: Book;
  chapterTitle?: string;
  createdAt: string;
  hideBook?: boolean;
  markerColor?: string;
  compact?: boolean;
}) {
  const hasMeta =
    (!hideBook && book) || chapterTitle || createdAt;

  if (!hasMeta) return null;

  const showBook = !hideBook && !!book;

  if (compact) {
    return (
      <footer className="card-citation card-citation--compact">
        <div className="card-citation-inner">
          {markerColor && (
            <span
              className="card-citation-marker"
              style={{ backgroundColor: markerColor }}
              aria-hidden="true"
            />
          )}
          <div className="card-citation-content">
            {showBook && (
              <p className="card-citation-compact-book">《{book.title}》</p>
            )}
            <p className="card-citation-compact-meta">
              {chapterTitle && (
                <span className="card-citation-chapter">
                  〈{chapterTitle}〉
                </span>
              )}
              {chapterTitle && createdAt && (
                <span className="card-citation-sep" aria-hidden="true">
                  {" "}
                  ·{" "}
                </span>
              )}
              {createdAt && (
                <time dateTime={createdAt} className="tabular-nums">
                  {formatCitationDate(createdAt)}
                </time>
              )}
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="card-citation">
      <div className="card-citation-inner">
        {markerColor && (
          <span
            className="card-citation-marker"
            style={{ backgroundColor: markerColor }}
            aria-hidden="true"
          />
        )}
        <div className="card-citation-content">
          {showBook && (
            <p className="card-citation-title">《{book.title}》</p>
          )}
          <CitationMeta
            book={book}
            chapterTitle={chapterTitle}
            createdAt={createdAt}
            showAuthor={showBook}
          />
        </div>
      </div>
    </footer>
  );
}
