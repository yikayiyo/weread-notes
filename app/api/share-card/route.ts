import { NextRequest, NextResponse } from "next/server";
import { decodeShareItem, parseShareMode, type ShareTheme, SHARE_THEMES } from "@/lib/share-pool";
import { renderShareCardPng, renderShareCardSvg } from "@/lib/render-share-card";

export const runtime = "nodejs";

function parseTheme(value: string | null): ShareTheme {
  if (value && SHARE_THEMES.includes(value as ShareTheme)) {
    return value as ShareTheme;
  }
  return "paper";
}

/** Same item + theme + format always produces the same output. */
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
} as const;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") ?? "svg";
  const theme = parseTheme(searchParams.get("theme"));
  const mode = parseShareMode(searchParams.get("mode"));
  const encoded = searchParams.get("item");

  if (!encoded) {
    return NextResponse.json({ error: "Missing item" }, { status: 400 });
  }

  const item = decodeShareItem(encoded);
  if (!item) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  try {
    if (format === "png") {
      const png = await renderShareCardPng(item, theme, mode);
      return new NextResponse(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          ...CACHE_HEADERS,
        },
      });
    }

    const svg = await renderShareCardSvg(item, theme, mode);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        ...CACHE_HEADERS,
      },
    });
  } catch (error) {
    console.error("share-card render failed:", error);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
