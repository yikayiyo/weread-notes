import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, symlinkSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

import { syncArchive } from "@weread/core";

// Exercise production pacing calls without making this offline check wait between books.
const realSetTimeout = globalThis.setTimeout;
const delays = [];
globalThis.setTimeout = (fn, ms, ...args) => {
  if (ms !== 30000) delays.push(ms);
  return realSetTimeout(fn, ms !== 30000 ? 0 : ms, ...args);
};
const apiKey = "wrk-test-only"; // Synthetic credential; these checks never use the network.
const unix = (date) => Date.parse(date) / 1000;
const time = unix("2025-05-01T12:00:00Z");
const shelf = { books: [
  { bookId: "a", title: "第一本", author: "作者甲", readUpdateTime: time, finishReading: 0 },
  { bookId: "b", title: "没有笔记的书", author: "作者乙", readUpdateTime: time, finishReading: 1 },
], albums: [{ albumInfo: { albumId: "audio-1" } }], mp: { title: "文章收藏" } };
const notebookRows = [
  { bookId: "a", book: { title: "第一本", author: "作者甲" }, noteCount: 1, reviewCount: 2,
    bookmarkCount: 4, sort: 100, readingProgress: 1, markedStatus: 0 },
  { bookId: "c", book: { title: "只在笔记本中的书", author: "作者丙" }, noteCount: 0, reviewCount: 0,
    bookmarkCount: 1, sort: 50, readingProgress: 50, markedStatus: 0 },
];
const progressById = {
  a: { progress: 1, updateTime: time },
  b: { progress: 100, updateTime: time, finishTime: unix("2024-10-02T12:00:00Z") },
  c: { progress: 100, updateTime: time, finishTime: unix("2024-10-02T12:00:00Z") },
};
function gateway(override = () => undefined) {
  const calls = [];
  return { calls, request: async (options) => {
    assert.equal(options.url, "https://i.weread.qq.com/api/agent/gateway");
    assert.equal(options.method, "POST");
    assert.equal(options.throw, false);
    assert.equal(options.headers.Authorization, `Bearer ${apiKey}`);
    const p = JSON.parse(options.body);
    assert.equal(p.skill_version, "1.0.4");
    assert.equal(p.params, undefined, "Business parameters must be flat");
    assert.equal(p.vid, undefined, "Never fetch another user's account");
    calls.push(p);
    const custom = override(p, calls);
    if (custom) return Object.hasOwn(custom, "json") ? structuredClone(custom) : { status: 200, json: structuredClone(custom) };
    let json;
    switch (p.api_name) {
      case "/shelf/sync": json = shelf; break;
      case "/user/notebooks":
        assert.ok(p.lastSort === undefined || p.lastSort === 100);
        json = { books: [notebookRows[p.lastSort === undefined ? 0 : 1]], hasMore: p.lastSort === undefined ? 1 : 0 };
        break;
      case "/book/getprogress": json = { bookId: p.bookId, book: progressById[p.bookId] }; break;
      case "/book/bookmarklist":
        json = { chapters: [{ chapterUid: 1, title: "第一章" }], updated: p.bookId === "a" ? [
          { bookmarkId: "h1", bookId: "a", markText: "划线原文", createTime: time, chapterUid: 1, type: 1, colorStyle: 2, range: "1-4" },
          { bookmarkId: "position-only", type: 0 },
        ] : [] };
        break;
      case "/review/list/mine":
        assert.equal(p.bookId, undefined, "Personal review endpoint uses lowercase bookid");
        assert.ok(p.synckey === 0 || p.synckey === 2);
        json = p.bookid === "a" ? {
          reviews: [{ review: p.synckey === 0
            ? { reviewId: "n1", content: "关于原文的想法", abstract: "对应的原文", range: "1-4", chapterUid: 1, chapterName: "第一章", createTime: time }
            : { reviewId: "n2", content: "整本书评", createTime: time } }],
          hasMore: p.synckey === 0 ? 1 : 0, synckey: 2,
        } : { reviews: [], hasMore: 0 };
        break;
      default: assert.fail(`Unexpected endpoint: ${p.api_name}`);
    }
    return { status: 200, json: structuredClone(json) };
  } };
}
function freeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

const first = gateway();
const progressEvents = [];
const snapshot = freeze(await syncArchive({ apiKey, request: first.request, onProgress: (p) => progressEvents.push(p) }));
assert.equal(snapshot.books.length, 3);
assert.equal(snapshot.meta.stats.shelfBooks, 4);
assert.equal(snapshot.meta.stats.notebookBooks, 2);
assert.deepEqual(first.calls.filter((p) => p.api_name === "/book/getprogress").map((p) => p.bookId), ["a", "c"], "Reuse Web notebook order; never request shelf-only book progress");
assert(delays.includes(300), "Preserve Web notebook pagination interval");
assert(delays.includes(200), "Preserve Web review pagination interval");
assert.equal(delays.filter((ms) => ms === 250).length, 2, "Preserve Web per-book pacing");
assert.equal(snapshot.books.find((b) => b.id === "a").progress, 1);
assert.equal(snapshot.books.find((b) => b.id === "a").finishedAt, undefined, "An unfinished book must not acquire a completion date");
assert.equal(snapshot.books.find((b) => b.id === "b").finishedAt, undefined, "Shelf state does not invent a completion date");
assert.equal(snapshot.books.find((b) => b.id === "c").finishedAt, "2024-10-02T12:00:00.000Z");
assert.equal(snapshot.highlights.length, 1);
assert.equal(snapshot.highlights[0].chapterTitle, "第一章");
assert.equal(snapshot.notes.length, 2);
assert.equal(snapshot.notes[0].quote, "对应的原文");
assert.equal(snapshot.notes[0].chapterTitle, "第一章");
assert.equal(snapshot.books.find((b) => b.id === "a").noteCount, 2);
assert.equal(snapshot.cache.version, 2);
assert.equal(progressEvents.at(-1).completed, 2);
assert.equal(progressEvents.at(-1).total, 2);
assert(!JSON.stringify(snapshot).includes(apiKey));

const historicalCompletion = await syncArchive({ apiKey, request: gateway((p) => {
  if (p.api_name === "/book/getprogress" && p.bookId === "a") {
    return { book: { ...progressById.a, progress: 99, finishTime: time } };
  }
}).request });
assert.equal(historicalCompletion.books.find((b) => b.id === "a").finishedAt, new Date(time * 1000).toISOString(), "Keep the API completion date even when current progress is below 100%");
assert.equal(historicalCompletion.readingStats.find((row) => row.year === 2025).booksRead, 1);
const cachedCompletion = await syncArchive({ apiKey, previous: historicalCompletion, request: gateway().request });
assert.equal(cachedCompletion.books.find((b) => b.id === "a").finishedAt, historicalCompletion.books.find((b) => b.id === "a").finishedAt, "Cached progress must preserve the same historical completion date");

const legacyFields = await syncArchive({apiKey,request:gateway((p)=> {
  if(p.api_name==='/book/bookmarklist') return {updated:[{bookmarkId:'undated',bookId:p.bookId,markText:'仍需保留的旧划线'}]};
  if(p.api_name==='/review/list/mine') return {reviews:[{reviewId:'whole-book',bookId:p.bookid,content:'整本书的想法',chapterUid:-1}],hasMore:0};
}).request});
assert.equal(legacyFields.meta.syncFailures.length,0);
assert(legacyFields.highlights.every((h)=>h.createdAt===''),"Legacy undated highlights retain content without invented dates");
assert(legacyFields.notes.every((n)=>n.chapterUid===undefined && n.createdAt===''),"Whole-book review sentinel is not a chapter error");

const waitsBefore=delays.filter((ms)=>ms===60000).length;
const rateLimited=gateway((p,calls)=>p.api_name==='/book/getprogress' && p.bookId==='a' && calls.filter((c)=>c.api_name===p.api_name && c.bookId==='a').length===1
  ? {status:499,json:{errcode:-2014,errmsg:'请求频率超限，请稍后再试'}} : undefined);
const recoveredLimit=await syncArchive({apiKey,request:rateLimited.request});
assert.equal(recoveredLimit.meta.syncFailures.length,0);
assert.equal(rateLimited.calls.filter((p)=>p.api_name==='/book/getprogress' && p.bookId==='a').length,2);
assert.equal(delays.filter((ms)=>ms===60000).length,waitsBefore+1,"Rate limits trigger a bounded cooldown before retry");
const persistentLimit=gateway((p)=>p.api_name==='/book/getprogress'?{status:499,json:{errcode:-2014,errmsg:'请求频率超限，请稍后再试'}}:undefined);
const pausedLimit=await syncArchive({apiKey,request:persistentLimit.request});
assert.equal(pausedLimit.meta.syncFailures.length,2);
assert.equal(persistentLimit.calls.filter((p)=>p.api_name==='/book/getprogress').length,2,"Persistent global rate limit stops further book requests");
const cooldownCancel=new AbortController();
await assert.rejects(syncArchive({apiKey,signal:cooldownCancel.signal,request:gateway(()=>({status:499,json:{errcode:-2014}})).request,
  onProgress:(p)=>{if(p.message.includes('60 秒')) cooldownCancel.abort();}}),{name:'AbortError'});

const incremental = gateway();
await syncArchive({ apiKey, request: incremental.request, previous: snapshot });
assert.equal(incremental.calls.length, 3, "Unchanged complete cache only fetches shelf and notebook pages");

const progressOnly = gateway((p) => {
  if (p.api_name === "/shelf/sync") {
    const changed = structuredClone(shelf);
    changed.books[0].readUpdateTime++;
    return changed;
  }
  if (p.api_name === "/book/getprogress" && p.bookId === "a") return { book: { progress: 25, updateTime: time + 1 } };
});
const changedProgress = await syncArchive({ apiKey, request: progressOnly.request, previous: snapshot });
assert.equal(progressOnly.calls.length, 4);
assert.equal(changedProgress.books.find((b) => b.id === "a").progress, 25);
assert(!progressOnly.calls.some((p) => p.api_name === "/book/bookmarklist"));

const newNotebooks = (p) => p.api_name === "/user/notebooks" ? { books: [{ ...notebookRows[0], sort: 101 }, {...notebookRows[1], readingProgress:75}], hasMore: 0 } : undefined;
const contentOnly = gateway(newNotebooks);
await syncArchive({ apiKey, request: contentOnly.request, previous: snapshot });
assert(contentOnly.calls.some((p) => p.api_name === "/book/bookmarklist" && p.bookId === "a"));
assert(contentOnly.calls.some((p) => p.api_name === "/book/getprogress" && p.bookId === "a"), "Changed notebook follows the existing Web complete-book path");

const incomplete = structuredClone(snapshot);
delete incomplete.cache.books.a.notes;
const incompleteRequest = gateway();
await syncArchive({ apiKey, request: incompleteRequest.request, previous: incomplete });
assert(incompleteRequest.calls.some((p) => p.api_name === "/review/list/mine"), "Malformed book cache must be fetched again");

const original = JSON.stringify(snapshot);
const partialRequest = gateway((p) => newNotebooks(p) || (p.api_name === "/book/getprogress" ? p.bookId === "a"
  ? {status:499,json:{errcode:-2,errmsg:`upstream unavailable; Authorization: Bearer ${apiKey}`}}
  : {book:{progress:75,updateTime:time+1}} : undefined));
const partial = await syncArchive({apiKey,request:partialRequest.request,previous:snapshot,force:true});
assert.equal(partial.meta.syncFailures.length, 1);
assert.equal(partial.meta.syncFailures[0].bookId, "a");
assert.match(partial.meta.syncFailures[0].message, /HTTP 499/);
assert(!JSON.stringify(partial).includes(apiKey), "Response details must never persist credentials");
assert.equal(partial.books.find((b)=>b.id === "a").progress, snapshot.books.find((b)=>b.id === "a").progress);
assert.deepEqual(partial.highlights, snapshot.highlights, "Force-sync failure preserves previous content");
assert.deepEqual(partial.notes, snapshot.notes);
assert.deepEqual(partial.cache.books.a, snapshot.cache.books.a, "Failed books do not advance fingerprints");
assert.equal(partial.books.find((b)=>b.id === "c").progress,75, "Other books continue after a book fails");
assert.equal(JSON.stringify(snapshot),original);
const retry = gateway(newNotebooks);
const retried = await syncArchive({apiKey,request:retry.request,previous:partial});
assert.equal(retried.meta.syncFailures?.length ?? 0,0);
assert.deepEqual(retry.calls.filter((p)=>p.api_name === "/book/getprogress").map((p)=>p.bookId),["a"], "Retry refetches failed book, reuses the completed book");

const allUnavailable = gateway((p) => p.api_name === "/book/getprogress" ? {status:499,json:{errmsg:"book unavailable"}} : undefined);
const firstPartial = await syncArchive({apiKey,request:allUnavailable.request});
assert.equal(firstPartial.meta.syncFailures.length,2);
assert.equal(firstPartial.books.length,3,"First sync retains actual shelf/notebook metadata even when details fail");
assert.equal(firstPartial.highlights.length,0);
assert.equal(firstPartial.books.find((b)=>b.id==='a').progress,1, "Retain notebook-reported progress when detail is unavailable");
const shelfFallback = await syncArchive({apiKey,request:gateway((p) => {
  if (p.api_name === "/shelf/sync") return {...shelf,books:shelf.books.map((b)=>({...b,finishReading:1}))};
  if (p.api_name === "/user/notebooks") return {books:[{...notebookRows[0],readingProgress:0}],hasMore:0};
  if (p.api_name === "/book/getprogress") return {status:499,json:{}};
}).request});
assert.equal(shelfFallback.books.find((b)=>b.id==='a').progress,100,"Zero notebook overview preserves original Web shelf fallback when details fail");

const legacy = structuredClone(snapshot);
legacy.cache = {version:1,books:{}};
const legacyPartial = await syncArchive({apiKey,request:allUnavailable.request,previous:legacy});
assert.deepEqual(legacyPartial.highlights,snapshot.highlights,"Old plugin aggregate fallback preserves content during cache upgrade");
assert.deepEqual(legacyPartial.notes,snapshot.notes);

for (const [override, pattern] of [
  [(p) => p.api_name === "/user/notebooks" ? { books: [notebookRows[0]], hasMore: 1 } : undefined, /分页游标未前进/],
  [(p) => p.api_name === "/user/notebooks" ? { books: [], hasMore: 1 } : undefined, /分页为空/],
]) {
  await assert.rejects(syncArchive({ apiKey, request: gateway(override).request, previous: snapshot }), pattern);
}
const malformed = await syncArchive({apiKey,request:gateway((p)=>p.api_name==='/book/getprogress'?{book:{progress:101}}:undefined).request});
assert.equal(malformed.meta.syncFailures.length,2,"Malformed details are explicit failures, not fabricated books");
const stuckReviews=await syncArchive({apiKey,request:gateway((p)=>p.api_name==='/review/list/mine'?{reviews:[{review:{reviewId:'n',content:'x',createTime:time}}],hasMore:1,synckey:0}:undefined).request});
assert(stuckReviews.meta.syncFailures.every((failure)=>/分页游标未前进/.test(failure.message)));

const upgrade = gateway((p) => p.api_name === "/book/getprogress"
  ? { upgrade_info: { message: "请安装更新版本" } } : undefined);
await assert.rejects(syncArchive({ apiKey, request: upgrade.request, previous: snapshot, force:true }), { name: "WeReadUpgradeError", message: /请安装更新版本/ });
assert(!upgrade.calls.some((p)=>p.api_name==='/book/bookmarklist'),"Upgrade halts all subsequent requests");
await assert.rejects(syncArchive({apiKey,request:async()=>({status:503,json:{}})}),/HTTP 503/);
await assert.rejects(syncArchive({apiKey,request:async()=>{throw new Error(`Authorization: Bearer ${apiKey}`);}}),(e)=>!e.message.includes(apiKey));

const controller = new AbortController();
let listeners=0;
const signal={get aborted(){return controller.signal.aborted;},addEventListener(...args){listeners++;controller.signal.addEventListener(...args);},removeEventListener(...args){listeners--;controller.signal.removeEventListener(...args);}};
const pending=syncArchive({apiKey,signal,request:()=>new Promise(()=>{})});
await Promise.resolve();
controller.abort();
await assert.rejects(pending,{name:'AbortError'});
assert.equal(listeners,0);

const timers=new Map();let timerId=0;
globalThis.setTimeout=(fn,ms)=>{assert.equal(ms,30000);timers.set(++timerId,fn);return timerId;};
const realClearTimeout=globalThis.clearTimeout;
globalThis.clearTimeout=(id)=>timers.delete(id);
try{
 const hanging=syncArchive({apiKey,request:()=>new Promise(()=>{})});
 for(let i=0;i<20 && timers.size===0;i++) await Promise.resolve();
 assert.equal(timers.size,1,"Timeout starts after the request gate grants its turn");
 [...timers.values()][0]();
 await assert.rejects(hanging,/请求超时/);
 assert.equal(timers.size,0);
}finally{globalThis.setTimeout=realSetTimeout;globalThis.clearTimeout=realClearTimeout;}

assert.match(readFileSync(new URL("../../scripts/sync.mjs",import.meta.url),'utf8'),/from ["']@weread\/core["']/);
assert.match(readFileSync(new URL("../../apps/obsidian/plugin.js",import.meta.url),'utf8'),/require\(["']@weread\/core["']\)/);

// Run the real CLI in a disposable project with synthetic fetch, never the user's .env/data.
const cliRoot = mkdtempSync(join(tmpdir(), "weread-cli-check-"));
try {
  mkdirSync(join(cliRoot,"scripts"));
  for (const file of ["sync.mjs","load-env.mjs"]) copyFileSync(new URL(`../../scripts/${file}`,import.meta.url),join(cliRoot,"scripts",file));
  mkdirSync(join(cliRoot,"node_modules/@weread"),{recursive:true});
  symlinkSync(new URL(".",import.meta.url),join(cliRoot,"node_modules/@weread/core"),"dir");
  writeFileSync(join(cliRoot,"stub.mjs"), `
    import assert from "node:assert/strict";
    import {writeFileSync} from "node:fs";
    const apiKey=${JSON.stringify(apiKey)}, time=${time};
    const shelf=${JSON.stringify(shelf)}, notebookRows=${JSON.stringify(notebookRows)}, progressById=${JSON.stringify(progressById)};
    ${gateway.toString()}
    const mock=gateway((p)=> {
      if(process.env.SYNC_CHECK_CASE==='fatal' && p.api_name==='/shelf/sync') return {upgrade_info:{message:'upgrade required'}};
      if(process.env.SYNC_CHECK_CASE==='partial' && p.api_name==='/book/getprogress' && p.bookId==='a') return {status:499,json:{errmsg:'offline simulated failure'}};
    });
    globalThis.fetch=async(url,options)=>{const r=await mock.request({url,...options,throw:false});return {status:r.status,json:async()=>r.json};};
    const timer=globalThis.setTimeout;
    globalThis.setTimeout=(fn,ms,...args)=>timer(fn,ms!==30000?0:ms,...args);
    process.on('exit',()=>writeFileSync(new URL('./calls.json',import.meta.url),JSON.stringify(mock.calls)));
  `);
  const readData=(file)=>JSON.parse(readFileSync(join(cliRoot,"data",file),"utf8"));
  function runCli(mode="ok",args=[]) {
    const run=spawnSync(process.execPath,["--import",join(cliRoot,"stub.mjs"),join(cliRoot,"scripts/sync.mjs"),...args],{encoding:"utf8",timeout:20000,env:{...process.env,WEREAD_API_KEY:apiKey,SYNC_CHECK_CASE:mode}});
    assert.equal(run.status,mode==='fatal'?1:0,run.stderr);
    assert(!`${run.stdout}${run.stderr}`.includes(apiKey));
    return JSON.parse(readFileSync(join(cliRoot,"calls.json"),"utf8"));
  }
  runCli();
  assert.equal(readData('highlights.json').length,1);
  assert.equal(readData('notes.json').length,2);
  assert.equal(runCli().length,3,"CLI reuses persisted Web cache");
  rmSync(join(cliRoot,'data/cache'),{recursive:true});
  assert.equal(runCli().length,3,"CLI bootstraps historical aggregate fingerprints");
  const oldEntry=readData('cache/a.json');
  runCli('partial',['--full']);
  assert.equal(readData('meta.json').syncFailures.length,1);
  assert.deepEqual(readData('cache/a.json'),oldEntry);
  assert.equal(readData('notes.json').length,2);
  runCli('ok',['--limit','0']);
  assert.equal(readData('meta.json').syncFailures.length,1,"Limited runs retain failures for books not attempted");
  const retryCalls=runCli();
  assert.deepEqual(retryCalls.filter((p)=>p.api_name==='/book/getprogress').map((p)=>p.bookId),['a'],"Retry a failed full refresh even if overview fingerprints did not change");
  assert.equal(readData('meta.json').syncFailures.length,0);
  const beforeFatal=readFileSync(join(cliRoot,'data/meta.json'),'utf8');
  runCli('fatal');
  assert.equal(readFileSync(join(cliRoot,'data/meta.json'),'utf8'),beforeFatal,"Fatal API errors never overwrite Web aggregates");
} finally { rmSync(cliRoot,{recursive:true,force:true}); }
console.log("Shared WeRead sync checks passed: original Web request scope/pacing/cache, partial HTTP 499 recovery, retained failed data, retry, upgrade, cancellation and credential safety.");
