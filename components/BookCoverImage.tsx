"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export function BookCoverImage({
  src,
  alt,
  sizes,
  className = "object-cover",
  priority = false,
  fallback,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fallback: ReactNode;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
    />
  );
}
