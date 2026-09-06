const GATEWAY = "https://i.weread.qq.com/api/agent/gateway";
const SKILL_VERSION = "1.0.4";

function invalid(path) { throw new Error(`微信读书返回格式异常：${path}`); }
function object(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(path);
  return value;
}
function array(value, path) {
  if (!Array.isArray(value)) invalid(path);
  return value;
}
function string(value, path, fallback) {
  if (value == null && fallback !== undefined) return fallback;
  if (typeof value !== "string") invalid(path);
  return value;
}
function id(value, path) {
  if ((typeof value !== "string" && typeof value !== "number") ||
      (typeof value === "number" && !Number.isFinite(value)) || !String(value).trim()) invalid(path);
  return String(value);
}
function number(value, path, fallback) {
  if (value == null && fallback !== undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) invalid(path);
  return value;
}
function toIso(value, path) {
  if (value == null || value === 0) return undefined;
  const date = new Date(number(value, path) * 1000);
  if (!Number.isFinite(date.getTime())) invalid(path);
  return date.toISOString();
}
function hasMore(value, path) {
  if (![0, 1, false, true].includes(value)) invalid(path);
  return value === 1 || value === true;
}
function readingProgress(value, path) {
  const result = number(value, path);
  if (result > 100) invalid(path);
  return result;
}
function group(items) {
  const result = new Map();
  for (const item of items) {
    const key = String(item.bookId);
    const list = result.get(key) ?? [];
    list.push(item);
    result.set(key, list);
  }
  return result;
}
function contentFingerprint(nb) {
  return {
    noteCount: number(nb.noteCount, "notebook.noteCount", 0),
    reviewCount: number(nb.reviewCount, "notebook.reviewCount", 0),
    bookmarkCount: number(nb.bookmarkCount, "notebook.bookmarkCount", 0),
    sort: number(nb.sort, "notebook.sort", 0),
  };
}
function progressFingerprint(nb, shelfBook) {
  return {
    readingProgress: nb.readingProgress == null ? 0 : readingProgress(nb.readingProgress, "notebook.readingProgress"),
    markedStatus: number(nb.markedStatus, "notebook.markedStatus", 0),
    shelfReadUpdateTime: number(shelfBook?.readUpdateTime, "shelf.readUpdateTime", 0),
  };
}
function fingerprintsMatch(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function applyProgress(book, p) {
  book.progress = readingProgress(p.progress, "progress.progress");
  book.startedAt = toIso(p.startReadingTime, "progress.startReadingTime");
  book.finishedAt = p.progress === 100 ? toIso(p.finishTime, "progress.finishTime") : undefined;
  book.lastReadAt = toIso(p.updateTime, "progress.updateTime") ?? book.lastReadAt;
}
function deriveReadingStats(books, highlights) {
  const byYear = new Map();
  for (const [items, field, count] of [[books, "finishedAt", "booksRead"], [highlights, "createdAt", "highlightCount"]]) {
    for (const item of items) {
      if (!item[field]) continue;
      const year = new Date(item[field]).getFullYear();
      if (!Number.isFinite(year)) continue;
      const row = byYear.get(year) ?? { year, booksRead: 0, highlightCount: 0 };
      row[count]++;
      byYear.set(year, row);
    }
  }
  return [...byYear.values()].sort((a, b) => b.year - a.year);
}

/** Shared Web/Obsidian sync. Persistence belongs to the caller; API failures remain per book. */
export async function syncArchive({ apiKey, request, previous = null, onProgress = () => {}, signal, force = false, limit = Infinity, onCache }) {
  if (typeof apiKey !== "string" || !apiKey.trim() || /[\r\n]/.test(apiKey)) throw new Error("请先配置微信读书 API Key");
  if (typeof request !== "function") throw new Error("缺少微信读书请求接口");
  if (limit !== Infinity && (!Number.isInteger(limit) || limit < 0)) throw new Error("limit 必须是非负整数");
  apiKey = apiKey.trim();
  let fatalError;
  let requestQueue = Promise.resolve(), lastRequestAt = 0, cooldown = null, cooldownController, recovering = false, rateLimitError;
  let lastProgress = { completed: 0, total: 0 };
  function checkAbort() {
    if (fatalError) throw fatalError;
    if (signal?.aborted) {
      const error = new Error("同步已取消");
      error.name = "AbortError";
      throw error;
    }
  }
  function safeMessage(value) {
    return String(value ?? "")
      .replaceAll(apiKey, "[密钥已隐藏]")
      .replace(/\b(?:authorization|bearer)\b[^\n,，;；]*/gi, "[鉴权已隐藏]")
      .replace(/wrk-[^\s"'<>，,;；]*/gi, "[密钥已隐藏]")
      .replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 240);
  }
  const report = (message, completed = 0, total = 0) => {
    checkAbort();
    lastProgress = { completed, total };
    onProgress({ completed, total, message: safeMessage(message) });
  };
  async function sleep(ms, extraSignal) {
    checkAbort();
    let timer, abort;
    try {
      await new Promise((resolve, reject) => {
        timer = setTimeout(resolve, ms);
        abort = () => { try { checkAbort(); } catch (error) { reject(error); } };
        signal?.addEventListener("abort", abort, { once: true });
        extraSignal?.addEventListener("abort", abort, { once: true });
        if (signal?.aborted || extraSignal?.aborted) abort();
      });
    } finally {
      clearTimeout(timer);
      if (abort) signal?.removeEventListener("abort", abort);
      if (abort) extraSignal?.removeEventListener("abort", abort);
    }
    checkAbort();
  }
  async function requestOnce(apiName, params) {
    checkAbort();
    let response, timer, abort;
    let timedOut = false;
    try {
      // Obsidian cannot cancel its socket; this race stops waiting and further API calls.
      response = await Promise.race([
        request({
          url: GATEWAY, method: "POST", throw: false,
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ api_name: apiName, skill_version: SKILL_VERSION, ...params }),
        }),
        new Promise((_, reject) => {
          timer = setTimeout(() => { timedOut = true; reject(new Error()); }, 30000);
          abort = () => reject(new Error());
          signal?.addEventListener("abort", abort, { once: true });
          if (signal?.aborted) abort();
        }),
      ]);
    } catch {
      checkAbort();
      throw new Error(`微信读书请求${timedOut ? "超时" : "失败"}：${apiName}，请检查网络后重试`);
    } finally {
      clearTimeout(timer);
      if (abort) signal?.removeEventListener("abort", abort);
    }
    checkAbort();
    let data;
    try { data = response?.json; } catch { /* HTTP errors still retain their status below. */ }
    if (data && typeof data === "object" && Object.hasOwn(data, "upgrade_info")) {
      const hint = typeof data.upgrade_info?.message === "string" ? safeMessage(data.upgrade_info.message) : "请升级微信读书接口版本后重试";
      fatalError = new Error(`微信读书接口需要升级：${hint}`);
      fatalError.name = "WeReadUpgradeError";
      cooldownController?.abort();
      throw fatalError;
    }
    const status = Number.isInteger(response?.status) ? response.status : "异常";
    if (status === "异常" || status < 200 || status >= 300 || (data?.errcode != null && data.errcode !== 0)) {
      const code = typeof data?.errcode === "number" || /^-?\d+$/.test(data?.errcode ?? "") ? String(data.errcode) : null;
      const detail = [data?.errmsg, data?.message, data?.msg, data?.error?.message].find((value) => typeof value === "string");
      const error = new Error(`微信读书接口失败：${apiName}（HTTP ${status}${code == null ? "" : `，errcode ${code}`}）${detail ? `：${safeMessage(detail)}` : ""}`);
      error.errcode = code == null ? null : Number(code);
      throw error;
    }
    return object(data, apiName);
  }
  async function weread(apiName, params = {}) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let pending;
      const turn = requestQueue.catch(() => {}).then(async () => {
        checkAbort();
        if (rateLimitError) throw rateLimitError;
        if (cooldown) await cooldown;
        const delay = lastRequestAt ? Math.max(0, lastRequestAt + 1000 - Date.now()) : 0;
        if (delay) await sleep(delay);
        // Another in-flight request may have entered cooldown while this turn waited.
        if (cooldown) await cooldown;
        checkAbort();
        if (rateLimitError) throw rateLimitError;
        lastRequestAt = Date.now();
        // Start the 30-second network timeout here, never while queued or cooling down.
        pending = requestOnce(apiName, params);
      });
      requestQueue = turn;
      await turn;
      try {
        const data = await pending;
        recovering = false;
        return data;
      } catch (error) {
        checkAbort();
        if (error.errcode !== -2014) throw error;
        if (attempt > 0 || recovering) {
          rateLimitError = error;
          throw error;
        }
        if (!cooldown) {
          report("微信读书请求频率超限，等待 60 秒后重试…", lastProgress.completed, lastProgress.total);
          cooldownController = new AbortController();
          cooldown = sleep(60000, cooldownController.signal)
            .then(() => { recovering = true; })
            .finally(() => { cooldown = null; cooldownController = null; });
        }
        await cooldown;
      }
    }
  }
  async function fetchAllNotebooks() {
    const result = new Map(), cursors = new Set();
    let lastSort;
    while (true) {
      report(`正在获取笔记本 · 已读取 ${result.size} 本`);
      const page = await weread("/user/notebooks", { count: 100, ...(lastSort === undefined ? {} : { lastSort }) });
      const rows = array(page.books, "/user/notebooks.books");
      for (const item of rows) {
        object(item, "notebook");
        result.set(id(item.bookId, "notebook.bookId"), item);
      }
      if (!hasMore(page.hasMore, "/user/notebooks.hasMore")) return [...result.values()];
      if (!rows.length) invalid("笔记本分页为空但仍有下一页");
      const next = number(rows.at(-1).sort, "notebook.sort");
      if (cursors.has(next) || (lastSort !== undefined && next >= lastSort)) invalid("笔记本分页游标未前进");
      cursors.add(next);
      lastSort = next;
      await sleep(300);
    }
  }
  async function fetchAllReviews(bookId, checkBook) {
    const result = new Map(), cursors = new Set([0]);
    let synckey = 0;
    while (true) {
      checkBook();
      const page = await weread("/review/list/mine", { bookid: bookId, synckey, count: 50 });
      const rows = array(page.reviews, "/review/list/mine.reviews");
      for (const item of rows) {
        const r = object(item.review ?? item, "review");
        const reviewId = id(r.reviewId ?? item.reviewId, "review.reviewId");
        if (r.bookId != null && id(r.bookId, "review.bookId") !== bookId) invalid("想法所属书籍不匹配");
        result.set(reviewId, {
          id: reviewId, bookId, content: string(r.content, "review.content", ""),
          quote: string(r.abstract, "review.abstract", "") || undefined,
          chapterUid: r.chapterUid == null || r.chapterUid === -1 ? undefined : number(r.chapterUid, "review.chapterUid"),
          chapterTitle: string(r.chapterTitle ?? r.chapterName, "review.chapterName", "") || undefined,
          createdAt: toIso(r.createTime, "review.createTime") ?? "",
          range: string(r.range, "review.range", "") || undefined,
          isPrivate: r.isPrivate == null ? undefined : r.isPrivate === 1,
        });
      }
      if (!hasMore(page.hasMore, "/review/list/mine.hasMore")) return [...result.values()];
      const next = number(page.synckey, "review.synckey");
      if (!rows.length || cursors.has(next)) invalid("想法分页游标未前进");
      cursors.add(next);
      synckey = next;
      checkBook();
      await sleep(200);
    }
  }
  async function syncBookNotes(bookId) {
    let bookError;
    const checkBook = () => { checkAbort(); if (bookError) throw bookError; };
    const pending = [weread("/book/bookmarklist", { bookId }), fetchAllReviews(bookId, checkBook)]
      .map((promise) => promise.catch((error) => { bookError = error; throw error; }));
    let hlRes, notes;
    try {
      [hlRes, notes] = await Promise.all(pending);
    } catch (error) {
      // Drain the in-flight sibling; checkBook/fatalError prevents any further pages.
      await Promise.allSettled(pending);
      checkAbort();
      throw error;
    }
    const chapters = new Map(array(hlRes.chapters ?? [], "bookmark.chapters").map((ch) => [
      number(ch.chapterUid, "chapter.chapterUid"), string(ch.title, "chapter.title"),
    ]));
    const highlights = new Map();
    for (const h of array(hlRes.updated, "bookmark.updated")) {
      object(h, "bookmark");
      if (h.type === 0) continue;
      if (h.type != null && h.type !== 1) invalid("bookmark.type");
      const highlightId = id(h.bookmarkId, "bookmark.bookmarkId");
      if (h.bookId != null && id(h.bookId, "bookmark.bookId") !== bookId) invalid("划线所属书籍不匹配");
      const chapterUid = h.chapterUid == null ? undefined : number(h.chapterUid, "bookmark.chapterUid");
      highlights.set(highlightId, {
        id: highlightId, bookId, content: string(h.markText, "bookmark.markText"), chapterUid,
        chapterTitle: chapters.get(chapterUid), createdAt: toIso(h.createTime, "bookmark.createTime") ?? "",
        range: string(h.range, "bookmark.range", "") || undefined,
        colorStyle: h.colorStyle == null ? undefined : number(h.colorStyle, "bookmark.colorStyle"),
      });
    }
    return { highlights: [...highlights.values()], notes };
  }

  report("正在获取微信读书书架");
  const shelf = await weread("/shelf/sync");
  const shelfRows = array(shelf.books, "/shelf/sync.books");
  const albums = array(shelf.albums ?? [], "/shelf/sync.albums");
  const shelfById = new Map(), bookMap = new Map();
  for (const b of shelfRows) {
    object(b, "shelf.book");
    const bookId = id(b.bookId, "shelf.bookId");
    shelfById.set(bookId, b);
    bookMap.set(bookId, {
      id: bookId, title: string(b.title, "shelf.title", bookId), author: string(b.author, "shelf.author", ""),
      cover: string(b.cover, "shelf.cover", "") || undefined, category: string(b.category, "shelf.category", "") || undefined,
      progress: b.finishReading === 1 ? 100 : 0, lastReadAt: toIso(b.readUpdateTime, "shelf.readUpdateTime"),
      highlightCount: 0, noteCount: 0,
    });
  }
  const notebooks = await fetchAllNotebooks();
  const previousBooks = new Map((previous?.books ?? []).map((b) => [String(b.id), b]));
  const oldHighlights = group(previous?.highlights ?? []), oldNotes = group(previous?.notes ?? []);
  const priorCaches = previous?.cache?.version === 2 ? previous.cache.books ?? {} : {};
  const cache = { version: 2, books: Object.create(null) };
  const fingerprints = Object.create(null), syncFailures = new Map();
  const previousFailures = new Map((previous?.meta?.syncFailures ?? []).map((failure) => [String(failure.bookId), failure]));
  const highlightsByBook = new Map(), notesByBook = new Map();
  function keepPrevious(bookId) {
    const oldBook = previousBooks.get(bookId);
    if (oldBook) bookMap.set(bookId, { ...oldBook });
    else if (cache.books[bookId]?.progress?.progress != null) {
      const fallback = { ...bookMap.get(bookId) };
      try { applyProgress(fallback, cache.books[bookId].progress); bookMap.set(bookId, fallback); }
      catch { /* Use shelf/notebook metadata if the old progress is incomplete. */ }
    }
  }
  for (const nb of notebooks) {
    const bookId = String(nb.bookId), s = shelfById.get(bookId);
    const info = object(nb.book ?? {}, "notebook.book");
    const b = bookMap.get(bookId) ?? { id: bookId, progress: 0 };
    b.title = string(info.title ?? b.title, "book.title", bookId);
    b.author = string(info.author ?? b.author, "book.author", "");
    b.cover = string(info.cover ?? b.cover, "book.cover", "") || undefined;
    b.category = string(info.category ?? b.category, "book.category", "") || undefined;
    b.highlightCount = number(nb.noteCount, "notebook.noteCount", 0);
    b.noteCount = number(nb.reviewCount, "notebook.reviewCount", 0);
    if (nb.readingProgress) b.progress = readingProgress(nb.readingProgress, "notebook.readingProgress");
    bookMap.set(bookId, b);
    if (previousFailures.has(bookId)) syncFailures.set(bookId, {
      bookId, title: b.title, message: safeMessage(previousFailures.get(bookId).message),
    });
    const old = Object.hasOwn(priorCaches, bookId) ? priorCaches[bookId] : null;
    if (old && typeof old === "object") {
      cache.books[bookId] = old;
      fingerprints[bookId] = { content: old.contentFingerprint, progress: old.progressFingerprint };
    }
    const completeContent = Array.isArray(old?.highlights) && Array.isArray(old?.notes);
    highlightsByBook.set(bookId, completeContent ? old.highlights : oldHighlights.get(bookId) ?? (Array.isArray(old?.highlights) ? old.highlights : []));
    notesByBook.set(bookId, completeContent ? old.notes : oldNotes.get(bookId) ?? (Array.isArray(old?.notes) ? old.notes : []));
    // Validate overview fingerprints even when --limit omits this book; do not advance them yet.
    contentFingerprint(nb);
    progressFingerprint(nb, s);
  }

  const notebookBooks = notebooks.slice(0, limit);
  let skipped = 0, progressOnly = 0, fetched = 0;
  for (let index = 0; index < notebookBooks.length; index++) {
    checkAbort();
    const nb = notebookBooks[index], bookId = String(nb.bookId);
    const base = bookMap.get(bookId), candidate = { ...base };
    const contentFp = contentFingerprint(nb), progressFp = progressFingerprint(nb, shelfById.get(bookId));
    const old = cache.books[bookId];
    const completeContent = Array.isArray(old?.highlights) && Array.isArray(old?.notes);
    const completeProgress = typeof old?.progress?.progress === "number" && Number.isFinite(old.progress.progress) && old.progress.progress >= 0 && old.progress.progress <= 100;
    const canReuse = !force && !previousFailures.has(bookId);
    const contentSame = canReuse && completeContent && old.contentFingerprint && fingerprintsMatch(contentFp, old.contentFingerprint);
    const progressSame = canReuse && completeProgress && old.progressFingerprint && fingerprintsMatch(progressFp, old.progressFingerprint);
    report(`正在同步《${base.title}》`, index, notebookBooks.length);
    let entry;
    try {
      if (contentSame && progressSame) {
        applyProgress(candidate, old.progress);
        entry = old;
        skipped++;
      } else {
        // Keep the existing Web order: progress first, then parallel highlights + personal reviews.
        const p = object((await weread("/book/getprogress", { bookId })).book, "/book/getprogress.book");
        applyProgress(candidate, p);
        const content = contentSame ? { highlights: old.highlights, notes: old.notes } : await syncBookNotes(bookId);
        entry = { bookId, ...content, progress: p, contentFingerprint: contentFp, progressFingerprint: progressFp, syncedAt: new Date().toISOString() };
        if (contentSame) progressOnly++; else fetched++;
      }
    } catch (error) {
      checkAbort();
      keepPrevious(bookId);
      syncFailures.set(bookId, { bookId, title: base.title, message: safeMessage(error.message || "该书暂时同步失败") });
      report(`《${base.title}》暂未更新，继续同步其他书`, index + 1, notebookBooks.length);
      if (!rateLimitError) await sleep(250);
      continue;
    }
    checkAbort();
    // A disk/cache callback failure is global; it must not masquerade as an API failure.
    if (onCache) await onCache(bookId, entry);
    checkAbort();
    cache.books[bookId] = entry;
    fingerprints[bookId] = { content: entry.contentFingerprint, progress: entry.progressFingerprint };
    highlightsByBook.set(bookId, entry.highlights);
    notesByBook.set(bookId, entry.notes);
    bookMap.set(bookId, candidate);
    syncFailures.delete(bookId);
    report(`已同步《${base.title}》`, index + 1, notebookBooks.length);
    if (!rateLimitError) await sleep(250);
  }
  checkAbort();
  const books = [...bookMap.values()].sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""));
  const highlights = [...highlightsByBook.values()].flat(), notes = [...notesByBook.values()].flat();
  const articleCollections = shelf.mp && Object.keys(object(shelf.mp, "shelf.mp")).length ? 1 : 0;
  return {
    books, highlights, notes, readingStats: deriveReadingStats(books, highlights), cache,
    meta: { lastSyncedAt: new Date().toISOString(), source: "weread", fingerprints, syncFailures: [...syncFailures.values()], stats: {
      shelfBooks: shelfRows.length + albums.length + articleCollections,
      shelfEbooks: shelfRows.length, shelfAlbums: albums.length, shelfArticleCollections: articleCollections,
      notebookBooks: notebooks.length, totalHighlights: highlights.length, totalNotes: notes.length,
      lastRun: { fetched, progressOnly, skipped, failed: syncFailures.size },
    } },
  };
}
