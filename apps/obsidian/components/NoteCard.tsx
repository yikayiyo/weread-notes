import type { Book, Note } from "@weread/core/types";
import { bookLookup } from "../lib/format";
import { normalizeExcerptText } from "@weread/core/excerpt-filter";
import { CardCitation } from "./CardCitation";
import { ScrollReveal } from "./ScrollReveal";
import { FormattedText } from "./FormattedText";

export function NoteCard({
  note,
  books,
  hideBook = false,
  reveal = true,
}: {
  note: Note;
  books: Book[];
  hideBook?: boolean;
  reveal?: boolean;
}) {
  const book = bookLookup(books, note.bookId);
  const body = normalizeExcerptText(note.content);

  const article = (
    <article className="note-card group relative">
      <div className="note-card-body space-y-4">
        {body && (
          <p className="excerpt-text text-primary">
            <FormattedText>{note.content}</FormattedText>
          </p>
        )}

        {note.quote && (
          <div className="note-card-quote" aria-label="书中原文">
            <p className="note-card-quote-label">原文</p>
            <blockquote className="note-card-quote-text">
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
