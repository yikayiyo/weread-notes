import { Suspense } from "react";
import { getArchiveData } from "@/lib/data";
import { isArchiveEmpty } from "@/lib/archive-empty";
import { NotesExplorer } from "@/components/NotesExplorer";
import { FirstRunWelcome } from "@/components/FirstRunWelcome";

export const metadata = {
  title: "摘录 · 不高山",
};

export default function NotesPage() {
  const { books, highlights, notes } = getArchiveData();

  return (
    <div className="page-stack">
      {highlights.length === 0 && notes.length === 0 ? (
        isArchiveEmpty() ? (
          <FirstRunWelcome variant="compact" context="notes" />
        ) : (
          <p className="text-secondary">暂无摘录。</p>
        )
      ) : (
        <Suspense fallback={<p className="text-secondary">加载中…</p>}>
          <NotesExplorer books={books} highlights={highlights} notes={notes} />
        </Suspense>
      )}
    </div>
  );
}
