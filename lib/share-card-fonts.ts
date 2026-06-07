import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { Font } from "satori";

const FONTS_DIR = join(
  process.cwd(),
  "node_modules/@fontsource/noto-serif-sc/files",
);

const FONT_FAMILY = "Noto Serif SC";
const fontFileCache = new Map<string, Buffer>();

let shareCardFonts: Font[] | null = null;

function readFontFile(filename: string): Buffer | null {
  if (fontFileCache.has(filename)) return fontFileCache.get(filename)!;
  const path = join(FONTS_DIR, filename);
  if (!existsSync(path)) return null;
  const data = readFileSync(path);
  fontFileCache.set(filename, data);
  return data;
}

function loadShareCardFonts(): Font[] {
  const fonts: Font[] = [];

  for (const weight of [400, 600] as const) {
    const cjk = readFontFile(
      `noto-serif-sc-chinese-simplified-${weight}-normal.woff`,
    );
    if (cjk) {
      fonts.push({
        name: FONT_FAMILY,
        data: cjk,
        weight,
        style: "normal",
        lang: "zh-CN",
      });
    }
  }

  for (const weight of [400, 600] as const) {
    const latin = readFontFile(`noto-serif-sc-latin-${weight}-normal.woff`);
    if (latin) {
      fonts.push({
        name: FONT_FAMILY,
        data: latin,
        weight,
        style: "normal",
      });
    }
  }

  return fonts;
}

export function getShareCardFonts(): Font[] {
  if (!shareCardFonts) shareCardFonts = loadShareCardFonts();
  return shareCardFonts;
}
