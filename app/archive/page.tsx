import { getBooks, groupBooksByYearMonth } from "@/lib/data";
import { isArchiveEmpty } from "@/lib/archive-empty";
import { FirstRunWelcome } from "@/components/FirstRunWelcome";
import { ARCHIVE_RECOMMENDATION_TITLE } from "@/lib/recommendations";
import { ArchiveExplorer } from "@/components/ArchiveExplorer";
import { RecommendedBookSection } from "@/components/RecommendedBookSection";

export const metadata = {
  title: "归档 · 不高山",
};

export default function ArchivePage() {
  const books = getBooks();
  const groups = groupBooksByYearMonth(books);
  const recommended = books.find((b) => b.title === ARCHIVE_RECOMMENDATION_TITLE);

  return (
    <div className="page-stack">
      {recommended && <RecommendedBookSection book={recommended} />}

      {groups.length === 0 ? (
        isArchiveEmpty() ? (
          <FirstRunWelcome variant="compact" context="archive" />
        ) : (
          <p className="text-secondary">暂无藏书记录。</p>
        )
      ) : (
        <ArchiveExplorer groups={groups} />
      )}
    </div>
  );
}
