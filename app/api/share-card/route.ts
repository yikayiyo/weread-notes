import { NextRequest, NextResponse } from "next/server";
import { decodeShareItem, type ShareTheme, SHARE_THEMES } from "@/lib/share-pool";
import { renderShareCardPng, renderShareCardSvg } from "@/lib/render-share-card";

export const runtime = "nodejs";

function parseTheme(value: string | null): ShareTheme {
  if (value && SHARE_THEMES.includes(value as ShareTheme)) {
    return value as ShareTheme;
  }
  return "paper";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") ?? "svg";
  const theme = parseTheme(searchParams.get("theme"));
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
      const png = await renderShareCardPng(item, theme);
      return new NextResponse(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        },
      });
    }

    const svg = await renderShareCardSvg(item, theme);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("share-card render failed:", error);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
