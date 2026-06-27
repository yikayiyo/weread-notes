import Link from "next/link";
import type { CSSProperties } from "react";
import type { Book } from "@/lib/types";
import { readingCardAccent } from "@/lib/colors";
import { BookCoverImage } from "./BookCoverImage";
import { ScrollReveal } from "./ScrollReveal";

export function CurrentlyReadingCard({
  book,
  index = 0,
  priority = false,
  initialVisible = false,
}: {
  book: Book;
  index?: number;
  priority?: boolean;
  initialVisible?: boolean;
}) {
  const showProgress = book.progress > 0;
  const accent = readingCardAccent(index);

  const coverFallback = (
    <span
      className="flex h-full items-center justify-center px-2 text-center text-xs"
      style={{ color: accent }}
    >
      {book.title}
    </span>
  );

  return (
    <li>
      <ScrollReveal delayMs={index * 80} initialVisible={initialVisible}>
        <Link
          href={`/notes?book=${book.id}`}
          className="group block space-y-3"
          style={{ "--card-accent": accent } as CSSProperties}
        >
          <div
            className="relative aspect-[2/3] overflow-hidden bg-surface-muted shadow-sm"
            style={{
              outline: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
              outlineOffset: -1,
            }}
          >
            {book.cover ? (
              <BookCoverImage
                src={book.cover}
                alt={book.title}
                sizes="(max-width: 640px) 30vw, 150px"
                priority={priority}
                fallback={coverFallback}
              />
            ) : (
              coverFallback
            )}
          </div>
          <div className="space-y-2">
            <p className="font-title text-sm leading-snug text-primary line-clamp-2 transition-colors group-hover:text-(--card-accent)">
              {book.title}
            </p>
            <p className="text-xs text-secondary line-clamp-1">{book.author}</p>
            {showProgress && (
              <div className="space-y-1.5">
                <div
                  className="h-0.5 overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuenow={book.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`阅读进度 ${book.progress}%`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 motion-reduce:transition-none"
                    style={{
                      width: `${book.progress}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>
                <p className="text-xs tabular-nums text-(--card-accent)">
                  {book.progress}%
                </p>
              </div>
            )}
          </div>
        </Link>
      </ScrollReveal>
    </li>
  );
}
