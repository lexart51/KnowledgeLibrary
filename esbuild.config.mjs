import esbuild from "esbuild";
import process from "node:process";
import builtins from "builtin-modules";
import { copyFile } from "node:fs/promises";

const production = process.argv[2] === "production";

const context = await esbuild.context({
  banner: {
    js: "/* KnowledgeLibrary v6 */"
  },
  bundle: true,
  entryPoints: ["src/main.ts"],
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins
  ],
  format: "cjs",
  logLevel: "info",
  minify: production,
  outfile: "main.js",
  platform: "browser",
  sourcemap: production ? false : "inline",
  target: "es2022",
  treeShaking: true
});

await context.rebuild();
await copyFile("src/styles.css", "styles.css");

if (production) {
  await context.dispose();
} else {
  await context.watch();
}
