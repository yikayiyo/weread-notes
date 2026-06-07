"use client";

import type { ShareItem, ShareTheme } from "@/lib/share-pool";
import { ShareIcon } from "./ShareIcon";
import { useShareCard } from "./ShareCardProvider";

export function CardShareButton({
  item,
  theme,
}: {
  item: ShareItem;
  theme?: ShareTheme;
}) {
  const { openWithItem } = useShareCard();

  return (
    <button
      type="button"
      onClick={() => openWithItem(item, theme)}
      className="card-share-btn touch-target inline-flex items-center justify-center rounded-sm border border-border bg-paper/90 text-secondary backdrop-blur-[2px] transition-colors hover:border-accent hover:text-accent"
      aria-label="分享摘录"
      title="分享摘录"
    >
      <ShareIcon className="h-3.5 w-3.5" />
    </button>
  );
}
