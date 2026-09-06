import type { ImgHTMLAttributes } from "react";

export default function Image({
  src,
  alt,
  fill,
  priority,
  style,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
}) {
  return (
    <img
      {...props}
      alt={alt ?? ""}
      src={typeof src === "string" ? src : src.src}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      style={{
        ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } as const : {}),
        ...style,
      }}
    />
  );
}
