/* eslint-disable @typescript-eslint/no-require-imports */
const { Plugin, ItemView, PluginSettingTab, Setting, SecretComponent, Notice, requestUrl } = require("obsidian");
const { createHash } = require("node:crypto");
const { syncArchive } = require("@weread/core");
const { mountReadingApp } = require("./ui.tsx");
const css = require("./ui.css");

const VIEW_TYPE = "bugaoshan-reading";

class ReadingView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "我的阅读"; }
  getIcon() { return "book-open"; }
  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("bugaoshan-reading-view");
    const host = this.contentEl.createDiv({ cls: "bugaoshan-reading-host" });
    const shadow = host.attachShadow({ mode: "open" });
    const style = host.ownerDocument.createElement("style");
    style.textContent = css;
    shadow.appendChild(style);
    const mount = host.ownerDocument.createElement("div");
    shadow.appendChild(mount);
    this.ui = mountReadingApp(mount, this.plugin.viewProps());
    this.plugin.views.add(this);
  }
  async onClose() {
    this.plugin.views.delete(this);
    this.ui?.destroy();
    this.ui = null;
    this.contentEl.empty();
  }
}

class ReadingSettings extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName("微信读书 API key")
      .setDesc("首次使用请打开“我的阅读”，直接粘贴 API key。这里可以管理或选择已保存的密钥。")
      .addComponent((el) => {
        const component = new SecretComponent(this.app, el).setValue(this.plugin.settings.secretName);
        return component.onChange(async (name) => {
          if (!await this.plugin.selectSecret(name)) component.setValue(this.plugin.settings.secretName);
        });
      });
    new Setting(this.containerEl)
      .setName("我的阅读")
      .setDesc("直接从微信读书获取自己的电子书、划线和个人笔记；第一次同步可能需要几分钟。")
      .addButton((button) => button.setButtonText("打开我的阅读").setCta().onClick(async () => {
        this.app.setting.close();
        await this.plugin.openView();
      }));
    new Setting(this.containerEl)
      .setName("重新获取全部数据")
      .setDesc("正常同步会复用未变化的数据。出现缺漏时可强制重新获取；失败时保留原缓存。")
      .addButton((button) => button.setButtonText("全量同步").onClick(() => void this.plugin.startSync(true)));
    this.containerEl.createEl("p", {
      text: "同步后的文本保存在当前仓库的插件数据中，断网仍可浏览；封面图片需要联网。无需运行网站或安装 AI 工具。",
      cls: "setting-item-description",
    });
  }
}

module.exports = class ReadingPlugin extends Plugin {
  async onload() {
    this.views = new Set();
    this.settings = { secretName: "" };
    this.snapshot = null;
    this.connecting = false;
    this.syncing = false;
    this.saving = false;
    this.progress = null;
    this.error = null;
    this.saveQueue = Promise.resolve();
    this.active = true;
    try {
      const saved = await this.loadData();
      if (saved?.schemaVersion === 1) {
        this.settings.secretName = typeof saved.settings?.secretName === "string" ? saved.settings.secretName : "";
        const archive = saved.snapshot?.archive;
        if (/^[a-f0-9]{64}$/.test(saved.snapshot?.identity) && archive && [archive.books, archive.highlights, archive.notes, archive.readingStats].every(Array.isArray) && archive.meta) {
          this.snapshot = saved.snapshot;
        }
      }
    } catch {
      this.error = "本地缓存读取失败，请检查插件数据文件；原文件尚未修改。";
    }
    this.registerView(VIEW_TYPE, (leaf) => new ReadingView(leaf, this));
    this.addRibbonIcon("book-open", "打开我的阅读", () => void this.openView());
    this.addCommand({ id: "open-reading-archive", name: "打开我的阅读", callback: () => void this.openView() });
    this.addCommand({ id: "sync-reading-archive", name: "同步微信读书", callback: () => void this.startSync() });
    this.addSettingTab(new ReadingSettings(this.app, this));
  }

  apiKey() {
    return this.settings.secretName ? this.app.secretStorage.getSecret(this.settings.secretName)?.trim() || "" : "";
  }
  identity(key = this.apiKey()) { return key ? createHash("sha256").update(key).digest("hex") : null; }
  visibleArchive() { return this.snapshot?.identity === this.identity() ? this.snapshot.archive : null; }
  serialized(snapshot = this.snapshot, settings = this.settings) { return { schemaVersion: 1, settings, snapshot }; }
  enqueueSave(write) {
    this.saveQueue = this.saveQueue.catch(() => {}).then(write);
    return this.saveQueue;
  }

  async selectSecret(secretName) {
    if (!this.active) return false;
    if (this.syncing || this.connecting) {
      new Notice("请等待当前同步或保存完成后再更换 API key。");
      return false;
    }
    const next = { secretName: typeof secretName === "string" ? secretName : "" };
    this.connecting = true;
    this.error = null;
    this.refreshViews();
    try {
      return await this.enqueueSave(async () => {
        if (!this.active) return false;
        await this.saveData(this.serialized(this.snapshot, next));
        this.settings = next;
        return true;
      });
    } catch {
      this.error = "设置保存失败，请检查仓库写入权限。";
      new Notice(this.error);
      return false;
    } finally {
      this.connecting = false;
      this.refreshViews();
    }
  }

  async connectApiKey(value) {
    if (!this.active || this.syncing || this.connecting) return false;
    const apiKey = typeof value === "string" ? value.trim() : "";
    if (!/^wrk-\S+$/.test(apiKey)) {
      this.error = "请输入微信读书提供的 wrk- 开头 API key。";
      this.refreshViews();
      return false;
    }
    // Obsidian limits secret IDs to 64 characters; cache identities retain the full hash.
    const secretName = `weread-${this.identity(apiKey)}`.slice(0, 64);
    let created = false, connected = false;
    try {
      const existing = this.app.secretStorage.getSecret(secretName);
      if (existing && existing !== apiKey) throw new Error("Secret name already in use");
      created = !existing;
      if (created) this.app.secretStorage.setSecret(secretName, apiKey);
      connected = await this.selectSecret(secretName);
      if (connected && this.active) void this.startSync();
      return connected;
    } catch {
      this.error = "API key 保存失败，请重试。";
      return false;
    } finally {
      if (created && !connected) {
        try {
          // SecretStorage has no public delete API; clear only the value created by this attempt.
          if (this.app.secretStorage.getSecret(secretName) === apiKey) this.app.secretStorage.setSecret(secretName, "");
        } catch {
          this.error = "保存未完成；新密钥仍保存在 Obsidian 密钥管理中，可在那里清除。";
        }
      }
      this.refreshViews();
    }
  }

  async startSync(force = false) {
    if (!this.active || this.syncing || this.connecting) return;
    const apiKey = this.apiKey();
    if (!/^wrk-\S+$/.test(apiKey)) {
      this.error = "请粘贴你的微信读书 API key，再开始同步。";
      this.refreshViews();
      void this.openView();
      return;
    }
    const identity = this.identity(apiKey);
    const controller = new AbortController();
    this.controller = controller;
    this.syncing = true;
    this.error = null;
    this.progress = { completed: 0, total: 0, message: "正在连接微信读书…" };
    this.refreshViews();
    try {
      const archive = await syncArchive({
        apiKey, request: requestUrl, previous: this.visibleArchive(), signal: controller.signal, force,
        onProgress: (progress) => { this.progress = progress; this.refreshViews(); },
      });
      await this.enqueueSave(async () => {
        if (!this.active || controller.signal.aborted || identity !== this.identity()) return;
        const snapshot = { identity, archive };
        this.saving = true;
        this.progress = { completed: 1, total: 1, message: "正在保存阅读档案…" };
        this.refreshViews();
        await this.saveData(this.serialized(snapshot));
        this.snapshot = snapshot;
      });
    } catch (error) {
      if (!controller.signal.aborted) this.error = error.message || "同步失败，请稍后重试。";
    } finally {
      this.syncing = false;
      this.saving = false;
      this.controller = null;
      this.progress = null;
      this.refreshViews();
    }
  }

  viewProps() {
    return {
      archive: this.visibleArchive(), connecting: this.connecting, syncing: this.syncing, saving: this.saving, progress: this.progress,
      error: this.error, hasKey: Boolean(this.apiKey()),
      onConnect: (apiKey) => this.connectApiKey(apiKey),
      onSync: () => void this.startSync(), onCancel: () => { if (!this.saving) this.controller?.abort(); }, onSettings: () => this.openSettings(),
    };
  }
  refreshViews() { if (this.active) for (const view of this.views) view.ui?.update(this.viewProps()); }
  openSettings() { this.app.setting.open(); this.app.setting.openTabById(this.manifest.id); }
  async openView() {
    const workspace = this.app.workspace;
    const leaf = workspace.getLeavesOfType(VIEW_TYPE)[0] || workspace.getLeaf("tab");
    if (leaf.view.getViewType() !== VIEW_TYPE) await leaf.setViewState({ type: VIEW_TYPE, active: true });
    leaf.view.ui?.update(this.viewProps());
    await workspace.revealLeaf(leaf);
  }
  onunload() {
    this.active = false;
    this.controller?.abort();
    for (const view of this.views) { view.ui?.destroy(); view.ui = null; }
    this.views.clear();
  }
};
