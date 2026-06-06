export type SectionAccent = "sage" | "ochre" | "mauve";

export const sectionAccents: Record<
  SectionAccent,
  {
    title: string;
    link: string;
    linkHover: string;
    bar: string;
    surface: string;
    quoteBorder: string;
    progress: string;
    ring: string;
    tabActive: string;
    toggleActive: string;
  }
> = {
  sage: {
    title: "text-sage",
    link: "text-sage",
    linkHover: "hover:text-sage/80",
    bar: "bg-sage",
    surface: "bg-sage-light",
    quoteBorder: "border-sage/40",
    progress: "var(--sage)",
    ring: "ring-sage ring-offset-paper",
    tabActive: "text-sage",
    toggleActive: "bg-sage text-white",
  },
  ochre: {
    title: "text-ochre",
    link: "text-ochre",
    linkHover: "hover:text-ochre/80",
    bar: "bg-ochre",
    surface: "bg-ochre-light",
    quoteBorder: "border-ochre/35",
    progress: "var(--ochre)",
    ring: "ring-ochre ring-offset-paper",
    tabActive: "text-ochre",
    toggleActive: "bg-ochre text-white",
  },
  mauve: {
    title: "text-mauve",
    link: "text-mauve",
    linkHover: "hover:text-mauve/80",
    bar: "bg-mauve",
    surface: "bg-mauve-light",
    quoteBorder: "border-mauve/35",
    progress: "var(--mauve)",
    ring: "ring-mauve ring-offset-paper",
    tabActive: "text-mauve",
    toggleActive: "bg-mauve text-white",
  },
};

export const pageAccent: Record<string, SectionAccent> = {
  "/": "sage",
  "/notes": "ochre",
  "/archive": "sage",
  "/about": "mauve",
};

/** WeRead 阅读器划线色，工具栏从左到右；API `colorStyle` 1–5 与之对应。 */
export const WEREAD_HIGHLIGHT_COLORS = [
  { colorStyle: 1, hex: "#FF909C", rgb: "rgb(255, 144, 156)", label: "粉" },
  { colorStyle: 2, hex: "#B89FFF", rgb: "rgb(184, 159, 255)", label: "紫" },
  { colorStyle: 3, hex: "#74B4FF", rgb: "rgb(116, 180, 255)", label: "蓝" },
  { colorStyle: 4, hex: "#70D382", rgb: "rgb(112, 211, 130)", label: "绿" },
  { colorStyle: 5, hex: "#FFCB7E", rgb: "rgb(255, 203, 126)", label: "黄" },
] as const;

/** 无 colorStyle 的旧数据 fallback：微信读书默认划线黄 */
export const DEFAULT_HIGHLIGHT_COLOR_STYLE = 5;

const highlightByStyle = Object.fromEntries(
  WEREAD_HIGHLIGHT_COLORS.map(({ colorStyle, hex }) => [
    colorStyle,
    { accent: hex },
  ]),
) as Record<number, { accent: string }>;

function resolveColorStyle(colorStyle?: number): number {
  if (colorStyle == null || colorStyle === 0) {
    return DEFAULT_HIGHLIGHT_COLOR_STYLE;
  }
  return highlightByStyle[colorStyle] ? colorStyle : DEFAULT_HIGHLIGHT_COLOR_STYLE;
}

export function highlightStyle(colorStyle?: number) {
  return highlightByStyle[resolveColorStyle(colorStyle)];
}

export const readingCardAccents = [
  "var(--sage)",
  "var(--accent)",
  "var(--ochre)",
] as const;

export function readingCardAccent(index: number): string {
  return readingCardAccents[index % readingCardAccents.length];
}
