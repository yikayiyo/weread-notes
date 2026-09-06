import type { CSSProperties } from "react";
import type { Book, Highlight } from "@weread/core/types";
import { bookLookup } from "../lib/format";
import { highlightStyle } from "../lib/colors";
import { CardCitation } from "./CardCitation";
import { ScrollReveal } from "./ScrollReveal";
import { FormattedText } from "./FormattedText";

export function HighlightCard({
  highlight,
  books,
  hideBook = false,
  reveal = true,
}: {
  highlight: Highlight;
  books: Book[];
  hideBook?: boolean;
  reveal?: boolean;
}) {
  const book = bookLookup(books, highlight.bookId);
  const { accent } = highlightStyle(highlight.colorStyle);

  const article = (
    <article
      className="highlight-card group relative"
      style={{ "--hl-accent": accent } as CSSProperties}
    >
      <div className="highlight-card-main">
        <span
          className="highlight-marker"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />
        <blockquote className="excerpt-text font-excerpt text-primary">
          <FormattedText>{highlight.content}</FormattedText>
        </blockquote>
      </div>
      <CardCitation
        book={book}
        chapterTitle={highlight.chapterTitle}
        createdAt={highlight.createdAt}
        hideBook={hideBook}
      />
    </article>
  );

  return reveal ? <ScrollReveal>{article}</ScrollReveal> : article;
}
