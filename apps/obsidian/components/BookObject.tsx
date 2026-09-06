import { BookCoverImage } from "./BookCoverImage";

export function BookObject({
  title,
  cover,
  sizes,
  priority = false,
  className = "",
}: {
  title: string;
  cover?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const fallback = (
    <span className="book-object-fallback">{title}</span>
  );

  return (
    <div className={`book-object ${className}`.trim()}>
      {cover ? (
        <BookCoverImage
          src={cover}
          alt={title}
          sizes={sizes}
          priority={priority}
          fallback={fallback}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
