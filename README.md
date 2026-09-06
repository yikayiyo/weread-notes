# 不高山 · Personal Reading Archive

微信读书阅读记录的私人静态站点。

仓库使用 npm workspaces，同时维护 Web App、Obsidian 插件和共享数据核心。Web 包继续位于根目录，保持已有部署和预览入口。

## 目录与工作区

```text
weread-notes/
├── package.json               # reading-archive：Web 包与 workspace 入口
├── app/ components/ hooks/    # 原 Web 页面、交互和样式
├── lib/ public/ data/         # 原 Web 工具、资源和阅读数据
├── scripts/                   # 原 Web 同步命令与兼容构建入口
├── apps/obsidian/             # @weread/obsidian：独立插件包
└── packages/weread-core/       # @weread/core：共享同步和数据类型
```

`@weread/core` 是唯一的数据获取实现，负责分页、限流重试、增量缓存判断和数据规范化。Web 与插件各自处理密钥来源、请求传输和结果保存。它直接作为本地 workspace 依赖使用，无需发布到 npm。

插件有自己的组件、样式和构建命令，使用 React 与 esbuild，不依赖 Next.js 或 Web 页面。使用说明见 [插件 README](apps/obsidian/README.md)。

在根目录执行 `npm ci` 安装整个工作区。常用命令：

| 命令 | 用途 |
|------|------|
| `npm run dev` | 原 Web 开发预览，可继续追加 `-- --port 3001` |
| `npm run build` | 只构建 Web，输出仍为根 `.next/` |
| `npm run start` | 原 Web 生产预览 |
| `npm run sync` | 原 Web 数据同步，仍读取根环境变量并写入 `data/` |
| `npm run build:plugin` | 独立构建 Obsidian 插件 |
| `npm run package:plugin` | 在 `apps/obsidian/dist/` 生成可下载的插件 ZIP |
| `npm run check:core` | 离线验证共享核心与原 Web 同步入口 |
| `npm run check:plugin` | 验证插件构建、密钥、缓存及取消逻辑 |
| `npm run check:web -- http://127.0.0.1:3000` | 检查已启动的 Web 页面与 SVG/PNG 分享功能 |

插件的安装包只包含运行产物和说明，用户不需要下载 Web App 或安装开发依赖。原 `node scripts/build-obsidian-plugin.mjs`、`node scripts/check-obsidian-plugin.mjs` 和 `node scripts/check-weread-sync.mjs` 仍作为兼容入口保留。

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

阅读页面在**构建时**从仓库里的 `data/*.json` 读取数据并渲染，无需数据库。`/api/share-card` 使用 Node.js 在请求时生成 SVG/PNG 分享图片，因此部署时保留 Next.js 的服务端能力。

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

工作区整理保持原有部署契约：Root Directory 仍为仓库根目录，框架仍为 Next.js，安装命令可用 `npm ci`，构建命令仍为 `npm run build`，输出仍为默认 `.next/`。`app/`、`public/`、`data/`、环境变量位置和页面 URL 均保留。Web 构建不会执行插件构建，也不会自动同步微信读书。

其他基于仓库源码的预览或部署平台继续使用上述根目录和原命令；安装源码时需包含 `apps/`、`packages/` 和根 `package-lock.json`，让 npm 能正确解析本地工作区依赖。已有的线上部署不会因本地目录整理自动改变。
