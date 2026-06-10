import type { ShareMode } from "@/lib/share-pool";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildShareCardUrl(
  itemEncoded: string,
  theme: string,
  format: "svg" | "png",
  mode: ShareMode = "light",
): string {
  const params = new URLSearchParams({
    format,
    theme,
    mode,
    item: itemEncoded,
  });
  return `/api/share-card?${params.toString()}`;
}
