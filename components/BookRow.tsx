import Image from "next/image";
import type { Book } from "@/lib/types";

export function BookRow({ book }: { book: Book }) {
  return (
    <div className="flex gap-4">
      {book.cover && (
        <div className="relative h-20 w-14 shrink-0 overflow-hidden bg-surface-muted">
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-title text-base leading-snug text-primary">
          {book.title}
        </p>
        <p className="mt-1 text-sm text-secondary">{book.author}</p>
        {book.progress > 0 && book.progress < 100 && (
          <p className="mt-2 text-xs text-sage">在读 {book.progress}%</p>
        )}
      </div>
    </div>
  );
}
