import type { CSSProperties } from "react";
import type { Book, Highlight } from "@/lib/types";
import { bookLookup } from "@/lib/format";
import { highlightStyle } from "@/lib/colors";
import { highlightToShareItem } from "@/lib/share-pool";
import { CardCitation } from "./CardCitation";
import { CardShareButton } from "./CardShareButton";
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
  const shareItem = book?.title ? highlightToShareItem(highlight, book) : null;

  const article = (
    <article
      className="highlight-card group relative rounded-[2px]"
      style={{ "--hl-accent": accent } as CSSProperties}
    >
      {shareItem && <CardShareButton item={shareItem} />}
      <blockquote className="excerpt-text font-title text-primary text-wrap-pretty">
        <FormattedText>{highlight.content}</FormattedText>
      </blockquote>
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
