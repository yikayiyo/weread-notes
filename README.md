# 不高山 · Personal Reading Archive

微信读书阅读记录的私人静态站点。

## 站点页面

| 路径 | 说明 |
|------|------|
| `/` | 首页：当前阅读、最近划线与笔记 |
| `/notes` | 摘录：划线 / 笔记浏览，支持按书筛选、列表与网格布局 |
| `/archive` | 归档：藏书按年月排列，列表 / 网格视图 |
| `/about` | 关于 |

宽屏（≥768px）下摘录页左侧为「按书籍浏览」筛选（`sticky`），右侧为工具栏与摘录内容；窄屏顺序为工具栏 → 筛选 → 内容。

## 技术栈

- **框架**：Next.js 16（App Router）、React 19、TypeScript
- **样式**：Tailwind CSS 4
- **字体**：正文 LXGW WenKai（霞鹜文楷），标题 Noto Serif SC，英文点缀 Cormorant Garamond

## 架构

```
WeRead → npm run sync → data/*.json → Git Push → Vercel
```

纯静态站点：无后端、无数据库。页面在**构建时**从仓库里的 `data/*.json` 读取数据并渲染，部署后只提供静态文件。

- 本地运行 `npm run sync` 时，脚本通过 **WeRead Agent API** 拉取数据并写入 `data/`
- 线上站点**不持有** API 密钥，运行时**不连接**微信读书，只读取已同步进仓库的 JSON

## 本地开发

```bash
npm install

# 配置 API Key
cp .env.example .env.local   # Windows: copy .env.example .env.local
# 编辑 .env.local，填入 WEREAD_API_KEY=wrk-xxx

npm run sync        # 增量同步（默认跳过未变书籍）
npm run sync -- --full   # 强制全量重拉
npm run sync:test   # 测试同步（前 5 本）

npm run dev
```

可选：若希望在关于页链到本仓库 README，在 `.env.local` 中设置：

```bash
NEXT_PUBLIC_REPO_README_URL=https://github.com/you/reading-archive/blob/main/README.md
```

## 数据文件

| 文件 | 内容 |
|------|------|
| `data/books.json` | 书架书籍 |
| `data/highlights.json` | 划线 |
| `data/notes.json` | 笔记/想法 |
| `data/reading-stats.json` | 按年统计（派生） |
| `data/meta.json` | 同步元信息（含每本书指纹） |
| `data/cache/` | 按书缓存（本地增量用，不提交 Git） |

## 同步机制

同步**仅在你手动执行** `npm run sync` 时触发，不会在 `npm run dev`、`npm run build` 或 Vercel 部署时自动运行。

### 概览

1. 拉取书架，获取所有书籍的基本信息
2. 分页拉取笔记本列表，确定哪些书有划线或笔记
3. 逐本请求阅读进度、划线列表和想法笔记
4. 写入 `books.json`、`highlights.json`、`notes.json` 等文件，并更新同步元信息

### 增量逻辑（方案 C）

1. 拉取 `/shelf/sync` 和 `/user/notebooks`
2. 对比每本书指纹（划线数、想法数、书签数、最近笔记时间、阅读进度）
3. 未变 → 读 `data/cache/{bookId}.json`，跳过 API
4. 仅进度变 → 只调 `/book/getprogress`
5. 笔记变 → 拉划线 + 想法，更新 cache
6. 合并 cache → 写入 `highlights.json` / `notes.json`（内容相同则跳过写入）

## 样式与设计

- **布局**：全站内容区最大宽度 `76rem`，两侧留白随视口自适应
- **主题**：暖色纸张质感，支持浅色 / 深色模式（`localStorage` + 系统偏好）
- **分区色**：sage（阅读 / 归档）、ochre（摘录 / 划线）、mauve（笔记 / 关于）
- **划线色**：与微信读书阅读器五色一致，卡片背景为对应色调混合

更细的接口字段映射见 [docs/data-model.md](docs/data-model.md)。

## 部署

将 `data/` 与代码一并推送到 Git 后，Vercel 自动构建。`data/` 随仓库部署，无需额外配置。
