# 微信读书 · 我的阅读

独立的 Obsidian 桌面插件。每位用户配置自己的微信读书 API key，即可获取电子书、阅读进度、划线和个人笔记，并在 Obsidian 内浏览。

无需 Web App、Node.js 服务、Codex 或其他 AI 工具。界面保留本项目的书封、雾灰背景和卡片风格，以用户自己的阅读概览组织内容。

## 安装与使用

需要 **Obsidian 1.11.4 或更新版本，桌面端**。

1. 解压安装包，将 `bugaoshan-reading` 文件夹放到仓库的 `.obsidian/plugins/` 下。
2. 在「设置 → 第三方插件」启用「微信读书 · 我的阅读」。
3. 点击左侧书本图标或运行命令「微信读书 · 我的阅读：打开我的阅读」。
4. 在页面中粘贴自己的 `wrk-` 开头 API key，点击「同步数据」。同步完成后即可看到自己的阅读概览。

第一次同步会依次获取数据，可查看进度或取消；之后只重新获取发生变化的内容。单本同步失败时，会保留该书已有数据并继续处理其他书，页面列出未完成的书供重试。需要重新抓取时，可在设置中选择「全量同步」。

## 数据与界面

- 一个阅读概览展示最近在读、读过的书、最近划线和最近笔记，并提供查看全部内容的入口。
- 已读书籍与在读、未读藏书分开统计，完成日期使用接口给出的真实记录。
- 划线和笔记支持内容搜索、按书筛选、分页和列表/网格。
- 保留微信读书五色划线标记和独立深浅主题，按 Obsidian 面板宽度响应布局。
- 同步结果保存在当前仓库 `.obsidian/plugins/bugaoshan-reading/data.json`。文本可离线浏览，封面图片仍从微信读书加载。
- 单本失败不会清掉该书的旧缓存，失败内容下次仍会重试；书架或笔记本列表失败、取消或要求升级接口时，保留上次保存的快照。换 key 后不会使用旧账号的笔记缓存。
- 密钥由 [Obsidian SecretStorage](https://docs.obsidian.md/plugins/guides/secret-storage) 管理。插件数据只保存密钥名称和用于隔离缓存的指纹，安装包不包含任何人的 key 或阅读记录。

当前可视化范围是电子书和个人笔记。有声书和文章收藏只计入接口的书架统计，不包含听书明细或文章正文；书签内容目前不在微信读书接口导出范围内。

## 接口

按照 `weread-skills` **1.0.4** 的接口规则，直接请求微信读书官方 Agent Gateway：`https://i.weread.qq.com/api/agent/gateway`。

使用 `/shelf/sync`、`/user/notebooks`、`/book/getprogress`、`/book/bookmarklist` 和 `/review/list/mine`。请求参数平铺，带 `skill_version`；遇到 `upgrade_info` 会停止同步并提示更新插件，不会执行远程返回的代码或命令。

插件与 Web App 共用从原同步脚本抽出的调用流程：按笔记本顺序查询进度和内容，保留原有分页、请求间隔和增量缓存判断。书架独有书籍沿用书架提供的基础状态，不额外逐本请求进度。用户不需要安装 skill 文件，API key 由用户自行取得并配置。

两端统一将请求始发间隔控制在至少 1 秒。收到 `errcode -2014`（请求频率超限）时等待 60 秒并重试一次；仍被限流则保留已成功的数据，暂停剩余请求，页面可稍后重试。这些间隔是保守的工程设置，官方未公布具体限额。旧划线缺少创建时间、整本书想法的章节标记为 `-1` 时仍保留正文，不补造日期或章节。

## 开发

这是 Monorepo 内的 `@weread/obsidian` 工作区，开发时在仓库根目录运行：

```sh
npm ci
npm run build --workspace @weread/obsidian
npm run typecheck --workspace @weread/obsidian
npm test --workspace @weread/obsidian
npm test --workspace @weread/core
npm run package --workspace @weread/obsidian
```

`dist/main.js`、`dist/manifest.json` 和 `dist/styles.css` 是可安装文件；`dist/weread-reading-0.4.2.zip` 可直接上传到 GitHub Release，压缩包已包含正确的 `bugaoshan-reading` 文件夹和安装说明。打包命令使用系统 `zip`（macOS 与 Linux 常见环境已提供）。用户只需下载解压安装，无需执行任何开发命令。

同步逻辑由仓库内 `@weread/core` 包提供，Web App 和插件依赖同一个版本。`plugin.js` 仅负责 Obsidian 密钥、请求和保存适配；`ui.tsx`、`components/`、`lib/` 和 `ui.css` 由插件独立维护，保留网站的视觉风格。构建使用 esbuild 和 Tailwind，将同步核心、React、组件和隔离的 UI 样式打入 `main.js`，不依赖 Web App 或 Next.js 的构建工具。

为兼容已安装版本的配置和缓存，内部插件 ID 与安装目录名仍是 `bugaoshan-reading`。升级时仅替换 `main.js`、`manifest.json` 和 `styles.css`，保留已有 `data.json`。
