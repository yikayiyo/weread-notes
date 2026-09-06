import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./build.mjs";

const plugin = fileURLToPath(new URL("../", import.meta.url));
const { id, version } = JSON.parse(await readFile(path.join(plugin, "manifest.json"), "utf8"));
const archive = path.join(plugin, "dist", `weread-reading-${version}.zip`);
const stage = await mkdtemp(path.join(tmpdir(), "weread-release-"));
try {
  const folder = path.join(stage, id);
  await mkdir(folder);
  // 只分发安装所需文件，不打包本地 key、缓存、源码或构建元数据。
  for (const name of ["main.js", "manifest.json", "styles.css"]) {
    await copyFile(path.join(plugin, "dist", name), path.join(folder, name));
  }
  await copyFile(path.join(plugin, "README.md"), path.join(folder, "README.md"));
  execFileSync("zip", ["-q", "-r", path.join(stage, "plugin.zip"), id], { cwd: stage });
  await copyFile(path.join(stage, "plugin.zip"), archive);
  console.log(archive);
} finally {
  await rm(stage, { recursive: true, force: true });
}
