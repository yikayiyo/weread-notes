import { createElement } from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { ShareCardTemplate } from "@/components/share-card/ShareCardTemplate";
import { estimateShareCardHeight, SHARE_CARD_WIDTH } from "@/lib/share-card-layout";
import type { ShareItem, ShareTheme } from "@/lib/share-pool";
import { getShareCardFonts } from "@/lib/share-card-fonts";

export async function renderShareCardSvg(
  item: ShareItem,
  theme: ShareTheme,
): Promise<string> {
  const height = estimateShareCardHeight(item);
  return satori(createElement(ShareCardTemplate, { item, theme }), {
    width: SHARE_CARD_WIDTH,
    height,
    fonts: getShareCardFonts(),
  });
}

export async function renderShareCardPng(
  item: ShareItem,
  theme: ShareTheme,
): Promise<Buffer> {
  const svg = await renderShareCardSvg(item, theme);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: SHARE_CARD_WIDTH,
    },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}
