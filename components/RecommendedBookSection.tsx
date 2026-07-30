import Link from "next/link";
import type { Book, Highlight } from "@/lib/types";
import { PageSection } from "./PageSection";
import { SectionHeading } from "./SectionHeading";
import { BookCoverImage } from "./BookCoverImage";

export function RecommendedBookSection({
  book,
  highlight,
}: {
  book: Book;
  highlight?: Highlight;
}) {
  const href = `/notes?book=${book.id}`;
  const coverFallback = (
    <span className="flex h-full items-center justify-center p-2 text-center text-xs text-secondary">
      {book.title}
    </span>
  );

  return (
    <PageSection className="recommended-feature-section">
      <SectionHeading title="我的推荐" accent="ochre" initialVisible />
      <div className="recommended-feature">
        <Link
          href={href}
          className="recommended-feature-cover focus-ring"
          aria-label={`查看《${book.title}》的摘录`}
        >
          {book.cover ? (
            <BookCoverImage
              src={book.cover}
              alt={book.title}
              sizes="(max-width: 639px) 88px, 112px"
              priority
              fallback={coverFallback}
            />
          ) : (
            coverFallback
          )}
        </Link>

        <div className="recommended-feature-content">
          <div>
            <h3 className="font-title text-lg leading-snug text-primary">
              {book.title}
            </h3>
            <p className="mt-1 text-sm text-secondary">{book.author}</p>
          </div>

          {highlight && (
            <blockquote className="recommended-feature-quote">
              <p>{highlight.content}</p>
              {highlight.chapterTitle && (
                <cite>— {highlight.chapterTitle}</cite>
              )}
            </blockquote>
          )}

          <Link href={href} className="recommended-feature-link focus-ring">
            查看摘录 →
          </Link>
        </div>
      </div>
    </PageSection>
  );
}
