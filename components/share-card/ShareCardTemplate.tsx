import type { ShareItem, ShareTheme } from "@/lib/share-pool";
import { formatCitationDate } from "@/lib/format";
import { scaleFontSize, SHARE_CARD_WIDTH } from "@/lib/share-card-layout";

/** 对齐 globals.css 浅色主题 */
const SITE = {
  paper: "#f7f4ee",
  cardSurface: "#fdfbf6",
  cardBorder: "#ddd8ce",
  textPrimary: "#171717",
  textSecondary: "#6a6863",
  textCitation: "#8c8c8c",
  surfaceMuted: "#ede9e1",
  border: "#e8e4dc",
};

const SECTION_ACCENTS: Record<ShareTheme, string> = {
  paper: "#5b7a6b",
  ochre: "#8a7344",
  mauve: "#8b6b7a",
};

const CARD_SHADOW =
  "0 1px 2px rgba(23, 23, 23, 0.05), 0 2px 8px rgba(23, 23, 23, 0.03)";

function mixWithSurface(hex: string, ratio = 0.24): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const br = 253;
  const bg = 251;
  const bb = 246;
  const mix = (c: number, bc: number) =>
    Math.round(c * ratio + bc * (1 - ratio));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(mix(r, br))}${toHex(mix(g, bg))}${toHex(mix(b, bb))}`;
}

type ShareCardTemplateProps = {
  item: ShareItem;
  theme: ShareTheme;
};

function HighlightBody({ item }: { item: ShareItem & { kind: "highlight" } }) {
  const mainSize = scaleFontSize(item.content.length, 48, 34);
  return (
    <div
      lang="zh-CN"
      style={{
        display: "flex",
        fontSize: mainSize,
        lineHeight: 1.78,
        fontWeight: 400,
        color: SITE.textPrimary,
      }}
    >
      {item.content}
    </div>
  );
}

function NoteBody({
  item,
  ribbon,
}: {
  item: ShareItem & { kind: "note" };
  ribbon: string;
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
            color: SITE.textPrimary,
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
            backgroundColor: "#f3f1ec",
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
              color: SITE.textSecondary,
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

function CardFooter({ item }: { item: ShareItem }) {
  const metaParts: string[] = [];
  if (item.chapterTitle) metaParts.push(`〈${item.chapterTitle}〉`);
  if (item.createdAt) metaParts.push(formatCitationDate(item.createdAt));
  const metaLine = metaParts.join(" · ");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderTop: `1px solid ${SITE.border}`,
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
            color: "#9a9894",
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
              color: SITE.textSecondary,
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
              color: SITE.textCitation,
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

export function ShareCardTemplate({ item, theme }: ShareCardTemplateProps) {
  const sectionAccent = SECTION_ACCENTS[theme];
  const isHighlight = item.kind === "highlight";
  const cardBg = isHighlight
    ? mixWithSurface(item.accent)
    : SITE.cardSurface;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: SHARE_CARD_WIDTH,
        height: "100%",
        backgroundColor: SITE.paper,
        padding: "64px 68px 68px",
        fontFamily: "Noto Serif SC",
        color: SITE.textPrimary,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 3,
            height: 32,
            borderRadius: 9999,
            backgroundColor: sectionAccent,
            flexShrink: 0,
          }}
        />
        <div
          lang="zh-CN"
          style={{
            display: "flex",
            fontSize: 36,
            fontWeight: 400,
            letterSpacing: "0.04em",
            color: SITE.textPrimary,
          }}
        >
          不高山
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: "0.2em",
            color: sectionAccent,
          }}
        >
          摘录
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 44,
          border: `1px solid ${SITE.cardBorder}`,
          borderRadius: 2,
          backgroundColor: cardBg,
          boxShadow: CARD_SHADOW,
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
            <HighlightBody item={item} />
          ) : (
            <NoteBody item={item} ribbon={sectionAccent} />
          )}
        </div>

        <CardFooter item={item} />
      </div>
    </div>
  );
}
