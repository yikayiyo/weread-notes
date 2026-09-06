import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postcss from "postcss";

const keyA = "wrk-test-account-a", keyB = "wrk-test-account-b", keyC = "wrk-test-account-c";
const archive = { books: [], highlights: [], notes: [], readingStats: [], meta: { lastSyncedAt: "2026-09-06", source: "weread", stats: {} } };
const secretName = (key) => `weread-${createHash("sha256").update(key).digest("hex")}`.slice(0, 64);
const secrets = new Map([["my-weread", keyA], ["other-account", keyB]]);
const secretWrites = [], commands = [], ribbons = [];
let stored = null, diskError = false, secretError = false, sync, openedViews = 0, syncCalls = 0, destroyed = 0;
let createView, saveWait;
const app = {
  secretStorage: {
    getSecret: (name) => secrets.get(name) ?? null,
    setSecret(name, value) {
      assert.match(name, /^[a-z0-9-]+$/);
      assert(name.length <= 64, "Obsidian SecretStorage IDs must not exceed 64 characters");
      if (secretError) throw new Error(`模拟 secret 错误 ${keyC}`);
      secretWrites.push({ name, value });
      secrets.set(name, value);
    },
  },
  setting: { open() { assert.fail("首次连接不应打开密钥管理设置"); }, openTabById() {} },
};
class BasePlugin {
  app = app;
  manifest = { id: "bugaoshan-reading" };
  async loadData() { return stored; }
  async saveData(data) {
    if (diskError) throw new Error(`模拟磁盘写入失败 ${keyC}`);
    if (saveWait) await saveWait();
    stored = structuredClone(data);
    for (const key of [keyA, keyB, keyC]) assert(!JSON.stringify(data).includes(key));
  }
  registerView(_, factory) { createView = factory; }
  addRibbonIcon(_, name) { ribbons.push(name); }
  addCommand(command) { commands.push(command.name); }
  addSettingTab() {}
}
const runtime = { module: { exports: {} }, AbortController, Set, Promise,
  require: (name) => {
    if (name === "node:crypto") return { createHash };
    if (name === "@weread/core") return { syncArchive: (...args) => { syncCalls++; return sync(...args); } };
    if (name === "./ui.tsx") return { mountReadingApp() {} };
    if (name === "./ui.css") return "";
    assert.equal(name, "obsidian");
    return { Plugin: BasePlugin, ItemView: class {}, PluginSettingTab: class {}, Notice: class {} };
  },
};
runInNewContext(readFileSync(new URL("../plugin.js", import.meta.url), "utf8"), runtime);
const Plugin = runtime.module.exports;
const plugin = new Plugin();
await plugin.onload();
plugin.openView = async () => { openedViews++; };
assert.equal(createView({}).getDisplayText(), "我的阅读");
assert.deepEqual(ribbons, ["打开我的阅读"]);
assert.deepEqual(commands, ["打开我的阅读", "同步微信读书"]);
assert.equal(plugin.visibleArchive(), null);
await plugin.startSync();
assert.equal(openedViews, 1);
assert.equal(syncCalls, 0, "未配置密钥时不能请求");
for (const invalid of ["", "not-a-key", "wrk-", "wrk-key\nwith-header"]) {
  assert.equal(await plugin.viewProps().onConnect(invalid), false);
}
assert.equal(secretWrites.length, 0, "无效密钥不能写入 SecretStorage");

let complete, lastSync;
const startSync = plugin.startSync.bind(plugin);
plugin.startSync = (...args) => (lastSync = startSync(...args));
sync = (options) => {
  assert.equal(options.apiKey, keyA);
  assert.equal(options.previous, null);
  return new Promise((resolve) => { complete = resolve; });
};
const connecting = plugin.viewProps().onConnect(`  ${keyA}  `);
assert.equal(plugin.viewProps().connecting, true);
assert.equal(await plugin.viewProps().onConnect(keyB), false, "连接期间拒绝重复提交");
await plugin.startSync();
assert.equal(syncCalls, 0, "保存密钥期间不能启动同步");
assert.equal(await connecting, true, "密钥保存后立即返回，不等待全量同步");
assert.equal(plugin.viewProps().connecting, false);
assert.equal(plugin.syncing, true);
assert.equal(secrets.get(secretName(keyA)), keyA);
assert.equal(secrets.get("my-weread"), keyA, "首次连接不修改用户既有的共享密钥");
assert.equal(stored.settings.secretName, secretName(keyA));
assert.equal(stored.snapshot, null);
complete(archive);
await lastSync;
assert.equal(plugin.visibleArchive(), archive);
assert.equal(stored.snapshot.archive.meta.lastSyncedAt, "2026-09-06");
let saved = stored;

sync = async ({ previous }) => { assert.equal(previous, archive); throw new Error("模拟 API 失败"); };
await plugin.startSync();
assert.equal(stored, saved);
assert.equal(plugin.visibleArchive(), archive, "请求失败保留旧缓存");

diskError = true;
sync = async () => ({ ...archive, books: [{ id: "new" }] });
await plugin.startSync();
assert.equal(plugin.visibleArchive(), archive, "写入失败不发布新数据");
assert.equal(stored, saved);
assert.equal(await plugin.viewProps().onConnect(keyB), false);
assert.equal(secrets.get(secretName(keyB)), "", "设置保存失败时清空本次新建的密钥值");
assert.equal(secrets.get("other-account"), keyB);
assert.equal(plugin.settings.secretName, secretName(keyA));
assert.equal(plugin.visibleArchive(), archive);
assert(!plugin.error.includes(keyC), "持久化错误不可泄漏原始异常中的密钥");
const writes = secretWrites.length;
assert.equal(await plugin.viewProps().onConnect(keyA), false);
assert.equal(secretWrites.length, writes, "保存失败也不能清空已存在的同名密钥");
assert.equal(secrets.get(secretName(keyA)), keyA);
diskError = false;

secretError = true;
assert.equal(await plugin.viewProps().onConnect(keyC), false);
assert(!plugin.error.includes(keyC), "原生密钥保存异常不得泄漏 key");
assert.equal(plugin.settings.secretName, secretName(keyA));
assert.equal(plugin.visibleArchive(), archive);
secretError = false;

sync = () => new Promise((resolve) => { complete = resolve; });
const running = plugin.startSync();
const before = syncCalls;
await plugin.startSync();
assert.equal(syncCalls, before, "不能并发同步");
assert.equal(await plugin.viewProps().onConnect(keyB), false, "同步期间拒绝换 key");
assert.equal(await plugin.selectSecret("other-account"), false, "设置页也不能在同步期间换账号");
assert.equal(plugin.settings.secretName, secretName(keyA));
plugin.viewProps().onCancel();
complete({ ...archive, books: [{ id: "cancelled" }] });
await running;
assert.equal(stored, saved);
assert.equal(plugin.visibleArchive(), archive, "取消后的响应不能覆盖旧快照");

assert.equal(await plugin.selectSecret("other-account"), true, "兼容此前已选的原生密钥名称");
assert.equal(plugin.visibleArchive(), null, "切换到新账号后立即隔离旧账号内容");
sync = async ({ previous }) => { assert.equal(previous, null, "新账号不复用旧账号笔记"); return { ...archive, books: [{ id: "account-b" }] }; };
await plugin.startSync();
assert.equal(plugin.visibleArchive().books[0].id, "account-b");
saved = stored;

sync = () => new Promise((resolve) => { complete = resolve; });
const externalChange = plugin.startSync();
secrets.set("other-account", keyA);
complete({ ...archive, books: [{ id: "stale" }] });
await externalChange;
assert.equal(stored, saved, "原生密钥被外部更改后，旧请求不能提交缓存");
secrets.set("other-account", keyB);

const reloaded = new Plugin();
await reloaded.onload();
assert.equal(reloaded.settings.secretName, "other-account");
assert.equal(reloaded.visibleArchive().books[0].id, "account-b", "旧配置重启可从本地缓存浏览");
let releaseQueue;
reloaded.saveQueue = new Promise((resolve) => { releaseQueue = resolve; });
const beforeUnload = syncCalls;
const pendingConnection = reloaded.viewProps().onConnect(keyC);
reloaded.views.add({ ui: { destroy() { destroyed++; } } });
reloaded.onunload();
releaseQueue();
assert.equal(await pendingConnection, false);
assert.equal(secrets.get(secretName(keyC)), "", "卸载前尚未开始持久化时，清理本次新建密钥");
assert.equal(stored, saved);
assert.equal(syncCalls, beforeUnload, "卸载后不能启动首次同步");
assert.equal(destroyed, 1);
assert.equal(reloaded.active, false);

const duringSave = new Plugin();
await duringSave.onload();
saveWait = async () => { duringSave.onunload(); };
assert.equal(await duringSave.viewProps().onConnect(keyC), true, "已经写入磁盘的设置不能留下空密钥引用");
assert.equal(secrets.get(secretName(keyC)), keyC);
assert.equal(stored.settings.secretName, secretName(keyC));
assert.equal(syncCalls, beforeUnload);
saveWait = null;
const css = readFileSync(new URL("../dist/ui.generated.css", import.meta.url), "utf8");
assert.match(css, /\.note-card-body\s*\{/);
assert.match(css, /\.reading-deck-excerpt-body\s*\{/);
assert.doesNotMatch(css, /\.note-card-\.bgs-root/);
let shadowDefaults = false;
postcss.parse(css).walkDecls("--tw-translate-y", (declaration) => {
  if (declaration.value !== "0") return;
  let parent = declaration.parent;
  while (parent) { assert.notEqual(parent.name, "supports", "ShadowRoot 需要无条件的 Tailwind 初始值"); parent = parent.parent; }
  shadowDefaults = true;
});
assert(shadowDefaults);
assert.doesNotMatch(css, /share-card|card-share-btn/);

const pluginDir = fileURLToPath(new URL("../", import.meta.url));
const coreDir = fileURLToPath(new URL("../../../packages/weread-core/", import.meta.url));
const bundleMeta = JSON.parse(readFileSync(new URL("../dist/build-meta.json", import.meta.url), "utf8"));
for (const input of Object.keys(bundleMeta.inputs)) {
  const absolute = path.resolve(pluginDir, input);
  assert(!absolute.includes("/node_modules/next/"), "插件不能依赖 Next.js");
  assert(
    absolute.startsWith(pluginDir) || absolute.startsWith(coreDir) || absolute.includes("/node_modules/"),
    `插件不应引用 Web App 源码: ${input}`,
  );
}
const manifest = JSON.parse(readFileSync(new URL("../dist/manifest.json", import.meta.url), "utf8"));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
assert.equal(manifest.id, "bugaoshan-reading");
assert.equal(manifest.version, pkg.version);
const bundledRuntime = { module: { exports: {} }, setTimeout, clearTimeout, console,
  require(name) {
    assert(["obsidian", "node:crypto"].includes(name), `安装包不能需要额外依赖: ${name}`);
    return runtime.require(name);
  },
};
runInNewContext(readFileSync(new URL("../dist/main.js", import.meta.url), "utf8"), bundledRuntime);
assert.equal(typeof bundledRuntime.module.exports, "function", "安装包应导出 Obsidian 插件");
console.log("Native plugin checks passed: inline key connection, secret rollback, first sync, account isolation, cache commit, cancellation, concurrent guards, legacy restore, unload, shadow CSS, standalone bundle.");
