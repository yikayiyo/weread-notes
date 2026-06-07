"use client";

import { ShareIcon } from "./ShareIcon";
import { useShareCard } from "./ShareCardProvider";

export function ShareCardFab() {
  const { openRandom, pool } = useShareCard();

  return (
    <button
      type="button"
      onClick={openRandom}
      disabled={pool.length === 0}
      className="share-card-fab fixed z-40 inline-flex items-center justify-center rounded-full border border-border bg-paper text-accent shadow-[var(--card-shadow)] transition-colors hover:border-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:hidden"
      aria-label="随机摘录"
      title="随机摘录"
    >
      <ShareIcon className="h-5 w-5" />
    </button>
  );
}
