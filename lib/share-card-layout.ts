import type { ShareItem } from "./share-pool";
import { formatCitationDate } from "./format";

export const SHARE_CARD_WIDTH = 1080;

const OUTER_PADDING_TOP = 64;
const OUTER_PADDING_BOTTOM = 68;
const HEADER_HEIGHT = 36;
const HEADER_TO_CARD_GAP = 44;
const INNER_PADDING_TOP = 52;
const INNER_PADDING_BOTTOM = 44;
const INNER_PADDING_LEFT = 52;
const INNER_PADDING_RIGHT = 44;
const CONTENT_EXTRA_PADDING_LEFT = 6;
const OUTER_PADDING_X = 68;

const FOOTER_MARGIN_TOP = 40;
const FOOTER_PADDING_TOP = 28;
const FOOTER_GAP = 6;
const NOTE_BODY_GAP = 32;
const QUOTE_BLOCK_HORIZONTAL_INSET = 63;
const QUOTE_BLOCK_VERTICAL_PADDING = 40;

export const CONTENT_WIDTH =
  SHARE_CARD_WIDTH -
  OUTER_PADDING_X * 2 -
  INNER_PADDING_LEFT -
  INNER_PADDING_RIGHT -
  CONTENT_EXTRA_PADDING_LEFT;

export function scaleFontSize(length: number, base: number, min: number): number {
  if (length <= 40) return base;
  if (length <= 80) return base - 4;
  if (length <= 120) return base - 8;
  if (length <= 180) return base - 12;
  return min;
}

function charWidth(char: string, fontSize: number): number {
  if (/\s/.test(char)) return fontSize * 0.3;
  if (/[\u3040-\u9fff\u3400-\u4dbf\uf900-\ufaff\uff00-\uffef]/.test(char)) {
    return fontSize;
  }
  return fontSize * 0.55;
}

function countWrappedLines(text: string, fontSize: number, maxWidth: number): number {
  if (!text) return 0;

  const paragraphs = text.split("\n");
  let totalLines = 0;

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      totalLines += 1;
      continue;
    }

    let lineWidth = 0;
    let lines = 1;

    for (const char of paragraph) {
      const width = charWidth(char, fontSize);
      if (lineWidth + width > maxWidth && lineWidth > 0) {
        lines += 1;
        lineWidth = width;
      } else {
        lineWidth += width;
      }
    }

    totalLines += lines;
  }

  return totalLines;
}

function measureTextBlockHeight(
  text: string,
  fontSize: number,
  lineHeight: number,
  maxWidth: number,
): number {
  const lines = countWrappedLines(text, fontSize, maxWidth);
  if (lines === 0) return 0;
  return lines * fontSize * lineHeight;
}

function estimateFooterHeight(item: ShareItem): number {
  const citationWidth = CONTENT_WIDTH;
  let height = measureTextBlockHeight(
    `《${item.bookTitle}》`,
    26,
    1.5,
    citationWidth,
  );

  if (item.bookAuthor) {
    height += FOOTER_GAP;
    height += measureTextBlockHeight(item.bookAuthor, 24, 1.5, citationWidth);
  }

  const metaParts: string[] = [];
  if (item.chapterTitle) metaParts.push(`〈${item.chapterTitle}〉`);
  if (item.createdAt) metaParts.push(formatCitationDate(item.createdAt));
  const metaLine = metaParts.join(" · ");

  if (metaLine) {
    height += FOOTER_GAP;
    height += measureTextBlockHeight(metaLine, 22, 1.55, citationWidth);
  }

  return height;
}

function estimateBodyHeight(item: ShareItem): number {
  if (item.kind === "highlight") {
    const fontSize = scaleFontSize(item.content.length, 48, 34);
    return measureTextBlockHeight(item.content, fontSize, 1.78, CONTENT_WIDTH);
  }

  let height = 0;

  if (item.content) {
    const fontSize = scaleFontSize(item.content.length, 48, 34);
    height += measureTextBlockHeight(item.content, fontSize, 1.78, CONTENT_WIDTH);
  }

  if (item.quote) {
    if (item.content) height += NOTE_BODY_GAP;
    const fontSize = scaleFontSize(item.quote.length, 28, 22);
    const quoteWidth = CONTENT_WIDTH - QUOTE_BLOCK_HORIZONTAL_INSET;
    height +=
      QUOTE_BLOCK_VERTICAL_PADDING +
      measureTextBlockHeight(item.quote, fontSize, 1.65, quoteWidth);
  }

  return height;
}

export function estimateShareCardHeight(item: ShareItem): number {
  const shellHeight =
    OUTER_PADDING_TOP +
    HEADER_HEIGHT +
    HEADER_TO_CARD_GAP +
    INNER_PADDING_TOP +
    INNER_PADDING_BOTTOM +
    OUTER_PADDING_BOTTOM;

  const footerHeight = FOOTER_MARGIN_TOP + FOOTER_PADDING_TOP + estimateFooterHeight(item);
  const bodyHeight = estimateBodyHeight(item);
  const estimated = shellHeight + bodyHeight + footerHeight + 48;

  return Math.ceil(estimated);
}
