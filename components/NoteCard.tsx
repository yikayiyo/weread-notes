import type { Book, Note } from "@/lib/types";
import { bookLookup } from "@/lib/format";
import { normalizeExcerptText } from "@/lib/excerpt-filter";
import { sectionAccents, type SectionAccent } from "@/lib/colors";
import { noteToShareItem, type ShareTheme } from "@/lib/share-pool";
import { CardCitation } from "./CardCitation";
import { CardShareButton } from "./CardShareButton";
import { ScrollReveal } from "./ScrollReveal";
import { FormattedText } from "./FormattedText";

function sectionAccentToShareTheme(accent?: SectionAccent): ShareTheme {
  if (accent === "ochre") return "ochre";
  if (accent === "mauve") return "mauve";
  return "paper";
}

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
  const shareItem = book?.title ? noteToShareItem(note, book) : null;

  const article = (
    <article className="note-card group relative rounded-[2px]">
      {shareItem && (
        <CardShareButton
          item={shareItem}
          theme={sectionAccentToShareTheme(accent)}
        />
      )}
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
