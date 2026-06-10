import type { ShareItem, ShareMode, ShareTheme } from "@/lib/share-pool";
import { formatCitationDate } from "@/lib/format";
import { scaleFontSize, SHARE_CARD_WIDTH } from "@/lib/share-card-layout";
import { siteMarkSvgDataUrl } from "@/lib/site-mark-data";

const SHARE_CARD_HEADER_HEIGHT = 30;
const SHARE_CARD_LOGO_HEIGHT = SHARE_CARD_HEADER_HEIGHT;
const SHARE_CARD_LOGO_WIDTH = Math.round(
  SHARE_CARD_LOGO_HEIGHT * (134 / 49),
);
/** 与 SectionHeading 比例一致：色条略低于 logo 视觉高度 */
const SHARE_CARD_BAR_HEIGHT = 22;
const SHARE_CARD_HEADER_GAP = 14;

type SitePalette = {
  paper: string;
  cardSurface: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textCitation: string;
  citationTitle: string;
  surfaceMuted: string;
  border: string;
  quoteBg: string;
  highlightMix: number;
  cardShadow: string;
};

/** 对齐 globals.css 浅色 / 深色主题 */
const PALETTES: Record<ShareMode, SitePalette> = {
  light: {
    paper: "#f7f4ee",
    cardSurface: "#fdfbf6",
    cardBorder: "#ddd8ce",
    textPrimary: "#171717",
    textSecondary: "#6a6863",
    textCitation: "#8c8c8c",
    citationTitle: "#9a9894",
    surfaceMuted: "#ede9e1",
    border: "#e8e4dc",
    quoteBg: "#f3f1ec",
    highlightMix: 0.24,
    cardShadow:
      "0 1px 2px rgba(23, 23, 23, 0.05), 0 2px 8px rgba(23, 23, 23, 0.03)",
  },
  dark: {
    paper: "#1a1916",
    cardSurface: "#252320",
    cardBorder: "#3a3834",
    textPrimary: "#e8e4dc",
    textSecondary: "#9a968f",
    textCitation: "#7a7874",
    citationTitle: "#8a8884",
    surfaceMuted: "#252320",
    border: "#2e2c28",
    quoteBg: "#22201d",
    highlightMix: 0.12,
    cardShadow: "none",
  },
};

const SECTION_ACCENTS: Record<
  ShareMode,
  Record<ShareTheme, string>
> = {
  light: {
    paper: "#5b7a6b",
    ochre: "#8a7344",
    mauve: "#8b6b7a",
  },
  dark: {
    paper: "#8aab96",
    ochre: "#c4a86a",
    mauve: "#a88898",
  },
};

function mixWithSurface(hex: string, surface: string, ratio: number): string {
  const parse = (color: string) => {
    const n = parseInt(color.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const [r, g, b] = parse(hex);
  const [br, bg, bb] = parse(surface);
  const mix = (c: number, bc: number) =>
    Math.round(c * ratio + bc * (1 - ratio));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(mix(r, br))}${toHex(mix(g, bg))}${toHex(mix(b, bb))}`;
}

type ShareCardTemplateProps = {
  item: ShareItem;
  theme: ShareTheme;
  mode?: ShareMode;
};

function HighlightBody({
  item,
  palette,
}: {
  item: ShareItem & { kind: "highlight" };
  palette: SitePalette;
}) {
  const mainSize = scaleFontSize(item.content.length, 48, 34);
  return (
    <div
      lang="zh-CN"
      style={{
        display: "flex",
        fontSize: mainSize,
        lineHeight: 1.78,
        fontWeight: 400,
        color: palette.textPrimary,
      }}
    >
      {item.content}
    </div>
  );
}

function NoteBody({
  item,
  ribbon,
  palette,
}: {
  item: ShareItem & { kind: "note" };
  ribbon: string;
  palette: SitePalette;
}) {
  const mainText = item.content || item.quote || "";
  const mainSize = scaleFontSize(mainText.length, 48, 34);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {item.content ? (
        <div
          lang="zh-CN"
          style={{
            display: "flex",
            fontSize: mainSize,
            lineHeight: 1.78,
            fontWeight: 400,
            color: palette.textPrimary,
          }}
        >
          {item.content}
        </div>
      ) : (
        <div style={{ display: "none" }} />
      )}
      {item.quote ? (
        <div
          style={{
            display: "flex",
            gap: 20,
            padding: "20px 24px 20px 20px",
            backgroundColor: palette.quoteBg,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 3,
              minHeight: 40,
              backgroundColor: ribbon,
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
          <div
            lang="zh-CN"
            style={{
              display: "flex",
              flex: 1,
              fontSize: scaleFontSize(item.quote.length, 28, 22),
              lineHeight: 1.65,
              color: palette.textSecondary,
              fontWeight: 400,
            }}
          >
            {item.quote}
          </div>
        </div>
      ) : (
        <div style={{ display: "none" }} />
      )}
    </div>
  );
}

const CITATION_TITLE_FONT = 26;

function CardFooter({
  item,
  palette,
}: {
  item: ShareItem;
  palette: SitePalette;
}) {
  const metaParts: string[] = [];
  if (item.chapterTitle) metaParts.push(`〈${item.chapterTitle}〉`);
  if (item.createdAt) metaParts.push(formatCitationDate(item.createdAt));
  const metaLine = metaParts.join(" · ");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderTop: `1px solid ${palette.border}`,
        paddingTop: 28,
        marginTop: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          lang="zh-CN"
          style={{
            display: "flex",
            fontSize: CITATION_TITLE_FONT,
            lineHeight: 1.5,
            color: palette.citationTitle,
          }}
        >
          《{item.bookTitle}》
        </div>
        {item.bookAuthor ? (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              lineHeight: 1.5,
              color: palette.textSecondary,
            }}
          >
            {item.bookAuthor}
          </div>
        ) : (
          <div style={{ display: "none" }} />
        )}
        {metaLine ? (
          <div
            lang="zh-CN"
            style={{
              display: "flex",
              fontSize: 22,
              lineHeight: 1.55,
              color: palette.textCitation,
            }}
          >
            {metaLine}
          </div>
        ) : (
          <div style={{ display: "none" }} />
        )}
      </div>
    </div>
  );
}

export function ShareCardTemplate({
  item,
  theme,
  mode = "light",
}: ShareCardTemplateProps) {
  const palette = PALETTES[mode];
  const sectionAccent = SECTION_ACCENTS[mode][theme];
  const isHighlight = item.kind === "highlight";

  const cardBg = isHighlight
    ? mode === "dark"
      ? palette.surfaceMuted
      : mixWithSurface(item.accent, palette.cardSurface, palette.highlightMix)
    : mode === "dark"
      ? palette.surfaceMuted
      : palette.cardSurface;

  const cardBorderStyle =
    mode === "dark" && isHighlight
      ? `1px solid ${palette.cardBorder}`
      : `1px solid ${palette.cardBorder}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: SHARE_CARD_WIDTH,
        height: "100%",
        backgroundColor: palette.paper,
        padding: "64px 68px 68px",
        fontFamily: "Noto Serif SC",
        color: palette.textPrimary,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: SHARE_CARD_HEADER_HEIGHT,
          gap: SHARE_CARD_HEADER_GAP,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 3,
            height: SHARE_CARD_BAR_HEIGHT,
            borderRadius: 9999,
            backgroundColor: sectionAccent,
            flexShrink: 0,
          }}
        />
        <img
          src={siteMarkSvgDataUrl(
            palette.textPrimary,
            SHARE_CARD_LOGO_WIDTH,
            SHARE_CARD_LOGO_HEIGHT,
          )}
          width={SHARE_CARD_LOGO_WIDTH}
          height={SHARE_CARD_LOGO_HEIGHT}
          alt=""
          style={{
            display: "flex",
            width: SHARE_CARD_LOGO_WIDTH,
            height: SHARE_CARD_LOGO_HEIGHT,
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 44,
          border: cardBorderStyle,
          borderTop:
            mode === "dark" && isHighlight
              ? `2px solid ${item.accent}`
              : cardBorderStyle,
          borderRadius: 2,
          backgroundColor: cardBg,
          boxShadow: palette.cardShadow,
          padding: "52px 44px 44px 52px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            paddingLeft: 6,
          }}
        >
          {isHighlight ? (
            <HighlightBody item={item} palette={palette} />
          ) : (
            <NoteBody item={item} ribbon={sectionAccent} palette={palette} />
          )}
        </div>

        <CardFooter item={item} palette={palette} />
      </div>
    </div>
  );
}
