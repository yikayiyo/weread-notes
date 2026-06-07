"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ShareItem } from "@/lib/share-pool";
import {
  encodeShareItem,
  pickRandomShareItem,
  pickRandomTheme,
  type ShareTheme,
} from "@/lib/share-pool";

export type ShareCardSource = "random" | "card";

type ShareCardContextValue = {
  pool: ShareItem[];
  open: boolean;
  source: ShareCardSource;
  item: ShareItem | null;
  theme: ShareTheme;
  itemEncoded: string | null;
  openRandom: () => void;
  openWithItem: (item: ShareItem, theme?: ShareTheme) => void;
  close: () => void;
  shuffle: () => void;
};

const ShareCardContext = createContext<ShareCardContextValue | null>(null);

export function useShareCard(): ShareCardContextValue {
  const ctx = useContext(ShareCardContext);
  if (!ctx) {
    throw new Error("useShareCard must be used within ShareCardProvider");
  }
  return ctx;
}

function pickPair(pool: ShareItem[]): { item: ShareItem; theme: ShareTheme } | null {
  const item = pickRandomShareItem(pool);
  if (!item) return null;
  return { item, theme: pickRandomTheme() };
}

export function ShareCardProvider({
  pool,
  children,
}: {
  pool: ShareItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<ShareCardSource>("random");
  const [item, setItem] = useState<ShareItem | null>(null);
  const [theme, setTheme] = useState<ShareTheme>("paper");

  const applyPair = useCallback(
    (pair: { item: ShareItem; theme: ShareTheme } | null) => {
      if (!pair) {
        setItem(null);
        setTheme("paper");
        return;
      }
      setItem(pair.item);
      setTheme(pair.theme);
    },
    [],
  );

  const openRandom = useCallback(() => {
    applyPair(pickPair(pool));
    setSource("random");
    setOpen(true);
  }, [applyPair, pool]);

  const openWithItem = useCallback((next: ShareItem, nextTheme?: ShareTheme) => {
    setItem(next);
    setTheme(nextTheme ?? pickRandomTheme());
    setSource("card");
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const shuffle = useCallback(() => {
    applyPair(pickPair(pool));
    setSource("random");
  }, [applyPair, pool]);

  const itemEncoded = useMemo(
    () => (item ? encodeShareItem(item) : null),
    [item],
  );

  const value = useMemo(
    () => ({
      pool,
      open,
      source,
      item,
      theme,
      itemEncoded,
      openRandom,
      openWithItem,
      close,
      shuffle,
    }),
    [
      pool,
      open,
      source,
      item,
      theme,
      itemEncoded,
      openRandom,
      openWithItem,
      close,
      shuffle,
    ],
  );

  return (
    <ShareCardContext.Provider value={value}>{children}</ShareCardContext.Provider>
  );
}
