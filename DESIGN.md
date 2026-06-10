---
name: 不高山
description: 私人阅读档案 · 暖纸质感与三色分区
colors:
  paper: "#f7f4ee"
  ink: "#171717"
  ink-secondary: "#6a6863"
  ink-citation: "#767676"
  accent: "#3d5a73"
  border: "#e8e4dc"
  border-subtle: "#d4cfc4"
  surface-muted: "#ede9e1"
  surface-warm: "#f3f0e8"
  card-surface: "#fdfbf6"
  card-border: "#ddd8ce"
  sage: "#4d6e5c"
  sage-light: "#eef3f0"
  ochre: "#756038"
  ochre-light: "#f7f2e8"
  mauve: "#7a5a6a"
  mauve-light: "#f5eef1"
  hl-pink: "#ff909c"
  hl-purple: "#b89fff"
  hl-blue: "#74b4ff"
  hl-green: "#70d382"
  hl-yellow: "#ffcb7e"
typography:
  display:
    fontFamily: "\"Noto Serif SC\", \"PingFang SC\", \"Microsoft YaHei\", ui-serif, serif"
    fontSize: "clamp(1.75rem, 4.5vw, 2.375rem)"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "normal"
  headline:
    fontFamily: "\"Noto Serif SC\", \"PingFang SC\", \"Microsoft YaHei\", ui-serif, serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.2em"
  body:
    fontFamily: "\"LXGW WenKai\", \"PingFang SC\", \"Microsoft YaHei\", serif"
    fontSize: "clamp(1rem, 2.5vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "\"Noto Serif SC\", \"PingFang SC\", serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.2em"
  english:
    fontFamily: "Georgia, ui-serif, serif"
    fontSize: "clamp(2.5rem, 7vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "2px"
  pill: "9999px"
spacing:
  page-gutter: "clamp(1.25rem, 4vw, 2rem)"
  section-gap: "clamp(3rem, 6vw, 4.5rem)"
  block-gap: "clamp(1.75rem, 3.5vw, 2.5rem)"
  content-max: "76rem"
  touch-min: "2.75rem"
components:
  filter-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    padding: "0 0.75rem"
    height: "{spacing.touch-min}"
  filter-pill-selected:
    backgroundColor: "{colors.ochre-light}"
    textColor: "{colors.ochre}"
    rounded: "{rounded.sm}"
    padding: "0 0.75rem"
    height: "{spacing.touch-min}"
  theme-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    padding: "0"
    size: "{spacing.touch-min}"
  note-card:
    backgroundColor: "{colors.card-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "1.5rem 1.25rem 1.375rem"
  highlight-card:
    backgroundColor: "{colors.card-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "1.5rem 1.25rem 1.375rem"
---

# Design System: 不高山

## Overview

**Creative North Star: "The Annotated Desk"（标注书桌）**

不高山的设计语言来自一张私人书桌：暖色纸张、细线分隔、边缘留着阅读时的彩色标注。全站不是应用面板，而是一本可翻页的读书记。排版承担层次，装饰让位于摘录与书籍封面；sage、ochre、mauve 三色像书签一样标记不同内容类型，微信读书的五色划线则直接印在纸面上。

系统明确拒绝 SaaS 仪表盘美学、玻璃拟态、大圆角幽灵卡片，以及每个区块上方的小号全大写 eyebrow。深色模式不是反转炫技，而是同一书桌在夜灯下的低对比变体。

**Key Characteristics:**

- 暖纸底（`#f7f4ee`）+ 三色分区（sage / ochre / mauve），accent 蓝灰用于链接与焦点
- 2px 微圆角、细边框、极轻阴影（blur ≤ 8px）， elevation 克制
- 中文衬线标题 + 霞鹜文楷正文，系统字体先行、Webfont 渐进增强
- 摘录卡片左对齐 content-rail（0.875rem），与 SectionHeading 色条对齐
- 滚动揭示与页面进入动画轻量，完整支持 `prefers-reduced-motion`

## Colors

暖中性纸张为画布，三色分区标注语义，微信读书划线色保留原样。

### Primary

- **Slate Accent**（`#3d5a73`）：导航 hover、输入焦点、focus ring、通用链接态。全站唯一的「工具色」，用量 ≤10%。
- **Sage**（`#4d6e5c` / light `#eef3f0`）：阅读与归档。SectionHeading 色条、导航当前页（首页 / 归档）、阅读进度条。
- **Ochre**（`#756038` / light `#f7f2e8`）：划线与摘录。筛选 pill 选中态、分段控件指示、首访引导链接。
- **Mauve**（`#7a5a6a` / light `#f5eef1`）：笔记与关于。笔记卡片引用带、关于页诗词边框。

### Secondary

- **WeRead Highlight Five**（粉 `#ff909c`、紫 `#b89fff`、蓝 `#74b4ff`、绿 `#70d382`、黄 `#ffcb7e`）：与微信读书阅读器一致。HighlightCard 背景以对应色 24%（浅色）/ 12%（深色）混合 `--card-surface`。

### Neutral

- **Paper**（`#f7f4ee`）：页面背景。深色模式 `#1a1916`。
- **Ink**（`#171717`）：正文。Secondary `#6a6863`，Citation `#767676`。
- **Border**（`#e8e4dc` / subtle `#d4cfc4`）：header/footer 分隔、卡片边框、输入下划线。
- **Card Surface**（`#fdfbf6` / border `#ddd8ce`）：NoteCard 与 HighlightCard 底色。
- **Surface Muted**（`#ede9e1`）：书封占位、引用块背景。

### Named Rules

**The Three Bookmark Rule.** Sage、ochre、mauve 各对应一种内容类型，同一语义全站同色。不在同一页面混用三种分区色做装饰。

**The WeRead Fidelity Rule.** 划线卡片背景色必须来自微信读书五色，不另造高亮色。`colorStyle` 1–5 与 API 字段一一对应。

## Typography

**Display Font:** Noto Serif SC（标题，Webfont 渐进加载）  
**Body Font:** LXGW WenKai 霞鹜文楷（正文）  
**English Accent:** Georgia（首访预览引号等英文点缀）

**Character:** 中文衬线标题带来书卷气，文楷正文像手写读书笔记。标题用小号 + 宽字距（0.2em）作 section label，而非大号 display  shouting。

### Hierarchy

- **Display**（400, `clamp(1.75rem, 4.5vw, 2.375rem)`, lh 1.25）：首访欢迎标题。上限远低于 6rem。
- **Headline / Section Label**（500, 0.875rem, tracking 0.2em）：SectionHeading、导航。配合 2px 宽色条。
- **Body / Excerpt**（400, `clamp(1rem, 2.5vw, 1.125rem)`, lh 1.75–1.8）：划线与笔记正文。`text-wrap: pretty`。
- **Label**（400, 0.75rem, tracking 0.12–0.22em）：诗词出处、计数、分页元信息。
- **English ornament**（Georgia, 大引号装饰）：首访预览区，非正文。

### Named Rules

**The Rail Alignment Rule.** 卡片内容左内边距使用 `calc(var(--content-rail) - 1px)`（0.875rem），与 SectionHeading 色条 + gap 对齐，形成统一竖向书脊。

## Elevation

以 tonal layering 为主，阴影极轻且仅用于卡片静止态。深色模式下卡片去阴影，改靠 border 与 surface 色差分层。

### Shadow Vocabulary

- **Card rest**（`0 1px 2px …5%, 0 2px 8px …3%`）：NoteCard、HighlightCard。blur 最大 8px，禁止与 1px border 叠加宽阴影。
- **Book cover**（`shadow-sm`）：CurrentlyReadingCard 书封，outline 1px accent 35% mix。

### Named Rules

**The Flat Dark Rule.** 深色模式下 `.note-card` 与 `.highlight-card` 移除 box-shadow，背景 `--surface-muted`；HighlightCard 以 2px 顶边 `--hl-accent` 标识划线色。

## Components

### Navigation

- **Style:** 文字链，0.875rem，`text-secondary` 默认。
- **Active:** 当前路由对应分区色 + `font-medium`（sage / ochre / mauve 随页面）。
- **Hover:** `text-accent`（`#3d5a73`）。
- **Header:** 底边 1px border + 2px 渐变条（sage → ochre → mauve 55% mix）。

### Buttons & Controls

- **Theme toggle:** 2.75rem 方框，1px border，hover border/text → accent。图标 16px stroke。
- **Filter pill:** 2px 圆角，1px border 70% mix，选中 ochre border + ochre-light 底。
- **Segmented control / view toggle:** 1px border 容器，2px 内 padding，指示块 ochre-light（或 sage 变体），transition 300ms ease-out。
- **Text button / pagination:** 无背景，color transition 200ms，disabled opacity 0.4。
- **Focus:** 全局 2px solid accent outline，offset 2px。

### Cards / Containers

- **NoteCard:** card-surface 底，1px card-border，2px 半径，card-shadow。引用块 3px 竖条 + muted 底。
- **HighlightCard:** 同上，背景 mix `--hl-accent` 24%（浅）/ 顶边 2px accent（深）。
- **CurrentlyReadingCard:** 2:3 书封，accent outline 35%，标题 hover → card-accent。
- **Internal padding:** 列表 1.5rem；网格模式 1rem。

### Inputs

- **Input line:** 透明底，仅 bottom border subtle，focus → accent border。640px 以上 0.875rem。

### SectionHeading（签名组件）

- 2px × 16px 圆角色条（sage/ochre/mauve）+ 小号 tracking 标题 + 可选右侧链接（同色 + hover 80%）。

### Share & Modal

- Overlay：`text-primary` 28% mix。FAB 3.25rem 圆角（全圆），fixed 右下 safe-area -aware。

## Do's and Don'ts

### Do:

- **Do** 用 sage / ochre / mauve 标记阅读、划线、笔记三种内容，全站语义一致。
- **Do** 保持 2px 圆角与细边框；卡片阴影 blur 不超过 8px。
- **Do** 让正文行宽自然流动，摘录区使用 `text-wrap: pretty`。
- **Do** 为所有交互元素提供 `:focus-visible` 2px accent 环。
- **Do** 在 `prefers-reduced-motion: reduce` 下禁用 page-enter、scroll-reveal、分段指示动画。

### Don't:

- **Don't** 使用 SaaS 仪表盘、数据表格或 hero-metric 模板布局。
- **Don't** 使用 gradient text、玻璃拟态、或对卡片同时施加 1px border + 16px+ 宽阴影。
- **Don't** 在 section 上方堆叠小号全大写 tracked eyebrow（「最近在看」已是中文 label，无需再加 ENGLISH KICKER）。
- **Don't** 把卡片圆角做到 12px 以上；全站卡片顶 2px，标签 pill 可用全圆。
- **Don't** 用 border-left > 1px 作列表装饰（about 页诗词在桌面端已去除左边框；NoteCard 引用块 3px 竖条仅限引用上下文）。
- **Don't** 深色模式引入紫色渐变或霓虹 accent；保持与浅色相同的色相关系。
- **Don't** 把阅读记录做成无限滚动 social feed；分页与筛选是既定交互。
