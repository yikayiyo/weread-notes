import type { Book } from "@/lib/types";
import { PageSection } from "./PageSection";
import { SectionHeading } from "./SectionHeading";
import { CurrentlyReadingCard } from "./CurrentlyReadingCard";

export function RecommendedBookSection({ book }: { book: Book }) {
  return (
    <PageSection accent="ochre" bleed>
      <SectionHeading
        title="我的推荐"
        accent="ochre"
        href={`/notes?book=${book.id}`}
        linkLabel="查看摘录 →"
      />
      <ul className="grid max-w-[12.5rem] grid-cols-1 gap-5 sm:gap-8">
        <CurrentlyReadingCard book={book} index={0} />
      </ul>
    </PageSection>
  );
}
