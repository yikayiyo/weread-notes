# Data Model — 基于真实接口探测

样本书：《段永平投资问答录：大道至简的财富逻辑》（`bookId: 3300193296`）

探测时间：2026-06-06

---

## 数据来源与同步顺序

```
/shelf/sync          → 书架全量（书籍元信息、在读状态）
/user/notebooks      → 有笔记的书（分页，lastSort 游标）
  └─ 每本书：
       /book/info         → 详情（分类、简介、评分）
       /book/getprogress  → 进度（progress、startReadingTime、finishTime）
       /book/bookmarklist → 划线（markText）
       /review/list/mine  → 想法/点评（content）
```

**同步策略建议**

- 书架：全量同步 `books[]`（用于 Archive）
- 划线/笔记：只同步 `/user/notebooks` 返回的 243 本书，不要对 692 本逐本请求
- 书签（`bookmarkCount`）：接口不导出内容，只保留数量统计（可选）

---

## 接口字段 → 档案字段映射

### Book（`/shelf/sync` + `/book/info` + `/book/getprogress`）

| 档案字段 | 来源 | 说明 |
|----------|------|------|
| `id` | `bookId` | 主键 |
| `title` | `title` | |
| `author` | `author` | |
| `cover` | `cover` | CDN URL |
| `category` | `category` 或 `categories[0].title` | |
| `progress` | `getprogress.book.progress` | 0–100 整数，100=读完 |
| `startedAt` | `getprogress.book.startReadingTime` | Unix → ISO |
| `finishedAt` | `getprogress.book.finishTime` | 仅 progress=100 时有值 |
| `lastReadAt` | `getprogress.book.updateTime` | 最近阅读 |
| `highlightCount` | `notebooks.noteCount` | 划线条数 |
| `noteCount` | `notebooks.reviewCount` | 想法/点评条数 |

> `readingTime`（秒）接口有返回，但按产品原则「阅读痕迹优先于阅读数据」，**默认不入档案**，Phase 3 年度报告再考虑。

### Highlight（`/book/bookmarklist` → `updated[]`）

| 档案字段 | 来源 | 说明 |
|----------|------|------|
| `id` | `bookmarkId` | 如 `3300193296_44_1407-1430` |
| `bookId` | `bookId` | |
| `content` | `markText` | 划线原文 |
| `chapterUid` | `chapterUid` | |
| `chapterTitle` | `chapters[]` 按 uid 查找 | 接口附带章节表 |
| `createdAt` | `createTime` | Unix → ISO |
| `range` | `range` | 深链 `weread://bestbookmark?...` |
| `colorStyle` | `colorStyle` | 可选，展示用 |

### Note（`/review/list/mine` → `reviews[]`）

| 档案字段 | 来源 | 说明 |
|----------|------|------|
| `id` | `reviewId` | |
| `bookId` | `review.bookId` | |
| `content` | `review.content` | **用户写的想法**（网站主角） |
| `quote` | `review.abstract` | 被评论的原文（展示时作为引文） |
| `chapterUid` | `review.chapterUid` | 章节点评时有值 |
| `chapterTitle` | `review.chapterTitle` | |
| `createdAt` | `review.createTime` | Unix → ISO |
| `range` | `review.range` | 与划线关联、生成深链 |
| `isPrivate` | `review.isPrivate` | 私密标记，默认同步全部 |

**Note 的三种形态（实测）**

1. **划线想法**：有 `content` + `abstract` + `range`（如「无语」评论「末位淘汰制」）
2. **章节点评**：有 `content` + `chapterTitle`，`abstract` 可能很短
3. **书评**：`chapterName` 为空，无 `range`（本书未出现）

### Meta

```json
{
  "lastSyncedAt": "2026-06-06T12:00:00.000Z",
  "source": "weread",
  "stats": {
    "shelfBooks": 692,
    "notebookBooks": 243,
    "totalHighlights": 5203
  }
}
```

### ReadingStats（派生，Phase 2）

从 `books[]` 按 `finishedAt` 年份聚合，**不由接口直接给出**：

```json
{
  "year": 2026,
  "booksRead": 12,
  "highlightCount": 340
}
```

---

## 文件布局

```
data/
  meta.json
  books.json          # 书架全量或仅已读/在读
  highlights.json     # 全量划线，扁平数组
  notes.json          # 全量想法，扁平数组
  reading-stats.json  # 按年派生（Phase 2）
```

扁平数组 + `bookId` 关联，避免嵌套更新困难，利于 Git diff 和全文搜索。

---

## Notes 页展示结构（摘录集）

```
┌─────────────────────────────────────┐
│  quote（abstract 或独立划线原文）      │  ← 灰色引文区
│                                     │
│  content（用户想法）                 │  ← 正文
│                                     │
│  《书名》· 章节名 · 2026年3月28日     │  ← 元信息
└─────────────────────────────────────┘
```

划线页只展示 `highlights`，无 `content` 的用户批注。

---

## 与初版 Spec 的差异

| 初版 Spec | 实测后调整 |
|-----------|------------|
| `Highlight.content` | ✅ 对应 `markText` |
| `Note.content` | ✅ 对应 review `content`；新增 `quote` 字段存 `abstract` |
| `Book.startedAt` | 用 `startReadingTime`，非书架字段 |
| `ReadingStats.readingHours` | Phase 1 去掉，不符合产品原则 |
| 分开 Highlight / Note | ✅ 保持分开；通过 `range`+`chapterUid` 可选关联 |
