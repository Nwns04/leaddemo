import { readFile } from "node:fs/promises";

const checks = [
  "src/pages/work.html", "src/pages/mugi.html", "src/pages/mugi-case-study.html",
  "src/js/assets.js", "src/js/components.js", "src/js/dex-adapter.js", "src/js/site.js", "src/data/projects.js"
];
let errors = 0;
for (const file of checks) {
  const source = await readFile(file, "utf8");
  if (/TODO|FIXME/.test(source)) { console.error(`${file}: unfinished marker found`); errors += 1; }
  if (file.endsWith(".html") && !source.includes("lang=\"en\"")) { console.error(`${file}: missing lang attribute`); errors += 1; }
}
if (errors) process.exit(1);
console.log(`Lint passed for ${checks.length} source files.`);
