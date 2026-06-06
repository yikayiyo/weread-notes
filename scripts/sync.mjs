/**
 * WeRead → data/*.json (incremental via data/cache/)
 * Usage: copy .env.example → .env.local, set WEREAD_API_KEY, then npm run sync
 *        node scripts/sync.mjs --limit 10   (test run)
 *        node scripts/sync.mjs --full       (ignore cache, re-fetch all)
 */

import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from "fs";
import { createHash } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "./load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
loadEnv(ROOT_DIR);

const DATA_DIR = join(ROOT_DIR, "data");
const CACHE_DIR = join(DATA_DIR, "cache");
const SKILL_VERSION = "1.0.3";
const GATEWAY = "https://i.weread.qq.com/api/agent/gateway";

const limitArg = process.argv.find((a) => a.startsWith("--limit"));
const NOTEBOOK_LIMIT = limitArg
  ? parseInt(
      limitArg.split("=")[1] ||
        process.argv[process.argv.indexOf("--limit") + 1],
      10,
    )
  : Infinity;
const FORCE_FULL = process.argv.includes("--full");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toIso(unix) {
  if (!unix) return undefined;
  return new Date(Number(unix) * 1000).toISOString();
}

function stableJson(data) {
  return JSON.stringify(data);
}

function contentHash(data) {
  return createHash("sha256").update(stableJson(data)).digest("hex").slice(0, 16);
}

async function weread(apiName, params = {}) {
  const key = process.env.WEREAD_API_KEY;
  if (!key) {
    console.error("Missing WEREAD_API_KEY");
    process.exit(1);
  }
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_name: apiName,
      skill_version: SKILL_VERSION,
      ...params,
    }),
  });
  const data = await res.json();
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`${apiName} errcode=${data.errcode}`);
  }
  return data;
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJsonIfChanged(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const next = JSON.stringify(data, null, 2) + "\n";
  if (existsSync(path) && readFileSync(path, "utf-8") === next) {
    return false;
  }
  writeFileSync(path, next, "utf-8");
  return true;
}

function cachePath(bookId) {
  return join(CACHE_DIR, `${bookId}.json`);
}

function loadCache(bookId) {
  return readJson(cachePath(bookId), null);
}

function writeCache(bookId, entry) {
  writeJsonIfChanged(cachePath(bookId), entry);
}

function contentFingerprint(nb) {
  return {
    noteCount: nb.noteCount ?? 0,
    reviewCount: nb.reviewCount ?? 0,
    bookmarkCount: nb.bookmarkCount ?? 0,
    sort: nb.sort ?? 0,
  };
}

function progressFingerprint(nb, shelfBook) {
  return {
    readingProgress: nb.readingProgress ?? 0,
    markedStatus: nb.markedStatus ?? 0,
    shelfReadUpdateTime: shelfBook?.readUpdateTime ?? 0,
  };
}

function fingerprintsMatch(a, b) {
  return stableJson(a) === stableJson(b);
}

function applyProgress(book, p) {
  if (p.progress != null) book.progress = p.progress;
  book.startedAt = toIso(p.startReadingTime);
  book.finishedAt = toIso(p.finishTime);
  book.lastReadAt = toIso(p.updateTime) ?? book.lastReadAt;
}

async function fetchAllNotebooks() {
  const all = [];
  let lastSort;
  let page = 0;
  while (true) {
    page++;
    const params = { count: 100 };
    if (lastSort) params.lastSort = lastSort;
    const res = await weread("/user/notebooks", params);
    if (res.books?.length) all.push(...res.books);
    console.log(
      `  notebooks page ${page}: +${res.books?.length ?? 0} (total ${all.length})`,
    );
    if (!res.hasMore || !res.books?.length) break;
    lastSort = res.books[res.books.length - 1].sort;
    await sleep(300);
  }
  return all;
}

async function fetchAllReviews(bookId) {
  const all = [];
  let synckey = 0;
  while (true) {
    const res = await weread("/review/list/mine", {
      bookid: bookId,
      synckey,
      count: 50,
    });
    if (res.reviews?.length) {
      for (const item of res.reviews) {
        const r = item.review ?? item;
        all.push({
          id: r.reviewId || item.reviewId,
          bookId: r.bookId || bookId,
          content: r.content || "",
          quote: r.abstract || undefined,
          chapterUid: r.chapterUid,
          chapterTitle: r.chapterTitle || r.chapterName,
          createdAt: toIso(r.createTime),
          range: r.range,
          isPrivate: r.isPrivate === 1,
        });
      }
    }
    if (!res.hasMore) break;
    synckey = res.synckey;
    await sleep(200);
  }
  return all;
}

function chapterTitle(chapters, uid) {
  const ch = chapters?.find((c) => c.chapterUid === uid);
  return ch?.title;
}

async function syncBookNotes(bookId) {
  const [hlRes, notes] = await Promise.all([
    weread("/book/bookmarklist", { bookId }),
    fetchAllReviews(bookId),
  ]);

  const chapters = hlRes.chapters ?? [];
  const highlights = (hlRes.updated ?? []).map((h) => ({
    id: h.bookmarkId,
    bookId: h.bookId,
    content: h.markText,
    chapterUid: h.chapterUid,
    chapterTitle: chapterTitle(chapters, h.chapterUid),
    createdAt: toIso(h.createTime),
    range: h.range,
    colorStyle: h.colorStyle,
  }));

  return { highlights, notes };
}

function deriveReadingStats(books, highlights) {
  const byYear = new Map();
  for (const book of books) {
    if (!book.finishedAt) continue;
    const year = new Date(book.finishedAt).getFullYear();
    const entry = byYear.get(year) ?? { year, booksRead: 0, highlightCount: 0 };
    entry.booksRead++;
    byYear.set(year, entry);
  }
  for (const h of highlights) {
    const year = new Date(h.createdAt).getFullYear();
    const entry = byYear.get(year) ?? { year, booksRead: 0, highlightCount: 0 };
    entry.highlightCount++;
    byYear.set(year, entry);
  }
  return [...byYear.values()].sort((a, b) => b.year - a.year);
}

function mergeFromCache(activeBookIds) {
  const allHighlights = [];
  const allNotes = [];

  for (const bookId of activeBookIds) {
    const cache = loadCache(bookId);
    if (!cache) continue;
    allHighlights.push(...(cache.highlights ?? []));
    allNotes.push(...(cache.notes ?? []));
  }

  return { allHighlights, allNotes };
}

/** Seed cache from committed aggregates so the first incremental run skips API. */
function bootstrapCacheFromAggregates(notebooks, prevFingerprints) {
  const highlights = readJson(join(DATA_DIR, "highlights.json"), []);
  const notes = readJson(join(DATA_DIR, "notes.json"), []);
  if (highlights.length === 0 && notes.length === 0) return 0;

  const hlByBook = new Map();
  for (const h of highlights) {
    hlByBook.set(h.bookId, [...(hlByBook.get(h.bookId) ?? []), h]);
  }
  const ntByBook = new Map();
  for (const n of notes) {
    ntByBook.set(n.bookId, [...(ntByBook.get(n.bookId) ?? []), n]);
  }

  const books = readJson(join(DATA_DIR, "books.json"), []);
  const bookById = new Map(books.map((b) => [b.id, b]));

  let seeded = 0;
  for (const nb of notebooks) {
    const bookId = nb.bookId;
    if (existsSync(cachePath(bookId))) continue;
    const bookHighlights = hlByBook.get(bookId);
    const bookNotes = ntByBook.get(bookId);
    if (!bookHighlights?.length && !bookNotes?.length) continue;

    const book = bookById.get(bookId);
    const contentFp = contentFingerprint(nb);
    const progressFp = progressFingerprint(nb, null);

    writeCache(bookId, {
      bookId,
      highlights: bookHighlights ?? [],
      notes: bookNotes ?? [],
      progress: book
        ? {
            progress: book.progress,
            startReadingTime: book.startedAt
              ? Math.floor(new Date(book.startedAt).getTime() / 1000)
              : undefined,
            finishTime: book.finishedAt
              ? Math.floor(new Date(book.finishedAt).getTime() / 1000)
              : undefined,
            updateTime: book.lastReadAt
              ? Math.floor(new Date(book.lastReadAt).getTime() / 1000)
              : undefined,
          }
        : {},
      contentFingerprint: contentFp,
      progressFingerprint: progressFp,
      syncedAt: prevFingerprints[bookId] ? undefined : "bootstrapped",
    });
    seeded++;
  }
  return seeded;
}

function pruneOrphanCaches(activeBookIds) {
  if (!existsSync(CACHE_DIR)) return 0;
  const active = new Set(activeBookIds);
  let removed = 0;
  for (const file of readdirSync(CACHE_DIR)) {
    if (!file.endsWith(".json")) continue;
    const bookId = file.replace(/\.json$/, "");
    if (!active.has(bookId)) {
      unlinkSync(join(CACHE_DIR, file));
      removed++;
    }
  }
  return removed;
}

async function main() {
  console.log("=== WeRead Sync ===");
  if (FORCE_FULL) console.log("  mode: full (ignoring cache)");
  else console.log("  mode: incremental");
  console.log();

  const prevMeta = readJson(join(DATA_DIR, "meta.json"), {
    fingerprints: {},
  });
  const prevFingerprints = prevMeta.fingerprints ?? {};

  console.log("1/4 Fetching shelf...");
  const shelf = await weread("/shelf/sync");
  const shelfById = new Map();
  for (const b of shelf.books ?? []) {
    shelfById.set(b.bookId, b);
  }

  const bookMap = new Map();
  for (const b of shelf.books ?? []) {
    bookMap.set(b.bookId, {
      id: b.bookId,
      title: b.title,
      author: b.author,
      cover: b.cover,
      category: b.category,
      progress: b.finishReading === 1 ? 100 : 0,
      lastReadAt: toIso(b.readUpdateTime),
      highlightCount: 0,
      noteCount: 0,
    });
  }
  console.log(`  shelf: ${bookMap.size} books`);

  console.log("\n2/4 Fetching notebooks...");
  const notebooks = await fetchAllNotebooks();
  const activeNotebookIds = notebooks.map((nb) => nb.bookId);

  if (!FORCE_FULL && !existsSync(CACHE_DIR)) {
    const seeded = bootstrapCacheFromAggregates(notebooks, prevFingerprints);
    if (seeded > 0) {
      console.log(`  bootstrapped ${seeded} cache file(s) from existing data`);
    }
  }

  const notebookBooks =
    NOTEBOOK_LIMIT < Infinity
      ? notebooks.slice(0, NOTEBOOK_LIMIT)
      : notebooks;

  console.log(`\n3/4 Syncing ${notebookBooks.length} notebook books...`);
  const fingerprints = { ...prevFingerprints };
  let skipped = 0;
  let progressOnly = 0;
  let fetched = 0;

  for (let i = 0; i < notebookBooks.length; i++) {
    const nb = notebookBooks[i];
    const bookId = nb.bookId;
    const info = nb.book ?? {};
    const shelfBook = shelfById.get(bookId);
    const existing = bookMap.get(bookId) ?? {
      id: bookId,
      title: info.title,
      author: info.author,
      cover: info.cover,
      progress: 0,
    };

    existing.highlightCount = nb.noteCount ?? 0;
    existing.noteCount = nb.reviewCount ?? 0;
    if (info.title) existing.title = info.title;
    if (info.author) existing.author = info.author;
    if (info.cover) existing.cover = info.cover;
    if (nb.readingProgress) existing.progress = nb.readingProgress;

    const contentFp = contentFingerprint(nb);
    const progressFp = progressFingerprint(nb, shelfBook);
    const cache = FORCE_FULL ? null : loadCache(bookId);
    const prevFp =
      prevFingerprints[bookId] ??
      (cache?.contentFingerprint
        ? {
            content: cache.contentFingerprint,
            progress: cache.progressFingerprint,
          }
        : null);

    const contentSame =
      !FORCE_FULL &&
      cache &&
      prevFp?.content &&
      fingerprintsMatch(contentFp, prevFp.content);
    const progressSame =
      !FORCE_FULL &&
      cache &&
      prevFp?.progress &&
      fingerprintsMatch(progressFp, prevFp.progress);

    let status = "skip";

    try {
      if (contentSame && progressSame) {
        if (cache.progress) applyProgress(existing, cache.progress);
        skipped++;
        status = "cached";
      } else if (contentSame && !progressSame) {
        const progress = await weread("/book/getprogress", { bookId });
        const p = progress.book ?? {};
        applyProgress(existing, p);
        writeCache(bookId, {
          ...cache,
          progress: p,
          contentFingerprint: contentFp,
          progressFingerprint: progressFp,
          syncedAt: new Date().toISOString(),
        });
        progressOnly++;
        status = "progress";
      } else {
        const progress = await weread("/book/getprogress", { bookId });
        const p = progress.book ?? {};
        applyProgress(existing, p);

        const { highlights, notes } = await syncBookNotes(bookId);
        writeCache(bookId, {
          bookId,
          highlights,
          notes,
          progress: p,
          contentFingerprint: contentFp,
          progressFingerprint: progressFp,
          syncedAt: new Date().toISOString(),
        });
        fetched++;
        status = `+${highlights.length}hl +${notes.length}nt`;
      }

      fingerprints[bookId] = { content: contentFp, progress: progressFp };
      bookMap.set(bookId, existing);

      process.stdout.write(
        `\r  [${i + 1}/${notebookBooks.length}] ${existing.title?.slice(0, 28) ?? bookId}  ${status}`.padEnd(
          80,
        ),
      );
    } catch (e) {
      console.error(`\n  skip ${bookId}: ${e.message}`);
    }
    await sleep(250);
  }
  console.log("\n");
  console.log(
    `  fetched: ${fetched}  progress-only: ${progressOnly}  cached: ${skipped}`,
  );

  for (const nb of notebooks) {
    const existing = bookMap.get(nb.bookId);
    if (existing) {
      existing.highlightCount = nb.noteCount ?? existing.highlightCount;
      existing.noteCount = nb.reviewCount ?? existing.noteCount;
    }
  }

  const removedCaches = pruneOrphanCaches(activeNotebookIds);
  if (removedCaches > 0) {
    console.log(`  pruned ${removedCaches} orphan cache file(s)`);
  }

  for (const nb of notebooks) {
    const bookId = nb.bookId;
    fingerprints[bookId] = {
      content: contentFingerprint(nb),
      progress: progressFingerprint(nb, shelfById.get(bookId)),
    };
  }

  const { allHighlights, allNotes } = mergeFromCache(activeNotebookIds);

  const books = [...bookMap.values()].sort(
    (a, b) => new Date(b.lastReadAt ?? 0) - new Date(a.lastReadAt ?? 0),
  );

  const meta = {
    lastSyncedAt: new Date().toISOString(),
    source: "weread",
    stats: {
      shelfBooks: shelf.books?.length ?? 0,
      notebookBooks: notebooks.length,
      totalHighlights: allHighlights.length,
      totalNotes: allNotes.length,
      lastRun: { fetched, progressOnly, skipped },
    },
    fingerprints,
  };

  const readingStats = deriveReadingStats(books, allHighlights);

  console.log("\n4/4 Writing data files...");
  const writes = [
    ["meta.json", writeJsonIfChanged(join(DATA_DIR, "meta.json"), meta)],
    ["books.json", writeJsonIfChanged(join(DATA_DIR, "books.json"), books)],
    [
      "highlights.json",
      writeJsonIfChanged(join(DATA_DIR, "highlights.json"), allHighlights),
    ],
    ["notes.json", writeJsonIfChanged(join(DATA_DIR, "notes.json"), allNotes)],
    [
      "reading-stats.json",
      writeJsonIfChanged(join(DATA_DIR, "reading-stats.json"), readingStats),
    ],
  ];

  for (const [name, changed] of writes) {
    console.log(`  ${name}: ${changed ? "updated" : "unchanged"}`);
  }

  console.log("\nDone!");
  console.log(`  books:      ${books.length}`);
  console.log(`  highlights: ${allHighlights.length}`);
  console.log(`  notes:      ${allNotes.length}`);
  console.log(`  cache:      ${CACHE_DIR}`);
  console.log(`  → ${DATA_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
