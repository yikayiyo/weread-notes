import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const plugin = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(plugin, "dist");
const cssPath = path.join(plugin, "ui.css");
const source = await readFile(cssPath, "utf8");
const result = await postcss([tailwind({ base: plugin })]).process(source, { from: cssPath });

// Shadow DOM 隔离样式，响应式布局按 Obsidian 面板宽度计算。
result.root.walkRules((rule) => {
  rule.selector = rule.selector.replace(/:root(?![\w-])|:host(?![\w-])|(?<![\w.#-])(?:html|body)(?![\w-])/g, ".bgs-root");
});
result.root.walkAtRules("media", (rule) => {
  if (/width/.test(rule.params)) {
    rule.name = "container";
    rule.params = rule.params.replace(/^screen\s+and\s+/, "");
  }
});
result.root.walkDecls((declaration) => { declaration.value = declaration.value.replace(/(\d*\.?\d+)vw\b/g, "$1cqw"); });
// ShadowRoot 中 @property 注册不可靠，直接使用 Tailwind 生成的默认值。
result.root.walkAtRules("supports", (rule) => {
  if (rule.parent?.name === "layer" && rule.parent.params === "properties") rule.replaceWith(rule.nodes);
});
const css = `${result.root.toString()}\n.bgs-root { min-height: 100%; overflow: visible; }\n`;
await mkdir(dist, { recursive: true });
await writeFile(path.join(dist, "ui.generated.css"), css);
const bundle = await build({
  absWorkingDir: plugin,
  entryPoints: ["plugin.js"],
  outfile: path.join(dist, "main.js"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  external: ["obsidian"],
  metafile: true,
  logLevel: "info",
  plugins: [{
    name: "shadow-css",
    setup(builder) {
      builder.onLoad({ filter: /[/\\]ui\.css$/ }, () => ({ contents: css, loader: "text" }));
    },
  }],
});
await writeFile(path.join(dist, "build-meta.json"), `${JSON.stringify(bundle.metafile, null, 2)}\n`);
for (const name of ["manifest.json", "styles.css"]) await copyFile(path.join(plugin, name), path.join(dist, name));
