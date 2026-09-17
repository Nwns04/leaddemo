import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "dist");
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm" };
createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const safe = normalize(pathname).replace(/^([.][.][\\/])+/, "");
  const candidates = [join(root, safe), join(root, safe, "index.html")];
  let body;
  let file;
  for (const candidate of candidates) { try { body = await readFile(candidate); file = candidate; break; } catch {} }
  if (!body) { response.writeHead(404); response.end("Not found"); return; }
  response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" }); response.end(body);
}).listen(4173, "127.0.0.1", () => console.log("Preview server listening on http://127.0.0.1:4173"));
