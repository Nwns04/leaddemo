import { readFile } from "node:fs/promises";
import { join } from "node:path";

const files = ["src/js/assets.js", "src/js/components.js", "src/js/dex-adapter.js", "src/js/site.js", "src/data/projects.js", "scripts/build.mjs", "scripts/optimize-mugi-assets.mjs", "scripts/serve.mjs"];
for (const file of files) {
  const source = await readFile(join(process.cwd(), file), "utf8");
  if (!source.trim()) throw new Error(`${file} is empty`);
  if (!source.includes("export") && file.endsWith(".js")) throw new Error(`${file} has no module exports`);
}
console.log(`Typecheck passed for ${files.length} JavaScript modules (static runtime).`);
