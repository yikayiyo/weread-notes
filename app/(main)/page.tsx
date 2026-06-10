import {
  getBooks,
  getHighlights,
  getNotes,
  getCurrentlyReading,
  getRecentHighlights,
  getRecentNotes,
} from "@/lib/data";
import { HighlightCard } from "@/components/HighlightCard";
import { NoteCard } from "@/components/NoteCard";
import { SectionHeading } from "@/components/SectionHeading";
import { CurrentlyReadingCard } from "@/components/CurrentlyReadingCard";
import { PageSection } from "@/components/PageSection";
import { FirstRunWelcome } from "@/components/FirstRunWelcome";
import { isArchiveEmpty } from "@/lib/archive-empty";

export const metadata = {
  title: "不高山",
};

export default function HomePage() {
  const books = getBooks();
  const highlights = getHighlights();
  const notes = getNotes();
  const reading = getCurrentlyReading(books).slice(0, 3);
  const recentHighlights = getRecentHighlights(highlights, 3);
  const recentNotes = getRecentNotes(notes, 3);

  if (isArchiveEmpty()) {
    return <FirstRunWelcome />;
  }

  return (
    <div className="page-stack">
      {reading.length > 0 && (
        <PageSection>
          <SectionHeading
            title="最近在看"
            href="/archive"
            linkLabel="全部藏书 →"
            accent="sage"
            initialVisible
          />
          <ul className="book-grid">
            {reading.map((book, index) => (
              <CurrentlyReadingCard
                key={book.id}
                book={book}
                index={index}
                priority={index <= 1}
                initialVisible
              />
            ))}
          </ul>
        </PageSection>
      )}

      {recentHighlights.length > 0 && (
        <PageSection>
          <SectionHeading
            title="最近划线"
            href="/notes"
            linkLabel="全部摘录 →"
            accent="ochre"
          />
          <div className="excerpt-list">
            {recentHighlights.map((h) => (
              <HighlightCard
                key={h.id}
                highlight={h}
                books={books}
              />
            ))}
          </div>
        </PageSection>
      )}

      {recentNotes.length > 0 && (
        <PageSection>
          <SectionHeading
            title="最近笔记"
            href="/notes?tab=notes"
            linkLabel="全部摘录 →"
            accent="mauve"
          />
          <div className="excerpt-list">
            {recentNotes.map((n) => (
              <NoteCard key={n.id} note={n} books={books} accent="mauve" />
            ))}
          </div>
        </PageSection>
      )}
    </div>
  );
}
