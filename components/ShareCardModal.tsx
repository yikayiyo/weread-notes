"use client";

import { useEffect, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useShareCard } from "./ShareCardProvider";
import { ShareCardPreview } from "./ShareCardPreview";
import { buildShareCardUrl, downloadBlob } from "@/lib/share-download";
import { shareDownloadFilename, type ShareMode } from "@/lib/share-pool";
import { useTheme } from "./ThemeProvider";

export function ShareCardModal() {
  const { open, source, item, theme, itemEncoded, close, shuffle, pool } =
    useShareCard();
  const { theme: siteTheme, mounted } = useTheme();
  const mode: ShareMode = mounted && siteTheme === "dark" ? "dark" : "light";
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
        buildShareCardUrl(itemEncoded, theme, format, mode),
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

  const empty = pool.length === 0;

  return (
    <div
      className="share-card-overlay fixed inset-0 z-50 flex items-center justify-center p-[var(--page-gutter)]"
      data-open={open ? "" : undefined}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-card-title"
        className="share-card-dialog flex w-full max-w-md max-h-[90vh] flex-col gap-5 overflow-y-auto rounded-[2px] border border-border bg-paper p-5 shadow-[var(--card-shadow)] sm:max-w-lg sm:p-6"
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
                key={`${itemEncoded}-${theme}-${mode}`}
                itemEncoded={itemEncoded}
                theme={theme}
              />
            )}

            {exportError && (
              <p className="text-center text-sm text-ochre" role="alert">
                {exportError}
              </p>
            )}

            <div className="flex items-center justify-center gap-3">
              {!fromCard && (
                <button
                  type="button"
                  onClick={shuffle}
                  disabled={exporting !== null}
                  aria-label="换一张"
                  className="share-card-action inline-flex min-h-[var(--touch-min)] min-w-[2.5rem] items-center justify-center rounded-sm border border-border text-accent transition-colors hover:border-accent hover:text-primary disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M17.2929 3.29289C17.6834 2.90237 18.3166 2.90237 18.7071 3.29289L21.7071 6.29289C22.0976 6.68342 22.0976 7.31658 21.7071 7.70711L18.7071 10.7071C18.3166 11.0976 17.6834 11.0976 17.2929 10.7071C16.9024 10.3166 16.9024 9.68342 17.2929 9.29289L18.4858 8.1H17.1339C15.6006 8.1 14.2417 8.85096 13.0268 9.94141C12.6158 10.3103 11.9835 10.2762 11.6146 9.86514C11.2457 9.45413 11.2799 8.82188 11.6909 8.45299C13.0917 7.19573 14.9088 6.1 17.1339 6.1H18.6858L17.2929 4.70711C16.9024 4.31658 16.9024 3.68342 17.2929 3.29289ZM2 7.1C2 6.54772 2.44772 6.1 3 6.1C6.82463 6.1 9.24061 9.04557 11.1944 11.473C11.2677 11.5642 11.3405 11.6548 11.4128 11.7447C12.3547 12.917 13.2086 13.9797 14.1313 14.7835C15.1035 15.6305 16.0541 16.1 17.1291 16.1H18.6858L17.2929 14.7071C16.9024 14.3166 16.9024 13.6834 17.2929 13.2929C17.6834 12.9024 18.3166 12.9024 18.7071 13.2929L21.7071 16.2929C22.0976 16.6834 22.0976 17.3166 21.7071 17.7071L18.7071 20.7071C18.3166 21.0976 17.6834 21.0976 17.2929 20.7071C16.9024 20.3166 16.9024 19.6834 17.2929 19.2929L18.4858 18.1H17.1291C15.3977 18.1 13.9975 17.3195 12.8175 16.2915C11.8362 15.4366 10.94 14.3486 10.0918 13.2941C9.25289 14.3419 8.35876 15.4156 7.37784 16.2661C6.17696 17.3072 4.75087 18.1 3.00536 18.1C2.45308 18.1 2.00536 17.6523 2.00536 17.1C2.00536 16.5477 2.45308 16.1 3.00536 16.1C4.094 16.1 5.07128 15.6188 6.06772 14.7549C7.00179 13.9451 7.86818 12.8757 8.79915 11.7073C7.04692 9.6323 5.35215 8.1 3 8.1C2.44772 8.1 2 7.65229 2 7.1Z" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleExport("png")}
                disabled={exporting !== null || !item}
                aria-label="导出 PNG"
                className="share-card-action inline-flex min-h-[var(--touch-min)] min-w-[2.5rem] items-center justify-center rounded-sm border border-border text-accent transition-colors hover:border-accent hover:text-primary disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.0055 2H12.9945C14.3805 1.99999 15.4828 1.99999 16.3716 2.0738C17.2819 2.14939 18.0575 2.30755 18.7658 2.67552C19.8617 3.24477 20.7552 4.1383 21.3245 5.23415C21.6925 5.94253 21.8506 6.71811 21.9262 7.62839C22 8.5172 22 9.61946 22 11.0054V12.9945C22 13.6854 22 14.306 21.9909 14.8646C22.0049 14.9677 22.0028 15.0726 21.9846 15.175C21.9741 15.6124 21.9563 16.0097 21.9262 16.3716C21.8506 17.2819 21.6925 18.0575 21.3245 18.7658C20.7552 19.8617 19.8617 20.7552 18.7658 21.3245C18.0575 21.6925 17.2819 21.8506 16.3716 21.9262C15.4828 22 14.3805 22 12.9946 22H11.0055C9.61955 22 8.5172 22 7.62839 21.9262C6.71811 21.8506 5.94253 21.6925 5.23415 21.3245C4.43876 20.9113 3.74996 20.3273 3.21437 19.6191C3.20423 19.6062 3.19444 19.5932 3.185 19.5799C2.99455 19.3238 2.82401 19.0517 2.67552 18.7658C2.30755 18.0575 2.14939 17.2819 2.0738 16.3716C1.99999 15.4828 1.99999 14.3805 2 12.9945V11.0055C1.99999 9.61949 1.99999 8.51721 2.0738 7.62839C2.14939 6.71811 2.30755 5.94253 2.67552 5.23415C3.24477 4.1383 4.1383 3.24477 5.23415 2.67552C5.94253 2.30755 6.71811 2.14939 7.62839 2.0738C8.51721 1.99999 9.61949 1.99999 11.0055 2ZM20 11.05V12.5118L18.613 11.065C17.8228 10.2407 16.504 10.2442 15.7182 11.0727L11.0512 15.9929L9.51537 14.1359C8.69326 13.1419 7.15907 13.1746 6.38008 14.2028L4.19042 17.0928C4.13682 16.8463 4.09606 16.5568 4.06694 16.2061C4.0008 15.4097 4 14.3905 4 12.95V11.05C4 9.60949 4.0008 8.59025 4.06694 7.79391C4.13208 7.00955 4.25538 6.53142 4.45035 6.1561C4.82985 5.42553 5.42553 4.82985 6.1561 4.45035C6.53142 4.25538 7.00955 4.13208 7.79391 4.06694C8.59025 4.0008 9.60949 4 11.05 4H12.95C14.3905 4 15.4097 4.0008 16.2061 4.06694C16.9905 4.13208 17.4686 4.25538 17.8439 4.45035C18.5745 4.82985 19.1702 5.42553 19.5497 6.1561C19.7446 6.53142 19.8679 7.00955 19.9331 7.79391C19.9992 8.59025 20 9.60949 20 11.05ZM6.1561 19.5497C5.84198 19.3865 5.55279 19.1833 5.295 18.9467L7.97419 15.4106L9.51005 17.2676C10.2749 18.1924 11.6764 18.24 12.5023 17.3693L17.1693 12.449L19.9782 15.3792C19.9683 15.6812 19.9539 15.9547 19.9331 16.2061C19.8679 16.9905 19.7446 17.4686 19.5497 17.8439C19.1702 18.5745 18.5745 19.1702 17.8439 19.5497C17.4686 19.7446 16.9905 19.8679 16.2061 19.9331C15.4097 19.9992 14.3905 20 12.95 20H11.05C9.60949 20 8.59025 19.9992 7.79391 19.9331C7.00955 19.8679 6.53142 19.7446 6.1561 19.5497Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => void handleExport("svg")}
                disabled={exporting !== null || !item}
                aria-label="导出 SVG"
                className="share-card-action inline-flex min-h-[var(--touch-min)] min-w-[2.5rem] items-center justify-center rounded-sm border border-border text-accent transition-colors hover:border-accent hover:text-primary disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                  <path d="m10 13-2 2 2 2" />
                  <path d="m14 17 2-2-2-2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
