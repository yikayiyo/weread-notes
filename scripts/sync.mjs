/**
 * WeRead → data/*.json, using the same sync engine as the Obsidian plugin.
 * npm run sync | node scripts/sync.mjs --limit 10 | node scripts/sync.mjs --full
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.mjs";
import { syncArchive } from "@weread/core";

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT_DIR, "data");
const CACHE_DIR = join(DATA_DIR, "cache");

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { throw new Error(`无法读取 JSON：${path}`); }
}
function writeJsonIfChanged(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const next = JSON.stringify(data, null, 2) + "\n";
  if (existsSync(path) && readFileSync(path, "utf8") === next) return false;
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync(temporary, next, "utf8");
    renameSync(temporary, path);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  return true;
}
function cachePath(bookId) { return join(CACHE_DIR, `${encodeURIComponent(bookId)}.json`); }
function toUnix(value) {
  const timestamp = value ? Date.parse(value) : NaN;
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : undefined;
}
function group(items) {
  const byBook = new Map();
  for (const item of items) {
    const bookId = String(item.bookId), list = byBook.get(bookId) ?? [];
    list.push(item);
    byBook.set(bookId, list);
  }
  return byBook;
}
function readPrevious() {
  const previous = {
    books: readJson(join(DATA_DIR, "books.json"), []),
    highlights: readJson(join(DATA_DIR, "highlights.json"), []),
    notes: readJson(join(DATA_DIR, "notes.json"), []),
    readingStats: readJson(join(DATA_DIR, "reading-stats.json"), []),
    meta: readJson(join(DATA_DIR, "meta.json"), { fingerprints: {} }),
    cache: { version: 2, books: Object.create(null) },
  };
  for (const file of existsSync(CACHE_DIR) ? readdirSync(CACHE_DIR) : []) {
    if (!file.endsWith(".json")) continue;
    const entry = readJson(join(CACHE_DIR, file), null);
    if (entry && typeof entry === "object") {
      const bookId = String(entry.bookId ?? decodeURIComponent(file.slice(0, -5)));
      previous.cache.books[bookId] = entry;
    }
  }
  const highlights = group(previous.highlights), notes = group(previous.notes);
  for (const book of previous.books) {
    const bookId = String(book.id);
    if (Object.hasOwn(previous.cache.books, bookId)) continue;
    const h = highlights.get(bookId) ?? [], n = notes.get(bookId) ?? [];
    const fp = previous.meta.fingerprints?.[bookId];
    if (!h.length && !n.length && !fp) continue;
    // Bootstrap only from historical fingerprints, never from a just-fetched overview.
    const complete = fp?.content && fp.content.noteCount === h.length && fp.content.reviewCount === n.length;
    previous.cache.books[bookId] = {
      bookId, highlights: h, notes: n,
      progress: { progress: book.progress, startReadingTime: toUnix(book.startedAt), finishTime: toUnix(book.finishedAt), updateTime: toUnix(book.lastReadAt) },
      contentFingerprint: complete ? fp.content : undefined,
      progressFingerprint: complete ? fp.progress : undefined,
      syncedAt: "bootstrapped",
    };
  }
  return previous;
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((arg) => arg === "--limit" || arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.includes("=") ? limitArg.slice(8) : args[args.indexOf(limitArg) + 1]) : Infinity;
  if (limit !== Infinity && (!Number.isInteger(limit) || limit < 0)) throw new Error("--limit 必须是非负整数");
  loadEnv(ROOT_DIR);
  const apiKey = process.env.WEREAD_API_KEY;
  if (!apiKey) throw new Error("Missing WEREAD_API_KEY");
  const previous = readPrevious();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once("SIGINT", cancel);
  let result;
  try {
    result = await syncArchive({
      apiKey, previous, force: args.includes("--full"), limit, signal: controller.signal,
      request: async ({ url, method, headers, body }) => {
        const response = await fetch(url, { method, headers, body, signal: controller.signal });
        let json;
        try { json = await response.json(); } catch { /* The core reports HTTP/format errors. */ }
        return { status: response.status, json };
      },
      onCache: (bookId, entry) => writeJsonIfChanged(cachePath(bookId), entry),
      onProgress: ({ completed, total, message }) => process.stdout.write(`\r  [${completed}/${total}] ${message}`.padEnd(100)),
    });
  } finally {
    process.off("SIGINT", cancel);
    controller.abort();
  }
  process.stdout.write("\n");
  for (const [name, data] of [
    ["meta.json", result.meta], ["books.json", result.books], ["highlights.json", result.highlights],
    ["notes.json", result.notes], ["reading-stats.json", result.readingStats],
  ]) console.log(`  ${name}: ${writeJsonIfChanged(join(DATA_DIR, name), data) ? "updated" : "unchanged"}`);
  const active = new Set(Object.keys(result.cache.books));
  for (const file of existsSync(CACHE_DIR) ? readdirSync(CACHE_DIR) : []) {
    if (file.endsWith(".json") && !active.has(decodeURIComponent(file.slice(0, -5)))) unlinkSync(join(CACHE_DIR, file));
  }
  for (const failure of result.meta.syncFailures) console.warn(`  ${failure.title}: ${failure.message}`);
  console.log(`完成：${result.books.length} 本电子书，${result.highlights.length} 条划线，${result.notes.length} 条笔记；${result.meta.syncFailures.length} 本待重试。`);
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
