"use client";

import { useEffect, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useShareCard } from "./ShareCardProvider";
import { ShareCardPreview } from "./ShareCardPreview";
import { buildShareCardUrl, downloadBlob } from "@/lib/share-download";
import { shareDownloadFilename } from "@/lib/share-pool";

export function ShareCardModal() {
  const { open, source, item, theme, itemEncoded, close, shuffle, pool } =
    useShareCard();
  const fromCard = source === "card";
  const [exporting, setExporting] = useState<"png" | "svg" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const handleExport = async (format: "png" | "svg") => {
    if (!item || !itemEncoded) return;
    setExporting(format);
    setExportError(null);
    try {
      const response = await fetch(
        buildShareCardUrl(itemEncoded, theme, format),
      );
      if (!response.ok) throw new Error("导出失败");
      const blob = await response.blob();
      downloadBlob(blob, shareDownloadFilename(item, format));
    } catch {
      setExportError("导出失败，请稍后重试");
    } finally {
      setExporting(null);
    }
  };

  if (!open) return null;

  const empty = pool.length === 0;

  return (
    <div
      className="share-card-overlay fixed inset-0 z-50 flex items-center justify-center p-[var(--page-gutter)]"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-card-title"
        className="share-card-dialog flex w-full max-w-md flex-col gap-5 rounded-[2px] border border-border bg-paper p-5 shadow-[var(--card-shadow)] sm:max-w-lg sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="share-card-title"
              className="font-title text-lg text-primary sm:text-xl"
            >
              {fromCard ? "分享摘录" : "随机摘录"}
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {fromCard ? "生成并导出这张摘录" : "分享你的阅读片段"}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="touch-target inline-flex shrink-0 items-center justify-center rounded-sm border border-border px-2 text-secondary transition-colors hover:border-accent hover:text-accent"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {empty ? (
          <p className="py-10 text-center text-sm text-secondary">
            暂无可分享的摘录，同步数据后再来试试。
          </p>
        ) : (
          <>
            {itemEncoded && (
              <ShareCardPreview
                key={`${itemEncoded}-${theme}`}
                itemEncoded={itemEncoded}
                theme={theme}
              />
            )}

            {exportError && (
              <p className="text-center text-sm text-ochre" role="alert">
                {exportError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!fromCard && (
                <button
                  type="button"
                  onClick={shuffle}
                  disabled={exporting !== null}
                  className="share-card-action text-btn min-h-[var(--touch-min)] text-accent transition-colors hover:text-primary disabled:opacity-50"
                >
                  换一张
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleExport("png")}
                disabled={exporting !== null || !item}
                className="share-card-action text-btn min-h-[var(--touch-min)] text-accent transition-colors hover:text-primary disabled:opacity-50"
              >
                {exporting === "png" ? "导出中…" : "导出 PNG"}
              </button>
              <button
                type="button"
                onClick={() => void handleExport("svg")}
                disabled={exporting !== null || !item}
                className="share-card-action text-btn min-h-[var(--touch-min)] text-accent transition-colors hover:text-primary disabled:opacity-50"
              >
                {exporting === "svg" ? "导出中…" : "导出 SVG"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
