import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

await rm(dist, { recursive: true, force: true });

// MUGI
await mkdir(join(dist, "work", "mugi", "case-study"), { recursive: true });
await mkdir(join(dist, "work", "mugi"), { recursive: true });

// SLOCK
await mkdir(join(dist, "work", "slock", "case-study"), { recursive: true });
await mkdir(join(dist, "work", "slock"), { recursive: true });

// COLONY
await mkdir(join(dist, "work", "colony", "case-study"), { recursive: true });
await mkdir(join(dist, "work", "colony"), { recursive: true });

// LWOLF
await mkdir(join(dist, "work", "lwolf", "buy"), { recursive: true });
await mkdir(join(dist, "work", "lwolf"), { recursive: true });

// STONKS
await mkdir(join(dist, "work", "stonks"), { recursive: true });

// PROMOTER DEMO
await mkdir(join(dist, "work", "promoter"), { recursive: true });
await mkdir(join(dist, "demos", "promoter"), { recursive: true });

// NEW PROJECTS
for (const project of ["moonrat", "gloop", "barkbyte"]) {
  await mkdir(join(dist, "work", project), { recursive: true });
  await mkdir(join(dist, "demos", project), { recursive: true });
}

await mkdir(join(dist, "shared"), { recursive: true });
await mkdir(join(dist, "data", "colony"), { recursive: true });
await mkdir(join(dist, "demos", "mugi"), { recursive: true });
await mkdir(join(dist, "demos", "slock"), { recursive: true });
await mkdir(join(dist, "demos", "colony"), { recursive: true });
await mkdir(join(dist, "demos", "lwolf"), { recursive: true });
await mkdir(join(dist, "demos", "stonks"), { recursive: true });

// Shared CSS
for (const file of [
  "styles.css",
  "slock.css",
  "colony.css",
  "lwolf.css",
  "lwolf-buy.css",
  "stonks.css",
  "moonrat.css",
  "gloop.css",
  "barkbyte.css",
  "promoter-demo.css",
]) {
  await cp(join(root, "src", "shared", file), join(dist, "shared", file));
}

// Shared JS
for (const file of ["assets.js", "components.js", "dex-adapter.js", "site.js", "promoter-demo.js"]) {
  await cp(join(root, "src", "js", file), join(dist, "shared", file));
}

await cp(join(root, "src", "js", "slock.js"), join(dist, "shared", "slock.js"));

for (const file of ["colony.js", "colony-data.js", "colony-extras.js"]) {
  await cp(join(root, "src", "js", file), join(dist, "shared", file));
}

await cp(join(root, "src", "js", "lwolf.js"), join(dist, "shared", "lwolf.js"));
await cp(join(root, "src", "js", "lwolf-buy.js"), join(dist, "shared", "lwolf-buy.js"));
await cp(join(root, "src", "js", "stonks.js"), join(dist, "shared", "stonks.js"));
for (const file of ["moonrat.js", "gloop.js", "barkbyte.js"]) {
  await cp(join(root, "src", "js", file), join(dist, "shared", file));
}

// Data
await cp(join(root, "src", "data", "colony"), join(dist, "data", "colony"), { recursive: true });

// Demo assets
await cp(join(root, "src", "data", "mugi", "assets.json"), join(dist, "demos", "mugi", "assets.json"));
await cp(join(root, "public", "demos", "slock"), join(dist, "demos", "slock"), { recursive: true });
await cp(join(root, "public", "demos", "colony"), join(dist, "demos", "colony"), { recursive: true });
await cp(join(root, "public", "demos", "lwolf"), join(dist, "demos", "lwolf"), { recursive: true });
await cp(join(root, "public", "demos", "stonks"), join(dist, "demos", "stonks"), { recursive: true });
for (const project of ["moonrat", "gloop", "barkbyte"]) {
  await cp(join(root, "public", "demos", project), join(dist, "demos", project), { recursive: true });
}
await cp(join(root, "public", "demos", "mugi", "optimized"), join(dist, "demos", "mugi", "optimized"), { recursive: true });
await cp(join(root, "public", "demos", "promoter", "aavatar.png"), join(dist, "demos", "promoter", "aavatar.png"));

// Public root
await cp(join(root, "public", "favicon.svg"), join(dist, "favicon.svg"));

// Routes
await cp(join(root, "src", "pages", "work.html"), join(dist, "work", "index.html"));

await cp(join(root, "src", "pages", "mugi.html"), join(dist, "work", "mugi", "index.html"));
await cp(join(root, "src", "pages", "mugi-case-study.html"), join(dist, "work", "mugi", "case-study", "index.html"));

await cp(join(root, "src", "pages", "slock.html"), join(dist, "work", "slock", "index.html"));
await cp(join(root, "src", "pages", "slock-case-study.html"), join(dist, "work", "slock", "case-study", "index.html"));

await cp(join(root, "src", "pages", "colony.html"), join(dist, "work", "colony", "index.html"));
await cp(join(root, "src", "pages", "colony-case-study.html"), join(dist, "work", "colony", "case-study", "index.html"));

await cp(join(root, "src", "pages", "lwolf.html"), join(dist, "work", "lwolf", "index.html"));
await cp(join(root, "src", "pages", "lwolf-buy.html"), join(dist, "work", "lwolf", "buy", "index.html"));

await cp(join(root, "src", "pages", "stonks.html"), join(dist, "work", "stonks", "index.html"));

await cp(join(root, "src", "pages", "promoter-demo.html"), join(dist, "work", "promoter", "index.html"));

for (const project of ["moonrat", "gloop", "barkbyte"]) {
  await cp(join(root, "src", "pages", `${project}.html`), join(dist, "work", project, "index.html"));
}

await writeFile(join(dist, "index.html"), '<!doctype html><meta http-equiv="refresh" content="0; url=/work/" />');

console.log(`
Built dist/ with:

/work
/work/mugi
/work/mugi/case-study
/work/slock
/work/slock/case-study
/work/colony
/work/colony/case-study
/work/lwolf
/work/lwolf/buy
/work/stonks
/work/promoter
/work/moonrat
/work/gloop
/work/barkbyte
`);
