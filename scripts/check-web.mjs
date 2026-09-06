import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

// Run against an already-started Web server; only the share-card fixture is synthetic.
// node scripts/check-web.mjs http://127.0.0.1:3000 [--record|--compare snapshot.json]
const base = process.argv[2] || "http://127.0.0.1:3000";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const result = { pages: {}, share: {} };
for (const route of ["/", "/notes", "/archive", "/about"]) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.match(html, /不高山/);
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  assert(text.length > 20, `${route}: rendered page shell is present`);
  result.pages[route] = hash(text);
}

const item = Buffer.from(JSON.stringify({ kind: "highlight", content: "目录迁移验证：阅读让想法生长。",
  bookTitle: "虚构测试书", bookAuthor: "测试作者", chapterTitle: "第一章", createdAt: "2026-09-06T00:00:00.000Z", accent: "#587468" })).toString("base64url");
for (const format of ["svg", "png"]) {
  const url = new URL("/api/share-card", base);
  url.search = new URLSearchParams({ item, format, theme: "paper", mode: "light" }).toString();
  const response = await fetch(url);
  assert.equal(response.status, 200, `${format}: share renderer`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (format === "svg") {
    assert.match(response.headers.get("content-type"), /image\/svg\+xml/);
    assert.match(bytes.toString(), /^<svg\b/);
  } else {
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0);
  }
  result.share[format] = hash(bytes);
}
assert.equal((await fetch(new URL("/api/share-card", base))).status, 400);

if (process.argv[3] === "--record") writeFileSync(process.argv[4], JSON.stringify(result, null, 2) + "\n");
else if (process.argv[3] === "--compare") assert.deepEqual(result, JSON.parse(readFileSync(process.argv[4], "utf8")), "Web pages and share-card output must match the baseline");
else assert.equal(process.argv[3], undefined, "Use --record or --compare with a snapshot path");
console.log("Web checks passed: four pages, SVG/PNG share rendering, and invalid share request handling.");
