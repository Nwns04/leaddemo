import { mkdir, readdir, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, extname, join, relative } from "node:path";

const execFileAsync = promisify(execFile);
const root = join(process.cwd(), "public", "demos", "mugi");
const outputRoot = join(root, "optimized");
const ffmpeg = process.env.MUGI_FFMPEG_PATH || "D:\\YouTubeFactory\\tools\\ffmpeg\\bin\\ffmpeg.exe";

async function collectPngs(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "optimized") continue;
    const path = join(folder, entry.name);
    if (entry.isDirectory()) files.push(...await collectPngs(path));
    else if (extname(entry.name).toLowerCase() === ".png") files.push(path);
  }
  return files;
}

const sources = await collectPngs(root);
if (!sources.length) {
  console.log("No MUGI PNG masters found; nothing to optimize.");
  process.exit(0);
}

for (const source of sources) {
  const output = join(outputRoot, relative(root, source).replace(/\.png$/i, ".webp"));
  await mkdir(dirname(output), { recursive: true });
  await stat(source);
  await execFileAsync(ffmpeg, [
    "-y", "-hide_banner", "-loglevel", "error", "-i", source,
    "-frames:v", "1", "-c:v", "libwebp", "-q:v", "90", "-compression_level", "6", "-preset", "picture", output
  ]);
  console.log(`${relative(root, source)} -> ${relative(root, output)}`);
}

console.log(`Optimized ${sources.length} MUGI PNG master(s) with ffmpeg/libwebp.`);
