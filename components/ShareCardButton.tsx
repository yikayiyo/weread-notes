"use client";

import { ShareIcon } from "./ShareIcon";
import { useShareCard } from "./ShareCardProvider";

export function ShareCardButton() {
  const { openRandom, pool } = useShareCard();

  return (
    <button
      type="button"
      onClick={openRandom}
      disabled={pool.length === 0}
      className="touch-target hidden shrink-0 items-center justify-center rounded-sm border border-border text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
      aria-label="随机摘录"
      title="随机摘录"
    >
      <ShareIcon />
    </button>
  );
}
