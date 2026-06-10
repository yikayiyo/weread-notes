"use client";

import { useEffect, useState } from "react";
import type { ShareMode, ShareTheme } from "@/lib/share-pool";
import { buildShareCardUrl } from "@/lib/share-download";
import { useTheme } from "./ThemeProvider";

export function ShareCardPreview({
  itemEncoded,
  theme,
}: {
  itemEncoded: string;
  theme: ShareTheme;
}) {
  const { theme: siteTheme, mounted } = useTheme();
  const mode: ShareMode = mounted && siteTheme === "dark" ? "dark" : "light";
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const loading = !previewUrl && !error;

  useEffect(() => {
    if (!mounted) return;

    let active = true;
    let objectUrl: string | null = null;
    setPreviewUrl(null);
    setError(null);
    setLoaded(false);

    fetch(buildShareCardUrl(itemEncoded, theme, "svg", mode))
      .then(async (response) => {
        if (!response.ok) throw new Error("preview failed");
        return response.blob();
      })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!active) return;
        setError("卡片预览加载失败，请稍后重试");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [itemEncoded, theme, mode, mounted]);

  return (
    <div className="share-card-preview mx-auto flex h-[360px] w-full max-w-[360px] items-center justify-center overflow-hidden rounded-[2px] border border-border bg-paper">
      {(!mounted || loading) && (
        <div className="flex h-full w-full items-center justify-center bg-surface-muted">
          <span className="spinner" />
        </div>
      )}
      {previewUrl && !loading && mounted && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="分享卡片预览"
          className={`share-card-preview-img h-full w-full object-contain${loaded ? " loaded" : ""}`}
          onLoad={() => setLoaded(true)}
        />
      )}
      {error && !loading && mounted && (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-ochre">
          {error}
        </div>
      )}
    </div>
  );
}
