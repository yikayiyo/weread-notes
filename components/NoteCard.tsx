import type { Book, Note } from "@/lib/types";
import { bookLookup } from "@/lib/format";
import { normalizeExcerptText } from "@/lib/excerpt-filter";
import { sectionAccents, type SectionAccent } from "@/lib/colors";
import { CardCitation } from "./CardCitation";
import { ScrollReveal } from "./ScrollReveal";
import { FormattedText } from "./FormattedText";

export function NoteCard({
  note,
  books,
  hideBook = false,
  accent,
  reveal = true,
}: {
  note: Note;
  books: Book[];
  hideBook?: boolean;
  accent?: SectionAccent;
  reveal?: boolean;
}) {
  const book = bookLookup(books, note.bookId);
  const colors = accent ? sectionAccents[accent] : null;
  const ribbon = colors?.bar ?? "bg-mauve";
  const body = normalizeExcerptText(note.content);

  const article = (
    <article className="note-card group rounded-[2px]">
      <div className="note-card-body space-y-4">
        {body && (
          <p className="excerpt-text font-title text-primary text-wrap-pretty">
            <FormattedText>{note.content}</FormattedText>
          </p>
        )}

        {note.quote && (
          <div className="note-card-quote" aria-label="书中原文">
            <span
              className={`note-card-quote-accent ${ribbon}`}
              aria-hidden="true"
            />
            <blockquote className="note-card-quote-text text-wrap-pretty">
              <FormattedText>{note.quote}</FormattedText>
            </blockquote>
          </div>
        )}

        <CardCitation
          book={book}
          chapterTitle={note.chapterTitle}
          createdAt={note.createdAt}
          hideBook={hideBook}
        />
      </div>
    </article>
  );

  return reveal ? <ScrollReveal>{article}</ScrollReveal> : article;
}
