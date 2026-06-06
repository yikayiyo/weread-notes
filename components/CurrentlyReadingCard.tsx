import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Book } from "@/lib/types";
import { readingCardAccent } from "@/lib/colors";
import { ScrollReveal } from "./ScrollReveal";

export function CurrentlyReadingCard({
  book,
  index = 0,
}: {
  book: Book;
  index?: number;
}) {
  const inProgress = book.progress > 0 && book.progress < 100;
  const accent = readingCardAccent(index);

  return (
    <li>
      <ScrollReveal delayMs={index * 80}>
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
              <Image
                src={book.cover}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 30vw, 150px"
              />
            ) : (
              <span
                className="flex h-full items-center justify-center px-2 text-center text-xs"
                style={{ color: accent }}
              >
                {book.title}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-title text-sm leading-snug text-primary line-clamp-2 transition-colors group-hover:text-(--card-accent)">
              {book.title}
            </p>
            <p className="text-xs text-secondary line-clamp-1">{book.author}</p>
            {inProgress && (
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
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${book.progress}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>
                <p
                  className="text-xs tabular-nums text-(--card-accent)"
                >
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
